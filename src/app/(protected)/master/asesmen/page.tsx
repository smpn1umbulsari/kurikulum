'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    BookOpen,
    Calendar,
    ChevronRight,
    Clock,
    FileText,
    Grid3X3,
    LayoutGrid,
    MoreHorizontal,
    Plus,
    Printer,
    Users,
    ClipboardList,
    UserCheck,
} from 'lucide-react';

interface Asesmen {
    id: string;
    semester_id: string;
    semester_nama: string;
    jenis_ujian: string;
    tanggal_mulai: string | null;
    tanggal_selesai: string | null;
    tanggal_ttd: string | null;
    kode_nus: string | null;
    acuan_kelas: 'real' | 'dapo';
    created_at: string;
}

interface Semester {
    id: string;
    nama: string;
    tahun_pelajaran_nama: string;
}

const JENIS_UJIAN_OPTIONS = [
    { value: 'Asesmen Sumatif Tengah Semester', label: 'ASTS - Asesmen Sumatif Tengah Semester' },
    { value: 'Asesmen Sumatif Akhir Semester', label: 'ASAS - Asesmen Sumatif Akhir Semester' },
    { value: 'Asesmen Sumatif Akhir Tahun', label: 'ASAT - Asesmen Sumatif Akhir Tahun' },
    { value: 'Asesmen Sumatif Akhir Jenjang', label: 'ASAJ - Asesmen Sumatif Akhir Jenjang' },
];

