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
import { Plus, Pencil, Trash2, Search, Filter, BookOpen, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PembagianMengajarReal {
    id: string;
    semester_id: string;
    guru_id: string;
    mata_pelajaran_id: string;
    kelas_real_id: string;
    jam_mengajar: number;
    created_at: string;
    // Joined data
    guru?: { id: string; nama: string; kode_guru: string };
    mata_pelajaran?: { id: string; nama: string; kode_mapel: string };
    kelas_real?: { id: string; nama: string; jenjang: number };
}

interface Guru {
    id: string;
    nama: string;
    kode_guru: string;
}

interface MataPelajaran {
    id: string;
    nama: string;
    kode_mapel: string;
}

interface KelasReal {
    id: string;
    nama: string;
    jenjang: number;
}

/**
 * Pembagian Mengajar Real Page
 * 
 * Halaman CRUD untuk mengelola pembagian mengajar operasional (Real).
 * Accessible oleh superadmin, admin, dan kepala sekolah.
 */
export default function PembagianMengajarRealPage() {
    const { profile } = useAuth();
    const { semester } = useActiveSemester();
    const { toast } = useToast();
    const supabase = createClient();

    const [data, setData] = useState<PembagianMengajarReal[]>([]);
    const [filteredData, setFilteredData] = useState<PembagianMengajarReal[]>([]);
    const [guruList, setGuruList] = useState<Guru[]>([]);
    const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
    const [kelasList, setKelasList] = useState<KelasReal[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGuru, setFilterGuru] = useState<string>('all');
    const [filterMapel, setFilterMapel] = useState<string>('all');
    const [filterJenjang, setFilterJenjang] = useState<string>('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PembagianMengajarReal | null>(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        guru_id: '',
        mata_pelajaran_id: '',
        kelas_real_id: '',
        jam_mengajar: 0,
    });

    // Check permission
    const canManage = profile?.role === 'superadmin' || profile?.role === 'admin';

    // Fetch reference data
    useEffect(() => {
        fetchReferenceData();
    }, []);

    // Fetch pembagian mengajar
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
                    item.guru?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.mata_pelajaran?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.kelas_real?.nama.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterGuru !== 'all') {
            result = result.filter((item) => item.guru_id === filterGuru);
        }

        if (filterMapel !== 'all') {
            result = result.filter((item) => item.mata_pelajaran_id === filterMapel);
        }

        if (filterJenjang !== 'all') {
            result = result.filter((item) => item.kelas_real?.jenjang === parseInt(filterJenjang));
        }

        setFilteredData(result);
    }, [data, searchTerm, filterGuru, filterMapel, filterJenjang]);

    async function fetchReferenceData() {
        try {
            const [guruRes, mapelRes, kelasRes] = await Promise.all([
                supabase.from('guru').select('id, nama, kode_guru').eq('status', 'aktif').order('nama'),
                supabase.from('mata_pelajaran').select('id, nama, kode_mapel').eq('status', 'aktif').order('nama'),
                semester?.id
                    ? supabase.from('kelas_real').select('id, nama, jenjang').eq('semester_id', semester.id).order('nama')
                    : Promise.resolve({ data: [] }),
            ]);

            setGuruList(guruRes.data || []);
            setMapelList(mapelRes.data || []);
            setKelasList(kelasRes.data || []);
        } catch (error) {
            console.error('Error fetching reference data:', error);
        }
    }

    async function fetchData() {
        if (!semester?.id) return;

        try {
            setLoading(true);
            const { data: result, error } = await supabase
                .from('pembagian_mengajar_real')
                .select(`
                    *,
                    guru:guru_id (id, nama, kode_guru),
                    mata_pelajaran:mata_pelajaran_id (id, nama, kode_mapel),
                    kelas_real:kelas_real_id (id, nama, jenjang)
                `)
                .eq('semester_id', semester.id)
                .order('guru(nama)');

            if (error) throw error;
            setData(result || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: 'Error',
                description: 'Gagal memuat data pembagian mengajar',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    function openDialog(item?: PembagianMengajarReal) {
        if (item) {
            setEditingItem(item);
            setFormData({
                guru_id: item.guru_id,
                mata_pelajaran_id: item.mata_pelajaran_id,
                kelas_real_id: item.kelas_real_id,
                jam_mengajar: item.jam_mengajar,
            });
        } else {
            setEditingItem(null);
            setFormData({
                guru_id: '',
                mata_pelajaran_id: '',
                kelas_real_id: '',
                jam_mengajar: 0,
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
                    .from('pembagian_mengajar_real')
                    .update({
                        guru_id: formData.guru_id,
                        mata_pelajaran_id: formData.mata_pelajaran_id,
                        kelas_real_id: formData.kelas_real_id,
                        jam_mengajar: formData.jam_mengajar,
                    })
                    .eq('id', editingItem.id);

                if (error) throw error;
                toast({ title: 'Berhasil', description: 'Pembagian mengajar berhasil diperbarui' });
            } else {
                const { error } = await supabase.from('pembagian_mengajar_real').insert({
                    semester_id: semester?.id,
                    guru_id: formData.guru_id,
                    mata_pelajaran_id: formData.mata_pelajaran_id,
                    kelas_real_id: formData.kelas_real_id,
                    jam_mengajar: formData.jam_mengajar,
                });

                if (error) throw error;
                toast({ title: 'Berhasil', description: 'Pembagian mengajar berhasil ditambahkan' });
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

    async function handleDelete(item: PembagianMengajarReal) {
        if (!confirm(`Hapus pembagian mengajar ini?`)) return;

        try {
            const { error } = await supabase.from('pembagian_mengajar_real').delete().eq('id', item.id);
            if (error) throw error;

            toast({ title: 'Berhasil', description: 'Pembagian mengajar berhasil dihapus' });
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
                    <h1 className="text-3xl font-bold tracking-tight">Pembagian Mengajar Real</h1>
                    <p className="text-muted-foreground">
                        Kelola pembagian mengajar operasional (Real)
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
                        Tambah Pembagian
                    </Button>
                )}
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Cari guru, mapel, atau kelas..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterGuru} onValueChange={setFilterGuru}>
                            <SelectTrigger>
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Filter guru" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Guru</SelectItem>
                                {guruList.map((g) => (
                                    <SelectItem key={g.id} value={g.id}>
                                        {g.nama}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterJenjang} onValueChange={setFilterJenjang}>
                            <SelectTrigger>
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

            {/* Data Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Pembagian Mengajar</CardTitle>
                    <CardDescription>
                        {filteredData.length} dari {data.length} pembagian mengajar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-muted-foreground">Memuat...</p>
                    ) : !semester ? (
                        <p className="text-muted-foreground">
                            Tidak ada semester aktif. Hubungi administrator.
                        </p>
                    ) : filteredData.length === 0 ? (
                        <p className="text-muted-foreground">Tidak ada data yang cocok</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left text-sm text-muted-foreground">
                                        <th className="pb-3 font-medium">Guru</th>
                                        <th className="pb-3 font-medium">Mata Pelajaran</th>
                                        <th className="pb-3 font-medium">Kelas</th>
                                        <th className="pb-3 font-medium">Jam</th>
                                        {canManage && <th className="pb-3 font-medium">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((item) => (
                                        <tr key={item.id} className="border-b">
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="font-medium">{item.guru?.nama}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.guru?.kode_guru}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="font-medium">{item.mata_pelajaran?.nama}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.mata_pelajaran?.kode_mapel}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium">
                                                    {item.kelas_real?.nama}
                                                </span>
                                            </td>
                                            <td className="py-3">{item.jam_mengajar} JP</td>
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
                <DialogContent className="max-w-lg">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {editingItem ? 'Edit Pembagian Mengajar' : 'Tambah Pembagian Mengajar'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingItem
                                    ? 'Perbarui informasi pembagian mengajar'
                                    : 'Tambahkan pembagian mengajar baru'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="guru_id">Guru</Label>
                                <Select
                                    value={formData.guru_id}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, guru_id: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih guru" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {guruList.map((g) => (
                                            <SelectItem key={g.id} value={g.id}>
                                                {g.nama} ({g.kode_guru})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="mata_pelajaran_id">Mata Pelajaran</Label>
                                <Select
                                    value={formData.mata_pelajaran_id}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, mata_pelajaran_id: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih mata pelajaran" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {mapelList.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.nama} ({m.kode_mapel})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="kelas_real_id">Kelas Real</Label>
                                <Select
                                    value={formData.kelas_real_id}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, kelas_real_id: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih kelas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {kelasList.map((k) => (
                                            <SelectItem key={k.id} value={k.id}>
                                                {k.nama} (Jenjang {k.jenjang})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="jam_mengajar">Jam Mengajar (JP)</Label>
                                <Input
                                    id="jam_mengajar"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={formData.jam_mengajar}
                                    onChange={(e) =>
                                        setFormData({ ...formData, jam_mengajar: parseInt(e.target.value) || 0 })
                                    }
                                />
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
                            <Button type="submit" disabled={saving || !formData.guru_id || !formData.mata_pelajaran_id || !formData.kelas_real_id}>
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}