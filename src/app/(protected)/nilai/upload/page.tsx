'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth, useActiveSemester } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileSpreadsheet, AlertCircle, Check, X, Download, RefreshCw, Info } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import * as XLSX from 'xlsx';

// Types
interface UploadError {
    row: number;
    nis: string;
    field: string;
    value: string;
    message: string;
}

interface ParsedNilai {
    row: number;
    nis: string;
    nama: string;
    uh1: number | null;
    uh2: number | null;
    uh3: number | null;
    uh4: number | null;
    uh5: number | null;
    pts: number | null;
    semester: number | null;
}

interface PreviewNilai {
    nis: string;
    nama: string;
    uh1: number | null;
    uh2: number | null;
    uh3: number | null;
    uh4: number | null;
    uh5: number | null;
    pts: number | null;
    semester: number | null;
    rapor: number | null;
    hasConflict: boolean;
    conflictField?: string;
    oldValue?: number | null;
    newValue?: number | null;
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

// Bobot untuk kalkulasi RAPOR
const BOBOT = {
    uh: 0.5,  // Total UH (avg * 5 components * 0.1 each = 0.5)
    pts: 0.2,
    semester: 0.3,
};

/**
 * Halaman Upload Nilai Excel
 * 
 * Fitur:
 * - Generate template Excel dengan metadata tersembunyi
 * - Validasi metadata (semester_id, kelas_id, mapel_id)
 * - Validasi isi (format angka, range 0-100)
 * - Preview perubahan sebelum disimpan
 * - Batch upsert ke database
 * 
 * Akses: Guru
 */
export default function UploadNilaiPage() {
    const { profile } = useAuth();
    const { semester } = useActiveSemester();
    const { toast } = useToast();
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
    const [mapelOptions, setMapelOptions] = useState<MapelOption[]>([]);
    const [selectedKelas, setSelectedKelas] = useState<string>('');
    const [selectedMapel, setSelectedMapel] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedNilai[]>([]);
    const [previewData, setPreviewData] = useState<PreviewNilai[]>([]);
    const [errors, setErrors] = useState<UploadError[]>([]);
    const [existingNilai, setExistingNilai] = useState<Record<string, Record<string, number | null>>>({});
    const [step, setStep] = useState<'upload' | 'preview' | 'confirm'>('upload');

    // Ambil daftar kelas & mapel
    useEffect(() => {
        if (semester?.id && profile?.role === 'guru') {
            fetchOptions();
        }
    }, [semester, profile]);

    async function fetchOptions() {
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
            console.error('Error fetching options:', error);
        } finally {
            setLoading(false);
        }
    }

    // Generate template Excel
    function generateTemplate() {
        if (!selectedKelas || !selectedMapel || !semester) {
            toast({
                title: 'Validasi',
                description: 'Pilih kelas dan mata pelajaran terlebih dahulu',
                variant: 'destructive',
            });
            return;
        }

        const wb = XLSX.utils.book_new();

        // Sheet metadata (hidden)
        const metaWs = XLSX.utils.aoa_to_sheet([
            ['_meta_semester_id', semester.id],
            ['_meta_kelas_real_id', selectedKelas],
            ['_meta_mapel_id', selectedMapel],
        ]);
        // Hide the metadata sheet
        wb.SheetNames = ['Metadata', 'Template'];
        wb.Sheets['Metadata'] = metaWs;

        // Template sheet
        const templateData = [
            ['NIS', 'Nama', 'UH1', 'UH2', 'UH3', 'UH4', 'UH5', 'PTS', 'Semester'],
            // Sample rows
            ['', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', ''],
        ];
        const templateWs = XLSX.utils.aoa_to_sheet(templateData);
        wb.Sheets['Template'] = templateWs;

        // Generate file
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `Template_Nilai_${semester.nama.replace(' ', '_')}.xlsx`;
        a.click();

        URL.revokeObjectURL(url);
        toast({ title: 'Berhasil', description: 'Template berhasil diunduh' });
    }

    // Parse Excel file
    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
            toast({
                title: 'Error',
                description: 'File harus format Excel (.xlsx atau .xls)',
                variant: 'destructive',
            });
            return;
        }

        setFile(selectedFile);
        setErrors([]);
        setParsedData([]);
        setPreviewData([]);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                // Baca metadata dari sheet pertama
                const metaSheet = workbook.Sheets['Metadata'];
                let fileSemesterId = '';
                let fileKelasId = '';
                let fileMapelId = '';

                if (metaSheet) {
                    fileSemesterId = metaSheet['A2']?.v || '';
                    fileKelasId = metaSheet['B2']?.v || '';
                    fileMapelId = metaSheet['C2']?.v || '';
                }

