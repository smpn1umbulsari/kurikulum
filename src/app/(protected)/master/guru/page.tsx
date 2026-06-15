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

interface Guru {
    id: string;
    kode_guru: string;
    urutan: number | null;
    nama: string;
    status_pegawai: 'PNS' | 'PPPK' | 'PPPK PW' | 'GTT';
    nip: string;
    status: 'aktif' | 'nonaktif';
    created_at: string;
}

const statusPegawaiOptions = [
    { value: 'PNS', label: 'PNS' },
    { value: 'PPPK', label: 'PPPK' },
    { value: 'PPPK PW', label: 'PPPK PW' },
    { value: 'GTT', label: 'GTT (Guru Tidak Tetap)' },
];

const statusOptions = [
    { value: 'aktif', label: 'Aktif' },
    { value: 'nonaktif', label: 'Nonaktif' },
];

/**
 * Guru Page
 * 
 * Halaman CRUD untuk mengelola data guru.
 * Accessible oleh superadmin dan admin.
 */
export default function GuruPage() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const supabase = createClient();

    const [data, setData] = useState<Guru[]>([]);
    const [filteredData, setFilteredData] = useState<Guru[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Guru | null>(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        kode_guru: '',
        nama: '',
        status_pegawai: 'PNS' as 'PNS' | 'PPPK' | 'PPPK PW' | 'GTT',
        nip: '',
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
                    item.kode_guru.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.nip.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterStatus !== 'all') {
            result = result.filter((item) => item.status === filterStatus);
        }

        setFilteredData(result);
    }, [data, searchTerm, filterStatus]);

    async function fetchData() {
        try {
            const { data: result, error } = await supabase
                .from('guru')
                .select('*')
                .order('urutan', { ascending: true, nullsFirst: false });

            if (error) throw error;
            setData(result || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: 'Error',
                description: 'Gagal memuat data guru',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    function openDialog(item?: Guru) {
        if (item) {
            setEditingItem(item);
            setFormData({
                kode_guru: item.kode_guru,
                nama: item.nama,
                status_pegawai: item.status_pegawai,
                nip: item.nip,
                status: item.status,
            });
        } else {
            setEditingItem(null);
            setFormData({
                kode_guru: '',
                nama: '',
                status_pegawai: 'PNS',
                nip: '',
                status: 'aktif',
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
                    .from('guru')
                    .update({
                        kode_guru: formData.kode_guru,
                        nama: formData.nama,
                        status_pegawai: formData.status_pegawai,
                        nip: formData.nip,
                        status: formData.status,
                    })
                    .eq('id', editingItem.id);

                if (error) throw error;
                toast({ title: 'Berhasil', description: 'Data guru berhasil diperbarui' });
            } else {
                const { error } = await supabase.from('guru').insert({
                    kode_guru: formData.kode_guru,
                    nama: formData.nama,
                    status_pegawai: formData.status_pegawai,
                    nip: formData.nip,
                    status: formData.status,
                });

                if (error) throw error;
                toast({ title: 'Berhasil', description: 'Data guru berhasil ditambahkan' });
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

    async function handleDelete(item: Guru) {
        if (!confirm(`Hapus guru "${item.nama}"?`)) return;

        try {
            const { error } = await supabase.from('guru').delete().eq('id', item.id);
            if (error) throw error;

            toast({ title: 'Berhasil', description: 'Data guru berhasil dihapus' });
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
                    <h1 className="text-3xl font-bold tracking-tight">Data Guru</h1>
                    <p className="text-muted-foreground">
                        Kelola data guru dan tenaga pengajar
                    </p>
                </div>
                {canManage && (
                    <Button onClick={() => openDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Guru
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
                                placeholder="Cari nama, kode, atau NIP..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="mr-2 h-4 w-4" />
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
                    <CardTitle>Daftar Guru</CardTitle>
                    <CardDescription>
                        {filteredData.length} dari {data.length} guru
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
                                        <th className="pb-3 font-medium">Kode</th>
                                        <th className="pb-3 font-medium">Nama</th>
                                        <th className="pb-3 font-medium">Status Pegawai</th>
                                        <th className="pb-3 font-medium">NIP</th>
                                        <th className="pb-3 font-medium">Status</th>
                                        {canManage && <th className="pb-3 font-medium">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((item, index) => (
                                        <tr key={item.id} className="border-b">
                                            <td className="py-3">{index + 1}</td>
                                            <td className="py-3 font-mono text-sm">{item.kode_guru}</td>
                                            <td className="py-3 font-medium">{item.nama}</td>
                                            <td className="py-3">
                                                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium">
                                                    {item.status_pegawai}
                                                </span>
                                            </td>
                                            <td className="py-3 font-mono text-sm">{item.nip}</td>
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
                                {editingItem ? 'Edit Guru' : 'Tambah Guru'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingItem
                                    ? 'Perbarui informasi guru'
                                    : 'Tambahkan guru baru ke sistem'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="kode_guru">Kode Guru</Label>
                                <Input
                                    id="kode_guru"
                                    placeholder="GR-001"
                                    value={formData.kode_guru}
                                    onChange={(e) =>
                                        setFormData({ ...formData, kode_guru: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="nama">Nama Lengkap</Label>
                                <Input
                                    id="nama"
                                    placeholder="Nama lengkap guru"
                                    value={formData.nama}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nama: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status_pegawai">Status Pegawai</Label>
                                <Select
                                    value={formData.status_pegawai}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            status_pegawai: value as typeof formData.status_pegawai,
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusPegawaiOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="nip">NIP</Label>
                                <Input
                                    id="nip"
                                    placeholder="NIP (kosongkan untuk GTT)"
                                    value={formData.nip}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nip: e.target.value })
                                    }
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
                                        {statusOptions.map((opt) => (
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