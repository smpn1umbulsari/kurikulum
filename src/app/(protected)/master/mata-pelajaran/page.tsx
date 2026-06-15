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
import { Plus, Pencil, Trash2, Search, Filter } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface MataPelajaran {
    id: string;
    kode_mapel: string;
    nama: string;
    kelompok: string | null;
    agama: string | null;
    status: 'aktif' | 'nonaktif';
    created_at: string;
}

const kelompokOptions = [
    { value: 'A', label: 'Kelompok A (Wajib)' },
    { value: 'B', label: 'Kelompok B (Wajib)' },
    { value: 'C', label: 'Kelompok C (Peminatan)' },
];

const agamaOptions = [
    { value: 'Islam', label: 'Islam' },
    { value: 'Kristen', label: 'Kristen' },
    { value: 'Hindu', label: 'Hindu' },
    { value: 'Budha', label: 'Budha' },
    { value: 'Konghucu', label: 'Konghucu' },
];

/**
 * Mata Pelajaran Page
 * 
 * Halaman CRUD untuk mengelola mata pelajaran.
 * Accessible oleh superadmin dan admin.
 */
export default function MataPelajaranPage() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const supabase = createClient();

    const [data, setData] = useState<MataPelajaran[]>([]);
    const [filteredData, setFilteredData] = useState<MataPelajaran[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterKelompok, setFilterKelompok] = useState<string>('all');
    const [filterAgama, setFilterAgama] = useState<string>('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MataPelajaran | null>(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        kode_mapel: '',
        nama: '',
        kelompok: '' as string,
        agama: '' as string,
        status: 'aktif' as 'aktif' | 'nonaktif',
    });

    // Check permission
    const canManage = profile?.role === 'superadmin' || profile?.role === 'admin';

    // Fetch data
    useEffect(() => {
        fetchData();
    }, []);

    // Filter data
    useEffect(() => {
        let result = data;

        if (searchTerm) {
            result = result.filter(
                (item) =>
                    item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.kode_mapel.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterKelompok !== 'all') {
            result = result.filter((item) => item.kelompok === filterKelompok);
        }

        if (filterAgama !== 'all') {
            result = result.filter((item) => item.agama === filterAgama);
        }

        setFilteredData(result);
    }, [data, searchTerm, filterKelompok, filterAgama]);

    async function fetchData() {
        try {
            const { data: result, error } = await supabase
                .from('mata_pelajaran')
                .select('*')
                .order('kode_mapel');

            if (error) throw error;
            setData(result || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: 'Error',
                description: 'Gagal memuat data mata pelajaran',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    function openDialog(item?: MataPelajaran) {
        if (item) {
            setEditingItem(item);
            setFormData({
                kode_mapel: item.kode_mapel,
                nama: item.nama,
                kelompok: item.kelompok || '',
                agama: item.agama || '',
                status: item.status,
            });
        } else {
            setEditingItem(null);
            setFormData({
                kode_mapel: '',
                nama: '',
                kelompok: '',
                agama: '',
                status: 'aktif',
            });
        }
        setDialogOpen(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = {
                kode_mapel: formData.kode_mapel,
                nama: formData.nama,
                kelompok: formData.kelompok || null,
                agama: formData.agama || null,
                status: formData.status,
            };

            if (editingItem) {
                const { error } = await supabase
                    .from('mata_pelajaran')
                    .update(payload)
                    .eq('id', editingItem.id);

                if (error) throw error;
                toast({ title: 'Berhasil', description: 'Data mata pelajaran berhasil diperbarui' });
            } else {
                const { error } = await supabase.from('mata_pelajaran').insert(payload);

                if (error) throw error;
                toast({ title: 'Berhasil', description: 'Data mata pelajaran berhasil ditambahkan' });
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

    async function handleDelete(item: MataPelajaran) {
        if (!confirm(`Hapus mata pelajaran "${item.nama}"?`)) return;

        try {
            const { error } = await supabase.from('mata_pelajaran').delete().eq('id', item.id);
            if (error) throw error;

            toast({ title: 'Berhasil', description: 'Data mata pelajaran berhasil dihapus' });
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

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mata Pelajaran</h1>
                    <p className="text-muted-foreground">
                        Kelola mata pelajaran dan kurikulum
                    </p>
                </div>
                {canManage && (
                    <Button onClick={() => openDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Mata Pelajaran
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
                                placeholder="Cari nama atau kode mapel..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterKelompok} onValueChange={setFilterKelompok}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Filter kelompok" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Kelompok</SelectItem>
                                {kelompokOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Mata Pelajaran</CardTitle>
                    <CardDescription>
                        {filteredData.length} dari {data.length} mata pelajaran
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-muted-foreground">Memuat...</p>
                    ) : filteredData.length === 0 ? (
                        <p className="text-muted-foreground">Tidak ada data yang cocok</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left text-sm text-muted-foreground">
                                        <th className="pb-3 font-medium">Kode</th>
                                        <th className="pb-3 font-medium">Nama</th>
                                        <th className="pb-3 font-medium">Kelompok</th>
                                        <th className="pb-3 font-medium">Agama</th>
                                        <th className="pb-3 font-medium">Status</th>
                                        {canManage && <th className="pb-3 font-medium">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((item) => (
                                        <tr key={item.id} className="border-b">
                                            <td className="py-3 font-mono text-sm">{item.kode_mapel}</td>
                                            <td className="py-3 font-medium">{item.nama}</td>
                                            <td className="py-3">
                                                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium">
                                                    {item.kelompok || '-'}
                                                </span>
                                            </td>
                                            <td className="py-3 text-sm">{item.agama || '-'}</td>
                                            <td className="py-3">
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-medium ${item.status === 'aktif'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                >
                                                    {item.status}
                                                </span>
                                            </td>
                                            {canManage && (
                                                <td className="py-3">
                                                    <div className="flex gap-1">
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
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                                {editingItem ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingItem
                                    ? 'Perbarui informasi mata pelajaran'
                                    : 'Tambahkan mata pelajaran baru'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="kode_mapel">Kode Mapel</Label>
                                    <Input
                                        id="kode_mapel"
                                        placeholder="IPA"
                                        value={formData.kode_mapel}
                                        onChange={(e) =>
                                            setFormData({ ...formData, kode_mapel: e.target.value })
                                        }
                                        required
                                    />
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
                                            <SelectItem value="aktif">Aktif</SelectItem>
                                            <SelectItem value="nonaktif">Nonaktif</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="nama">Nama Mata Pelajaran</Label>
                                <Input
                                    id="nama"
                                    placeholder="Ilmu Pengetahuan Alam"
                                    value={formData.nama}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nama: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="kelompok">Kelompok</Label>
                                <Select
                                    value={formData.kelompok}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, kelompok: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih kelompok" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {kelompokOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="agama">Agama (opsional)</Label>
                                <Select
                                    value={formData.agama}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, agama: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih agama" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Tidak Ada</SelectItem>
                                        {agamaOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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