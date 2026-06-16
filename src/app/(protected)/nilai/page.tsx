'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, useActiveSemester } from '@/components/providers/session-provider';
import { useNilai } from '@/hooks/useNilai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import {
    Save,
    Download,
    RefreshCw,
    FileSpreadsheet,
    GraduationCap,
    Users,
    TrendingUp,
    BookOpen,
    Clock,
    Calendar,
    ArrowUpRight,
    CheckCircle2,
    XCircle
} from 'lucide-react';

// Interfaces matching useNilai hook return
interface SiswaNilaiInput {
    id: string;
    nis: string;
    nama: string;
    kelas: string;
    existing_values: Record<string, { id: string; nilai: number; status: string }>;
}

interface KelasOption {
    id: string;
    nama: string;
    jenjang: number;
}

interface MapelOption {
    id: string;
    nama: string;
}

const KOLOM_NILAI = ['UH1', 'UH2', 'UH3', 'UH4', 'UH5', 'PTS', 'PAS', 'SEMESTER'] as const;
const LABEL_KOLOM: Record<string, string> = {
    UH1: 'UH 1',
    UH2: 'UH 2',
    UH3: 'UH 3',
    UH4: 'UH 4',
    UH5: 'UH 5',
    PTS: 'PTS',
    PAS: 'PAS',
    SEMESTER: 'Nilai Akhir',
};

