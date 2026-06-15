'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
    ArrowLeft,
    Save,
    RotateCcw,
    RefreshCw,
    LayoutGrid,
    Users,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Settings,
    Pencil,
} from 'lucide-react';

interface Asesmen {
    id: string;
    semester_id: string;
    semester_nama: string;
    jenis_ujian: string;
    kode_nus: string | null;
    acuan_kelas: 'real' | 'dapo';
}

interface RuangPengaturan {
    kapasitas_default: number;
    mode_pembagian: 'setengah' | '固定20' | 'manual';
    acuan_kelas: 'real' | 'dapo';
    pengaturan_7: { aktif: boolean; urutan: 'az' | 'za'; ruang_awal: number; ruang_akhir: number };
    pengaturan_8: { aktif: boolean; urutan: 'az' | 'za'; ruang_awal: number; ruang_akhir: number };
    pengaturan_9: { aktif: boolean; urutan: 'az' | 'za'; ruang_awal: number; ruang_akhir: number };
}

interface SiswaRuang {
    siswa_id: string;
    siswa_nama: string;
    siswa_nis: string;
    kelas_nama: string;
    jenjang: number;
    nomor_ruang: number;
    nomor_urut: number;
}

interface ValidationResult {
    valid: boolean;
    warnings: string[];
    unassigned_count: number;
    overfilled_ruang: { ruang: number; jenjang_count: number }[];
}

const MODES = [
    { value: 'setengah', label: 'Setengah Kelas' },
    { value: '固定20', label: 'Maksimal 20 Siswa' },
    { value: 'manual', label: 'Manual' },
];

