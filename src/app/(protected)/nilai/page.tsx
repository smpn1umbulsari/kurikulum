'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, useActiveSemester } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Save, Upload, Download, AlertTriangle, Check, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Types
interface SiswaKelas {
    id: string;
    siswa_id: string;
    siswa: {
        id: string;
        nis: string;
        nama: string;
        jenis_kelamin: 'L' | 'P';
    };
}

interface NilaiMapel {
    id: string;
    siswa_id: string;
    mapel_id: string;
    semester_id: string;
    uh1: number | null;
    uh2: number | null;
    uh3: number | null;
    uh4: number | null;
    uh5: number | null;
    pts: number | null;
    semester: number | null;
    rapor: number | null;
    pts_locked: boolean;
}

interface PembagianReal {
    id: string;
    kelas_real_id: string;
    mapel_id: string;
    guru_id: string;
    kelas_real: {
        id: string;
        nama: string;
        jenjang: number;
    };
    mata_pelajaran: {
        id: string;
        nama: string;
    };
}

interface MapelOption {
    id: string;
    nama: string;
    kelas_real_id: string;
}

interface KelasOption {
    id: string;
    nama: string;
    jenjang: number;
}

// Konfigurasi bobot komponen nilai
const BOBOT = {
    uh1: 0.1,
    uh2: 0.1,
    uh3: 0.1,
    uh4: 0.1,
    uh5: 0.1,
    pts: 0.2,
    semester: 0.3,
};

// Kolom yang akan ditampilkan berdasarkan mode
const KOLOM_NILAI = ['uh1', 'uh2', 'uh3', 'uh4', 'uh5', 'pts', 'semester', 'rapor'] as const;
const LABEL_KOLOM: Record<string, string> = {
    uh1: 'UH 1',
    uh2: 'UH 2',
    uh3: 'UH 3',
    uh4: 'UH 4',
    uh5: 'UH 5',
    pts: 'PTS',
    semester: 'Semester',
    rapor: 'RAPOR',
};

/**
 * Halaman Input Nilai
 * 
 * Halaman untuk guru input nilai spreadsheet dengan fitur:
 * - Filter kelas & mapel
 * - Tabel spreadsheet inline dengan navigasi Tab/Enter
 * - Validasi sequential UH
 * - Auto-kalkulasi RAPOR
 * - Partial save
 * 
 * Akses: Guru
 */