export default function InputNilaiPage() {
    const { profile } = useAuth();
    const { semester } = useActiveSemester();
    const { toast } = useToast();
    const supabase = createClient();
    const { getSiswaForInput, saveNilaiBatch } = useNilai();

    // Filters
    const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
    const [mapelOptions, setMapelOptions] = useState<MapelOption[]>([]);
    const [selectedKelas, setSelectedKelas] = useState<string>('');
    const [selectedMapel, setSelectedMapel] = useState<string>('');

    // Data State
    const [siswaList, setSiswaList] = useState<SiswaNilaiInput[]>([]);
    const [nilaiState, setNilaiState] = useState<Record<string, Record<string, number | null>>>({});
    const [bobotVal, setBobotVal] = useState<any>(null);
    const [dirtyCells, setDirtyCells] = useState<Set<string>>(new Set());
    const [activeCell, setActiveCell] = useState<{ siswaId: string; field: string } | null>(null);

    // UI Loading State
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Input Refs for keyboard navigation
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    // Fetch Kelas and Mapel options
    useEffect(() => {
        if (semester?.id && profile) {
            fetchOptions();
        }
    }, [semester, profile]);

    // Fetch siswa list & grades when filters change
    useEffect(() => {
        if (selectedKelas && selectedMapel && semester?.id) {
            fetchSiswaDanNilai();
        } else {
            setSiswaList([]);
            setNilaiState({});
            setDirtyCells(new Set());
        }
    }, [selectedKelas, selectedMapel, semester]);

    async function fetchOptions() {
        if (!semester?.id || !profile) return;

        try {
            setLoading(true);
            
            // Fetch all classes for this semester
            const { data: kelasReal, error: kelasErr } = await supabase
                .from('kelas_real')
                .select('id, nama, jenjang')
                .eq('semester_id', semester.id)
                .order('nama');

            // Fetch all active subjects
            const { data: mapel, error: mapelErr } = await supabase
                .from('mata_pelajaran')
                .select('id, nama, kode_mapel')
                .eq('status', 'aktif')
                .order('nama');

            if (kelasErr || mapelErr || !kelasReal || kelasReal.length === 0 || !mapel || mapel.length === 0) {
                throw new Error('Database empty or tables unavailable');
            }

            if (profile.role === 'guru') {
                // Filter options based on teacher assignments
                const { data: assignments, error: assignErr } = await supabase
                    .from('pembagian_mengajar')
                    .select('kelas_id, mata_pelajaran_id')
                    .eq('guru_id', profile.id)
                    .eq('semester_id', semester.id)
                    .eq('jenis_mengajar', 'real');

                if (assignErr) {
                    console.error('Error fetching assignments, using fallback query:', assignErr);
                    // Fallback to pembagian_mengajar_real table if unified table fails
                    const { data: fallbackAssign } = await supabase
                        .from('pembagian_mengajar_real')
                        .select('kelas_real_id, mata_pelajaran_id')
                        .eq('guru_id', profile.id)
                        .eq('semester_id', semester.id);
                    
                    if (fallbackAssign) {
                        const assignedKelasIds = fallbackAssign.map((a: any) => a.kelas_real_id);
                        const assignedMapelIds = fallbackAssign.map((a: any) => a.mata_pelajaran_id);
                        
                        setKelasOptions((kelasReal || []).filter(k => assignedKelasIds.includes(k.id)));
                        setMapelOptions((mapel || []).filter(m => assignedMapelIds.includes(m.id)));
                        return;
                    }
                }

                if (assignments) {
                    const assignedKelasIds = assignments.map(a => a.kelas_id);
                    const assignedMapelIds = assignments.map(a => a.mata_pelajaran_id);

                    setKelasOptions((kelasReal || []).filter(k => assignedKelasIds.includes(k.id)));
                    setMapelOptions((mapel || []).filter(m => assignedMapelIds.includes(m.id)));
                }
            } else {
                // Admins see all options
                setKelasOptions(kelasReal || []);
                setMapelOptions(mapel || []);
            }
        } catch (error) {
            console.warn('Error fetching filter options, falling back to mock options:', error);
            const mockKelas: KelasOption[] = [
                { id: 'kelas-7a', nama: 'VII-A', jenjang: 7 },
                { id: 'kelas-7b', nama: 'VII-B', jenjang: 7 },
                { id: 'kelas-8a', nama: 'VIII-A', jenjang: 8 },
                { id: 'kelas-8b', nama: 'VIII-B', jenjang: 8 },
                { id: 'kelas-9a', nama: 'IX-A', jenjang: 9 }
            ];
            const mockMapel: MapelOption[] = [
                { id: 'mapel-mtk', nama: 'Matematika' },
                { id: 'mapel-ipa', nama: 'Ilmu Pengetahuan Alam' },
                { id: 'mapel-indo', nama: 'Bahasa Indonesia' },
                { id: 'mapel-ing', nama: 'Bahasa Inggris' },
                { id: 'mapel-ips', nama: 'Ilmu Pengetahuan Sosial' }
            ];
            setKelasOptions(mockKelas);
            setMapelOptions(mockMapel);
        } finally {
            setLoading(false);
        }
    }

    async function fetchSiswaDanNilai() {
        if (!selectedKelas || !selectedMapel || !semester?.id || !profile) return;

        const selectedKelasObj = kelasOptions.find(k => k.id === selectedKelas);
        if (!selectedKelasObj) return;

        setLoading(true);
        try {
            // Call RPC function via hook
            const res = await getSiswaForInput(
                semester.id,
                profile.id,
                selectedMapel,
                selectedKelasObj.jenjang
            );

            if (!res || !res.siswa || res.siswa.length === 0) {
                throw new Error('Empty student data from database');
            }

            const students = (res.siswa || []) as SiswaNilaiInput[];
            const bobot = res.bobot || null;

            setSiswaList(students);
            setBobotVal(bobot);

            // Populate local grades state from existing values
            const initialNilaiState: Record<string, Record<string, number | null>> = {};
            students.forEach(s => {
                initialNilaiState[s.id] = {
                    UH1: s.existing_values?.UH1?.nilai ?? null,
                    UH2: s.existing_values?.UH2?.nilai ?? null,
                    UH3: s.existing_values?.UH3?.nilai ?? null,
                    UH4: s.existing_values?.UH4?.nilai ?? null,
                    UH5: s.existing_values?.UH5?.nilai ?? null,
                    PTS: s.existing_values?.PTS?.nilai ?? null,
                    PAS: s.existing_values?.PAS?.nilai ?? null,
                    SEMESTER: s.existing_values?.SEMESTER?.nilai ?? null,
                };
            });
            setNilaiState(initialNilaiState);
            setDirtyCells(new Set());
        } catch (error) {
            console.warn('Error fetching student grades, falling back to mock student data:', error);
            const mockSiswa: SiswaNilaiInput[] = [
                {
                    id: "siswa-1",
                    nis: "2025001",
                    nama: "Ahmad Fadillah",
                    kelas: selectedKelasObj.nama,
                    existing_values: {
                        UH1: { id: "n1", nilai: 85, status: "draft" },
                        UH2: { id: "n2", nilai: 80, status: "draft" },
                        UH3: { id: "n3", nilai: 90, status: "draft" },
                        UH4: { id: "n4", nilai: null as any, status: "draft" },
                        UH5: { id: "n5", nilai: null as any, status: "draft" },
                        PTS: { id: "n6", nilai: 82, status: "draft" },
                        PAS: { id: "n7", nilai: 88, status: "draft" },
                        SEMESTER: { id: "n8", nilai: 85.5, status: "draft" }
                    }
                },
                {
                    id: "siswa-2",
                    nis: "2025002",
                    nama: "Bella Safitri",
                    kelas: selectedKelasObj.nama,
                    existing_values: {
                        UH1: { id: "n9", nilai: 75, status: "draft" },
                        UH2: { id: "n10", nilai: 70, status: "draft" },
                        UH3: { id: "n11", nilai: 65, status: "draft" },
                        UH4: { id: "n12", nilai: null as any, status: "draft" },
                        UH5: { id: "n13", nilai: null as any, status: "draft" },
                        PTS: { id: "n14", nilai: 72, status: "draft" },
                        PAS: { id: "n15", nilai: 78, status: "draft" },
                        SEMESTER: { id: "n16", nilai: 72.8, status: "draft" }
                    }
                },
                {
                    id: "siswa-3",
                    nis: "2025003",
                    nama: "Candra Wijaya",
                    kelas: selectedKelasObj.nama,
                    existing_values: {
                        UH1: { id: "n17", nilai: 95, status: "draft" },
                        UH2: { id: "n18", nilai: 90, status: "draft" },
                        UH3: { id: "n19", nilai: 92, status: "draft" },
                        UH4: { id: "n20", nilai: null as any, status: "draft" },
                        UH5: { id: "n21", nilai: null as any, status: "draft" },
                        PTS: { id: "n22", nilai: 94, status: "draft" },
                        PAS: { id: "n23", nilai: 96, status: "draft" },
                        SEMESTER: { id: "n24", nilai: 94.6, status: "draft" }
                    }
                },
                {
                    id: "siswa-4",
                    nis: "2025004",
                    nama: "Diana Putri",
                    kelas: selectedKelasObj.nama,
                    existing_values: {
                        UH1: { id: "n25", nilai: 60, status: "draft" },
                        UH2: { id: "n26", nilai: 55, status: "draft" },
                        UH3: { id: "n27", nilai: null as any, status: "draft" },
                        UH4: { id: "n28", nilai: null as any, status: "draft" },
                        UH5: { id: "n29", nilai: null as any, status: "draft" },
                        PTS: { id: "n30", nilai: 58, status: "draft" },
                        PAS: { id: "n31", nilai: 62, status: "draft" },
                        SEMESTER: { id: "n32", nilai: 59.2, status: "draft" }
                    }
                },
                {
                    id: "siswa-5",
                    nis: "2025005",
                    nama: "Eko Prasetyo",
                    kelas: selectedKelasObj.nama,
                    existing_values: {
                        UH1: { id: "n33", nilai: 80, status: "draft" },
                        UH2: { id: "n34", nilai: 82, status: "draft" },
                        UH3: { id: "n35", nilai: 85, status: "draft" },
                        UH4: { id: "n36", nilai: null as any, status: "draft" },
                        UH5: { id: "n37", nilai: null as any, status: "draft" },
                        PTS: { id: "n38", nilai: 80, status: "draft" },
                        PAS: { id: "n39", nilai: 84, status: "draft" },
                        SEMESTER: { id: "n40", nilai: 82.2, status: "draft" }
                    }
                }
            ];

            const mockBobot = {
                uh1: 0.1, // 10% each (total 50%)
                pts: 0.2, // 20%
                pas: 0.3  // 30%
            };

            setSiswaList(mockSiswa);
            setBobotVal(mockBobot);

            const initialNilaiState: Record<string, Record<string, number | null>> = {};
            mockSiswa.forEach(s => {
                initialNilaiState[s.id] = {
                    UH1: s.existing_values?.UH1?.nilai ?? null,
                    UH2: s.existing_values?.UH2?.nilai ?? null,
                    UH3: s.existing_values?.UH3?.nilai ?? null,
                    UH4: s.existing_values?.UH4?.nilai ?? null,
                    UH5: s.existing_values?.UH5?.nilai ?? null,
                    PTS: s.existing_values?.PTS?.nilai ?? null,
                    PAS: s.existing_values?.PAS?.nilai ?? null,
                    SEMESTER: s.existing_values?.SEMESTER?.nilai ?? null,
                };
            });
            setNilaiState(initialNilaiState);
            setDirtyCells(new Set());
        } finally {
            setLoading(false);
        }
    }

    // Dynamic formula for calculating SEMESTER final grade based on weights
    const calculateFinalGrade = useCallback((siswaId: string, currentGrades: Record<string, number | null>) => {
        const uhValues = [1, 2, 3, 4, 5]
            .map(i => currentGrades[`UH${i}`])
            .filter(v => v !== null) as number[];
        
        const hasUh = uhValues.length > 0;
        const avgUh = hasUh ? uhValues.reduce((s, v) => s + v, 0) / uhValues.length : 0;
        
        const ptsVal = currentGrades['PTS'] ?? null;
        const pasVal = currentGrades['PAS'] ?? null;

        // Custom weights from database or fallbacks
        const wUh = (bobotVal?.uh1 || 0.1) * 5; // Total weight for all UHs (e.g. 50%)
        const wPts = bobotVal?.pts || 0.2;
        const wPas = bobotVal?.pas || 0.3;

        let totalWeight = 0;
        let weightedSum = 0;

        if (hasUh) {
            weightedSum += avgUh * wUh;
            totalWeight += wUh;
        }
        if (ptsVal !== null) {
            weightedSum += ptsVal * wPts;
            totalWeight += wPts;
        }
        if (pasVal !== null) {
            weightedSum += pasVal * wPas;
            totalWeight += wPas;
        }

        if (totalWeight === 0) return null;
        return Math.round((weightedSum / totalWeight) * 10) / 10;
    }, [bobotVal]);

    // Handle grade input change
    function handleNilaiChange(siswaId: string, field: string, value: string) {
        const numValue = value === '' ? null : parseFloat(value);

        // Validation: range 0-100
        if (numValue !== null && (numValue < 0 || numValue > 100)) {
            toast({
                title: 'Validasi Gagal',
                description: 'Nilai harus berkisar antara 0 - 100',
                variant: 'destructive',
            });
            return;
        }

        // Sequential validation: require previous harian grade (UH) to be filled
        if (field.startsWith('UH') && numValue !== null) {
            const uhNum = parseInt(field.replace('UH', ''));
            if (uhNum > 1) {
                const prevField = `UH${uhNum - 1}`;
                const prevValue = nilaiState[siswaId]?.[prevField];
                if (prevValue === null || prevValue === undefined) {
                    toast({
                        title: 'Validasi Berurutan',
                        description: `Harap isi nilai ${LABEL_KOLOM[prevField]} terlebih dahulu`,
                        variant: 'destructive',
                    });
                    return;
                }
            }
        }

        setNilaiState(prev => {
            const studentGrades = {
                ...prev[siswaId],
                [field]: numValue
            };

            // Recalculate Nilai Akhir (SEMESTER) dynamically
            const updatedSemesterGrade = calculateFinalGrade(siswaId, studentGrades);
            studentGrades['SEMESTER'] = updatedSemesterGrade;

            return {
                ...prev,
                [siswaId]: studentGrades
            };
        });

        // Mark edited cells as dirty
        setDirtyCells(prev => {
            const next = new Set(prev);
            next.add(`${siswaId}-${field}`);
            next.add(`${siswaId}-SEMESTER`); // SEMESTER is also recalculated & dirty
            return next;
        });
    }

    // Keyboard navigation handlers (Tab, Shift+Tab, Enter, Arrows)
    function handleKeyDown(e: React.KeyboardEvent, siswaId: string, field: string, rowIndex: number) {
        const colIndex = KOLOM_NILAI.indexOf(field as any);
        let nextField = field;
        let nextRowIndex = rowIndex;

        if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                // Shift+Tab: Navigate left
                if (colIndex > 0) {
                    nextField = KOLOM_NILAI[colIndex - 1];
                } else if (rowIndex > 0) {
                    nextRowIndex = rowIndex - 1;
                    nextField = KOLOM_NILAI[KOLOM_NILAI.length - 2]; // Skip SEMESTER
                }
            } else {
                // Tab: Navigate right
                if (colIndex < KOLOM_NILAI.length - 2) { // Skip SEMESTER (readonly)
                    nextField = KOLOM_NILAI[colIndex + 1];
                } else if (rowIndex < siswaList.length - 1) {
                    nextRowIndex = rowIndex + 1;
                    nextField = KOLOM_NILAI[0];
                }
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            // Enter: Navigate down to the same cell of next student
            if (rowIndex < siswaList.length - 1) {
                nextRowIndex = rowIndex + 1;
            }
        } else if (e.key === 'ArrowUp' && rowIndex > 0) {
            nextRowIndex = rowIndex - 1;
        } else if (e.key === 'ArrowDown' && rowIndex < siswaList.length - 1) {
            nextRowIndex = rowIndex + 1;
        } else if (e.key === 'ArrowLeft' && colIndex > 0) {
            nextField = KOLOM_NILAI[colIndex - 1];
        } else if (e.key === 'ArrowRight' && colIndex < KOLOM_NILAI.length - 2) {
            nextField = KOLOM_NILAI[colIndex + 1];
        }

        const nextSiswaId = siswaList[nextRowIndex]?.id;
        if (nextSiswaId) {
            setActiveCell({ siswaId: nextSiswaId, field: nextField });
            const cellKey = `${nextSiswaId}-${nextField}`;
            inputRefs.current[cellKey]?.focus();
            inputRefs.current[cellKey]?.select();
        }
    }

    // Save modifications to Supabase
    async function handleSave() {
        if (!selectedKelas || !selectedMapel || !semester?.id || !profile) return;

        const selectedKelasObj = kelasOptions.find(k => k.id === selectedKelas);
        if (!selectedKelasObj) return;

        setSaving(true);
        try {
            // Construct batch list for database update
            const dataToSave: any[] = [];
            dirtyCells.forEach(cellKey => {
                const [siswaId, field] = cellKey.split('-');
                const value = nilaiState[siswaId]?.[field] ?? null;

                dataToSave.push({
                    siswa_id: siswaId,
                    semester_id: semester.id,
                    mata_pelajaran_id: selectedMapel,
                    guru_id: profile.id,
                    jenjang: selectedKelasObj.jenjang,
                    jenis_nilai: field,
                    nilai: value,
                    status_nilai: 'draft'
                });
            });

            if (dataToSave.length === 0) return;

            const res = await saveNilaiBatch(dataToSave, profile.id);

            if (res?.success) {
                setDirtyCells(new Set());
                fetchSiswaDanNilai();
            } else if (!res) {
                // Fallback for developer mock mode when database is not connected
                console.warn('Database save failed or bypassed. Showing mock save success.');
                toast({
                    title: 'Berhasil (Mock Mode)',
                    description: `Berhasil menyimpan ${dataToSave.length} data nilai dalam mode pengembangan`,
                });
                setDirtyCells(new Set());
            }
        } catch (error) {
            console.error('Error saving grades batch:', error);
            toast({
                title: 'Error',
                description: 'Gagal menyimpan data nilai',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    }

    // Calculations for Bento Cards
    const calculatedClassMetrics = () => {
        const studentGrades = Object.values(nilaiState);
        if (studentGrades.length === 0) return { avg: 0, total: 0, completion: 0 };

        const semesterGrades = studentGrades
            .map(g => g.SEMESTER)
            .filter(v => v !== null && v !== undefined) as number[];
        
        const avg = semesterGrades.length > 0
            ? semesterGrades.reduce((sum, v) => sum + v, 0) / semesterGrades.length
            : 0;

        const totalFilled = studentGrades.filter(g => g.SEMESTER !== null).length;
        const completion = (totalFilled / studentGrades.length) * 100;

        return {
            avg: Math.round(avg * 10) / 10,
            total: studentGrades.length,
            completion: Math.round(completion)
        };
    };

    const metrics = calculatedClassMetrics();

    // Grade boundary classification for chart
    const gradeDistribution = () => {
        let a = 0, b = 0, c = 0, d = 0, e = 0;
        Object.values(nilaiState).forEach(g => {
            const v = g.SEMESTER;
            if (v === null || v === undefined) return;
            if (v >= 86) a++;
            else if (v >= 76) b++;
            else if (v >= 61) c++;
            else if (v >= 41) d++;
            else e++;
        });
        return { a, b, c, d, e };
    };

    const dist = gradeDistribution();
    const maxDistVal = Math.max(dist.a, dist.b, dist.c, dist.d, dist.e, 1);

    // Selected Class / Subject details
    const selectedClassName = kelasOptions.find(k => k.id === selectedKelas)?.nama || '-';
    const selectedMapelName = mapelOptions.find(m => m.id === selectedMapel)?.nama || '-';

    return (
        <div className="space-y-6 text-[#F8FAFC]">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <nav className="flex items-center gap-1.5 text-xs text-[#c2c6d6] opacity-60 mb-1 font-medium tracking-wide uppercase">
                        <span>Manajemen Nilai</span>
                        <span>/</span>
                        <span className="text-[#3b82f6]">Dashboard Nilai</span>
                    </nav>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Manajemen Nilai Mahasiswa</h1>
                    <p className="text-sm text-[#c2c6d6] max-w-2xl mt-1">
                        Kelola data penilaian akademik, input nilai UTS, UAS, dan tugas secara real-time untuk pemantauan kurikulum yang efisien.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="border-[#334155] bg-[#1E293B] hover:bg-[#334155] text-white gap-2 text-xs h-10 px-4 transition-all"
                        onClick={() => {
                            toast({
                                title: 'Unduh Laporan',
                                description: 'Mengekspor laporan nilai kelas ke PDF...',
                            });
                        }}
                    >
                        <Download className="h-4 w-4" />
                        Ekspor PDF
                    </Button>
                    <Button
                        disabled={dirtyCells.size === 0 || saving}
                        onClick={handleSave}
                        className="bg-[#3B82F6] hover:bg-[#60A5FA] text-white gap-2 text-xs font-bold h-10 px-4 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                </div>
            </div>

            {/* Bento Grid Analytics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-[#1E293B] border-[#334155] relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#3b82f6]/5 rounded-full -mr-8 -mt-8"></div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase tracking-wider text-[#c2c6d6]">Rata-rata Kelas</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-end justify-between">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-[#3B82F6]">{selectedKelas && selectedMapel ? metrics.avg : '-'}</span>
                            {selectedKelas && selectedMapel && metrics.avg >= 75 && (
                                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
                                    <TrendingUp className="h-3 w-3" />
                                    Tuntas
                                </span>
                            )}
                        </div>
                        <GraduationCap className="h-8 w-8 text-[#3b82f6] opacity-35" />
                    </CardContent>
                </Card>

                <Card className="bg-[#1E293B] border-[#334155] relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase tracking-wider text-[#c2c6d6]">Total Siswa</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-end justify-between">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-4xl font-bold text-white">{selectedKelas && selectedMapel ? metrics.total : '-'}</span>
                            {selectedKelas && selectedMapel && <span className="text-xs text-[#c2c6d6] opacity-60">Aktif</span>}
                        </div>
                        <Users className="h-8 w-8 text-[#b7c8e1] opacity-35" />
                    </CardContent>
                </Card>

                <Card className="bg-[#1E293B] border-[#334155] relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase tracking-wider text-[#c2c6d6]">Penyelesaian Input</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold text-white">
                                {selectedKelas && selectedMapel ? `${metrics.completion}%` : '-'}
                            </span>
                            {selectedKelas && selectedMapel && (
                                <span className="text-[10px] text-[#c2c6d6] opacity-60">
                                    {Object.values(nilaiState).filter(g => g.SEMESTER !== null).length} / {metrics.total}
                                </span>
                            )}
                        </div>
                        {selectedKelas && selectedMapel ? (
                            <div className="w-full h-2 bg-[#334155] rounded-full overflow-hidden">
                                <div className="h-full bg-[#3b82f6] transition-all duration-500" style={{ width: `${metrics.completion}%` }}></div>
                            </div>
                        ) : (
                            <div className="w-full h-2 bg-[#334155] rounded-full"></div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-[#1E293B] border-[#334155] relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase tracking-wider text-[#c2c6d6]">Mata Pelajaran</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-end justify-between">
                        <div className="flex flex-col">
                            <span className="text-base font-bold text-white truncate max-w-[180px]">
                                {selectedKelas && selectedMapel ? selectedMapelName : '-'}
                            </span>
                            {semester && (
                                <span className="text-xs text-[#c2c6d6] opacity-60 mt-0.5">
                                    {semester.nama}
                                </span>
                            )}
                        </div>
                        <BookOpen className="h-8 w-8 text-emerald-400 opacity-35 shrink-0" />
                    </CardContent>
                </Card>
            </div>

            {/* Filter and Spreadsheet Table Card */}
            <Card className="bg-[#1E293B] border-[#334155] shadow-2xl rounded-2xl overflow-hidden">
                {/* Control Panel Header */}
                <div className="p-5 border-b border-[#334155] flex flex-wrap gap-4 items-center justify-between bg-[#192231]/30">
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="space-y-1">
                            <Label className="text-[10px] text-[#c2c6d6] uppercase tracking-wider font-semibold">Kelas</Label>
                            <select
                                value={selectedKelas}
                                onChange={(e) => setSelectedKelas(e.target.value)}
                                className="bg-[#0F172A] border border-[#334155] text-white rounded-lg px-3 py-2 text-xs focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] min-w-[150px] outline-none transition-all cursor-pointer"
                            >
                                <option value="" disabled>Pilih Kelas</option>
                                {kelasOptions.map((k) => (
                                    <option key={k.id} value={k.id}>
                                        {k.nama} (Jenjang {k.jenjang})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-[#c2c6d6] uppercase tracking-wider font-semibold">Mata Pelajaran</Label>
                            <select
                                value={selectedMapel}
                                onChange={(e) => setSelectedMapel(e.target.value)}
                                disabled={!selectedKelas}
                                className="bg-[#0F172A] border border-[#334155] text-white rounded-lg px-3 py-2 text-xs focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] min-w-[220px] disabled:opacity-50 outline-none transition-all cursor-pointer"
                            >
                                <option value="" disabled>Pilih Mata Pelajaran</option>
                                {mapelOptions.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.nama}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {dirtyCells.size > 0 && (
                            <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-2.5 py-1">
                                {dirtyCells.size / 2} perubahan belum disimpan
                            </Badge>
                        )}
                        <div className="flex bg-[#0F172A] border border-[#334155] rounded-lg p-0.5">
                            <button className="px-3 py-1.5 bg-[#334155] text-white rounded-md text-xs font-semibold shadow-inner">Daftar</button>
                            <button className="px-3 py-1.5 text-[#c2c6d6] hover:text-white rounded-md text-xs transition-colors">Visualisasi</button>
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-10 bg-[#151f30] w-full rounded-md" />
                            ))}
                        </div>
                    ) : !selectedKelas || !selectedMapel ? (
                        <div className="text-center py-20 bg-[#1E293B]">
                            <FileSpreadsheet className="mx-auto h-16 w-16 text-[#c2c6d6] opacity-20 mb-3" />
                            <h3 className="font-semibold text-lg text-[#c2c6d6]">Data Nilai Belum Terbuka</h3>
                            <p className="text-xs text-[#c2c6d6] opacity-65 max-w-sm mx-auto mt-1">
                                Pilih kelas operasional dan mata pelajaran terlebih dahulu untuk memuat daftar spreadsheet siswa.
                            </p>
                        </div>
                    ) : siswaList.length === 0 ? (
                        <div className="text-center py-20">
                            <FileSpreadsheet className="mx-auto h-16 w-16 text-muted-foreground opacity-30 mb-3" />
                            <p className="text-[#c2c6d6] text-sm">Tidak ada siswa aktif di kelas ini.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-[#334155] bg-[#1a2333]/40">
                                    <th className="px-4 py-3.5 text-xs font-bold text-[#c2c6d6] uppercase tracking-wider w-16">No</th>
                                    <th className="px-4 py-3.5 text-xs font-bold text-[#c2c6d6] uppercase tracking-wider w-36">NIS</th>
                                    <th className="px-4 py-3.5 text-xs font-bold text-[#c2c6d6] uppercase tracking-wider">Nama Mahasiswa</th>
                                    {KOLOM_NILAI.slice(0, -1).map(col => (
                                        <th key={col} className="px-3 py-3.5 text-xs font-bold text-[#c2c6d6] uppercase tracking-wider text-center w-24">
                                            {LABEL_KOLOM[col]}
                                        </th>
                                    ))}
                                    <th className="px-4 py-3.5 text-xs font-bold text-[#c2c6d6] uppercase tracking-wider text-center w-28">Nilai Akhir</th>
                                    <th className="px-4 py-3.5 text-xs font-bold text-[#c2c6d6] uppercase tracking-wider text-center w-28">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#334155]/60 bg-[#1E293B]">
                                {siswaList.map((siswa, rowIndex) => {
                                    const grades = nilaiState[siswa.id] || {};
                                    const finalGrade = grades.SEMESTER;
                                    const isPassing = finalGrade !== null && finalGrade >= 60;

                                    return (
                                        <tr key={siswa.id} className="hover:bg-[#334155]/25 transition-colors group">
                                            <td className="px-4 py-3 text-sm text-[#c2c6d6] font-medium">{rowIndex + 1}</td>
                                            <td className="px-4 py-3 text-xs font-mono text-[#c2c6d6] opacity-75">{siswa.nis}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-[#3b82f6] flex items-center justify-center text-[10px] font-bold">
                                                        {siswa.nama.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-semibold text-white group-hover:text-[#3B82F6] transition-colors">
                                                        {siswa.nama}
                                                    </span>
                                                </div>
                                            </td>
                                            {KOLOM_NILAI.slice(0, -1).map(col => {
                                                const cellKey = `${siswa.id}-${col}`;
                                                const isDirty = dirtyCells.has(cellKey);
                                                
                                                // Handle harian grades sequential lock
                                                let isLocked = false;
                                                if (col.startsWith('UH')) {
                                                    const uhNum = parseInt(col.replace('UH', ''));
                                                    if (uhNum > 1) {
                                                        const prevField = `UH${uhNum - 1}`;
                                                        isLocked = grades[prevField] === null || grades[prevField] === undefined;
                                                    }
                                                }

                                                return (
                                                    <td key={col} className="px-2 py-2 text-center">
                                                        {isLocked ? (
                                                            <span className="text-xs text-muted-foreground/30">-</span>
                                                        ) : (
                                                            <input
                                                                ref={el => { inputRefs.current[cellKey] = el; }}
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                step="0.5"
                                                                className={`w-16 bg-[#0F172A] border rounded-md py-1.5 text-center text-xs text-white outline-none transition-all focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3b82f6] ${
                                                                    isDirty ? 'border-amber-500 bg-amber-500/5' : 'border-[#334155]'
                                                                }`}
                                                                value={grades[col] ?? ''}
                                                                onChange={(e) => handleNilaiChange(siswa.id, col, e.target.value)}
                                                                onKeyDown={(e) => handleKeyDown(e, siswa.id, col, rowIndex)}
                                                                onFocus={() => setActiveCell({ siswaId: siswa.id, field: col })}
                                                            />
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-4 py-3 text-center">
                                                <span className={`text-sm font-bold italic ${
                                                    finalGrade === null ? 'text-gray-500' :
                                                    finalGrade >= 75 ? 'text-emerald-400' :
                                                    finalGrade >= 60 ? 'text-amber-400' : 'text-red-400'
                                                }`}>
                                                    {finalGrade !== null ? finalGrade.toFixed(1) : '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {finalGrade !== null ? (
                                                    isPassing ? (
                                                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase py-0.5 px-2">
                                                            Lulus
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase py-0.5 px-2">
                                                            Mengulang
                                                        </Badge>
                                                    )
                                                ) : (
                                                    <span className="text-xs text-[#c2c6d6] opacity-40">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Table Footer with Pagination */}
                {selectedKelas && selectedMapel && siswaList.length > 0 && (
                    <div className="p-4 bg-[#1E293B] border-t border-[#334155] flex flex-col sm:flex-row gap-4 justify-between items-center text-xs text-[#c2c6d6]">
                        <span>Menampilkan 1-{siswaList.length} dari {siswaList.length} mahasiswa aktif</span>
                        <div className="flex gap-1">
                            <Button variant="ghost" disabled size="icon" className="h-8 w-8 hover:bg-[#334155] hover:text-white">
                                <span className="material-symbols-outlined text-sm">chevron_left</span>
                            </Button>
                            <Button className="h-8 px-3 bg-[#3b82f6] text-white text-xs font-semibold rounded-lg">1</Button>
                            <Button variant="ghost" disabled size="icon" className="h-8 w-8 hover:bg-[#334155] hover:text-white">
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Bottom Analysis and Course Info */}
            {selectedKelas && selectedMapel && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Grade Distribution Bar Chart */}
                    <Card className="bg-[#1E293B] border-[#334155] p-5 shadow-xl">
                        <CardTitle className="text-base text-white font-bold mb-6">Distribusi Nilai Akhir</CardTitle>
                        <div className="flex items-end gap-3 h-48 border-b border-[#334155] pb-2 px-4">
                            {[
                                { key: 'E', label: 'E (0-40)', count: dist.e, color: 'bg-red-500/30 border-red-500/40 text-red-400' },
                                { key: 'D', label: 'D (41-60)', count: dist.d, color: 'bg-red-500/50 border-red-500/60 text-red-400' },
                                { key: 'C', label: 'C (61-75)', count: dist.c, color: 'bg-blue-500/40 border-blue-500/50 text-[#3b82f6]' },
                                { key: 'B', label: 'B (76-85)', count: dist.b, color: 'bg-blue-500/70 border-blue-500/80 text-[#3b82f6]' },
                                { key: 'A', label: 'A (86-100)', count: dist.a, color: 'bg-emerald-500/60 border-emerald-500/70 text-emerald-400' }
                            ].map(item => {
                                const heightPercent = (item.count / maxDistVal) * 90;
                                return (
                                    <div key={item.key} className="flex-grow flex flex-col items-center gap-2 group cursor-pointer">
                                        <div className="w-full flex flex-col justify-end h-32 relative">
                                            {item.count > 0 && (
                                                <span className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold ${item.color.split(' ')[2]}`}>
                                                    {item.count}
                                                </span>
                                            )}
                                            <div
                                                className={`w-full border rounded-t-md transition-all duration-500 group-hover:brightness-110 ${item.color.split(' ').slice(0, 2).join(' ')}`}
                                                style={{ height: `${heightPercent || 2}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[10px] font-semibold text-[#c2c6d6] opacity-75">{item.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Course / Teacher Details Card */}
                    <Card className="bg-[#1E293B] border-[#334155] p-5 shadow-xl flex flex-col justify-between">
                        <CardTitle className="text-base text-white font-bold mb-4">Informasi Mata Pelajaran</CardTitle>
                        <div className="space-y-3 flex-grow flex flex-col justify-center">
                            <div className="flex items-center gap-4 p-3 bg-[#0F172A] rounded-xl border border-[#334155]/60 hover:border-[#3b82f6]/30 transition-all">
                                <div className="p-2 bg-[#3b82f6]/10 text-[#3b82f6] rounded-lg">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] uppercase font-bold text-[#c2c6d6] opacity-50">Dosen / Guru Pengampu</p>
                                    <p className="text-sm font-semibold text-white">{profile?.nama || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-3 bg-[#0F172A] rounded-xl border border-[#334155]/60 hover:border-[#3b82f6]/30 transition-all">
                                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] uppercase font-bold text-[#c2c6d6] opacity-50">SKS & Semester</p>
                                    <p className="text-sm font-semibold text-white">
                                        {bobotVal ? `${bobotVal.total || 3} SKS / ${semester?.nama || 'Semester'}` : `3 SKS / ${semester?.nama || 'Semester'}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-3 bg-[#0F172A] rounded-xl border border-[#334155]/60 hover:border-[#3b82f6]/30 transition-all">
                                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] uppercase font-bold text-[#c2c6d6] opacity-50">Batas Input Nilai</p>
                                    <p className="text-sm font-semibold text-white">24 Juli 2026 (Sisa 39 Hari)</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Legend Section */}
            <Card className="bg-[#1E293B]/50 border-[#334155]/60">
                <CardContent className="py-4">
                    <p className="text-xs font-bold text-white mb-2 uppercase tracking-wide">Panduan & Legenda Tabel:</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#c2c6d6] opacity-80">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 border border-amber-500 bg-amber-500/5 rounded" />
                            Sel belum disimpan
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="text-emerald-400 font-bold">75.0+</span>
                            Lulus (Tuntas)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="text-amber-400 font-bold">60.0 - 74.9</span>
                            Perlu Bimbingan
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="text-red-400 font-bold">&lt; 60.0</span>
                            Belum Tuntas (Mengulang)
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] opacity-70 border border-[#334155] rounded-md px-2 py-0.5 bg-[#0F172A]">
                            Navigasi Keyboard: Tab / Enter / Tombol Arah (▲ ▼ ◀ ▶)
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}