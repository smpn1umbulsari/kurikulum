'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Pencil, Check, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface TahunPelajaran {
    id: string;
    nama: string;
}

interface Semester {
    id: string;
    tahun_pelajaran_id: string;
    nama: string;
    status: 'aktif' | 'nonaktif';
    mode_penilaian: 'pts' | 'semester';
    tahun_pelajaran?: TahunPelajaran;
}

interface SemesterWithTP extends Semester {
    tahun_pelajaran: TahunPelajaran;
}

/**
 * Semester Page
 * 
 * Halaman CRUD untuk mengelola semester.
 * Accessible oleh superadmin dan admin.
 */
export default function SemesterPage() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const supabase = createClient();

    const [data, setData] = useState<SemesterWithTP[]>([]);
    const [tahunPelajaran, setTahunPelajaran] = useState<TahunPelajaran[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Semester | null>(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        tahun_pelajaran_id: '',
        nama: '',
        status: 'nonaktif' as 'aktif' | 'nonaktif',
        mode_penilaian: 'pts' as 'pts' | 'semester',
    });

    // Check permission
    const canManage = profile?.role === 'superadmin' || profile?.role === 'admin';

    // Fetch data
    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            setLoading(true);
            const { data: result, error } = await supabase
                .from('semester')
                .select(`
                    *,
                    tahun_pelajaran:tahun_pelajaran_id (
                        id,
                        nama
                    )
                `)
                .order('tahun_pelajaran(nama)', { ascending: false })
                .order('nama');

            if (error) throw error;
            setData(result || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: 'Error',
                description: 'Gagal memuat data semester',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    async function fetchTahunPelajaran() {
        try {
            const { data: result } = await supabase
                .from('tahun_pelajaran')
                .select('id, nama')
                .order('nama', { ascending: false });
            setTahunPelajaran(result || []);
        } catch (error) {
            console.error('Error fetching tahun pelajaran:', error);
        }
    }

    function openDialog(item?: Semester) {
        fetchTahunPelajaran();

        if (item) {
            setEditingItem(item);
            setFormData({
                tahun_pelajaran_id: item.tahun_pelajaran_id,
                nama: item.nama,
                status: item.status,
                mode_penilaian: item.mode_penilaian,
            });
        } else {
            setEditingItem(null);
            setFormData({
                tahun_pelajaran_id: '',
                nama: '',
                status: 'nonaktif',
                mode_penilaian: 'pts',
            });
        }
        setDialogOpen(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        try {
            if (editingItem) {
                const { error } = await supabase
                    .from('semester')
                    .update({
                        tahun_pelajaran_id: formData.tahun_pelajaran_id,
                        nama: formData.nama,
                        status: formData.status,
                        mode_penilaian: formData.mode_penilaian,
                    })
                    .eq('id', editingItem.id);

                if (error) throw error;
                toast({ title: 'Berhasil', description: 'Semester berhasil diperbarui' });
            } else {
                const { error } = await supabase.from('semester').insert({
                    tahun_pelajaran_id: formData.tahun_pelajaran_id,
                    nama: formData.nama,
                    status: formData.status,
                    mode_penilaian: formData.mode_penilaian,
                });

                if (error) throw error;
                toast({ title: 'Berhasil', description: 'Semester berhasil ditambahkan' });
            }

            setDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error saving data:', error);
            toast({
                title: 'Error',
                description: 'Gagal menyimpan data',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    }

    async function setActive(item: Semester) {
        if (item.status === 'aktif') return;

        try {
            // First, deactivate all semesters
            await supabase
                .from('semester')
                .update({ status: 'nonaktif' })
                .neq('id', '00000000-0000-0000-0000-000000000000');

            // Then, activate the selected one
            const { error } = await supabase
                .from('semester')
                .update({ status: 'aktif' })
                .eq('id', item.id);

            if (error) throw error;

            toast({ title: 'Berhasil', description: `Semester "${item.nama}" sekarang aktif` });
            fetchData();
        } catch (error) {
            console.error('Error activating semester:', error);
            toast({
                title: 'Error',
                description: 'Gagal mengaktifkan semester',
                variant: 'destructive',
            });
        }
    }

    // Group by tahun pelajaran
    const groupedData = data.reduce((acc, item) => {
        const tpNama = item.tahun_pelajaran?.nama || 'Unknown';
        if (!acc[tpNama]) acc[tpNama] = [];
        acc[tpNama].push(item);
        return acc;
    }, {} as Record<string, SemesterWithTP[]>);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Semester</h1>
                    <p className="text-muted-foreground">
                        Kelola semester dan tahun pelajaran
                    </p>
                </div>
                {canManage && (
                    <Button onClick={() => openDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Semester
                    </Button>
                )}
            </div>

            {/* Active Semester Info */}
            {data.find((s) => s.status === 'aktif') && (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="flex items-center gap-4 pt-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                            <Check className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="font-medium text-green-800">Semester Aktif</p>
                            <p className="text-lg font-bold text-green-900">
                                {data.find((s) => s.status === 'aktif')?.nama}
                            </p>
                            <p className="text-sm text-green-700">
                                Mode Penilaian:{' '}
                                {data.find((s) => s.status === 'aktif')?.mode_penilaian === 'pts'
                                    ? 'PTS (Penilaian Tengah Semester)'
                                    : 'Semester'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Data Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Semester</CardTitle>
                    <CardDescription>
                        {data.length} semester ditemukan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-muted-foreground">Memuat...</p>
                    ) : data.length === 0 ? (
                        <p className="text-muted-foreground">
                            Belum ada data semester
                        </p>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedData).map(([tpNama, semesters]) => (
                                <div key={tpNama}>
                                    <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                                        <Calendar className="h-5 w-5" />
                                        Tahun Pelajaran {tpNama}
                                    </h3>
                                    <div className="space-y-2">
                                        {semesters.map((item) => (
                                            <div
                                                key={item.id}
                                                className={`flex items-center justify-between rounded-lg border p-4 ${item.status === 'aktif'
                                                        ? 'border-green-200 bg-green-50'
                                                        : ''
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex h-10 w-10 items-center justify-center rounded-full ${item.status === 'aktif'
                                                                ? 'bg-green-100 text-green-600'
                                                                : 'bg-primary/10 text-primary'
                                                            }`}
                                                    >
                                                        {item.status === 'aktif' ? (
                                                            <Check className="h-5 w-5" />
                                                        ) : (
                                                            <span className="text-sm font-bold">
                                                                {item.nama.charAt(0)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{item.nama}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Mode:{' '}
                                                            {item.mode_penilaian === 'pts'
                                                                ? 'PTS'
                                                                : 'Semester'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {item.status === 'aktif' ? (
                                                        <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                                                            Aktif
                                                        </span>
                                                    ) : (
                                                        canManage && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setActive(item)}
                                                            >
                                                                Jadikan Aktif
                                                            </Button>
                                                        )
                                                    )}
                                                    {canManage && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openDialog(item)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {editingItem ? 'Edit Semester' : 'Tambah Semester'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingItem
                                    ? 'Perbarui informasi semester'
                                    : 'Tambahkan semester baru'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            {!editingItem && (
                                <div className="grid gap-2">
                                    <Label htmlFor="tahun_pelajaran_id">Tahun Pelajaran</Label>
                                    <Select
                                        value={formData.tahun_pelajaran_id}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, tahun_pelajaran_id: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih tahun pelajaran" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tahunPelajaran.map((tp) => (
                                                <SelectItem key={tp.id} value={tp.id}>
                                                    {tp.nama}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="nama">Nama Semester</Label>
                                <Input
                                    id="nama"
                                    placeholder="Ganjil 2025/2026"
                                    value={formData.nama}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nama: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="mode_penilaian">Mode Penilaian</Label>
                                    <Select
                                        value={formData.mode_penilaian}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                mode_penilaian: value as typeof formData.mode_penilaian,
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pts">PTS</SelectItem>
                                            <SelectItem value="semester">Semester</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                status: value as typeof formData.status,
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="nonaktif">Nonaktif</SelectItem>
                                            <SelectItem value="aktif">Aktif</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}