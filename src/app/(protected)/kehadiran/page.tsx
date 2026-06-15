'use client';

import { useState, useEffect } from 'react';
import { useAuth, useActiveSemester } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Save, Users, AlertCircle, Check, Calendar, FileText } from 'lucide-react';
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

interface Kehadiran {
    id: string;
    siswa_id: string;
    semester_id: string;
    sakit: number | null;
    izin: number | null;
    alpha: number | null;
    catatan: string | null;
}

interface KelasOption {
    id: string;
    nama: string;
    jenjang: number;
}

interface KehadiranInput {
    siswa_id: string;
    nis: string;
    nama: string;
    sakit: number | null;
    izin: number | null;
    alpha: number | null;
    catatan: string;
}

/**
 * Halaman Kehadiran & Catatan Wali Kelas
 * 
 * Fitur:
 * - Filter kelas (hanya kelas wali kelas)
 * - Input rekap kehadiran (Sakit, Izin, Alpha)
 * - Input catatan wali kelas per siswa
 * - Batch save
 * 
 * Akses: Wali Kelas
 */
export default function KehadiranPage() {
    const { profile } = useAuth();
    const { semester } = useActiveSemester();
    const { toast } = useToast();
    const supabase = createClient();

    // State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
    const [selectedKelas, setSelectedKelas] = useState<string>('');
    const [siswaList, setSiswaList] = useState<SiswaKelas[]>([]);
    const [kehadiranData, setKehadiranData] = useState<Record<string, KehadiranInput>>({});
    const [dirtyCells, setDirtyCells] = useState<Set<string>>(new Set());

    // Ambil daftar kelas wali
    useEffect(() => {
        if (semester?.id && profile?.role === 'guru') {
            fetchKelasOptions();
        }
    }, [semester, profile]);

    // Ambil siswa saat kelas berubah
    useEffect(() => {
        if (selectedKelas && semester?.id) {
            fetchSiswa();
        }
    }, [selectedKelas, semester]);

    async function fetchKelasOptions() {
        if (!semester?.id || !profile) return;

        try {
            const { data: kelas } = await supabase
                .from('kelas_real')
                .select('id, nama, jenjang')
                .eq('semester_id', semester.id)
                .eq('wali_kelas_id', profile.id);

            setKelasOptions(kelas || []);
        } catch (error) {
            console.error('Error fetching kelas:', error);
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

            // Ambil kehadiran
            const siswaIds = siswaKelas?.map((s: any) => s.siswa_id) || [];
            if (siswaIds.length === 0) {
                setKehadiranData({});
                setLoading(false);
                return;
            }

            const { data: kehadiran } = await supabase
                .from('kehadiran')
                .select('*')
                .eq('semester_id', semester.id)
                .in('siswa_id', siswaIds);

            const kehadiranMap: Record<string, KehadiranInput> = {};
            siswaKelas?.forEach((s: any) => {
                const k = kehadiran?.find((h: any) => h.siswa_id === s.siswa_id);
                kehadiranMap[s.siswa_id] = {
                    siswa_id: s.siswa_id,
                    nis: s.siswa.nis,
                    nama: s.siswa.nama,
                    sakit: k?.sakit ?? null,
                    izin: k?.izin ?? null,
                    alpha: k?.alpha ?? null,
                    catatan: k?.catatan ?? '',
                };
            });

            setKehadiranData(kehadiranMap);
            setDirtyCells(new Set());
        } catch (error) {
            console.error('Error fetching siswa:', error);
        } finally {
            setLoading(false);
        }
    }

    function handleChange(siswaId: string, field: keyof KehadiranInput, value: string | number | null) {
        setKehadiranData(prev => ({
            ...prev,
            [siswaId]: {
                ...prev[siswaId],
                [field]: value,
            },
        }));
        setDirtyCells(prev => new Set(prev).add(`${siswaId}-${field}`));
    }

    async function handleSave() {
        if (!semester?.id) return;

        setSaving(true);
        try {
            const toUpsert = Object.values(kehadiranData).map(k => ({
                siswa_id: k.siswa_id,
                semester_id: semester.id,
                sakit: k.sakit,
                izin: k.izin,
                alpha: k.alpha,
                catatan: k.catatan || null,
            }));

            const { error } = await supabase
                .from('kehadiran')
                .upsert(toUpsert, {
                    onConflict: 'siswa_id,semester_id',
                });

            if (error) throw error;

            toast({ title: 'Berhasil', description: 'Data kehadiran berhasil disimpan' });
            setDirtyCells(new Set());
            fetchSiswa();
        } catch (error) {
            console.error('Error saving:', error);
            toast({ title: 'Error', description: 'Gagal menyimpan data', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    }

    // Calculate totals
    const totalSakit = Object.values(kehadiranData).reduce((sum, k) => sum + (k.sakit || 0), 0);
    const totalIzin = Object.values(kehadiranData).reduce((sum, k) => sum + (k.izin || 0), 0);
    const totalAlpha = Object.values(kehadiranData).reduce((sum, k) => sum + (k.alpha || 0), 0);
    const totalHariEfektif = 0; // TODO: Add jumlah_hari_efektif to semester query when available
    const siswaWithCatatan = Object.values(kehadiranData).filter(k => k.catatan).length;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Kehadiran & Catatan Wali Kelas</h1>
                    <p className="text-muted-foreground">
                        Input rekap kehadiran dan catatan untuk siswa
                    </p>
                </div>
                {dirtyCells.size > 0 && (
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                )}
            </div>

            {/* Filter */}
            <Card>
                <CardHeader>
                    <CardTitle>Pilih Kelas</CardTitle>
                    <CardDescription>
                        Hanya kelas yang menjadi tanggung jawab Anda sebagai Wali Kelas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="w-full max-w-xs">
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
                </CardContent>
            </Card>

            {/* Summary */}
            {selectedKelas && Object.keys(kehadiranData).length > 0 && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{siswaList.length}</p>
                                    <p className="text-sm text-muted-foreground">Total Siswa</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-100 rounded-full">
                                    <AlertCircle className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{totalSakit}</p>
                                    <p className="text-sm text-muted-foreground">Total Sakit</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-yellow-100 rounded-full">
                                    <Calendar className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{totalIzin}</p>
                                    <p className="text-sm text-muted-foreground">Total Izin</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-100 rounded-full">
                                    <FileText className="h-6 w-6 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{totalAlpha}</p>
                                    <p className="text-sm text-muted-foreground">Total Alpha</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Info */}
            {semester && (
                <Card className="bg-muted/50">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4" />
                            <span>
                                Semester {semester.nama} •
                                {totalHariEfektif > 0 ? `${totalHariEfektif} hari efektif` : 'hari efektif belum diatur'}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Data Table */}
            {selectedKelas && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Daftar Kehadiran Siswa</CardTitle>
                                <CardDescription>
                                    {siswaList.length} siswa • {siswaWithCatatan} siswa memiliki catatan
                                </CardDescription>
                            </div>
                            {dirtyCells.size > 0 && (
                                <Badge variant="destructive">
                                    {dirtyCells.size} perubahan belum disimpan
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : siswaList.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">Tidak ada siswa di kelas ini</p>
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
                                            <th className="px-3 py-2 text-center">Sakit</th>
                                            <th className="px-3 py-2 text-center">Izin</th>
                                            <th className="px-3 py-2 text-center">Alpha</th>
                                            <th className="px-3 py-2 text-left min-w-[200px]">Catatan Wali Kelas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {siswaList.map((siswa, i) => {
                                            const k = kehadiranData[siswa.siswa_id] || {
                                                siswa_id: siswa.siswa_id,
                                                nis: siswa.siswa.nis,
                                                nama: siswa.siswa.nama,
                                                sakit: null,
                                                izin: null,
                                                alpha: null,
                                                catatan: '',
                                            };
                                            const isDirty = dirtyCells.has(`${siswa.siswa_id}-sakit`) ||
                                                dirtyCells.has(`${siswa.siswa_id}-izin`) ||
                                                dirtyCells.has(`${siswa.siswa_id}-alpha`) ||
                                                dirtyCells.has(`${siswa.siswa_id}-catatan`);

                                            return (
                                                <tr
                                                    key={siswa.id}
                                                    className={`border-b hover:bg-muted/30 ${isDirty ? 'bg-yellow-50' : ''}`}
                                                >
                                                    <td className="px-3 py-2">{i + 1}</td>
                                                    <td className="px-3 py-2 font-mono">{siswa.siswa.nis}</td>
                                                    <td className="px-3 py-2 font-medium">{siswa.siswa.nama}</td>
                                                    <td className="px-3 py-2 text-center">{siswa.siswa.jenis_kelamin}</td>
                                                    <td className="px-2 py-1">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className={`w-16 px-2 py-1 text-center border rounded ${isDirty ? 'border-yellow-500' : 'border-input'}`}
                                                            value={k.sakit ?? ''}
                                                            onChange={(e) => handleChange(
                                                                siswa.siswa_id,
                                                                'sakit',
                                                                e.target.value === '' ? null : parseInt(e.target.value) || 0
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className={`w-16 px-2 py-1 text-center border rounded ${isDirty ? 'border-yellow-500' : 'border-input'}`}
                                                            value={k.izin ?? ''}
                                                            onChange={(e) => handleChange(
                                                                siswa.siswa_id,
                                                                'izin',
                                                                e.target.value === '' ? null : parseInt(e.target.value) || 0
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className={`w-16 px-2 py-1 text-center border rounded ${isDirty ? 'border-yellow-500' : 'border-input'}`}
                                                            value={k.alpha ?? ''}
                                                            onChange={(e) => handleChange(
                                                                siswa.siswa_id,
                                                                'alpha',
                                                                e.target.value === '' ? null : parseInt(e.target.value) || 0
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1">
                                                        <textarea
                                                            className={`w-full px-2 py-1 border rounded resize-none ${isDirty ? 'border-yellow-500' : 'border-input'}`}
                                                            rows={2}
                                                            value={k.catatan}
                                                            onChange={(e) => handleChange(
                                                                siswa.siswa_id,
                                                                'catatan',
                                                                e.target.value
                                                            )}
                                                            placeholder="Catatan wali kelas..."
                                                        />
                                                    </td>
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
                            Data berubah (belum disimpan)
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="text-red-600 font-bold">Sakit</span>
                            Jumlah hari sakit
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="text-yellow-600 font-bold">Izin</span>
                            Jumlah hari izin
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="text-gray-600 font-bold">Alpha</span>
                            Jumlah hari tidak hadir tanpa keterangan
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}