export default function PembagianRuangPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const asesmenId = params.id as string;

    const [asesmen, setAsesmen] = useState<Asesmen | null>(null);
    const [pengaturan, setPengaturan] = useState<RuangPengaturan | null>(null);
    const [siswaRuangs, setSiswaRuangs] = useState<SiswaRuang[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [editingCell, setEditingCell] = useState<{ siswaId: string; ruang: number } | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch asesmen
            const asesmenRes = await fetch(`/api/asesmen/${asesmenId}`);
            if (asesmenRes.ok) {
                const data = await asesmenRes.json();
                setAsesmen(data);
            }

            // Fetch pengaturan ruang
            const pengaturanRes = await fetch(`/api/asesmen/${asesmenId}/ruang/pengaturan`);
            if (pengaturanRes.ok) {
                const data = await pengaturanRes.json();
                setPengaturan(data);
            }

            // Fetch siswa ruang
            const siswaRuangRes = await fetch(`/api/asesmen/${asesmenId}/ruang/siswa`);
            if (siswaRuangRes.ok) {
                const data = await siswaRuangRes.json();
                setSiswaRuangs(data);
            }

            // Validate
            await validateData();
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

    const validateData = async () => {
        try {
            const res = await fetch(`/api/asesmen/${asesmenId}/ruang/validate`);
            if (res.ok) {
                const data = await res.json();
                setValidation(data);
            }
        } catch (error) {
            console.error('Error validating:', error);
        }
    };

    const handlePengaturanChange = (field: string, value: unknown) => {
        setHasChanges(true);
        setPengaturan((prev) => {
            if (!prev) return prev;
            
            // Handle nested fields like pengaturan_7.aktif
            if (field.includes('.')) {
                const [parent, child] = field.split('.');
                return {
                    ...prev,
                    [parent]: {
                        ...(prev as any)[parent],
                        [child]: value,
                    },
                };
            }
            
            return { ...prev, [field]: value };
        });
    };

    const handleSavePengaturan = async () => {
        if (!pengaturan) return;
        
        setSaving(true);
        try {
            const res = await fetch(`/api/asesmen/${asesmenId}/ruang/pengaturan`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pengaturan),
            });

            if (res.ok) {
                setHasChanges(false);
                toast({
                    title: 'Berhasil',
                    description: 'Pengaturan ruang berhasil disimpan',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Gagal menyimpan pengaturan',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await fetch(`/api/asesmen/${asesmenId}/ruang/generate`, {
                method: 'POST',
            });

            if (res.ok) {
                const data = await res.json();
                setSiswaRuangs(data.siswa_ruangs);
                await validateData();
                toast({
                    title: 'Berhasil',
                    description: `Berhasil membagikan ${data.count} siswa ke ruang ujian`,
                });
            } else {
                const error = await res.json();
                toast({
                    title: 'Error',
                    description: error.message || 'Gagal generate',
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

    const handleReset = async () => {
        try {
            const res = await fetch(`/api/asesmen/${asesmenId}/ruang/reset`, {
                method: 'POST',
            });

            if (res.ok) {
                setSiswaRuangs([]);
                await validateData();
                toast({
                    title: 'Berhasil',
                    description: 'Pembagian ruang direset',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Gagal reset',
                variant: 'destructive',
            });
        }
    };

    const handleEditCell = (siswaId: string, ruang: number) => {
        setEditingCell({ siswaId, ruang });
    };

    const handleSaveEdit = async (siswaId: string, newRuang: number) => {
        try {
            const res = await fetch(`/api/asesmen/${asesmenId}/ruang/siswa/${siswaId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nomor_ruang: newRuang }),
            });

            if (res.ok) {
                setSiswaRuangs((prev) =>
                    prev.map((sr) =>
                        sr.siswa_id === siswaId ? { ...sr, nomor_ruang: newRuang } : sr
                    )
                );
                await validateData();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Gagal update',
                variant: 'destructive',
            });
        }
        setEditingCell(null);
    };

    // Group by ruang
    const groupedByRuang = siswaRuangs.reduce((acc, sr) => {
        const ruang = sr.nomor_ruang;
        if (!acc[ruang]) acc[ruang] = [];
        acc[ruang].push(sr);
        return acc;
    }, {} as Record<number, SiswaRuang[]>);

    // Group by jenjang
    const groupedByJenjang = siswaRuangs.reduce((acc, sr) => {
        const jenjang = sr.jenjang;
        if (!acc[jenjang]) acc[jenjang] = [];
        acc[jenjang].push(sr);
        return acc;
    }, {} as Record<number, SiswaRuang[]>);

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
                    <h1 className="text-3xl font-bold tracking-tight">Pembagian Ruang Siswa</h1>
                    <p className="text-muted-foreground">
                        {asesmen.jenis_ujian} • {asesmen.semester_nama}
                    </p>
                </div>
            </div>

            {/* Validation Alerts */}
            {validation && !validation.valid && (
                <Card className="border-orange-500">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-orange-500">Peringatan Validasi</h4>
                                <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                                    {validation.warnings.map((w, i) => (
                                        <li key={i}>• {w}</li>
                                    ))}
                                    {validation.unassigned_count > 0 && (
                                        <li>• {validation.unassigned_count} siswa belum ditempatkan</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {validation && validation.valid && siswaRuangs.length > 0 && (
                <Card className="border-green-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-green-600 font-medium">
                                Pembagian ruang valid! {siswaRuangs.length} siswa terbagi dalam{' '}
                                {Object.keys(groupedByRuang).length} ruang.
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabs */}
            <Tabs defaultValue="pengaturan" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pengaturan">
                        <Settings className="h-4 w-4 mr-2" />
                        Pengaturan
                    </TabsTrigger>
                    <TabsTrigger value="hasil">
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Hasil ({siswaRuangs.length})
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Pengaturan */}
                <TabsContent value="pengaturan" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pengaturan Global</CardTitle>
                            <CardDescription>
                                Konfigurasi dasar untuk pembagian ruang ujian
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Kapasitas Default Ruang</Label>
                                    <Input
                                        type="number"
                                        min="10"
                                        max="50"
                                        value={pengaturan?.kapasitas_default || 24}
                                        onChange={(e) =>
                                            handlePengaturanChange('kapasitas_default', parseInt(e.target.value))
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mode Pembagian</Label>
                                    <Select
                                        value={pengaturan?.mode_pembagian || '固定20'}
                                        onValueChange={(value) =>
                                            handlePengaturanChange('mode_pembagian', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MODES.map((mode) => (
                                                <SelectItem key={mode.value} value={mode.value}>
                                                    {mode.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Acuan Kelas</Label>
                                    <Select
                                        value={pengaturan?.acuan_kelas || 'real'}
                                        onValueChange={(value) =>
                                            handlePengaturanChange('acuan_kelas', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="real">Kelas Real</SelectItem>
                                            <SelectItem value="dapo">Kelas Dapodik</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleSavePengaturan} disabled={saving || !hasChanges}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Simpan Pengaturan
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Per Jenjang */}
                    {[7, 8, 9].map((jenjang) => (
                        <Card key={jenjang}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Checkbox
                                        checked={(pengaturan as any)?.[`pengaturan_${jenjang}`]?.aktif ?? false}
                                        onCheckedChange={(checked) =>
                                            handlePengaturanChange(`pengaturan_${jenjang}.aktif`, checked)
                                        }
                                    />
                                    Jenjang {jenjang}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label>Urutan Abjad</Label>
                                        <Select
                                            value={
                                                (pengaturan as any)?.[`pengaturan_${jenjang}`]?.urutan || 'az'
                                            }
                                            onValueChange={(value) =>
                                                handlePengaturanChange(`pengaturan_${jenjang}.urutan`, value)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="az">A → Z (Normal)</SelectItem>
                                                <SelectItem value="za">Z → A (Terbalik)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ruang Awal</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="99"
                                            value={
                                                (pengaturan as any)?.[`pengaturan_${jenjang}`]?.ruang_awal || jenjang * 10
                                            }
                                            onChange={(e) =>
                                                handlePengaturanChange(
                                                    `pengaturan_${jenjang}.ruang_awal`,
                                                    parseInt(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ruang Akhir</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="99"
                                            value={
                                                (pengaturan as any)?.[`pengaturan_${jenjang}`]?.ruang_akhir || jenjang * 10 + 5
                                            }
                                            onChange={(e) =>
                                                handlePengaturanChange(
                                                    `pengaturan_${jenjang}.ruang_akhir`,
                                                    parseInt(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Action Buttons */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex gap-4">
                                <Button onClick={handleGenerate} disabled={generating}>
                                    {generating ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                    )}
                                    Generate Otomatis
                                </Button>
                                <Button variant="outline" onClick={handleReset}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Hasil */}
                <TabsContent value="hasil" className="space-y-4">
                    {siswaRuangs.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Belum ada pembagian ruang.</p>
                                <p className="text-sm">Klik "Generate Otomatis" untuk memulai.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Group by Ruang */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Per Ruang</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {Object.entries(groupedByRuang)
                                            .sort(([a], [b]) => Number(a) - Number(b))
                                            .map(([ruang, siswas]) => (
                                                <div key={ruang} className="border rounded-lg p-4">
                                                    <h4 className="font-medium mb-2">
                                                        Ruang {ruang}{' '}
                                                        <Badge variant="secondary">
                                                            {siswas.length} siswa
                                                        </Badge>
                                                        {(() => {
                                                            const jenjangs = Array.from(new Set(siswas.map((s) => s.jenjang)));
                                                            return jenjangs.length > 2 ? (
                                                                <Badge variant="destructive" className="ml-2">
                                                                    {jenjangs.length} jenjang (Melebihi 2!)
                                                                </Badge>
                                                            ) : null;
                                                        })()}
                                                    </h4>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>No</TableHead>
                                                                <TableHead>NIS</TableHead>
                                                                <TableHead>Nama</TableHead>
                                                                <TableHead>Kelas</TableHead>
                                                                <TableHead>Jenjang</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {siswas
                                                                .sort((a, b) => a.nomor_urut - b.nomor_urut)
                                                                .map((sr, idx) => (
                                                                    <TableRow key={sr.siswa_id}>
                                                                        <TableCell>{idx + 1}</TableCell>
                                                                        <TableCell>{sr.siswa_nis}</TableCell>
                                                                        <TableCell>{sr.siswa_nama}</TableCell>
                                                                        <TableCell>{sr.kelas_nama}</TableCell>
                                                                        <TableCell>{sr.jenjang}</TableCell>
                                                                    </TableRow>
                                                                ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Ringkasan</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Siswa</p>
                                            <p className="text-2xl font-bold">{siswaRuangs.length}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Jumlah Ruang</p>
                                            <p className="text-2xl font-bold">{Object.keys(groupedByRuang).length}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Rata-rata/Ruang</p>
                                            <p className="text-2xl font-bold">
                                                {siswaRuangs.length / Object.keys(groupedByRuang).length || 0}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Status</p>
                                            <Badge variant={validation?.valid ? 'default' : 'destructive'}>
                                                {validation?.valid ? 'Valid' : 'Ada Masalah'}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>
            </Tabs>

            {/* Navigation */}
            <div className="flex justify-between">
                <Button variant="outline" onClick={() => router.push(`/master/asesmen/${asesmenId}/matrix`)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Tab 2: Matrix Pengawas
                </Button>
                <Button onClick={() => router.push(`/master/asesmen/${asesmenId}/pengawas`)}>
                    Tab 4: Pembagian Pengawas
                    <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                </Button>
            </div>
        </div>
    );
}