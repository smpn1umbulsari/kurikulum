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
import { Plus, Pencil, Trash2, Search, Filter, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Siswa {
    id: string;
    nis: string;
    nisn: string | null;
    nipd: string | null;
    nama: string;
    jenis_kelamin: 'L' | 'P';
    status: 'aktif' | 'nonaktif' | 'alumni';
    created_at: string;
}

const genderOptions = [
    { value: 'L', label: 'Laki-laki' },
    { value: 'P', label: 'Perempuan' },
];

const statusOptions = [
    { value: 'aktif', label: 'Aktif' },
    { value: 'nonaktif', label: 'Nonaktif' },
    { value: 'alumni', label: 'Alumni' },
];

/**
 * Siswa Page
 * 
 * Halaman CRUD untuk mengelola data siswa.
 * Accessible oleh superadmin, admin, dan urusan.
 */
export default function SiswaPage() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const supabase = createClient();

    const [data, setData] = useState<Siswa[]>([]);
    const [filteredData, setFilteredData] = useState<Siswa[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGender, setFilterGender] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Siswa | null>(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        nis: '',
        nisn: '',
        nipd: '',
        nama: '',
        jenis_kelamin: 'L' as 'L' | 'P',
        status: 'aktif' as 'aktif' | 'nonaktif' | 'alumni',
    });

    // Check permission
    const canManage = profile?.role === 'superadmin' || profile?.role === 'admin' || profile?.role === 'urusan';

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
                    item.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (item.nisn && item.nisn.includes(searchTerm)) ||
                    (item.nipd && item.nipd.includes(searchTerm))
            );
        }

        if (filterGender !== 'all') {
            result = result.filter((item) => item.jenis_kelamin === filterGender);
        }

        if (filterStatus !== 'all') {
            result = result.filter((item) => item.status === filterStatus);
        }

        setFilteredData(result);
    }, [data, searchTerm, filterGender, filterStatus]);

    async function fetchData() {
        try {
            const { data: result, error } = await supabase
                .from('siswa')
                .select('*')
                .order('nama');

            if (error) throw error;
            setData(result || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: 'Error',
                description: 'Gagal memuat data siswa',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    function openDialog(item?: Siswa) {
        if (item) {
            setEditingItem(item);
            setFormData({
                nis: item.nis,
                nisn: item.nisn || '',
                nipd: item.nipd || '',
                nama: item.nama,
                jenis_kelamin: item.jenis_kelamin,
                status: item.status,
            });
        } else {
            setEditingItem(null);
            setFormData({
                nis: '',
                nisn: '',
                nipd: '',
                nama: '',
                jenis_kelamin: 'L',
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
                nis: formData.nis,
                nisn: formData.nisn || null,
                nipd: formData.nipd || null,
                nama: formData.nama,
                jenis_kelamin: formData.jenis_kelamin,
                status: formData.status,
            };

            if (editingItem) {
                const { error } = await supabase
                    .from('siswa')
                    .update(payload)
                    .eq('id', editingItem.id);

                if (error) throw error;
                toast({ title: 'Berhasil', description: 'Data siswa berhasil diperbarui' });
            } else {
                const { error } = await supabase.from('siswa').insert(payload);

                if (error) throw error;
                toast({ title: 'Berhasil', description: 'Data siswa berhasil ditambahkan' });
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

    async function handleDelete(item: Siswa) {
        if (!confirm(`Hapus siswa "${item.nama}"?`)) return;

        try {
            const { error } = await supabase.from('siswa').delete().eq('id', item.id);
            if (error) throw error;

            toast({ title: 'Berhasil', description: 'Data siswa berhasil dihapus' });
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
                    <h1 className="text-3xl font-bold tracking-tight">Data Siswa</h1>
                    <p className="text-muted-foreground">
                        Kelola data siswa dan informasi akademik
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Import Excel
                    </Button>
                    {canManage && (
                        <Button onClick={() => openDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Siswa
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama, NIS, NISN, atau NIPD..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterGender} onValueChange={setFilterGender}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Filter gender" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Gender</SelectItem>
                                {genderOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Filter status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                {statusOptions.map((opt) => (
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
                    <CardTitle>Daftar Siswa</CardTitle>
                    <CardDescription>
                        {filteredData.length} dari {data.length} siswa
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
                                        <th className="pb-3 font-medium">No</th>
                                        <th className="pb-3 font-medium">NIS</th>
                                        <th className="pb-3 font-medium">Nama</th>
                                        <th className="pb-3 font-medium">JK</th>
                                        <th className="pb-3 font-medium">NISN</th>
                                        <th className="pb-3 font-medium">NIPD</th>
                                        <th className="pb-3 font-medium">Status</th>
                                        {canManage && <th className="pb-3 font-medium">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((item, index) => (
                                        <tr key={item.id} className="border-b">
                                            <td className="py-3">{index + 1}</td>
                                            <td className="py-3 font-mono text-sm">{item.nis}</td>
                                            <td className="py-3 font-medium">{item.nama}</td>
                                            <td className="py-3">
                                                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium">
                                                    {item.jenis_kelamin}
                                                </span>
                                            </td>
                                            <td className="py-3 font-mono text-sm">{item.nisn || '-'}</td>
                                            <td className="py-3 font-mono text-sm">{item.nipd || '-'}</td>
                                            <td className="py-3">
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-medium ${item.status === 'aktif'
                                                            ? 'bg-green-100 text-green-800'
                                                            : item.status === 'alumni'
                                                                ? 'bg-blue-100 text-blue-800'
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
                <DialogContent className="max-w-md">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {editingItem ? 'Edit Siswa' : 'Tambah Siswa'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingItem
                                    ? 'Perbarui informasi siswa'
                                    : 'Tambahkan siswa baru ke sistem'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="nis">NIS</Label>
                                    <Input
                                        id="nis"
                                        placeholder="2025001"
                                        value={formData.nis}
                                        onChange={(e) =>
                                            setFormData({ ...formData, nis: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="nisn">NISN</Label>
                                    <Input
                                        id="nisn"
                                        placeholder="0012345678"
                                        value={formData.nisn}
                                        onChange={(e) =>
                                            setFormData({ ...formData, nisn: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="nipd">NIPD</Label>
                                <Input
                                    id="nipd"
                                    placeholder="1234567890"
                                    value={formData.nipd}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nipd: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="nama">Nama Lengkap</Label>
                                <Input
                                    id="nama"
                                    placeholder="Nama lengkap siswa"
                                    value={formData.nama}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nama: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                                    <Select
                                        value={formData.jenis_kelamin}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                jenis_kelamin: value as typeof formData.jenis_kelamin,
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {genderOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
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
                                            {statusOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
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