                // Validasi metadata
                if (!semester || !selectedKelas || !selectedMapel) {
                    toast({
                        title: 'Error',
                        description: 'Pilih semester, kelas, dan mapel terlebih dahulu',
                        variant: 'destructive',
                    });
                    return;
                }

                if (fileSemesterId && fileSemesterId !== semester.id) {
                    toast({
                        title: 'Metadata Salah',
                        description: `File ini untuk semester lain. Semester aktif: ${semester.nama}`,
                        variant: 'destructive',
                    });
                    return;
                }

                if (fileKelasId && fileKelasId !== selectedKelas) {
                    toast({
                        title: 'Metadata Salah',
                        description: 'File ini untuk kelas lain. Pilih kelas yang sesuai.',
                        variant: 'destructive',
                    });
                    return;
                }

                if (fileMapelId && fileMapelId !== selectedMapel) {
                    toast({
                        title: 'Metadata Salah',
                        description: 'File ini untuk mapel lain. Pilih mapel yang sesuai.',
                        variant: 'destructive',
                    });
                    return;
                }

                // Parse data dari sheet Template
                const templateSheet = workbook.Sheets['Template'];
                if (!templateSheet) {
                    toast({
                        title: 'Error',
                        description: 'Sheet "Template" tidak ditemukan',
                        variant: 'destructive',
                    });
                    return;
                }

                const jsonData = XLSX.utils.sheet_to_json<ParsedNilai>(templateSheet, {
                    header: ['nis', 'nama', 'uh1', 'uh2', 'uh3', 'uh4', 'uh5', 'pts', 'semester'],
                    range: 1, // Skip header row
                }) as any[];

                // Validate and parse data
                const parsed: ParsedNilai[] = [];
                const validationErrors: UploadError[] = [];
                let rowNum = 2; // Start from row 2 (after header)

                for (const row of jsonData) {
                    // Skip empty rows
                    if (!row.nis && !row.nama) continue;

                    const nilai: ParsedNilai = {
                        row: rowNum,
                        nis: String(row.nis || '').trim(),
                        nama: String(row.nama || '').trim(),
                        uh1: parseNumeric(row.uh1),
                        uh2: parseNumeric(row.uh2),
                        uh3: parseNumeric(row.uh3),
                        uh4: parseNumeric(row.uh4),
                        uh5: parseNumeric(row.uh5),
                        pts: parseNumeric(row.pts),
                        semester: parseNumeric(row.semester),
                    };

                    // Validate NIS
                    if (!nilai.nis) {
                        validationErrors.push({
                            row: rowNum,
                            nis: '',
                            field: 'nis',
                            value: String(row.nis || ''),
                            message: 'NIS harus diisi',
                        });
                    }

                    // Validate numeric fields
                    const numericFields = ['uh1', 'uh2', 'uh3', 'uh4', 'uh5', 'pts', 'semester'];
                    for (const field of numericFields) {
                        const val = nilai[field as keyof ParsedNilai] as number | null;
                        if (val !== null && (val < 0 || val > 100)) {
                            validationErrors.push({
                                row: rowNum,
                                nis: nilai.nis,
                                field,
                                value: String(val),
                                message: `Nilai ${field.toUpperCase()} harus antara 0-100`,
                            });
                        }
                    }

                    parsed.push(nilai);
                    rowNum++;
                }

                if (validationErrors.length > 0) {
                    setErrors(validationErrors);
                    toast({
                        title: 'Error Validasi',
                        description: `${validationErrors.length} error ditemukan. Perbaiki dan upload ulang.`,
                        variant: 'destructive',
                    });
                    return;
                }

                if (parsed.length === 0) {
                    toast({
                        title: 'Error',
                        description: 'Tidak ada data nilai di file',
                        variant: 'destructive',
                    });
                    return;
                }

                setParsedData(parsed);
                setStep('preview');

