'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Upload, Pencil, Trash2, Star, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Types
interface KepalaSekolah {
    id: string;
    nip: string | null;
    nama: string;
    periode_mulai: string;
    periode_selesai: string | null;
    is_aktif: boolean;
    tanda_tangan_url: string | null;
    created_at: string;
}

interface FormData {
    nip: string;
    nama: string;
    periode_mulai: string;
    periode_selesai: string;
    is_aktif: boolean;
    tanda_tangan: File | null;
}

/**
 * Halaman CRUD Kepala Sekolah
 * 
 * Fitur:
 * - CRUD data kepala sekolah
 * - Set aktif (hanya 1 yang aktif)
 * - Upload TTD digital (PNG transparan)
 * 
 * Akses: Admin
 */
export default function KepalaSekolahPage() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [kepalaSekolahList, setKepalaSekolahList] = useState<KepalaSekolah[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({
        nip: '',
        nama: '',
        periode_mulai: '',
        periode_selesai: '',
        is_aktif: false,
        tanda_tangan: null,
    });
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Fetch data
    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('kepala_sekolah')
                .select('*')
                .order('is_aktif', { ascending: false })
                .order('periode_mulai', { ascending: false });

            if (error) throw error;
            setKepalaSekolahList(data || []);
        } catch (error) {
            console.error('Error fetching:', error);
            toast({ title: 'Error', description: 'Gagal memuat data', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }

    // Open dialog for add/edit
    function openDialog(kepala?: KepalaSekolah) {
        if (kepala) {
            setEditingId(kepala.id);
            setFormData({
                nip: kepala.nip || '',
                nama: kepala.nama,
                periode_mulai: kepala.periode_mulai,
                periode_selesai: kepala.periode_selesai || '',
                is_aktif: kepala.is_aktif,
                tanda_tangan: null,
            });
            setPreviewUrl(kepala.tanda_tangan_url);
        } else {
            setEditingId(null);
            setFormData({
                nip: '',
                nama: '',
                periode_mulai: new Date().getFullYear().toString(),
                periode_selesai: '',
                is_aktif: false,
                tanda_tangan: null,
            });
            setPreviewUrl(null);
        }
        setIsDialogOpen(true);
    }

    // Handle file select
    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.includes('image/png')) {
            toast({
                title: 'Error',
                description: 'File harus format PNG',
                variant: 'destructive',
            });
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast({
                title: 'Error',
                description: 'File maksimal 2MB',
                variant: 'destructive',
            });
            return;
        }

        setFormData(prev => ({ ...prev, tanda_tangan: file }));

        // Preview
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target?.result as string);
        reader.readAsDataURL(file);
    }

    // Save
    async function handleSave() {
        if (!formData.nama || !formData.periode_mulai) {
            toast({
                title: 'Validasi',
                description: 'Nama dan periode mulai wajib diisi',
                variant: 'destructive',
            });
            return;
        }

        setSaving(true);
        try {
            let tanda_tangan_url: string | null = null;

            // Upload TTD if provided
            if (formData.tanda_tangan) {
                const ext = formData.tanda_tangan.name.split('.').pop();
                const fileName = `ttd_${Date.now()}.${ext}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('ttd')
                    .upload(fileName, formData.tanda_tangan);

                if (uploadError) {
                    toast({
                        title: 'Error',
                        description: 'Gagal upload TTD',
                        variant: 'destructive',
                    });
                    return;
                }

                const { data: urlData } = supabase.storage
                    .from('ttd')
                    .getPublicUrl(fileName);
                tanda_tangan_url = urlData.publicUrl;
            } else if (editingId) {
                // Keep existing
                const existing = kepalaSekolahList.find(k => k.id === editingId);
                tanda_tangan_url = existing?.tanda_tangan_url || null;
            }

            const dataToSave = {
                nip: formData.nip || null,
                nama: formData.nama,
                periode_mulai: formData.periode_mulai,
                periode_selesai: formData.periode_selesai || null,
                is_aktif: formData.is_aktif,
                tanda_tangan_url: tanda_tangan_url,
            };

            if (editingId) {
                // Update
                const { error } = await supabase
                    .from('kepala_sekolah')
                    .update(dataToSave)
                    .eq('id', editingId);

                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('kepala_sekolah')
                    .insert(dataToSave);

                if (error) throw error;
            }

            // If set as aktif, unset others
            if (formData.is_aktif) {
                await supabase
                    .from('kepala_sekolah')
                    .update({ is_aktif: false })
                    .neq('id', editingId || '');

                // Re-fetch with new aktif
                if (editingId) {
                    await supabase
                        .from('kepala_sekolah')
                        .update({ is_aktif: true })
                        .eq('id', editingId);
                } else {
                    // Get last inserted
                    const { data } = await supabase
                        .from('kepala_sekolah')
                        .select('id')
                        .order('created_at', { ascending: false })
                        .limit(1);
                    if (data && data[0]) {
                        await supabase
                            .from('kepala_sekolah')
                            .update({ is_aktif: true })
                            .eq('id', data[0].id);
                    }
                }
            }

            toast({ title: 'Berhasil', description: 'Data berhasil disimpan' });
            setIsDialogOpen(false);
            fetchData();

        } catch (error) {
            console.error('Error saving:', error);
            toast({ title: 'Error', description: 'Gagal menyimpan data', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    }

    // Delete
    async function handleDelete(id: string) {
        if (!confirm('Yakin hapus data ini?')) return;

        try {
            const { error } = await supabase
                .from('kepala_sekolah')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast({ title: 'Berhasil', description: 'Data berhasil dihapus' });
            fetchData();
        } catch (error) {
            toast({ title: 'Error', description: 'Gagal menghapus data', variant: 'destructive' });
        }
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Kepala Sekolah</h1>
                    <p className="text-muted-foreground">
                        Kelola data kepala sekolah dan TTD digital
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => openDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingId ? 'Edit Kepala Sekolah' : 'Tambah Kepala Sekolah'}
                            </DialogTitle>
                            <DialogDescription>
                                Masukkan data kepala sekolah
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>NIP</Label>
                                <Input
                                    value={formData.nip}
                                    onChange={(e) => setFormData(prev => ({ ...prev, nip: e.target.value }))}
                                    placeholder="Nomor Induk Pegawai"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Nama Lengkap *</Label>
                                <Input
                                    value={formData.nama}
                                    onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                                    placeholder="Nama lengkap"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Periode Mulai *</Label>
                                    <Input
                                        value={formData.periode_mulai}
                                        onChange={(e) => setFormData(prev => ({ ...prev, periode_mulai: e.target.value }))}
                                        placeholder="2024"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Periode Selesai</Label>
                                    <Input
                                        value={formData.periode_selesai}
                                        onChange={(e) => setFormData(prev => ({ ...prev, periode_selesai: e.target.value }))}
                                        placeholder="2028 atau kosongkan"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Tanda Tangan (PNG Transparan)</Label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                                <div
                                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {previewUrl ? (
                                        <div className="flex items-center justify-center">
                                            <img
                                                src={previewUrl}
                                                alt="TTD Preview"
                                                className="max-h-24 object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-muted-foreground">
                                            <Upload className="mx-auto h-8 w-8 mb-2" />
                                            <p className="text-sm">Klik untuk upload PNG</p>
                                        </div>
                                    )}
                                </div>
                                {previewUrl && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, tanda_tangan: null }));
                                            setPreviewUrl(null);
                                        }}
                                    >
                                        Hapus TTD
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_aktif"
                                    checked={formData.is_aktif}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_aktif: e.target.checked }))}
                                    className="rounded"
                                />
                                <Label htmlFor="is_aktif" className="cursor-pointer">
                                    Jadikan kepala sekolah aktif
                                </Label>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Batal
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Info */}
            <Card className="bg-muted/50">
                <CardContent className="py-4">
                    <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>
                            Hanya 1 kepala sekolah yang bisa aktif. TTD digital digunakan untuk ekspor rapor PDF.
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* List */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Kepala Sekolah</CardTitle>
                    <CardDescription>
                        {kepalaSekolahList.length} data
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-20 w-full" />
                            ))}
                        </div>
                    ) : kepalaSekolahList.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>Belum ada data kepala sekolah</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {kepalaSekolahList.map((kepala) => (
                                <div
                                    key={kepala.id}
                                    className={`flex items-center justify-between p-4 border rounded-lg ${kepala.is_aktif ? 'bg-green-50 border-green-200' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center overflow-hidden">
                                            {kepala.tanda_tangan_url ? (
                                                <img
                                                    src={kepala.tanda_tangan_url}
                                                    alt="TTD"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            ) : (
                                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{kepala.nama}</p>
                                                {kepala.is_aktif && (
                                                    <Badge variant="default" className="bg-green-600">
                                                        <Star className="h-3 w-3 mr-1" /> Aktif
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {kepala.nip ? `NIP: ${kepala.nip}` : 'NIP: -'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Periode: {kepala.periode_mulai} - {kepala.periode_selesai || 'sekarang'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openDialog(kepala)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500"
                                            onClick={() => handleDelete(kepala.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}