'use client';

import { useState, useEffect } from 'react';
import { useAuth, useActiveSemester } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Download, FileSpreadsheet, Check, AlertCircle, RefreshCw, Users, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import * as XLSX from 'xlsx';

// Types
interface RekapNilai {
    siswa_id: string;
    nis: string;
    nama: string;
    jenis_kelamin: 'L' | 'P';
    mapel_id: string;
    mapel_nama: string;
    uh1: number | null;
    uh2: number | null;
    uh3: number | null;
    uh4: number | null;
    uh5: number | null;
    pts: number | null;
    semester: number | null;
    rapor: number | null;
    status: 'lengkap' | 'kurang' | 'kosong';
    missing_fields: string[];
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

interface RekapSummary {
    total_siswa: number;
    lengkap: number;
    kurang: number;
    kosong: number;
    rata_rata: number;
}

/**
 * Halaman Rekap Nilai
 * 
 * Fitur:
 * - Filter kelas & mapel
 * - Tabel rekap nilai per siswa & mapel
 * - Status kelengkapan data (lengkap/kurang/kosong)
 * - Rata-rata kelas
 * - Ekspor ke Excel
 * 
 * Akses: Guru, Wali Kelas, Admin
 */
export default function RekapNilaiPage() {
    const { profile } = useAuth();
    const { semester } = useActiveSemester();
    const { toast } = useToast();
    const supabase = createClient();

    // State
    const [loading, setLoading] = useState(true);
    const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
    const [mapelOptions, setMapelOptions] = useState<MapelOption[]>([]);
    const [selectedKelas, setSelectedKelas] = useState<string>('');
    const [selectedMapel, setSelectedMapel] = useState<string>('all');
    const [rekapData, setRekapData] = useState<RekapNilai[]>([]);
    const [summary, setSummary] = useState<RekapSummary | null>(null);
    const [exporting, setExporting] = useState(false);

    // Ambil daftar kelas
    useEffect(() => {
        if (semester?.id) {
            fetchKelasOptions();
        }
    }, [semester, profile]);

    // Ambil mapel saat kelas berubah
    useEffect(() => {
        if (selectedKelas && semester?.id) {
            fetchMapelOptions();
        }
    }, [selectedKelas, semester]);

    // Ambil data rekap saat filter berubah
    useEffect(() => {
        if (selectedKelas && semester?.id) {
            fetchRekap();
        }
    }, [selectedKelas, selectedMapel, semester]);

    async function fetchKelasOptions() {
        if (!semester?.id) return;

        try {
            let query = supabase
                .from('kelas_real')
                .select('id, nama, jenjang')
                .eq('semester_id', semester.id);

            // Filter berdasarkan role
            if (profile?.role === 'guru') {
                // Guru hanya lihat kelas yang diajar
                const { data: pembagian } = await supabase
                    .from('pembagian_mengajar_real')
                    .select('kelas_real_id')
                    .eq('guru_id', profile.id)
                    .eq('semester_id', semester.id);

                const kelasIds = pembagian?.map((p: any) => p.kelas_real_id) || [];
                if (kelasIds.length > 0) {
                    query = query.in('id', kelasIds);
                }
            }
            // Note: Wali kelas is a tugas_tambahan, not a separate role.
            // Wali kelas filtering is handled at the guru level above.

            const { data: kelas } = await query;
            setKelasOptions(kelas || []);
        } catch (error) {
            console.error('Error fetching kelas:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchMapelOptions() {
        if (!selectedKelas || !semester?.id) return;

        try {
            let query = supabase
                .from('pembagian_mengajar_real')
                .select(`
                    id,
                    mapel_id,
                    mata_pelajaran:mata_pelajaran_id (id, nama)
                `)
                .eq('kelas_real_id', selectedKelas)
                .eq('semester_id', semester.id);

            if (profile?.role === 'guru') {
                query = query.eq('guru_id', profile.id);
            }

            const { data: pembagian } = await query;
            const mapelList: MapelOption[] = [];

            pembagian?.forEach((p: any) => {
                if (p.mata_pelajaran) {
                    mapelList.push({
                        id: p.mata_pelajaran.id,
                        nama: p.mata_pelajaran.nama,
                        kelas_real_id: selectedKelas,
                    });
                }
            });

            setMapelOptions(mapelList);
        } catch (error) {
            console.error('Error fetching mapel:', error);
        }
    }

    async function fetchRekap() {
        if (!selectedKelas || !semester?.id) return;

        setLoading(true);
        try {
            // Ambil siswa di kelas
            const { data: siswaKelas } = await supabase
                .from('siswa_kelas')
                .select(`
                    siswa_id,
                    siswa:siswa_id (id, nis, nama, jenis_kelamin)
                `)
                .eq('kelas_real_id', selectedKelas)
                .eq('semester_id', semester.id);

            if (!siswaKelas || siswaKelas.length === 0) {
                setRekapData([]);
                setSummary(null);
                setLoading(false);
                return;
            }

            const siswaIds = siswaKelas.map((s: any) => s.siswa_id);
            const siswaMap = new Map<string, any>();
            siswaKelas.forEach((s: any) => siswaMap.set(s.siswa_id, s.siswa));

            // Ambil mapel yang diajar di kelas ini
            let mapelQuery = supabase
                .from('pembagian_mengajar_real')
                .select('mata_pelajaran_id, mata_pelajaran:mata_pelajaran_id (id, nama)')
                .eq('kelas_real_id', selectedKelas)
                .eq('semester_id', semester.id);

            if (profile?.role === 'guru') {
                mapelQuery = mapelQuery.eq('guru_id', profile.id);
            }

            const { data: mapelList } = await mapelQuery;
            const mapelIds = selectedMapel !== 'all'
                ? [selectedMapel]
                : (mapelList?.map((m: any) => m.mata_pelajaran_id) || []);

            // Ambil nilai
            let nilaiQuery = supabase
                .from('nilai_mapel')
                .select('*')
                .eq('semester_id', semester.id)
                .in('siswa_id', siswaIds);

            if (mapelIds.length > 0) {
                nilaiQuery = nilaiQuery.in('mapel_id', mapelIds);
            }

            const { data: nilaiList } = await nilaiQuery;

            // Mapel info
            const mapelInfo = new Map<string, string>();
            mapelList?.forEach((m: any) => {
                if (m.mata_pelajaran) {
                    mapelInfo.set(m.mata_pelajaran.id, m.mata_pelajaran.nama);
                }
            });

            // Build rekap data
            const rekap: RekapNilai[] = [];
            const nilaiMap = new Map<string, any>();

            nilaiList?.forEach((n: any) => {
                const key = `${n.siswa_id}-${n.mapel_id}`;
                nilaiMap.set(key, n);
            });

            siswaIds.forEach((siswaId: string) => {
                const siswa = siswaMap.get(siswaId);
                if (!siswa) return;

                if (selectedMapel !== 'all') {
                    // Single mapel view
                    const nilai = nilaiMap.get(`${siswaId}-${selectedMapel}`);
                    const missing: string[] = [];

                    if (!nilai) {
                        missing.push('UH1', 'UH2', 'UH3', 'UH4', 'UH5', 'PTS', 'Semester');
                    } else {
                        ['uh1', 'uh2', 'uh3', 'uh4', 'uh5', 'pts', 'semester'].forEach(f => {
                            if (nilai[f] === null) missing.push(f.toUpperCase());
                        });
                    }

                    rekap.push({
                        siswa_id: siswaId,
                        nis: siswa.nis,
                        nama: siswa.nama,
                        jenis_kelamin: siswa.jenis_kelamin,
                        mapel_id: selectedMapel,
                        mapel_nama: mapelInfo.get(selectedMapel) || '',
                        uh1: nilai?.uh1 ?? null,
                        uh2: nilai?.uh2 ?? null,
                        uh3: nilai?.uh3 ?? null,
                        uh4: nilai?.uh4 ?? null,
                        uh5: nilai?.uh5 ?? null,
                        pts: nilai?.pts ?? null,
                        semester: nilai?.semester ?? null,
                        rapor: nilai?.rapor ?? null,
                        status: missing.length === 0 ? 'lengkap' : missing.length < 7 ? 'kurang' : 'kosong',
                        missing_fields: missing,
                    });
                } else {
                    // All mapel view - create one row per siswa with aggregated status
                    const siswaNilai = Array.from(nilaiMap.entries())
                        .filter(([key]) => key.startsWith(`${siswaId}-`))
                        .map(([, nilai]) => nilai);

                    const lengkapCount = siswaNilai.filter(n => {
                        return n.uh1 !== null && n.pts !== null && n.semester !== null;
                    }).length;

                    const totalMapel = mapelIds.length;
                    const status = totalMapel === 0 ? 'kosong' :
                        lengkapCount === totalMapel ? 'lengkap' :
                            lengkapCount > 0 ? 'kurang' : 'kosong';

                    rekap.push({
                        siswa_id: siswaId,
                        nis: siswa.nis,
                        nama: siswa.nama,
                        jenis_kelamin: siswa.jenis_kelamin,
                        mapel_id: '',
                        mapel_nama: `${lengkapCount}/${totalMapel} mapel lengkap`,
                        uh1: null,
                        uh2: null,
                        uh3: null,
                        uh4: null,
                        uh5: null,
                        pts: null,
                        semester: null,
                        rapor: siswaNilai.length > 0
                            ? siswaNilai.reduce((sum, n) => sum + (n.rapor || 0), 0) / siswaNilai.length
                            : null,
                        status,
                        missing_fields: [],
                    });
                }
            });

            setRekapData(rekap);

            // Calculate summary
            const summaryData: RekapSummary = {
                total_siswa: rekap.length,
                lengkap: rekap.filter(r => r.status === 'lengkap').length,
                kurang: rekap.filter(r => r.status === 'kurang').length,
                kosong: rekap.filter(r => r.status === 'kosong').length,
                rata_rata: rekap.filter(r => r.rapor !== null).reduce((sum, r) => sum + (r.rapor || 0), 0) /
                    rekap.filter(r => r.rapor !== null).length || 0,
            };
            setSummary(summaryData);

        } catch (error) {
            console.error('Error fetching rekap:', error);
        } finally {
            setLoading(false);
        }
    }

    // Export to Excel
    async function handleExport() {
        if (rekapData.length === 0) return;

        setExporting(true);
        try {
            const wb = XLSX.utils.book_new();

            const exportData = rekapData.map(r => ({
                'NIS': r.nis,
                'Nama': r.nama,
                'JK': r.jenis_kelamin,
                'Mapel': r.mapel_nama,
                'UH1': r.uh1 ?? '',
                'UH2': r.uh2 ?? '',
                'UH3': r.uh3 ?? '',
                'UH4': r.uh4 ?? '',
                'UH5': r.uh5 ?? '',
                'PTS': r.pts ?? '',
                'Semester': r.semester ?? '',
                'RAPOR': r.rapor?.toFixed(2) ?? '',
                'Status': r.status === 'lengkap' ? '✓ Lengkap' : r.status === 'kurang' ? '⚠ Kurang' : '✗ Kosong',
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(wb, ws, 'Rekap Nilai');

            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `Rekap_Nilai_${selectedKelas}_${new Date().toISOString().split('T')[0]}.xlsx`;
            a.click();

            URL.revokeObjectURL(url);
            toast({ title: 'Berhasil', description: 'File Excel berhasil diunduh' });

        } catch (error) {
            console.error('Error exporting:', error);
            toast({ title: 'Error', description: 'Gagal export Excel', variant: 'destructive' });
        } finally {
            setExporting(false);
        }
    }

    const filteredMapel = mapelOptions.filter(m => m.kelas_real_id === selectedKelas);
    const kelengkapanPercent = summary ? Math.round((summary.lengkap / summary.total_siswa) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Rekap Nilai</h1>
                    <p className="text-muted-foreground">
                        Lihat rekap kelengkapan nilai siswa per kelas
                    </p>
                </div>
                {rekapData.length > 0 && (
                    <Button onClick={handleExport} disabled={exporting}>
                        <Download className="mr-2 h-4 w-4" />
                        {exporting ? 'Exporting...' : 'Export Excel'}
                    </Button>
                )}
            </div>

            {/* Filter */}
            <Card>
                <CardHeader>
                    <CardTitle>Filter</CardTitle>
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
                            <Select value={selectedMapel} onValueChange={setSelectedMapel}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua mapel" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Mapel</SelectItem>
                                    {filteredMapel.map(m => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary */}
            {summary && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{summary.total_siswa}</p>
                                    <p className="text-sm text-muted-foreground">Total Siswa</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 rounded-full">
                                    <Check className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{summary.lengkap}</p>
                                    <p className="text-sm text-muted-foreground">Lengkap</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-yellow-100 rounded-full">
                                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{summary.kurang}</p>
                                    <p className="text-sm text-muted-foreground">Kurang</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <BookOpen className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{summary.rata_rata.toFixed(1)}</p>
                                    <p className="text-sm text-muted-foreground">Rata-rata</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Kelengkapan Progress */}
            {summary && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Kelengkapan Data</span>
                                <span className="font-medium">{kelengkapanPercent}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${kelengkapanPercent >= 80 ? 'bg-green-500' : kelengkapanPercent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${kelengkapanPercent}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Data Table */}
            {selectedKelas && (
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Nilai Siswa</CardTitle>
                        <CardDescription>
                            {rekapData.length} siswa
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : rekapData.length === 0 ? (
                            <div className="text-center py-12">
                                <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">Tidak ada data</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-3 py-2 text-left w-12">No</th>
                                            <th className="px-3 py-2 text-left">NIS</th>
                                            <th className="px-3 py-2 text-left">Nama</th>
                                            <th className="px-3 py-2 text-center">JK</th>
                                            {selectedMapel === 'all' ? (
                                                <th className="px-3 py-2 text-left">Mapel</th>
                                            ) : (
                                                <>
                                                    <th className="px-3 py-2 text-center">UH1</th>
                                                    <th className="px-3 py-2 text-center">UH2</th>
                                                    <th className="px-3 py-2 text-center">UH3</th>
                                                    <th className="px-3 py-2 text-center">UH4</th>
                                                    <th className="px-3 py-2 text-center">UH5</th>
                                                    <th className="px-3 py-2 text-center">PTS</th>
                                                    <th className="px-3 py-2 text-center">SEM</th>
                                                </>
                                            )}
                                            <th className="px-3 py-2 text-center">RAPOR</th>
                                            <th className="px-3 py-2 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rekapData.map((row, i) => (
                                            <tr key={`${row.siswa_id}-${row.mapel_id}`} className="border-b hover:bg-muted/30">
                                                <td className="px-3 py-2">{i + 1}</td>
                                                <td className="px-3 py-2 font-mono">{row.nis}</td>
                                                <td className="px-3 py-2 font-medium">{row.nama}</td>
                                                <td className="px-3 py-2 text-center">{row.jenis_kelamin}</td>
                                                {selectedMapel === 'all' ? (
                                                    <td className="px-3 py-2">{row.mapel_nama}</td>
                                                ) : (
                                                    <>
                                                        <td className="px-3 py-2 text-center">{row.uh1 ?? '-'}</td>
                                                        <td className="px-3 py-2 text-center">{row.uh2 ?? '-'}</td>
                                                        <td className="px-3 py-2 text-center">{row.uh3 ?? '-'}</td>
                                                        <td className="px-3 py-2 text-center">{row.uh4 ?? '-'}</td>
                                                        <td className="px-3 py-2 text-center">{row.uh5 ?? '-'}</td>
                                                        <td className="px-3 py-2 text-center">{row.pts ?? '-'}</td>
                                                        <td className="px-3 py-2 text-center">{row.semester ?? '-'}</td>
                                                    </>
                                                )}
                                                <td className={`px-3 py-2 text-center font-bold ${(row.rapor ?? 0) >= 75 ? 'text-green-600' :
                                                        (row.rapor ?? 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                                                    }`}>
                                                    {row.rapor?.toFixed(2) ?? '-'}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <Badge variant={
                                                        row.status === 'lengkap' ? 'default' :
                                                            row.status === 'kurang' ? 'warning' : 'destructive'
                                                    }>
                                                        {row.status === 'lengkap' ? 'Lengkap' :
                                                            row.status === 'kurang' ? 'Kurang' : 'Kosong'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}