                // Fetch existing nilai for comparison
                await fetchExistingNilai(parsed);

            } catch (error) {
                console.error('Error parsing file:', error);
                toast({
                    title: 'Error',
                    description: 'Gagal membaca file Excel',
                    variant: 'destructive',
                });
            }
        };

        reader.readAsArrayBuffer(selectedFile);
    }

    function parseNumeric(value: any): number | null {
        if (value === null || value === undefined || value === '') return null;
        const num = Number(value);
        return isNaN(num) ? null : num;
    }

    async function fetchExistingNilai(parsed: ParsedNilai[]) {
        if (!semester?.id || !selectedMapel) return;

        try {
            // Get siswa by NIS
            const nisList = parsed.map(p => p.nis).filter(Boolean);
            const { data: siswaList } = await supabase
                .from('siswa')
                .select('id, nis')
                .in('nis', nisList);

            const siswaMap = new Map<string, string>();
            siswaList?.forEach((s: any) => siswaMap.set(s.nis, s.id));

            // Get existing nilai
            const siswaIds = Array.from(siswaMap.values());
            if (siswaIds.length === 0) return;

            const { data: existingData } = await supabase
                .from('nilai_mapel')
                .select('siswa_id, uh1, uh2, uh3, uh4, uh5, pts, semester')
                .eq('mapel_id', selectedMapel)
                .eq('semester_id', semester.id)
                .in('siswa_id', siswaIds);

            const existingMap: Record<string, Record<string, number | null>> = {};
            existingData?.forEach((n: any) => {
                const siswa = siswaList?.find((s: any) => s.id === n.siswa_id);
                if (siswa) {
                    existingMap[siswa.nis] = {
                        uh1: n.uh1,
                        uh2: n.uh2,
                        uh3: n.uh3,
                        uh4: n.uh4,
                        uh5: n.uh5,
                        pts: n.pts,
                        semester: n.semester,
                    };
                }
            });

            setExistingNilai(existingMap);
            generatePreview(parsed, existingMap);

        } catch (error) {
            console.error('Error fetching existing:', error);
        }
    }

    function generatePreview(parsed: ParsedNilai[], existing: Record<string, Record<string, number | null>>) {
        const preview: PreviewNilai[] = parsed.map(p => {
            const existingNilai = existing[p.nis] || {};
            const hasConflict = Object.keys(existingNilai).some(
                key => existingNilai[key] !== null && p[key as keyof ParsedNilai] !== null
            );

            // Calculate RAPOR
            const avgUh = [p.uh1, p.uh2, p.uh3, p.uh4, p.uh5]
                .filter(v => v !== null)
                .reduce((a, b) => a + (b || 0), 0) / 5;
            const rapor = p.uh1 !== null && p.pts !== null && p.semester !== null
                ? (avgUh * BOBOT.uh + (p.pts || 0) * BOBOT.pts + (p.semester || 0) * BOBOT.semester)
                : null;

            return {
                nis: p.nis,
                nama: p.nama,
                uh1: p.uh1,
                uh2: p.uh2,
                uh3: p.uh3,
                uh4: p.uh4,
                uh5: p.uh5,
                pts: p.pts,
                semester: p.semester,
                rapor,
                hasConflict,
                oldValue: undefined,
                newValue: undefined,
            };
        });

        setPreviewData(preview);
    }

    async function handleUpload() {
        if (!semester?.id || !selectedMapel) return;

        setUploading(true);
        try {
            // Get siswa by NIS
            const nisList = parsedData.map(p => p.nis);
            const { data: siswaList } = await supabase
                .from('siswa')
                .select('id, nis')
                .in('nis', nisList);

            const siswaMap = new Map<string, string>();
            siswaList?.forEach((s: any) => siswaMap.set(s.nis, s.id));

            // Prepare batch insert/update
            const toUpsert = parsedData
                .filter(p => siswaMap.has(p.nis))
                .map(p => ({
                    siswa_id: siswaMap.get(p.nis),
                    mapel_id: selectedMapel,
                    semester_id: semester.id,
                    uh1: p.uh1,
                    uh2: p.uh2,
                    uh3: p.uh3,
                    uh4: p.uh4,
                    uh5: p.uh5,
                    pts: p.pts,
                    semester: p.semester,
                    rapor: calculateRapor(p),
                }));

            if (toUpsert.length === 0) {
                toast({
                    title: 'Error',
                    description: 'Tidak ada data yang bisa disimpan',
                    variant: 'destructive',
                });
                return;
            }

            // Batch upsert
            const { error } = await supabase
                .from('nilai_mapel')
                .upsert(toUpsert, {
                    onConflict: 'siswa_id,mapel_id,semester_id',
                });

            if (error) throw error;

            toast({
                title: 'Berhasil',
                description: `${toUpsert.length} nilai berhasil diupload`,
            });

            // Reset
            setStep('upload');
            setFile(null);
            setParsedData([]);
            setPreviewData([]);
            setErrors([]);

        } catch (error) {
            console.error('Error uploading:', error);
            toast({
                title: 'Error',
                description: 'Gagal upload nilai',
                variant: 'destructive',
            });
        } finally {
            setUploading(false);
        }
    }

    function calculateRapor(p: ParsedNilai): number | null {
        if (p.uh1 === null || p.pts === null || p.semester === null) return null;

        const avgUh = [p.uh1, p.uh2, p.uh3, p.uh4, p.uh5]
            .filter(v => v !== null)
            .reduce((a, b) => a + (b || 0), 0) / 5;

        return Math.round((avgUh * BOBOT.uh + (p.pts || 0) * BOBOT.pts + (p.semester || 0) * BOBOT.semester) * 100) / 100;
    }

    const filteredMapel = mapelOptions.filter(m => m.kelas_real_id === selectedKelas);
    const conflictCount = previewData.filter(p => p.hasConflict).length;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Upload Nilai Excel</h1>
                <p className="text-muted-foreground">
                    Upload file Excel nilai dengan metadata validation
                </p>
            </div>

            {/* Step 1: Upload */}
            {step === 'upload' && (
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Filter */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pilih Data</CardTitle>
                            <CardDescription>Pilih kelas dan mata pelajaran</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={generateTemplate}
                                disabled={!selectedKelas || !selectedMapel}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download Template Excel
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Upload */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload File</CardTitle>
                            <CardDescription>
                                Upload file Excel yang sudah diisi.
                                <span className="block text-amber-600 mt-1">
                                    File harus memiliki metadata tersembunyi dari template.
                                </span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                className="hidden"
                                onChange={handleFileSelect}
                            />

                            <div
                                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {file ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <FileSpreadsheet className="h-8 w-8 text-green-600" />
                                        <div className="text-left">
                                            <p className="font-medium">{file.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                        <p className="font-medium">Klik untuk pilih file</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Format: .xlsx atau .xls
                                        </p>
                                    </>
                                )}
                            </div>

                            {errors.length > 0 && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error Validasi ({errors.length})</AlertTitle>
                                    <AlertDescription>
                                        <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                                            {errors.slice(0, 5).map((e, i) => (
                                                <li key={i}>Baris {e.row}: {e.message}</li>
                                            ))}
                                            {errors.length > 5 && (
                                                <li>...dan {errors.length - 5} error lainnya</li>
                                            )}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Step 2: Preview */}
            {step === 'preview' && (
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Preview Data</CardTitle>
                                    <CardDescription>
                                        {previewData.length} siswa • {conflictCount} konflik dengan data lama
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setStep('upload')}>
                                        Batal
                                    </Button>
                                    <Button onClick={handleUpload} disabled={uploading}>
                                        {uploading ? (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                Mengupload...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="mr-2 h-4 w-4" />
                                                Upload {previewData.length} Data
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-3 py-2 text-left">NIS</th>
                                            <th className="px-3 py-2 text-left">Nama</th>
                                            <th className="px-3 py-2 text-center">UH1</th>
                                            <th className="px-3 py-2 text-center">UH2</th>
                                            <th className="px-3 py-2 text-center">UH3</th>
                                            <th className="px-3 py-2 text-center">UH4</th>
                                            <th className="px-3 py-2 text-center">UH5</th>
                                            <th className="px-3 py-2 text-center">PTS</th>
                                            <th className="px-3 py-2 text-center">SEM</th>
                                            <th className="px-3 py-2 text-center">RAPOR</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.map((row, i) => (
                                            <tr key={i} className={`border-b ${row.hasConflict ? 'bg-yellow-50' : ''}`}>
                                                <td className="px-3 py-2 font-mono">{row.nis}</td>
                                                <td className="px-3 py-2">{row.nama}</td>
                                                <td className="px-3 py-2 text-center">{row.uh1 ?? '-'}</td>
                                                <td className="px-3 py-2 text-center">{row.uh2 ?? '-'}</td>
                                                <td className="px-3 py-2 text-center">{row.uh3 ?? '-'}</td>
                                                <td className="px-3 py-2 text-center">{row.uh4 ?? '-'}</td>
                                                <td className="px-3 py-2 text-center">{row.uh5 ?? '-'}</td>
                                                <td className="px-3 py-2 text-center">{row.pts ?? '-'}</td>
                                                <td className="px-3 py-2 text-center">{row.semester ?? '-'}</td>
                                                <td className={`px-3 py-2 text-center font-bold ${(row.rapor ?? 0) >= 75 ? 'text-green-600' :
                                                        (row.rapor ?? 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                                                    }`}>
                                                    {row.rapor?.toFixed(2) ?? '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {conflictCount > 0 && (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Konflik Data</AlertTitle>
                            <AlertDescription>
                                {conflictCount} siswa sudah memiliki nilai. Data lama akan ditimpa.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            )}

            {/* Info */}
            <Card className="bg-muted/50">
                <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium">Petunjuk:</p>
                            <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                                <li>Download template Excel terlebih dahulu</li>
                                <li>Isi data nilai sesuai format (NIS, Nama, UH1-UH5, PTS, Semester)</li>
                                <li>File template mengandung metadata tersembunyi (semester_id, kelas_id, mapel_id)</li>
                                <li>Nilai harus berupa angka antara 0-100</li>
                                <li>RAPOR akan dihitung otomatis saat upload</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}