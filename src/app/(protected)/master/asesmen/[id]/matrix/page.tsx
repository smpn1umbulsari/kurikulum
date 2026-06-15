'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    ArrowLeft,
    Save,
    RotateCcw,
    Users,
    Grid3X3,
    Check,
    X,
    Loader2,
} from 'lucide-react';

interface Asesmen {
    id: string;
    semester_id: string;
    semester_nama: string;
    jenis_ujian: string;
    kode_nus: string | null;
}

interface JadwalUjian {
    id: string;
    hari: string;
    tanggal: string;
    jam: string;
    mata_pelajaran_nama?: string;
}

interface Guru {
    id: string;
    kode_guru: string;
    nama: string;
}

interface MatrixCell {
    jadwal_id: string;
    guru_id: string;
    tersedia: boolean;
}

export default function MatrixPengawasPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const asesmenId = params.id as string;

    const [asesmen, setAsesmen] = useState<Asesmen | null>(null);
    const [jadwals, setJadwals] = useState<JadwalUjian[]>([]);
    const [gurus, setGurus] = useState<Guru[]>([]);
    const [matrix, setMatrix] = useState<MatrixCell[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

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

            // Fetch gurus
            const gurusRes = await fetch('/api/guru?status=aktif');
            if (gurusRes.ok) {
                const data = await gurusRes.json();
                setGurus(data);
            }

            // Fetch existing matrix
            const matrixRes = await fetch(`/api/asesmen/${asesmenId}/matrix`);
            if (matrixRes.ok) {
                const data = await matrixRes.json();
                setMatrix(data);
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

    const getCellValue = (jadwalId: string, guruId: string): boolean => {
        const cell = matrix.find(
            (m) => m.jadwal_id === jadwalId && m.guru_id === guruId
        );
        return cell?.tersedia ?? false;
    };

    const handleCellToggle = (jadwalId: string, guruId: string) => {
        setHasChanges(true);
        setMatrix((prev) => {
            const existing = prev.findIndex(
                (m) => m.jadwal_id === jadwalId && m.guru_id === guruId
            );

            if (existing >= 0) {
                // Toggle existing
                const updated = [...prev];
                updated[existing] = {
                    ...updated[existing],
                    tersedia: !updated[existing].tersedia,
                };
                return updated;
            } else {
                // Add new
                return [
                    ...prev,
                    { jadwal_id: jadwalId, guru_id: guruId, tersedia: true },
                ];
            }
        });
    };

    const handleMarkAllSlot = (jadwalId: string, tersedia: boolean) => {
        setHasChanges(true);
        setMatrix((prev) => {
            const updated = prev.filter((m) => m.jadwal_id !== jadwalId);
            if (tersedia) {
                gurus.forEach((guru) => {
                    updated.push({
                        jadwal_id: jadwalId,
                        guru_id: guru.id,
                        tersedia: true,
                    });
                });
            }
            return updated;
        });
    };

    const handleMarkAllGuru = (guruId: string, tersedia: boolean) => {
        setHasChanges(true);
        setMatrix((prev) => {
            const updated = prev.filter((m) => m.guru_id !== guruId);
            if (tersedia) {
                jadwals.forEach((jadwal) => {
                    updated.push({
                        jadwal_id: jadwal.id,
                        guru_id: guruId,
                        tersedia: true,
                    });
                });
            }
            return updated;
        });
    };

    const handleReset = () => {
        setMatrix([]);
        setHasChanges(true);
        toast({
            title: 'Direset',
            description: 'Matrix telah direset',
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/asesmen/${asesmenId}/matrix`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matrix }),
            });

            if (res.ok) {
                setHasChanges(false);
                toast({
                    title: 'Berhasil',
                    description: 'Matrix ketersediaan pengawas berhasil disimpan',
                });
            } else {
                const error = await res.json();
                toast({
                    title: 'Error',
                    description: error.message || 'Gagal menyimpan',
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

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
        });
    };

    // Group jadwals by day
    const groupedJadwals = jadwals.reduce((acc, jadwal) => {
        const key = jadwal.hari || 'Lainnya';
        if (!acc[key]) acc[key] = [];
        acc[key].push(jadwal);
        return acc;
    }, {} as Record<string, JadwalUjian[]>);

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
                    <h1 className="text-3xl font-bold tracking-tight">Matrix Ketersediaan Pengawas</h1>
                    <p className="text-muted-foreground">
                        {asesmen.jenis_ujian} • {asesmen.semester_nama}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleReset}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !hasChanges}>
                        {saving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Simpan
                    </Button>
                </div>
            </div>

            {/* Info */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Grid3X3 className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                {jadwals.length} slot ujian × {gurus.length} guru
                            </span>
                        </div>
                        <Badge variant="secondary">
                            {matrix.filter((m) => m.tersedia).length} check
                        </Badge>
                        {hasChanges && (
                            <Badge variant="outline" className="text-orange-500">
                                Ada perubahan belum disimpan
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Matrix Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Ketersediaan Guru per Slot Ujian
                    </CardTitle>
                    <CardDescription>
                        Centang slot waktu di mana guru tersedia untuk mengawas.
                        Klik header kolom/baris untuk menandai semua.
                    </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    {jadwals.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Grid3X3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Belum ada jadwal ujian.</p>
                            <p className="text-sm">
                                Tambahkan jadwal di Tab 1 terlebih dahulu.
                            </p>
                        </div>
                    ) : gurus.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Belum ada data guru.</p>
                        </div>
                    ) : (
                        <div className="min-w-[800px]">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="border p-2 bg-muted text-left sticky left-0 z-10 min-w-[200px]">
                                            <div className="flex items-center justify-between">
                                                <span>Guru</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 px-2 text-xs"
                                                    onClick={() => {
                                                        const allAvailable = jadwals.every((j) =>
                                                            getCellValue(j.id, gurus[0]?.id)
                                                        );
                                                        gurus.forEach((guru) => {
                                                            handleMarkAllGuru(guru.id, !allAvailable);
                                                        });
                                                    }}
                                                >
                                                    {jadwals.every((j) =>
                                                        getCellValue(j.id, gurus[0]?.id)
                                                    ) ? 'Uncheck All' : 'Check All'}
                                                </Button>
                                            </div>
                                        </th>
                                        {jadwals.map((jadwal) => (
                                            <th
                                                key={jadwal.id}
                                                className="border p-2 bg-muted text-center min-w-[120px]"
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-medium">{jadwal.hari}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDate(jadwal.tanggal)}
                                                    </span>
                                                    <span className="text-xs font-normal">
                                                        {jadwal.jam}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-2 text-xs"
                                                        onClick={() => {
                                                            const allAvailable = gurus.every((g) =>
                                                                getCellValue(jadwal.id, g.id)
                                                            );
                                                            handleMarkAllSlot(jadwal.id, !allAvailable);
                                                        }}
                                                    >
                                                        {gurus.every((g) =>
                                                            getCellValue(jadwal.id, g.id)
                                                        )
                                                            ? 'Kosongkan'
                                                            : 'Pilih Semua'}
                                                    </Button>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {gurus.map((guru) => (
                                        <tr key={guru.id}>
                                            <td className="border p-2 sticky left-0 bg-background z-10">
                                                <div>
                                                    <span className="font-medium">{guru.nama}</span>
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        ({guru.kode_guru})
                                                    </span>
                                                </div>
                                            </td>
                                            {jadwals.map((jadwal) => {
                                                const isAvailable = getCellValue(jadwal.id, guru.id);
                                                return (
                                                    <td
                                                        key={`${jadwal.id}-${guru.id}`}
                                                        className="border p-2 text-center"
                                                    >
                                                        <Checkbox
                                                            checked={isAvailable}
                                                            onCheckedChange={() =>
                                                                handleCellToggle(jadwal.id, guru.id)
                                                            }
                                                            className="mx-auto"
                                                        />
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Legend */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Guru tersedia di slot tersebut</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <X className="h-4 w-4 text-red-400" />
                            <span>Guru tidak tersedia</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Navigation */}
            <div className="flex justify-between">
                <Button variant="outline" onClick={() => router.push(`/master/asesmen/${asesmenId}/jadwal`)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Tab 1: Jadwal Ujian
                </Button>
                <Button onClick={() => router.push(`/master/asesmen/${asesmenId}/ruang`)}>
                    Tab 3: Pembagian Ruang
                    <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                </Button>
            </div>
        </div>
    );
}