'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
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
    ArrowLeft,
    Save,
    RotateCcw,
    RefreshCw,
    UserCheck,
    Users,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Settings,
    Printer,
    Check,
    X,
    Calendar,
    Clock,
} from 'lucide-react';

interface Asesmen {
    id: string;
    semester_id: string;
    semester_nama: string;
    jenis_ujian: string;
    kode_nus: string | null;
}

interface Guru {
    id: string;
    kode_guru: string;
    nama: string;
}

interface JadwalUjian {
    id: string;
    hari: string;
    tanggal: string;
    jam: string;
    jam_mulai: string;
    durasi_menit: number;
    mata_pelajaran_nama?: string;
    urutan: number;
}

interface Assignment {
    id?: string;
    jadwal_id: string;
    nomor_ruang: number;
    guru_id: string;
    urutan_pengawas: number;
    guru?: { id: string; nama: string; kode_guru: string };
}

interface Kepengawasan {
    id?: string;
    asesmen_id: string;
    matrix_mengawasi: any[];
    pengaturan: { pengawas_per_ruang: number; mode_auto: 'urut' | 'acak' };
    publish_kartu: boolean;
}

export default function PembagianPengawasPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const asesmenId = params.id as string;

    const [asesmen, setAsesmen] = useState<Asesmen | null>(null);
    const [gurus, setGurus] = useState<Guru[]>([]);
    const [jadwals, setJadwals] = useState<JadwalUjian[]>([]);
    const [rooms, setRooms] = useState<number[]>([]);
    const [kepengawasan, setKepengawasan] = useState<Kepengawasan | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [selectedGuruPreviewId, setSelectedGuruPreviewId] = useState<string>('');

    // Load data from API
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch asesmen
            const asesmenRes = await fetch(`/api/asesmen/${asesmenId}`);
            if (asesmenRes.ok) {
                const data = await asesmenRes.json();
                setAsesmen(data);
            }

            // Fetch pengawas details
            const res = await fetch(`/api/asesmen/${asesmenId}/pengawas`);
            if (res.ok) {
                const data = await res.json();
                setGurus(data.gurus || []);
                setJadwals(data.jadwals || []);
                setRooms(data.rooms || []);
                setKepengawasan(data.kepengawasan);
                setAssignments(data.assignments || []);
                if (data.gurus && data.gurus.length > 0) {
                    setSelectedGuruPreviewId(data.gurus[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: 'Error',
                description: 'Gagal memuat data pembagian pengawas',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [asesmenId, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSettingChange = (field: string, value: any) => {
        setHasChanges(true);
        setKepengawasan((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                pengaturan: {
                    ...prev.pengaturan,
                    [field]: value,
                },
            };
        });
    };

    const handleTogglePublish = async (checked: boolean) => {
        setKepengawasan((prev) => {
            if (!prev) return prev;
            return { ...prev, publish_kartu: checked };
        });
        setSaving(true);
        try {
            const res = await fetch(`/api/asesmen/${asesmenId}/pengawas`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    publish_kartu: checked,
                }),
            });

            if (res.ok) {
                toast({
                    title: 'Berhasil',
                    description: checked
                        ? 'Kartu pengawas telah dipublikasikan ke Guru'
                        : 'Publikasi kartu pengawas ditarik kembali',
                });
            } else {
                toast({
                    title: 'Error',
                    description: 'Gagal mengubah status publikasi',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Terjadi kesalahan saat memproses status',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleAssignmentChange = (jadwalId: string, room: number, supervisorIndex: number, guruId: string) => {
        setHasChanges(true);
        setAssignments((prev) => {
            const clean = prev.filter(
                (a) => !(a.jadwal_id === jadwalId && a.nomor_ruang === room && a.urutan_pengawas === supervisorIndex)
            );

            if (!guruId) {
                return clean;
            }

            const guruObj = gurus.find((g) => g.id === guruId);
            return [
                ...clean,
                {
                    jadwal_id: jadwalId,
                    nomor_ruang: room,
                    guru_id: guruId,
                    urutan_pengawas: supervisorIndex,
                    guru: guruObj,
                },
            ];
        });
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            // First save settings to ensure generation uses the correct rules
            await fetch(`/api/asesmen/${asesmenId}/pengawas`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pengaturan: kepengawasan?.pengaturan,
                }),
            });

            const res = await fetch(`/api/asesmen/${asesmenId}/pengawas/generate`, {
                method: 'POST',
            });

            if (res.ok) {
                const data = await res.json();
                setAssignments(data.assignments || []);
                setHasChanges(false);
                toast({
                    title: 'Berhasil',
                    description: `Auto-generate selesai. Menugaskan ${data.count} pengawas ke ruang ujian.`,
                });
            } else {
                const error = await res.json();
                toast({
                    title: 'Error',
                    description: error.error || 'Gagal melakukan auto-generate',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Terjadi kesalahan saat generate',
                variant: 'destructive',
            });
        } finally {
            setGenerating(false);
        }
    };

    const handleReset = () => {
        setAssignments([]);
        setHasChanges(true);
        toast({
            title: 'Direset',
            description: 'Daftar penugasan pengawas dikosongkan (belum disimpan).',
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/asesmen/${asesmenId}/pengawas`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pengaturan: kepengawasan?.pengaturan,
                    publish_kartu: kepengawasan?.publish_kartu,
                    assignments: assignments,
                }),
            });

            if (res.ok) {
                setHasChanges(false);
                toast({
                    title: 'Berhasil',
                    description: 'Pembagian pengawas berhasil disimpan',
                });
            } else {
                const error = await res.json();
                toast({
                    title: 'Error',
                    description: error.error || 'Gagal menyimpan pembagian pengawas',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Terjadi kesalahan saat menyimpan data',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    // Helper functions for options filtering and validation checks
    const getSelectedGuruId = (jadwalId: string, room: number, supervisorIndex: number): string => {
        const found = assignments.find(
            (a) => a.jadwal_id === jadwalId && a.nomor_ruang === room && a.urutan_pengawas === supervisorIndex
        );
        return found?.guru_id || 'none';
    };

    const isGuruAvailable = (guruId: string, jadwalId: string): boolean => {
        if (!kepengawasan?.matrix_mengawasi) return false;
        const cell = kepengawasan.matrix_mengawasi.find(
            (m) => m.jadwal_id === jadwalId && m.guru_id === guruId
        );
        return cell?.tersedia ?? false;
    };

    // Checks if the teacher is already assigned to a different room at the same time
    const getTeacherConflictsInSlot = (guruId: string, jadwalId: string, currentRoom: number): number[] => {
        if (!guruId || guruId === 'none') return [];
        return assignments
            .filter((a) => a.guru_id === guruId && a.jadwal_id === jadwalId && a.nomor_ruang !== currentRoom)
            .map((a) => a.nomor_ruang);
    };

    // Calculate total hours of supervising assignments per teacher
    const getGuruAssignmentCount = (guruId: string): number => {
        return assignments.filter((a) => a.guru_id === guruId).length;
    };

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

    // --- PDF Exporting Client-side via jsPDF ---
    const generatePDFCard = async (guruId: string) => {
        const teacher = gurus.find((g) => g.id === guruId);
        if (!teacher) return;

        const teacherAssignments = assignments
            .filter((a) => a.guru_id === guruId)
            .map((a) => {
                const j = jadwals.find((jad) => jad.id === a.jadwal_id);
                return {
                    hari: j?.hari || '',
                    tanggal: j?.tanggal || '',
                    jam: j?.jam || '',
                    jam_mulai: j?.jam_mulai || '',
                    durasi: j?.durasi_menit ? `${j.durasi_menit}m` : '',
                    mapel: j?.mata_pelajaran_nama || '-',
                    ruang: `Ruang ${a.nomor_ruang}`,
                };
            })
            .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.jam_mulai.localeCompare(b.jam_mulai));

        const jsPDF = (await import('jspdf')).default;
        const doc = new jsPDF();

        // 1. Draw Title
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('KARTU PENUGASAN PENGAWAS UJIAN', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont('Helvetica', 'normal');
        doc.text(asesmen?.jenis_ujian || 'Asesmen Sekolah', 105, 28, { align: 'center' });
        doc.text(`Semester: ${asesmen?.semester_nama || '-'}`, 105, 34, { align: 'center' });

        // Line separator
        doc.line(20, 38, 190, 38);

        // Teacher metadata
        doc.setFont('Helvetica', 'bold');
        doc.text('Identitas Pengawas:', 20, 48);
        doc.setFont('Helvetica', 'normal');
        doc.text(`Nama Pengawas : ${teacher.nama}`, 20, 56);
        doc.text(`Kode Pengawas : ${teacher.kode_guru}`, 20, 62);
        
        // supervising Table
        doc.setFont('Helvetica', 'bold');
        doc.text('Jadwal Mengawas:', 20, 75);

        // Draw Table Header
        let y = 83;
        doc.setFillColor(240, 240, 240);
        doc.rect(20, y, 170, 8, 'F');
        doc.setFontSize(9);
        doc.text('Hari, Tanggal', 22, y + 5);
        doc.text('Sesi', 75, y + 5);
        doc.text('Waktu', 105, y + 5);
        doc.text('Mata Pelajaran', 130, y + 5);
        doc.text('Ruang', 172, y + 5);
        
        // Table body
        doc.setFont('Helvetica', 'normal');
        y += 8;

        if (teacherAssignments.length === 0) {
            doc.text('Tidak ada jadwal mengawas.', 105, y + 10, { align: 'center' });
            y += 15;
        } else {
            teacherAssignments.forEach((ta) => {
                doc.line(20, y, 190, y);
                doc.text(`${ta.hari}, ${formatDate(ta.tanggal)}`, 22, y + 5);
                doc.text(ta.jam, 75, y + 5);
                doc.text(`${formatTime(ta.jam_mulai)} (${ta.durasi})`, 105, y + 5);
                
                // Crop mapel name if too long
                const cropMapel = ta.mapel.length > 22 ? ta.mapel.substring(0, 20) + '...' : ta.mapel;
                doc.text(cropMapel, 130, y + 5);
                doc.text(ta.ruang, 172, y + 5);
                y += 8;
            });
            doc.line(20, y, 190, y);
        }

        // Footer signatures
        y += 20;
        doc.setFontSize(10);
        doc.text('Mengetahui,', 140, y);
        doc.text('Kepala Sekolah', 140, y + 5);
        doc.text('_______________________', 140, y + 30);
        
        // Save
        doc.save(`Kartu_Pengawas_${teacher.nama.replace(/\s+/g, '_')}.pdf`);
    };

    const handleExportAllPDF = async () => {
        const assignedTeachers = Array.from(
            new Set(assignments.map((a) => a.guru_id))
        ).filter(Boolean);

        if (assignedTeachers.length === 0) {
            toast({
                title: 'Peringatan',
                description: 'Tidak ada guru yang ditugaskan untuk diekspor',
                variant: 'destructive',
            });
            return;
        }

        toast({
            title: 'Memproses PDF',
            description: `Membuat kartu pengawas untuk ${assignedTeachers.length} guru...`,
        });

        const jsPDF = (await import('jspdf')).default;
        const doc = new jsPDF();

        assignedTeachers.forEach((guruId, index) => {
            const teacher = gurus.find((g) => g.id === guruId);
            if (!teacher) return;

            if (index > 0) {
                doc.addPage();
            }

            const teacherAssignments = assignments
                .filter((a) => a.guru_id === guruId)
                .map((a) => {
                    const j = jadwals.find((jad) => jad.id === a.jadwal_id);
                    return {
                        hari: j?.hari || '',
                        tanggal: j?.tanggal || '',
                        jam: j?.jam || '',
                        jam_mulai: j?.jam_mulai || '',
                        durasi: j?.durasi_menit ? `${j.durasi_menit}m` : '',
                        mapel: j?.mata_pelajaran_nama || '-',
                        ruang: `Ruang ${a.nomor_ruang}`,
                    };
                })
                .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.jam_mulai.localeCompare(b.jam_mulai));

            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(16);
            doc.text('KARTU PENUGASAN PENGAWAS UJIAN', 105, 20, { align: 'center' });
            
            doc.setFontSize(12);
            doc.setFont('Helvetica', 'normal');
            doc.text(asesmen?.jenis_ujian || 'Asesmen Sekolah', 105, 28, { align: 'center' });
            doc.text(`Semester: ${asesmen?.semester_nama || '-'}`, 105, 34, { align: 'center' });

            doc.line(20, 38, 190, 38);

            doc.setFont('Helvetica', 'bold');
            doc.text('Identitas Pengawas:', 20, 48);
            doc.setFont('Helvetica', 'normal');
            doc.text(`Nama Pengawas : ${teacher.nama}`, 20, 56);
            doc.text(`Kode Pengawas : ${teacher.kode_guru}`, 20, 62);
            
            doc.setFont('Helvetica', 'bold');
            doc.text('Jadwal Mengawas:', 20, 75);

            let y = 83;
            doc.setFillColor(240, 240, 240);
            doc.rect(20, y, 170, 8, 'F');
            doc.setFontSize(9);
            doc.text('Hari, Tanggal', 22, y + 5);
            doc.text('Sesi', 75, y + 5);
            doc.text('Waktu', 105, y + 5);
            doc.text('Mata Pelajaran', 130, y + 5);
            doc.text('Ruang', 172, y + 5);
            
            doc.setFont('Helvetica', 'normal');
            y += 8;

            teacherAssignments.forEach((ta) => {
                doc.line(20, y, 190, y);
                doc.text(`${ta.hari}, ${formatDate(ta.tanggal)}`, 22, y + 5);
                doc.text(ta.jam, 75, y + 5);
                doc.text(`${formatTime(ta.jam_mulai)} (${ta.durasi})`, 105, y + 5);
                const cropMapel = ta.mapel.length > 22 ? ta.mapel.substring(0, 20) + '...' : ta.mapel;
                doc.text(cropMapel, 130, y + 5);
                doc.text(ta.ruang, 172, y + 5);
                y += 8;
            });
            doc.line(20, y, 190, y);

            y += 20;
            doc.setFontSize(10);
            doc.text('Mengetahui,', 140, y);
            doc.text('Kepala Sekolah', 140, y + 5);
            doc.text('_______________________', 140, y + 30);
        });

        doc.save(`Semua_Kartu_Pengawas_${asesmen?.jenis_ujian.replace(/\s+/g, '_') || 'Asesmen'}.pdf`);
        toast({
            title: 'Ekspor Berhasil',
            description: 'Semua kartu pengawas telah digabungkan ke dalam 1 file PDF.',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!asesmen) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">Data Asesmen tidak ditemukan.</p>
            </div>
        );
    }

    const hasGlobalConflicts = assignments.some((a) => {
        const conflictRooms = getTeacherConflictsInSlot(a.guru_id, a.jadwal_id, a.nomor_ruang);
        return conflictRooms.length > 0 || (a.guru_id !== 'none' && !isGuruAvailable(a.guru_id, a.jadwal_id));
    });

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">Manajemen Kepengawasan</h1>
                    <p className="text-muted-foreground">
                        {asesmen.jenis_ujian} • {asesmen.semester_nama}
                    </p>
                </div>
            </div>

            {/* Conflict Banner Alert */}
            {hasGlobalConflicts && (
                <Card className="border-orange-500 bg-orange-50/50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-orange-600">Konflik Kepengawasan Terdeteksi!</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Terdapat guru yang ditugaskan pada slot waktu yang sama di ruang berbeda, atau ditugaskan di slot waktu saat status ketersediaan mereka "Tidak Tersedia" di Matrix Ketersediaan.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="pembagian" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pembagian">
                        <UserCheck className="h-4 w-4 mr-2" />
                        Tab 3: Pembagian Pengawas
                    </TabsTrigger>
                    <TabsTrigger value="kartu">
                        <Printer className="h-4 w-4 mr-2" />
                        Tab 4: Kartu Pengawas
                    </TabsTrigger>
                </TabsList>

                {/* TAB 3: Pembagian Pengawas */}
                <TabsContent value="pembagian" className="space-y-4">
                    {/* Setup & Auto-generate card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5 text-muted-foreground" />
                                Aturan Auto-Generate Pengawas
                            </CardTitle>
                            <CardDescription>
                                Tentukan parameter sebelum melakukan pengisian otomatis.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Pengawas per Ruang</Label>
                                    <Select
                                        value={String(kepengawasan?.pengaturan?.pengawas_per_ruang || 1)}
                                        onValueChange={(val) => handleSettingChange('pengawas_per_ruang', parseInt(val))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1 Pengawas / Ruang</SelectItem>
                                            <SelectItem value="2">2 Pengawas / Ruang</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Metode Auto-Allocation</Label>
                                    <Select
                                        value={kepengawasan?.pengaturan?.mode_auto || 'urut'}
                                        onValueChange={(val) => handleSettingChange('mode_auto', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="urut">Urut (Sequential, hindari mengawas berturut-turut)</SelectItem>
                                            <SelectItem value="acak">Acak (Balanced, distribusi beban jam setara)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-end gap-2">
                                    <Button onClick={handleGenerate} disabled={generating} className="flex-1">
                                        {generating ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                        )}
                                        Generate Otomatis
                                    </Button>
                                    <Button variant="outline" onClick={handleReset}>
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pembagian Main Table */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Daftar Tugas Pengawas Ruang</CardTitle>
                                <CardDescription>
                                    Kelola daftar pengawas per ruang untuk setiap sesi ujian.
                                </CardDescription>
                            </div>
                            <Button onClick={handleSave} disabled={saving || !hasChanges}>
                                {saving ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                Simpan Perubahan
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {jadwals.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Belum ada jadwal ujian.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[80px]">Sesi</TableHead>
                                            <TableHead>Hari, Tanggal</TableHead>
                                            <TableHead>Mata Pelajaran</TableHead>
                                            <TableHead className="w-[100px] text-center">Ruang</TableHead>
                                            <TableHead className="min-w-[200px]">Pengawas 1</TableHead>
                                            {kepengawasan?.pengaturan?.pengawas_per_ruang === 2 && (
                                                <TableHead className="min-w-[200px]">Pengawas 2</TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {jadwals.map((jadwal) => (
                                            rooms.map((room) => {
                                                const selectedG1 = getSelectedGuruId(jadwal.id, room, 1);
                                                const conflictsG1 = getTeacherConflictsInSlot(selectedG1, jadwal.id, room);
                                                const availableG1 = selectedG1 !== 'none' ? isGuruAvailable(selectedG1, jadwal.id) : true;
                                                
                                                const selectedG2 = getSelectedGuruId(jadwal.id, room, 2);
                                                const conflictsG2 = getTeacherConflictsInSlot(selectedG2, jadwal.id, room);
                                                const availableG2 = selectedG2 !== 'none' ? isGuruAvailable(selectedG2, jadwal.id) : true;

                                                return (
                                                    <TableRow key={`${jadwal.id}-${room}`}>
                                                        <TableCell>
                                                            <Badge variant="outline">Sesi {jadwal.urutan}</Badge>
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            <div className="text-sm">{jadwal.hari}, {formatDate(jadwal.tanggal)}</div>
                                                            <div className="text-xs text-muted-foreground">{formatTime(jadwal.jam_mulai)} ({jadwal.durasi_menit}m)</div>
                                                        </TableCell>
                                                        <TableCell className="text-sm">
                                                            {jadwal.mata_pelajaran_nama || '-'}
                                                        </TableCell>
                                                        <TableCell className="text-center font-bold">
                                                            R. {room}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col gap-1.5">
                                                                <Select
                                                                    value={selectedG1}
                                                                    onValueChange={(val) => handleAssignmentChange(jadwal.id, room, 1, val === 'none' ? '' : val)}
                                                                >
                                                                    <SelectTrigger className={
                                                                        conflictsG1.length > 0 || !availableG1 ? "border-orange-500 bg-orange-50/50" : ""
                                                                    }>
                                                                        <SelectValue placeholder="Pilih Pengawas 1" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="none">-- Kosong --</SelectItem>
                                                                        {gurus.map((g) => {
                                                                            const isAvail = isGuruAvailable(g.id, jadwal.id);
                                                                            return (
                                                                                <SelectItem key={g.id} value={g.id}>
                                                                                    {g.nama} ({g.kode_guru}) {isAvail ? '' : '⚠️'}
                                                                                </SelectItem>
                                                                            );
                                                                        })}
                                                                    </SelectContent>
                                                                </Select>
                                                                {selectedG1 !== 'none' && (
                                                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                                                        {!availableG1 && (
                                                                            <Badge variant="outline" className="text-orange-600 border-orange-500 bg-orange-50 text-[10px]">
                                                                                Tidak Tersedia di Matrix
                                                                            </Badge>
                                                                        )}
                                                                        {conflictsG1.length > 0 && (
                                                                            <Badge variant="outline" className="text-red-600 border-red-500 bg-red-50 text-[10px]">
                                                                                Konflik Ruang: {conflictsG1.join(', ')}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        {kepengawasan?.pengaturan?.pengawas_per_ruang === 2 && (
                                                            <TableCell>
                                                                <div className="flex flex-col gap-1.5">
                                                                    <Select
                                                                        value={selectedG2}
                                                                        onValueChange={(val) => handleAssignmentChange(jadwal.id, room, 2, val === 'none' ? '' : val)}
                                                                    >
                                                                        <SelectTrigger className={
                                                                            conflictsG2.length > 0 || !availableG2 ? "border-orange-500 bg-orange-50/50" : ""
                                                                        }>
                                                                            <SelectValue placeholder="Pilih Pengawas 2" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="none">-- Kosong --</SelectItem>
                                                                            {gurus.map((g) => {
                                                                                const isAvail = isGuruAvailable(g.id, jadwal.id);
                                                                                return (
                                                                                    <SelectItem key={g.id} value={g.id}>
                                                                                        {g.nama} ({g.kode_guru}) {isAvail ? '' : '⚠️'}
                                                                                    </SelectItem>
                                                                                );
                                                                            })}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    {selectedG2 !== 'none' && (
                                                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                                                            {!availableG2 && (
                                                                                <Badge variant="outline" className="text-orange-600 border-orange-500 bg-orange-50 text-[10px]">
                                                                                    Tidak Tersedia di Matrix
                                                                                </Badge>
                                                                            )}
                                                                            {conflictsG2.length > 0 && (
                                                                                <Badge variant="outline" className="text-red-600 border-red-500 bg-red-50 text-[10px]">
                                                                                    Konflik Ruang: {conflictsG2.join(', ')}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                );
                                            })
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 4: Kartu Pengawas */}
                <TabsContent value="kartu" className="space-y-4">
                    {/* Publishing card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Publikasi Kartu Pengawas</CardTitle>
                                <CardDescription>
                                    Publikasikan jadwal mengawas ke akun dashboard Guru masing-masing secara online.
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="publish-mode" className="text-sm font-semibold">Publish Kartu</Label>
                                <Checkbox
                                    id="publish-mode"
                                    checked={kepengawasan?.publish_kartu || false}
                                    onCheckedChange={(checked) => handleTogglePublish(!!checked)}
                                />
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Preview and actions layout */}
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="md:col-span-1">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Daftar Pengawas</CardTitle>
                                <Button variant="outline" size="sm" onClick={handleExportAllPDF}>
                                    <Printer className="mr-1.5 h-4 w-4" />
                                    Cetak Semua
                                </Button>
                            </CardHeader>
                            <CardContent className="max-h-[500px] overflow-y-auto">
                                <div className="space-y-2">
                                    {gurus.map((g) => {
                                        const count = getGuruAssignmentCount(g.id);
                                        return (
                                            <div
                                                key={g.id}
                                                onClick={() => setSelectedGuruPreviewId(g.id)}
                                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                                                    selectedGuruPreviewId === g.id
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "hover:bg-accent"
                                                }`}
                                            >
                                                <div>
                                                    <div className="font-semibold text-sm">{g.nama}</div>
                                                    <div className="text-xs opacity-80">{g.kode_guru}</div>
                                                </div>
                                                <Badge variant={selectedGuruPreviewId === g.id ? "secondary" : "outline"}>
                                                    {count} Sesi
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Preview Kartu Penugasan</CardTitle>
                                    <CardDescription>
                                        Pratinjau kartu penugasan mengawas untuk guru terpilih.
                                    </CardDescription>
                                </div>
                                <Button
                                    onClick={() => generatePDFCard(selectedGuruPreviewId)}
                                    disabled={!selectedGuruPreviewId}
                                >
                                    <Printer className="mr-1.5 h-4 w-4" />
                                    Cetak Kartu Pengawas
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {(() => {
                                    const selectedGuru = gurus.find((g) => g.id === selectedGuruPreviewId);
                                    if (!selectedGuru) return <p className="text-muted-foreground text-center">Silakan pilih guru pengawas.</p>;
                                    
                                    const teacherAssignments = assignments
                                        .filter((a) => a.guru_id === selectedGuru.id)
                                        .map((a) => {
                                            const j = jadwals.find((jad) => jad.id === a.jadwal_id);
                                            return {
                                                id: `${a.jadwal_id}-${a.nomor_ruang}`,
                                                hari: j?.hari || '',
                                                tanggal: j?.tanggal || '',
                                                jam: j?.jam || '',
                                                jam_mulai: j?.jam_mulai || '',
                                                durasi: j?.durasi_menit || 120,
                                                mapel: j?.mata_pelajaran_nama || '-',
                                                ruang: `Ruang ${a.nomor_ruang}`,
                                            };
                                        });

                                    return (
                                        <div className="border rounded-lg p-6 space-y-6">
                                            {/* Header Kartu */}
                                            <div className="text-center border-b pb-4 space-y-1">
                                                <h3 className="font-bold text-lg">KARTU PENUGASAN PENGAWAS UJIAN</h3>
                                                <p className="text-sm font-semibold">{asesmen.jenis_ujian}</p>
                                                <p className="text-xs text-muted-foreground">Semester: {asesmen.semester_nama}</p>
                                            </div>

                                            {/* Info Guru */}
                                            <div className="grid grid-cols-2 gap-4 text-sm bg-accent/40 p-4 rounded-md">
                                                <div>
                                                    <span className="text-muted-foreground">Nama Pengawas:</span>
                                                    <div className="font-bold">{selectedGuru.nama}</div>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Kode Pengawas:</span>
                                                    <div className="font-bold">{selectedGuru.kode_guru}</div>
                                                </div>
                                            </div>

                                            {/* Detail Jadwal */}
                                            <div className="space-y-2">
                                                <div className="font-semibold text-sm">Jadwal Mengawas:</div>
                                                {teacherAssignments.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md bg-muted/20">Tidak ada penugasan mengawas.</p>
                                                ) : (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Hari, Tanggal</TableHead>
                                                                <TableHead>Sesi</TableHead>
                                                                <TableHead>Waktu</TableHead>
                                                                <TableHead>Mata Pelajaran</TableHead>
                                                                <TableHead>Ruang</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {teacherAssignments.map((ta) => (
                                                                <TableRow key={ta.id}>
                                                                    <TableCell className="font-medium text-xs">
                                                                        {ta.hari}, {formatDate(ta.tanggal)}
                                                                    </TableCell>
                                                                    <TableCell className="text-xs">{ta.jam}</TableCell>
                                                                    <TableCell className="text-xs">
                                                                        {formatTime(ta.jam_mulai)} ({ta.durasi}m)
                                                                    </TableCell>
                                                                    <TableCell className="text-xs">{ta.mapel}</TableCell>
                                                                    <TableCell className="font-semibold text-xs text-primary">{ta.ruang}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Bottom Navigation */}
            <div className="flex justify-between">
                <Button variant="outline" onClick={() => router.push(`/master/asesmen/${asesmenId}/ruang`)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Tab 3: Pembagian Ruang Siswa
                </Button>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => router.push(`/master/asesmen`)}>
                        Daftar Asesmen
                    </Button>
                    <Button onClick={() => router.push(`/master/asesmen/${asesmenId}/dokumen`)}>
                        Tab 5: Nomor Peserta & Dokumen
                        <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