export default function InputNilaiPage() {
    const { profile } = useAuth();
    const { semester } = useActiveSemester();
    const { toast } = useToast();
    const supabase = createClient();

    // State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
    const [mapelOptions, setMapelOptions] = useState<MapelOption[]>([]);
    const [selectedKelas, setSelectedKelas] = useState<string>('');
    const [selectedMapel, setSelectedMapel] = useState<string>('');
    const [siswaList, setSiswaList] = useState<SiswaKelas[]>([]);
    const [nilaiData, setNilaiData] = useState<Record<string, NilaiMapel>>({});
    const [dirtyCells, setDirtyCells] = useState<Set<string>>(new Set());
    const [activeCell, setActiveCell] = useState<{ siswaId: string; field: string } | null>(null);

    // Ambil daftar kelas yang diajar guru
    useEffect(() => {
        if (semester?.id && profile?.role === 'guru') {
            fetchKelasOptions();
        }
    }, [semester, profile]);

    // Ambil daftar siswa saat kelas berubah
    useEffect(() => {
        if (selectedKelas && semester?.id) {
            fetchSiswa();
        }
    }, [selectedKelas, semester]);

    // Ambil data nilai saat mapel berubah
    useEffect(() => {
        if (selectedKelas && selectedMapel && semester?.id) {
            fetchNilai();
        }
    }, [selectedMapel, semester]);

    async function fetchKelasOptions() {
        if (!semester?.id || !profile) return;

        try {
            const { data: pembagian } = await supabase
                .from('pembagian_mengajar_real')
                .select(`
                    id,
                    kelas_real_id,
                    mapel_id,
                    kelas_real:kelas_real_id (id, nama, jenjang),
                    mata_pelajaran:mata_pelajaran_id (id, nama)
                `)
                .eq('guru_id', profile.id)
                .eq('semester_id', semester.id);

            if (pembagian) {
                const kelasMap = new Map<string, KelasOption>();
                const mapelList: MapelOption[] = [];

                pembagian.forEach((p: any) => {
                    if (p.kelas_real) {
                        kelasMap.set(p.kelas_real.id, {
                            id: p.kelas_real.id,
                            nama: p.kelas_real.nama,
                            jenjang: p.kelas_real.jenjang,
                        });
                    }
                    if (p.mata_pelajaran) {
                        mapelList.push({
                            id: p.mata_pelajaran.id,
                            nama: p.mata_pelajaran.nama,
                            kelas_real_id: p.kelas_real_id,
                        });
                    }
                });

                setKelasOptions(Array.from(kelasMap.values()));
                setMapelOptions(mapelList);
            }
        } catch (error) {
            console.error('Error fetching kelas:', error);
            toast({ title: 'Error', description: 'Gagal memuat data kelas', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }

    async function fetchSiswa() {
        if (!selectedKelas || !semester?.id) return;

        setLoading(true);
        try {
            const { data: siswaKelas } = await supabase
                .from('siswa_kelas')
                .select(`
                    id,
                    siswa_id,
                    siswa:siswa_id (id, nis, nama, jenis_kelamin)
                `)
                .eq('kelas_real_id', selectedKelas)
                .eq('semester_id', semester.id);

            const typedSiswaKelas = (siswaKelas || []).map((item: any) => ({
                id: item.id,
                siswa_id: item.siswa_id,
                siswa: Array.isArray(item.siswa) ? item.siswa[0] : item.siswa
            })) as SiswaKelas[];

            setSiswaList(typedSiswaKelas);
        } catch (error) {
            console.error('Error fetching siswa:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchNilai() {
        if (!selectedMapel || !semester?.id) return;

        setLoading(true);
        try {
            const siswaIds = siswaList.map(s => s.siswa_id);

            if (siswaIds.length === 0) {
                setNilaiData({});
                return;
            }

            const { data: nilai } = await supabase
                .from('nilai_mapel')
                .select('*')
                .eq('mapel_id', selectedMapel)
                .eq('semester_id', semester.id)
                .in('siswa_id', siswaIds);

            const nilaiMap: Record<string, NilaiMapel> = {};
            nilai?.forEach(n => {
                nilaiMap[n.siswa_id] = n;
            });

            setNilaiData(nilaiMap);
            setDirtyCells(new Set());
        } catch (error) {
            console.error('Error fetching nilai:', error);
        } finally {
            setLoading(false);
        }
    }

    // Handle input change
    function handleNilaiChange(siswaId: string, field: string, value: string) {
        const numValue = value === '' ? null : parseFloat(value);

        // Validasi range 0-100
        if (numValue !== null && (numValue < 0 || numValue > 100)) {
            toast({
                title: 'Validasi',
                description: 'Nilai harus antara 0-100',
                variant: 'destructive',
            });
            return;
        }

        // Validasi sequential untuk UH
        if (field.startsWith('uh') && numValue !== null) {
            const uhNum = parseInt(field.replace('uh', ''));
            if (uhNum > 1) {
                const prevField = `uh${uhNum - 1}`;
                const prevValue = nilaiData[siswaId]?.[prevField as keyof NilaiMapel] as number | null;
                if (prevValue === null) {
                    toast({
                        title: 'Validasi',
                        description: `Harap isi ${LABEL_KOLOM[prevField]} terlebih dahulu`,
                        variant: 'destructive',
                    });
                    return;
                }
            }
        }

        // Update state
        setNilaiData(prev => ({
            ...prev,
            [siswaId]: {
                ...prev[siswaId],
                [field]: numValue,
                mapel_id: selectedMapel,
                semester_id: semester?.id,
                siswa_id: siswaId,
            } as NilaiMapel,
        }));

        // Tandai sel sebagai dirty
        setDirtyCells(prev => new Set(prev).add(`${siswaId}-${field}`));

        // Auto-kalkulasi RAPOR jika semua komponen terisi
        if (field !== 'rapor') {
            calculateRapor(siswaId);
        }
    }

    // Kalkulasi RAPOR
    function calculateRapor(siswaId: string) {
        const nilai = nilaiData[siswaId];
        if (!nilai) return;

        // Hitung hanya jika semua UH dan PTS, SEMESTER terisi
        const allUhFilled = [1, 2, 3, 4, 5].every(i => nilai[`uh${i}` as keyof NilaiMapel] !== null);
        const ptsFilled = nilai.pts !== null;
        const semFilled = nilai.semester !== null;

        if (allUhFilled && ptsFilled && semFilled) {
            const avgUh = ([1, 2, 3, 4, 5].reduce((sum, i) =>
                sum + ((nilai[`uh${i}` as keyof NilaiMapel] as number) || 0), 0) / 5);
            const rapor = (avgUh * BOBOT.uh1) +
                (avgUh * BOBOT.uh2) +
                (avgUh * BOBOT.uh3) +
                (avgUh * BOBOT.uh4) +
                (avgUh * BOBOT.uh5) +
                ((nilai.pts || 0) * BOBOT.pts) +
                ((nilai.semester || 0) * BOBOT.semester);

            setNilaiData(prev => ({
                ...prev,
                [siswaId]: {
                    ...prev[siswaId],
                    rapor: Math.round(rapor * 100) / 100,
                } as NilaiMapel,
            }));
        }
    }

    // Handle keyboard navigation
    function handleKeyDown(e: React.KeyboardEvent, siswaId: string, field: string, rowIndex: number) {
        if (e.key === 'Tab' || e.key === 'Enter') {
            e.preventDefault();

            const fieldIndex = KOLOM_NILAI.indexOf(field as any);
            let nextField: string | null = null;
            let nextSiswaId: string | null = null;

            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    // Shift+Tab: mundur
                    if (fieldIndex > 0) {
                        nextField = KOLOM_NILAI[fieldIndex - 1];
                        nextSiswaId = siswaId;
                    } else if (rowIndex > 0) {
                        nextField = KOLOM_NILAI[KOLOM_NILAI.length - 1];
                        nextSiswaId = siswaList[rowIndex - 1]?.siswa_id;
                    }
                } else {
                    // Tab: maju
                    if (fieldIndex < KOLOM_NILAI.length - 1) {
                        nextField = KOLOM_NILAI[fieldIndex + 1];
                        nextSiswaId = siswaId;
                    } else if (rowIndex < siswaList.length - 1) {
                        nextField = KOLOM_NILAI[0];
                        nextSiswaId = siswaList[rowIndex + 1]?.siswa_id;
                    }
                }
            } else if (e.key === 'Enter') {
                // Enter: turun ke baris berikutnya
                if (rowIndex < siswaList.length - 1) {
                    nextField = field;
                    nextSiswaId = siswaList[rowIndex + 1]?.siswa_id;
                }
            }

            if (nextField && nextSiswaId) {
                setActiveCell({ siswaId: nextSiswaId, field: nextField });
            }
        }
    }

    // Simpan nilai
    async function handleSave() {
        if (!selectedMapel || !semester?.id) return;

        setSaving(true);
        try {
            const toSave = Object.entries(nilaiData).map(([siswaId, nilai]) => ({
                siswa_id: siswaId,
                mapel_id: selectedMapel,
                semester_id: semester.id,
                uh1: nilai.uh1,
                uh2: nilai.uh2,
                uh3: nilai.uh3,
                uh4: nilai.uh4,
                uh5: nilai.uh5,
                pts: nilai.pts,
                semester: nilai.semester,
                rapor: nilai.rapor,
            }));

            // Batch upsert
            const { error } = await supabase
                .from('nilai_mapel')
                .upsert(toSave, {
                    onConflict: 'siswa_id,mapel_id,semester_id',
                });

            if (error) throw error;

            toast({ title: 'Berhasil', description: 'Nilai berhasil disimpan' });
            setDirtyCells(new Set());
            fetchNilai();
        } catch (error) {
            console.error('Error saving:', error);
            toast({ title: 'Error', description: 'Gagal menyimpan nilai', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    }

    // Filter mapel berdasarkan kelas yang dipilih
    const filteredMapel = mapelOptions.filter(m => m.kelas_real_id === selectedKelas);
    const isModePTS = semester?.mode_penilaian === 'pts';
    const visibleColumns = isModePTS
        ? KOLOM_NILAI.filter(k => k !== 'semester')
        : KOLOM_NILAI;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Input Nilai</h1>
                    <p className="text-muted-foreground">
                        Input dan kelola nilai siswa per mata pelajaran
                    </p>
                </div>
                {dirtyCells.size > 0 && (
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                )}
            </div>

            {/* Filter Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Pilih Kelas & Mata Pelajaran</CardTitle>
                    <CardDescription>
                        Filter untuk menampilkan data siswa dan nilai
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Kelas</Label>
                            <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih kelas" />
                                </SelectTrigger>
                                <SelectContent>
                                    {kelasOptions.map(k => (
                                        <SelectItem key={k.id} value={k.id}>
                                            Kelas {k.jenjang} - {k.nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Mata Pelajaran</Label>
                            <Select
                                value={selectedMapel}
                                onValueChange={setSelectedMapel}
                                disabled={!selectedKelas}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih mata pelajaran" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredMapel.map(m => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Mode Info */}
                    {semester && (
                        <div className="mt-4">
                            <Badge variant={isModePTS ? 'warning' : 'default'}>
                                Mode {isModePTS ? 'PTS (Penilaian Tengah Semester)' : 'Semester'}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                                {isModePTS
                                    ? 'Kolom Semester disembunyikan. Nilai UH & PTS dapat diedit.'
                                    : 'Semua kolom aktif. Nilai PTS terkunci setelah diinput.'}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Data Table */}
            {selectedKelas && selectedMapel && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Daftar Nilai Siswa</CardTitle>
                                <CardDescription>
                                    {siswaList.length} siswa • Klik sel untuk input nilai
                                </CardDescription>
                            </div>
                            {dirtyCells.size > 0 && (
                                <Badge variant="destructive">
                                    {dirtyCells.size} perubahan belum disimpan
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : siswaList.length === 0 ? (
                            <div className="text-center py-12">
                                <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">Tidak ada siswa di kelas ini</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-3 py-3 text-left font-medium w-12">No</th>
                                            <th className="px-3 py-3 text-left font-medium min-w-[150px]">NIS</th>
                                            <th className="px-3 py-3 text-left font-medium min-w-[200px]">Nama Siswa</th>
                                            {visibleColumns.map(col => (
                                                <th
                                                    key={col}
                                                    className="px-3 py-3 text-center font-medium min-w-[80px]"
                                                >
                                                    {LABEL_KOLOM[col]}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {siswaList.map((siswa, rowIndex) => {
                                            const nilai = nilaiData[siswa.siswa_id] || {};
                                            const siswaDirty = Array.from(dirtyCells).some(
                                                c => c.startsWith(`${siswa.siswa_id}-`)
                                            );

                                            return (
                                                <tr
                                                    key={siswa.id}
                                                    className={`border-b hover:bg-muted/30 ${siswaDirty ? 'bg-yellow-50' : ''}`}
                                                >
                                                    <td className="px-3 py-2">{rowIndex + 1}</td>
                                                    <td className="px-3 py-2 font-mono text-xs">
                                                        {siswa.siswa.nis}
                                                    </td>
                                                    <td className="px-3 py-2 font-medium">
                                                        {siswa.siswa.nama}
                                                    </td>
                                                    {visibleColumns.map(col => {
                                                        const isRapor = col === 'rapor';
                                                        const isLocked = !isModePTS && col === 'pts' && nilai.pts !== null;
                                                        const isActive = activeCell?.siswaId === siswa.siswa_id &&
                                                            activeCell?.field === col;
                                                        const isDirty = dirtyCells.has(`${siswa.siswa_id}-${col}`);

                                                        // Check sequential validation
                                                        let isSequentialLocked = false;
                                                        if (col.startsWith('uh')) {
                                                            const uhNum = parseInt(col.replace('uh', ''));
                                                            if (uhNum > 1) {
                                                                const prevField = `uh${uhNum - 1}`;
                                                                isSequentialLocked = nilai[prevField as keyof NilaiMapel] === null;
                                                            }
                                                        }

                                                        return (
                                                            <td
                                                                key={col}
                                                                className={`px-2 py-1 text-center ${isLocked ? 'bg-muted/50' : ''}`}
                                                            >
                                                                {isRapor ? (
                                                                    <span className={`font-bold ${(nilai.rapor as number) >= 75 ? 'text-green-600' :
                                                                            (nilai.rapor as number) >= 60 ? 'text-yellow-600' :
                                                                                'text-red-600'
                                                                        }`}>
                                                                        {nilai.rapor ?? '-'}
                                                                    </span>
                                                                ) : isLocked || isSequentialLocked ? (
                                                                    <span className="text-muted-foreground text-xs">
                                                                        {nilai[col as keyof NilaiMapel] ?? '-'}
                                                                    </span>
                                                                ) : (
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max="100"
                                                                        className={`w-full px-2 py-1 text-center border rounded ${isDirty ? 'border-yellow-500 bg-yellow-50' :
                                                                                'border-input'
                                                                            } ${isActive ? 'ring-2 ring-primary' : ''}`}
                                                                        value={(nilai[col as keyof NilaiMapel] as number | null) ?? ''}
                                                                        onChange={(e) => handleNilaiChange(
                                                                            siswa.siswa_id,
                                                                            col,
                                                                            e.target.value
                                                                        )}
                                                                        onKeyDown={(e) => handleKeyDown(
                                                                            e,
                                                                            siswa.siswa_id,
                                                                            col,
                                                                            rowIndex
                                                                        )}
                                                                        onFocus={() => setActiveCell({
                                                                            siswaId: siswa.siswa_id,
                                                                            field: col
                                                                        })}
                                                                    />
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Legend */}
            <Card className="bg-muted/50">
                <CardContent className="py-4">
                    <p className="text-sm font-medium mb-2">Legenda:</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <span className="w-4 h-4 border border-yellow-500 bg-yellow-50 rounded" />
                            Sel berubah (belum disimpan)
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-4 h-4 bg-muted/50 rounded" />
                            Sel terkunci (sudah diinput di mode PTS)
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="text-green-600 font-bold">75+</span>
                            Tuntas
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="text-yellow-600 font-bold">60-74</span>
                            Perlu Bimbingan
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="text-red-600 font-bold">&lt;60</span>
                            Belum Tuntas
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}