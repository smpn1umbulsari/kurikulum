'use client';

import { useState, useEffect } from 'react';
import { useAuth, useActiveSemester } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Pencil, Trash2, Search, BookOpen, Users, GraduationCap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface KelasReal {
    id: string;
    semester_id: string;
    nama: string;
    jenjang: number;
    wali_kelas_id: string | null;
    created_at: string;
    // Joined data
    wali_kelas?: { id: string; nama: string; kode_guru: string };
}

interface Guru {
    id: string;
    nama: string;
    kode_guru: string;
    status_pegawai: string;
}

interface KelasDapo {
    id: string;
    nama: string;
    jenjang: number;
}

/**
 * Kelas Real (Operasional) Page
 * 
 * Halaman CRUD untuk mengelola kelas operasional (Real).
 * Accessible oleh superadmin, admin, dan urusan.
 */
export default function KelasRealPage() {
    const { profile } = useAuth();
    const { semester } = useActiveSemester();
    const { toast } = useToast();
    const supabase = createClient();

    const [data, setData] = useState<KelasReal[]>([]);
    const [filteredData, setFilteredData] = useState<KelasReal[]>([]);
    const [guruList, setGuruList] = useState<Guru[]>([]);
    const [kelasDapoList, setKelasDapoList] = useState<KelasDapo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterJenjang, setFilterJenjang] = useState<string>('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<KelasReal | null>(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        nama: '',
        jenjang: 7 as number,
        wali_kelas_id: '' as string,
        kelas_dapo_id: '' as string,
    });

    // Check permission
    const canManage = profile?.role === 'superadmin' || profile?.role === 'admin' || profile?.role === 'urusan';

    // Fetch reference data
    useEffect(() => {
        fetchReferenceData();
    }, []);

    // Fetch kelas real
    useEffect(() => {
        if (semester?.id) {
            fetchData();
        }
    }, [semester]);

    // Filter data
    useEffect(() => {
        let result = data;

        if (searchTerm) {
            result = result.filter(
                (item) =>
                    item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.wali_kelas?.nama.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterJenjang !== 'all') {
            result = result.filter((item) => item.jenjang === parseInt(filterJenjang));
        }

        setFilteredData(result);
    }, [data, searchTerm, filterJenjang]);

    async function fetchReferenceData() {
        try {
            // Only show PNS/PPPK/PPPK PW for wali kelas (GTT blocked)
            const { data: guruData } = await supabase
                .from('guru')
                .select('id, nama, kode_guru, status_pegawai')
                .eq('status', 'aktif')
                .in('status_pegawai', ['PNS', 'PPPK', 'PPPK PW'])
                .order('nama');

            setGuruList(guruData || []);

            // Fetch kelas dapo for reference
            if (semester?.id) {
                const { data: kelasDapoData } = await supabase
                    .from('kelas_dapo')
                    .select('id, nama, jenjang')
                    .eq('semester_id', semester.id)
                    .order('nama');
                setKelasDapoList(kelasDapoData || []);
            }
        } catch (error) {
            console.error('Error fetching reference data:', error);
        }
    }

    async function fetchData() {
        if (!semester?.id) return;

        try {
            setLoading(true);
            const { data: result, error } = await supabase
                .from('kelas_real')
                .select(`
                    *,
                    wali_kelas:wali_kelas_id (id, nama, kode_guru)
                `)
                .eq('semester_id', semester.id)
                .order('jenjang')
                .order('nama');

            if (error) throw error;
            setData(result || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: 'Error',
                description: 'Gagal memuat data kelas',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    function openDialog(item?: KelasReal) {
        fetchReferenceData();

        if (item) {
            setEditingItem(item);
            setFormData({
                nama: item.nama,
                jenjang: item.jenjang,
                wali_kelas_id: item.wali_kelas_id || '',
                kelas_dapo_id: '',
            });
        } else {
            setEditingItem(null);
            setFormData({
                nama: '',
                jenjang: 7,
                wali_kelas_id: '',
                kelas_dapo_id: '',
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
                    .from('kelas_real')
                    .update({
                        nama: formData.nama,
                        jenjang: formData.jenjang,
                        wali_kelas_id: formData.wali_kelas_id || null,
                    })
                    .eq('id', editingItem.id);

                if (error) throw error;
                toast({ title: 'Berhasil', description: 'Kelas berhasil diperbarui' });
            } else {
                const { error } = await supabase.from('kelas_real').insert({
                    semester_id: semester?.id,
                    nama: formData.nama,
                    jenjang: formData.jenjang,
                    wali_kelas_id: formData.wali_kelas_id || null,
                });

                if (error) throw error;
                toast({ title: 'Berhasil', description: 'Kelas berhasil ditambahkan' });
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

    async function handleDelete(item: KelasReal) {
        if (!confirm(`Hapus kelas "${item.nama}"?`)) return;

        try {
            const { error } = await supabase.from('kelas_real').delete().eq('id', item.id);
            if (error) throw error;

            toast({ title: 'Berhasil', description: 'Kelas berhasil dihapus' });
            fetchData();
        } catch (error) {
            console.error('Error deleting data:', error);
            toast({
                title: 'Error',
                description: 'Gagal menghapus data',
                variant: 'destructive',
            });
        }
    }

    // Group by jenjang
    const groupedData = filteredData.reduce((acc, item) => {
        if (!acc[item.jenjang]) acc[item.jenjang] = [];
        acc[item.jenjang].push(item);
        return acc;
    }, {} as Record<number, KelasReal[]>);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Kelas Real (Operasional)</h1>
                    <p className="text-muted-foreground">
                        Kelola kelas operasional untuk kegiatan belajar mengajar
                    </p>
                    {semester && (
                        <p className="text-sm text-muted-foreground">
                            Semester aktif: <span className="font-medium">{semester.nama}</span>
                        </p>
                    )}
                </div>
                {canManage && (
                    <Button onClick={() => openDialog()} disabled={!semester}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Kelas
                    </Button>
                )}
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama kelas atau wali kelas..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterJenjang} onValueChange={setFilterJenjang}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Filter jenjang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Jenjang</SelectItem>
                                <SelectItem value="7">Jenjang 7</SelectItem>
                                <SelectItem value="8">Jenjang 8</SelectItem>
                                <SelectItem value="9">Jenjang 9</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Data by Jenjang */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Kelas</CardTitle>
                    <CardDescription>
                        {filteredData.length} kelas dari {data.length} total
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading || !semester ? (
                        <p className="text-muted-foreground">Memuat...</p>
                    ) : filteredData.length === 0 ? (
                        <p className="text-muted-foreground">Tidak ada data yang cocok</p>
                    ) : (
                        <div className="space-y-6">
                            {[7, 8, 9].map((jenjang) => {
                                const kelasList = groupedData[jenjang];
                                if (!kelasList || kelasList.length === 0) return null;

                                return (
                                    <div key={jenjang}>
                                        <h3 className="mb-3 text-lg font-semibold">
                                            Jenjang {jenjang}
                                        </h3>
                                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                            {kelasList.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex flex-col justify-between rounded-lg border p-4"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                                            <GraduationCap className="h-6 w-6 text-primary" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-bold text-lg">{item.nama}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {item.jenjang === 7 ? 'VII' : item.jenjang === 8 ? 'VIII' : 'IX'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 flex items-center gap-2 rounded-md bg-muted p-2">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-muted-foreground">Wali Kelas</p>
                                                            <p className="text-sm font-medium truncate">
                                                                {item.wali_kelas?.nama || '-'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {canManage && (
                                                        <div className="mt-3 flex justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openDialog(item)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDelete(item)}
                                                                className="text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
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
                                {editingItem ? 'Edit Kelas' : 'Tambah Kelas Real'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingItem
                                    ? 'Perbarui informasi kelas'
                                    : 'Tambahkan kelas operasional baru'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="nama">Nama Kelas</Label>
                                <Input
                                    id="nama"
                                    placeholder="VII-A"
                                    value={formData.nama}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nama: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="jenjang">Jenjang</Label>
                                <Select
                                    value={formData.jenjang.toString()}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, jenjang: parseInt(value) })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7">VII (7)</SelectItem>
                                        <SelectItem value="8">VIII (8)</SelectItem>
                                        <SelectItem value="9">IX (9)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="wali_kelas_id">Wali Kelas (opsional)</Label>
                                <Select
                                    value={formData.wali_kelas_id}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, wali_kelas_id: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih wali kelas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Tidak Ada</SelectItem>
                                        {guruList.map((g) => (
                                            <SelectItem key={g.id} value={g.id}>
                                                {g.nama} ({g.kode_guru}) - {g.status_pegawai}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-muted-foreground">
                                    Hanya PNS/PPPK/PPPK PW yang bisa menjadi Wali Kelas
                                </p>
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