export default function AsesmenPage() {
    const router = useRouter();
    const [asesmens, setAsesmens] = useState<Asesmen[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedAsesmen, setSelectedAsesmen] = useState<Asesmen | null>(null);
    const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        semester_id: '',
        jenis_ujian: '',
        tanggal_mulai: '',
        tanggal_selesai: '',
        tanggal_ttd: '',
        kode_nus: '',
        acuan_kelas: 'real' as 'real' | 'dapo',
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch semesters
            const semestersRes = await fetch('/api/semester?status=aktif');
            if (semestersRes.ok) {
                const semestersData = await semestersRes.json();
                setSemesters(semestersData);
            }

            // Fetch asesmens
            const asesmensRes = await fetch('/api/asesmen');
            if (asesmensRes.ok) {
                const asesmensData = await asesmensRes.json();
                setAsesmens(asesmensData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load data on mount
    useState(() => {
        fetchData();
    });

    const resetForm = () => {
        setFormData({
            semester_id: '',
            jenis_ujian: '',
            tanggal_mulai: '',
            tanggal_selesai: '',
            tanggal_ttd: '',
            kode_nus: '',
            acuan_kelas: 'real',
        });
        setSelectedAsesmen(null);
    };

    const handleOpenDialog = (asesmen?: Asesmen) => {
        if (asesmen) {
            setSelectedAsesmen(asesmen);
            setFormData({
                semester_id: asesmen.semester_id,
                jenis_ujian: asesmen.jenis_ujian,
                tanggal_mulai: asesmen.tanggal_mulai || '',
                tanggal_selesai: asesmen.tanggal_selesai || '',
                tanggal_ttd: asesmen.tanggal_ttd || '',
                kode_nus: asesmen.kode_nus || '',
                acuan_kelas: asesmen.acuan_kelas,
            });
        } else {
            resetForm();
        }
        setDialogOpen(true);
    };

    const handleSave = async () => {
        try {
            const url = selectedAsesmen
                ? `/api/asesmen/${selectedAsesmen.id}`
                : '/api/asesmen';
            const method = selectedAsesmen ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setDialogOpen(false);
                resetForm();
                fetchData();
            }
        } catch (error) {
            console.error('Error saving asesmen:', error);
        }
    };

    const handleDelete = async () => {
        if (!selectedDeleteId) return;

        try {
            const res = await fetch(`/api/asesmen/${selectedDeleteId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setDeleteDialogOpen(false);
                setSelectedDeleteId(null);
                fetchData();
            }
        } catch (error) {
            console.error('Error deleting asesmen:', error);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    const getJenisUjianShort = (jenis: string) => {
        const map: Record<string, string> = {
            'Asesmen Sumatif Tengah Semester': 'ASTS',
            'Asesmen Sumatif Akhir Semester': 'ASAS',
            'Asesmen Sumatif Akhir Tahun': 'ASAT',
            'Asesmen Sumatif Akhir Jenjang': 'ASAJ',
        };
        return map[jenis] || jenis;
    };

    const getJenisUjianColor = (jenis: string) => {
        const map: Record<string, string> = {
            'Asesmen Sumatif Tengah Semester': 'bg-blue-500',
            'Asesmen Sumatif Akhir Semester': 'bg-green-500',
            'Asesmen Sumatif Akhir Tahun': 'bg-orange-500',
            'Asesmen Sumatif Akhir Jenjang': 'bg-purple-500',
        };
        return map[jenis] || 'bg-gray-500';
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manajemen Asesmen</h1>
                    <p className="text-muted-foreground">
                        Kelola rencana asesmen, jadwal ujian, pembagian ruang, dan kepengawasan
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Asesmen
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedAsesmen ? 'Edit Asesmen' : 'Tambah Asesmen Baru'}
                            </DialogTitle>
                            <DialogDescription>
                                {selectedAsesmen
                                    ? 'Perbarui informasi rencana asesmen.'
                                    : 'Buat rencana asesmen baru untuk semester ini.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="semester">Semester</Label>
                                <Select
                                    value={formData.semester_id}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, semester_id: value })
                                    }
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Pilih semester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {semesters.map((sem) => (
                                            <SelectItem key={sem.id} value={sem.id}>
                                                {sem.nama} ({sem.tahun_pelajaran_nama})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="jenis_ujian">Jenis Ujian</Label>
                                <Select
                                    value={formData.jenis_ujian}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, jenis_ujian: value })
                                    }
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Pilih jenis ujian" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {JENIS_UJIAN_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="kode_nus">Kode NUS</Label>
                                <Input
                                    id="kode_nus"
                                    value={formData.kode_nus}
                                    onChange={(e) =>
                                        setFormData({ ...formData, kode_nus: e.target.value })
                                    }
                                    placeholder="Contoh: 130"
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="tanggal_mulai">Tanggal Mulai</Label>
                                <Input
                                    id="tanggal_mulai"
                                    type="date"
                                    value={formData.tanggal_mulai}
                                    onChange={(e) =>
                                        setFormData({ ...formData, tanggal_mulai: e.target.value })
                                    }
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="tanggal_selesai">Tanggal Selesai</Label>
                                <Input
                                    id="tanggal_selesai"
                                    type="date"
                                    value={formData.tanggal_selesai}
                                    onChange={(e) =>
                                        setFormData({ ...formData, tanggal_selesai: e.target.value })
                                    }
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="tanggal_ttd">Tanggal TTD</Label>
                                <Input
                                    id="tanggal_ttd"
                                    type="date"
                                    value={formData.tanggal_ttd}
                                    onChange={(e) =>
                                        setFormData({ ...formData, tanggal_ttd: e.target.value })
                                    }
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="acuan_kelas">Acuan Kelas</Label>
                                <Select
                                    value={formData.acuan_kelas}
                                    onValueChange={(value: 'real' | 'dapo') =>
                                        setFormData({ ...formData, acuan_kelas: value })
                                    }
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="real">Kelas Real</SelectItem>
                                        <SelectItem value="dapo">Kelas Dapodik</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Batal
                            </Button>
                            <Button onClick={handleSave}>
                                {selectedAsesmen ? 'Simpan Perubahan' : 'Buat Asesmen'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Quick Navigation Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => router.push('/master/asesmen/jadwal')}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Jadwal Ujian</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Tab 1</div>
                        <p className="text-xs text-muted-foreground">
                            Susunan jadwal ujian per sesi
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => router.push('/master/asesmen/matrix-pengawas')}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Matrix Pengawas</CardTitle>
                        <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Tab 2</div>
                        <p className="text-xs text-muted-foreground">
                            Ketersediaan pengawas per slot
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => router.push('/master/asesmen/ruang')}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Pembagian Ruang</CardTitle>
                        <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Tab 3</div>
                        <p className="text-xs text-muted-foreground">
                            Pembagian siswa ke ruang ujian
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => router.push('/master/asesmen/kepengawasan')}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Pengawas</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Tab 4</div>
                        <p className="text-xs text-muted-foreground">
                            Pembagian & kartu pengawas
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Asesmen List */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Rencana Asesmen</CardTitle>
                    <CardDescription>
                        Kelola asesmen yang telah dibuat. Klik untuk melihat detail dan melanjutkan
                        ke modul berikutnya.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                        </div>
                    ) : asesmens.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Belum ada rencana asesmen.</p>
                            <p className="text-sm">
                                Klik tombol &quot;Tambah Asesmen&quot; untuk membuat yang baru.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {asesmens.map((asesmen) => (
                                <div
                                    key={asesmen.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold ${getJenisUjianColor(
                                                asesmen.jenis_ujian
                                            )}`}
                                        >
                                            {getJenisUjianShort(asesmen.jenis_ujian)}
                                        </div>
                                        <div>
                                            <div className="font-medium">
                                                {asesmen.jenis_ujian}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {asesmen.semester_nama} • Kode NUS:{' '}
                                                {asesmen.kode_nus || '-'} • Acuan:{' '}
                                                {asesmen.acuan_kelas === 'real'
                                                    ? 'Kelas Real'
                                                    : 'Kelas Dapo'}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {formatDate(asesmen.tanggal_mulai)} -{' '}
                                                {formatDate(asesmen.tanggal_selesai)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">
                                            {asesmen.acuan_kelas === 'real'
                                                ? 'Kelas Real'
                                                : 'Kelas Dapo'}
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => router.push(`/master/asesmen/${asesmen.id}/jadwal`)}
                                                >
                                                    <Clock className="mr-2 h-4 w-4" />
                                                    Jadwal Ujian
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        router.push(`/master/asesmen/${asesmen.id}/matrix`)
                                                    }
                                                >
                                                    <Grid3X3 className="mr-2 h-4 w-4" />
                                                    Matrix Pengawas
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        router.push(`/master/asesmen/${asesmen.id}/ruang`)
                                                    }
                                                >
                                                    <LayoutGrid className="mr-2 h-4 w-4" />
                                                    Pembagian Ruang
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        router.push(`/master/asesmen/${asesmen.id}/pengawas`)
                                                    }
                                                >
                                                    <UserCheck className="mr-2 h-4 w-4" />
                                                    Pembagian Pengawas
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        router.push(`/master/asesmen/${asesmen.id}/dokumen`)
                                                    }
                                                >
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    Nomor Peserta & Berkas
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleOpenDialog(asesmen)}
                                                >
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelectedDeleteId(asesmen.id);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                    className="text-destructive"
                                                >
                                                    Hapus
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Asesmen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini akan menghapus semua data terkait asesmen termasuk
                            jadwal, pembagian ruang, dan kepengawasan. Tindakan ini tidak dapat
                            dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}