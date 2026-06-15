'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
    ArrowLeft,
    Plus,
    Pencil,
    Trash2,
    Printer,
    Save,
    Calendar,
    Clock,
    FileDown,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';

interface Asesmen {
    id: string;
    semester_id: string;
    semester_nama: string;
    jenis_ujian: string;
    tanggal_mulai: string | null;
    tanggal_selesai: string | null;
    kode_nus: string | null;
    acuan_kelas: 'real' | 'dapo';
}

interface JadwalUjian {
    id: string;
    asesmen_id: string;
    hari: string;
    tanggal: string;
    jam: string;
    jam_mulai: string;
    durasi_menit: number;
    mata_pelajaran_id: string | null;
    mata_pelajaran_nama?: string;
    urutan: number;
}

interface MataPelajaran {
    id: string;
    kode_mapel: string;
    nama: string;
}

const HARI_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const JAM_OPTIONS = ['Jam ke - 1', 'Jam ke - 2'];

export default function JadwalUjianPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const asesmenId = params.id as string;

    const [asesmen, setAsesmen] = useState<Asesmen | null>(null);
    const [jadwals, setJadwals] = useState<JadwalUjian[]>([]);
    const [mataPelajarans, setMataPelajarans] = useState<MataPelajaran[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedJadwal, setSelectedJadwal] = useState<JadwalUjian | null>(null);
    const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        hari: '',
        tanggal: '',
        jam: '',
        jam_mulai: '',
        durasi_menit: 120,
        mata_pelajaran_id: '',
        urutan: 1,
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch asesmen
            const asesmenRes = await fetch(`/api/asesmen/${asesmenId}`);
            if (asesmenRes.ok) {
                const data = await asesmenRes.json();
                setAsesmen(data);
            }

            // Fetch jadwals
            const jadwalsRes = await fetch(`/api/asesmen/${asesmenId}/jadwal`);
            if (jadwalsRes.ok) {
                const data = await jadwalsRes.json();
                setJadwals(data);
            }

            // Fetch mata pelajaran
            const mapelRes = await fetch('/api/mata-pelajaran?status=aktif');
            if (mapelRes.ok) {
                const data = await mapelRes.json();
                setMataPelajarans(data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: 'Error',
                description: 'Gagal memuat data',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [asesmenId, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const resetForm = () => {
        setFormData({
            hari: '',
            tanggal: '',
            jam: '',
            jam_mulai: '',
            durasi_menit: 120,
            mata_pelajaran_id: '',
            urutan: jadwals.length + 1,
        });
        setSelectedJadwal(null);
    };

    const handleOpenDialog = (jadwal?: JadwalUjian) => {
        if (jadwal) {
            setSelectedJadwal(jadwal);
            setFormData({
                hari: jadwal.hari || '',
                tanggal: jadwal.tanggal || '',
                jam: jadwal.jam || '',
                jam_mulai: jadwal.jam_mulai || '',
                durasi_menit: jadwal.durasi_menit || 120,
                mata_pelajaran_id: jadwal.mata_pelajaran_id || '',
                urutan: jadwal.urutan || 1,
            });
        } else {
            resetForm();
        }
        setDialogOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const url = selectedJadwal
                ? `/api/asesmen/${asesmenId}/jadwal/${selectedJadwal.id}`
                : `/api/asesmen/${asesmenId}/jadwal`;
            const method = selectedJadwal ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setDialogOpen(false);
                resetForm();
                fetchData();
                toast({
                    title: 'Berhasil',
                    description: selectedJadwal
                        ? 'Jadwal berhasil diperbarui'
                        : 'Jadwal berhasil ditambahkan',
                });
            } else {
                const error = await res.json();
                toast({
                    title: 'Error',
                    description: error.message || 'Gagal menyimpan jadwal',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Terjadi kesalahan saat menyimpan',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedDeleteId) return;

        try {
            const res = await fetch(`/api/asesmen/${asesmenId}/jadwal/${selectedDeleteId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setDeleteDialogOpen(false);
                setSelectedDeleteId(null);
                fetchData();
                toast({
                    title: 'Berhasil',
                    description: 'Jadwal berhasil dihapus',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Gagal menghapus jadwal',
                variant: 'destructive',
            });
        }
    };

    const handleExportPDF = async () => {
        toast({
            title: 'Memproses',
            description: 'Membuat PDF jadwal ujian...',
        });

        try {
            const res = await fetch(`/api/asesmen/${asesmenId}/jadwal/export`, {
                method: 'POST',
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Jadwal_${asesmen?.jenis_ujian || 'Ujian'}_${asesmen?.kode_nus || ''}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                toast({
                    title: 'Berhasil',
                    description: 'PDF jadwal ujian berhasil diunduh',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Gagal membuat PDF',
                variant: 'destructive',
            });
        }
    };

    // Group jadwals by hari
    const groupedJadwals = jadwals.reduce((acc, jadwal) => {
        const key = jadwal.hari || 'Lainnya';
        if (!acc[key]) acc[key] = [];
        acc[key].push(jadwal);
        return acc;
    }, {} as Record<string, JadwalUjian[]>);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatTime = (timeStr: string | null) => {
        if (!timeStr) return '-';
        const [hours, minutes] = timeStr.split(':');
        return `${hours}:${minutes}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
        );
    }

    if (!asesmen) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">Asesmen tidak ditemukan</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">Jadwal Ujian</h1>
                    <p className="text-muted-foreground">
                        {asesmen.jenis_ujian} • {asesmen.semester_nama}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportPDF}>
                        <Printer className="mr-2 h-4 w-4" />
                        Export PDF
                    </Button>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => handleOpenDialog()}>
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Jadwal
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>
                                    {selectedJadwal ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
                                </DialogTitle>
                                <DialogDescription>
                                    {selectedJadwal
                                        ? 'Perbarui informasi jadwal ujian.'
                                        : 'Tambah jadwal ujian untuk sesi ini.'}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="hari">Hari</Label>
                                        <Select
                                            value={formData.hari}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, hari: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih hari" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {HARI_OPTIONS.map((hari) => (
                                                    <SelectItem key={hari} value={hari}>
                                                        {hari}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tanggal">Tanggal</Label>
                                        <Input
                                            id="tanggal"
                                            type="date"
                                            value={formData.tanggal}
                                            onChange={(e) =>
                                                setFormData({ ...formData, tanggal: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="jam">Sesi Jam</Label>
                                        <Select
                                            value={formData.jam}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, jam: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih sesi" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {JAM_OPTIONS.map((jam) => (
                                                    <SelectItem key={jam} value={jam}>
                                                        {jam}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="jam_mulai">Jam Mulai</Label>
                                        <Input
                                            id="jam_mulai"
                                            type="time"
                                            value={formData.jam_mulai}
                                            onChange={(e) =>
                                                setFormData({ ...formData, jam_mulai: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="durasi_menit">Durasi (menit)</Label>
                                        <Input
                                            id="durasi_menit"
                                            type="number"
                                            min="30"
                                            max="300"
                                            value={formData.durasi_menit}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    durasi_menit: parseInt(e.target.value) || 120,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="urutan">Urutan</Label>
                                        <Input
                                            id="urutan"
                                            type="number"
                                            min="1"
                                            max="12"
                                            value={formData.urutan}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    urutan: parseInt(e.target.value) || 1,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mata_pelajaran">Mata Pelajaran</Label>
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
                                            {mataPelajarans.map((mapel) => (
                                                <SelectItem key={mapel.id} value={mapel.id}>
                                                    {mapel.kode_mapel} - {mapel.nama}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                    Batal
                                </Button>
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? 'Menyimpan...' : 'Simpan'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Info Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Jenis Ujian</p>
                            <p className="font-medium">{asesmen.jenis_ujian}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Kode NUS</p>
                            <p className="font-medium">{asesmen.kode_nus || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Tanggal Ujian</p>
                            <p className="font-medium">
                                {formatDate(asesmen.tanggal_mulai)} -{' '}
                                {formatDate(asesmen.tanggal_selesai)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Acuan Kelas</p>
                            <p className="font-medium">
                                {asesmen.acuan_kelas === 'real' ? 'Kelas Real' : 'Kelas Dapodik'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Jadwals Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Susunan Jadwal Ujian
                        <Badge variant="secondary">{jadwals.length}/12</Badge>
                    </CardTitle>
                    <CardDescription>
                        Maksimal 12 sesi jadwal ujian. Urutan menentukan prioritas pencetakan.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {jadwals.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Belum ada jadwal ujian.</p>
                            <p className="text-sm">Klik tombol &quot;Tambah Jadwal&quot; untuk memulai.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Urutan</TableHead>
                                    <TableHead>Hari</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Sesi</TableHead>
                                    <TableHead>Jam Mulai</TableHead>
                                    <TableHead>Durasi</TableHead>
                                    <TableHead>Mata Pelajaran</TableHead>
                                    <TableHead className="w-[100px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jadwals
                                    .sort((a, b) => a.urutan - b.urutan)
                                    .map((jadwal) => (
                                        <TableRow key={jadwal.id}>
                                            <TableCell>
                                                <Badge variant="outline">{jadwal.urutan}</Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">{jadwal.hari}</TableCell>
                                            <TableCell>{formatDate(jadwal.tanggal)}</TableCell>
                                            <TableCell>{jadwal.jam}</TableCell>
                                            <TableCell>{formatTime(jadwal.jam_mulai)}</TableCell>
                                            <TableCell>{jadwal.durasi_menit} menit</TableCell>
                                            <TableCell>
                                                {jadwal.mata_pelajaran_nama || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenDialog(jadwal)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setSelectedDeleteId(jadwal.id);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Quick Navigation */}
            <div className="flex justify-between">
                <Button variant="outline" onClick={() => router.push(`/master/asesmen`)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Daftar Asesmen
                </Button>
                <Button onClick={() => router.push(`/master/asesmen/${asesmenId}/matrix`)}>
                    Tab 2: Matrix Pengawas
                    <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                </Button>
            </div>

            {/* Delete Confirmation */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Jadwal?</DialogTitle>
                        <DialogDescription>
                            Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}