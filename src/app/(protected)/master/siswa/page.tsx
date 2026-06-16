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
import { Plus, Pencil, Trash2, Search, Filter, Upload, Award, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AlumniDialog } from '@/components/data-master/alumni-dialog';
import { useAlumni } from '@/hooks/useAlumni';
import { SiswaWithRelations, status_siswa_enum } from '@/types/database';
import { cn } from '@/lib/utils';

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
 * Mendukung fitur alumni dengan Award button.
 */
export default function SiswaPage() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const supabase = createClient();
    const { makeAlumni, revertAlumni, isProcessing } = useAlumni();

    const [data, setData] = useState<SiswaWithRelations[]>([]);
    const [filteredData, setFilteredData] = useState<SiswaWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGender, setFilterGender] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [alumniDialogOpen, setAlumniDialogOpen] = useState(false);
    const [selectedSiswa, setSelectedSiswa] = useState<SiswaWithRelations | null>(null);
    const [editingItem, setEditingItem] = useState<SiswaWithRelations | null>(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        nis: '',
        nisn: '',
        nipd: '',
        nama: '',
        jenjang: '' as string | null,
        jenis_kelamin: 'L' as 'L' | 'P',
        status: 'aktif' as status_siswa_enum,
    });

    // Check permission
    const canManage = profile?.role === 'superadmin' || profile?.role === 'admin' || profile?.role === 'urusan';

    // Fetch data with relations
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
            result = result.filter((item) => item.status_siswa === filterStatus);
        }

        setFilteredData(result);
    }, [data, searchTerm, filterGender, filterStatus]);

    async function fetchData() {
        try {
            // Fetch active semester first
            const { data: activeSemester } = await supabase
                .from('semester')
                .select('id')
                .eq('status', 'aktif')
                .maybeSingle();

            const { data: result, error } = await supabase
                .from('siswa')
                .select(`
                    *,
                    siswa_kelas(
                        semester_id,
                        kelas_dapo(id, nama),
                        kelas_real(id, nama)
                    )
                `)
                .order('nama');

            if (error) throw error;
            // Transform data to match SiswaWithRelations
            const transformed = (result || []).map((item: Record<string, any>) => {
                const activeAbsence = activeSemester
                    ? item.siswa_kelas?.find((sk: any) => sk.semester_id === activeSemester.id)
                    : item.siswa_kelas?.[0];

                return {
                    ...item,
                    status_siswa: (item.status as status_siswa_enum) || 'aktif',
                    tahun_lulus: (item.tahun_lulus as number | null) || null,
                    jenjang: item.jenjang as number | null,
                    kelas_dapo: activeAbsence?.kelas_dapo || null,
                    kelas_real: activeAbsence?.kelas_real || null,
                };
            }) as SiswaWithRelations[];
            setData(transformed);
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

    function openDialog(item?: SiswaWithRelations) {
        if (item) {
            setEditingItem(item);
            setFormData({
                nis: item.nis,
                nisn: item.nisn || '',
                nipd: item.nipd || '',
                nama: item.nama,
                jenjang: item.jenjang?.toString() || '',
                jenis_kelamin: item.jenis_kelamin,
                status: item.status_siswa,
            });
        } else {
            setEditingItem(null);
            setFormData({
                nis: '',
                nisn: '',
                nipd: '',
                nama: '',
                jenjang: '',
                jenis_kelamin: 'L',
                status: 'aktif',
            });
        }
        setDialogOpen(true);
    }

    // Open alumni dialog
    function openAlumniDialog(item: SiswaWithRelations) {
        setSelectedSiswa(item);
        setAlumniDialogOpen(true);
    }

    // Handle make alumni
    async function handleMakeAlumni(tahunLulus: number | undefined) {
        if (!selectedSiswa) return;
        
        const success = await makeAlumni({
            siswa_id: selectedSiswa.id,
            tahun_lulus: tahunLulus,
        });
        
        if (success) {
            setAlumniDialogOpen(false);
            setSelectedSiswa(null);
            fetchData();
        }
    }

    // Handle revert alumni
    async function handleRevertAlumni() {
        if (!selectedSiswa) return;
        
        const success = await revertAlumni(selectedSiswa.id);
        
        if (success) {
            setAlumniDialogOpen(false);
            setSelectedSiswa(null);
            fetchData();
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        try {
            const payload: Record<string, unknown> = {
                nis: formData.nis,
                nisn: formData.nisn || null,
                nipd: formData.nipd || null,
                nama: formData.nama,
                jenis_kelamin: formData.jenis_kelamin,
                status: formData.status,
            };

            if (formData.jenjang) {
                payload.jenjang = parseInt(formData.jenjang);
            }

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

    async function handleDelete(item: SiswaWithRelations) {
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
                    <Button variant="outline" asChild>
                        <a href="/master/siswa/import">
                            <Upload className="mr-2 h-4 w-4" />
                            Import Excel
                        </a>
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
                                <Filter className="mr-2 h-4 w-4" />
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
                        {filterStatus === 'alumni' && (
                            <span className="ml-2 text-amber-600">
                                (Menampilkan alumni)
                            </span>
                        )}
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
                                        <th className="pb-3 font-medium hidden lg:table-cell">Jenjang</th>
                                        <th className="pb-3 font-medium hidden md:table-cell">Kelas Dapo</th>
                                        <th className="pb-3 font-medium hidden md:table-cell">Kelas Real</th>
                                        <th className="pb-3 font-medium">Status</th>
                                        <th className="pb-3 font-medium hidden lg:table-cell">Tahun Lulus</th>
                                        {canManage && <th className="pb-3 font-medium">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((item, index) => (
                                        <tr 
                                            key={item.id} 
                                            className={cn(
                                                'border-b transition-colors',
                                                item.status_siswa === 'alumni' && 'bg-amber-50/50'
                                            )}
                                        >
                                            <td className="py-3">{index + 1}</td>
                                            <td className="py-3 font-mono text-sm">{item.nis}</td>
                                            <td className="py-3 font-medium">{item.nama}</td>
                                            <td className="py-3">
                                                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium">
                                                    {item.jenis_kelamin}
                                                </span>
                                            </td>
                                            <td className="py-3 font-mono text-sm">{item.nisn || '-'}</td>
                                            <td className="py-3 hidden lg:table-cell">{item.jenjang || '-'}</td>
                                            <td className="py-3 hidden md:table-cell text-sm">
                                                {item.kelas_dapo?.nama || '-'}
                                            </td>
                                            <td className="py-3 hidden md:table-cell text-sm">
                                                {item.kelas_real?.nama || '-'}
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className={cn(
                                                        'rounded-full px-2 py-1 text-xs font-medium',
                                                        item.status_siswa === 'aktif'
                                                            ? 'bg-green-100 text-green-800'
                                                            : item.status_siswa === 'alumni'
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    )}
                                                >
                                                    {item.status_siswa}
                                                </span>
                                            </td>
                                            <td className="py-3 hidden lg:table-cell font-medium">
                                                {item.tahun_lulus || '-'}
                                            </td>
                                            {canManage && (
                                                <td className="py-3">
                                                    <div className="flex gap-1">
                                                        {/* Alumni Button */}
                                                        {item.status_siswa === 'alumni' ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openAlumniDialog(item)}
                                                                className="h-8 w-8 text-amber-600 hover:text-amber-700"
                                                                title="Batalkan Alumni"
                                                            >
                                                                <RotateCcw className="h-4 w-4" />
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openAlumniDialog(item)}
                                                                className="h-8 w-8 text-amber-600 hover:text-amber-700"
                                                                title="Jadikan Alumni"
                                                            >
                                                                <Award className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openDialog(item)}
                                                            className="h-8 w-8"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(item)}
                                                            className="h-8 w-8 text-destructive hover:text-destructive"
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
                            <div className="grid gap-2">
                                <Label htmlFor="jenjang">Jenjang</Label>
                                <Select
                                    value={formData.jenjang || ''}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, jenjang: value || null })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih jenjang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7">Kelas 7</SelectItem>
                                        <SelectItem value="8">Kelas 8</SelectItem>
                                        <SelectItem value="9">Kelas 9</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                                    <Select
                                        value={formData.jenis_kelamin}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                jenis_kelamin: value as 'L' | 'P',
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
                                                status: value as status_siswa_enum,
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

            {/* Alumni Dialog */}
            <AlumniDialog
                open={alumniDialogOpen}
                onOpenChange={setAlumniDialogOpen}
                siswa={selectedSiswa}
                onConfirm={handleMakeAlumni}
                onRevert={selectedSiswa?.status_siswa === 'alumni' ? handleRevertAlumni : undefined}
                isProcessing={isProcessing}
            />
        </div>
    );
}
