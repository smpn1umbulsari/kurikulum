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
import { Plus, Pencil, Trash2, Search, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface KelasDapo {
    id: string;
    semester_id: string;
    nama: string;
    jenjang: number;
    created_at: string;
}

interface TahunPelajaran {
    id: string;
    nama: string;
}

/**
 * Kelas Dapodik Page
 * 
 * Halaman CRUD untuk mengelola kelas dapodik.
 * Accessible oleh superadmin, admin, dan urusan.
 */
export default function KelasDapoPage() {
    const { profile } = useAuth();
    const { semester, isLoading: semesterLoading } = useActiveSemester();
    const { toast } = useToast();
    const supabase = createClient();

    const [data, setData] = useState<KelasDapo[]>([]);
    const [filteredData, setFilteredData] = useState<KelasDapo[]>([]);
    const [tahunPelajaran, setTahunPelajaran] = useState<TahunPelajaran[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterJenjang, setFilterJenjang] = useState<string>('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<KelasDapo | null>(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        nama: '',
        jenjang: 7 as number,
        semester_id: '',
    });

    // Check permission
    const canManage = profile?.role === 'superadmin' || profile?.role === 'admin' || profile?.role === 'urusan';

    // Fetch data
    useEffect(() => {
        fetchTahunPelajaran();
    }, []);

    useEffect(() => {
        if (semester?.id) {
            fetchData(semester.id);
        }
    }, [semester]);

    useEffect(() => {
        let result = data;

        if (searchTerm) {
            result = result.filter(
                (item) => item.nama.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterJenjang !== 'all') {
            result = result.filter((item) => item.jenjang === parseInt(filterJenjang));
        }

        setFilteredData(result);
    }, [data, searchTerm, filterJenjang]);

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

    async function fetchData(semesterId: string) {
        try {
            setLoading(true);
            const { data: result, error } = await supabase
                .from('kelas_dapo')
                .select('*')
                .eq('semester_id', semesterId)
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

    function openDialog(item?: KelasDapo) {
        if (item) {
            setEditingItem(item);
            setFormData({
                nama: item.nama,
                jenjang: item.jenjang,
                semester_id: item.semester_id,
            });
        } else {
            setEditingItem(null);
            setFormData({
                nama: '',
                jenjang: 7,
                semester_id: semester?.id || '',
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
                    .from('kelas_dapo')
                    .update({
                        nama: formData.nama,
                        jenjang: formData.jenjang,
                    })
                    .eq('id', editingItem.id);

                if (error) throw error;
                toast({ title: 'Berhasil', description: 'Kelas berhasil diperbarui' });
            } else {
                const { error } = await supabase.from('kelas_dapo').insert({
                    nama: formData.nama,
                    jenjang: formData.jenjang,
                    semester_id: formData.semester_id,
                });

                if (error) throw error;
                toast({ title: 'Berhasil', description: 'Kelas berhasil ditambahkan' });
            }

            setDialogOpen(false);
            if (semester?.id) fetchData(semester.id);
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

    async function handleDelete(item: KelasDapo) {
        if (!confirm(`Hapus kelas "${item.nama}"?`)) return;

        try {
            const { error } = await supabase.from('kelas_dapo').delete().eq('id', item.id);
            if (error) throw error;

            toast({ title: 'Berhasil', description: 'Kelas berhasil dihapus' });
            if (semester?.id) fetchData(semester.id);
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
    }, {} as Record<number, KelasDapo[]>);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Kelas Dapodik</h1>
                    <p className="text-muted-foreground">
                        Kelola kelas berdasarkan data Dapodik
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
                                placeholder="Cari nama kelas..."
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
                    {loading || semesterLoading ? (
                        <p className="text-muted-foreground">Memuat...</p>
                    ) : !semester ? (
                        <p className="text-muted-foreground">
                            Tidak ada semester aktif. Hubungi administrator.
                        </p>
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
                                                    className="flex items-center justify-between rounded-lg border p-4"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                            <BookOpen className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{item.nama}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {item.jenjang === 7 ? 'VII' : item.jenjang === 8 ? 'VIII' : 'IX'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {canManage && (
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
                                {editingItem ? 'Edit Kelas' : 'Tambah Kelas'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingItem
                                    ? 'Perbarui informasi kelas'
                                    : 'Tambahkan kelas baru'}
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
                            {!editingItem && (
                                <div className="grid gap-2">
                                    <Label htmlFor="semester_id">Semester</Label>
                                    <Select
                                        value={formData.semester_id}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, semester_id: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih semester" />
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