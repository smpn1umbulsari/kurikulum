'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Download, Upload, FileSpreadsheet, AlertCircle, Check, Users, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import * as XLSX from 'xlsx';

// Types
interface SiswaImport {
    nis: string;
    nisn: string;
    nama: string;
    nik: string;
    jenis_kelamin: 'L' | 'P';
    tempat_lahir: string;
    tanggal_lahir: string;
    agama: string;
    alamat: string;
    nama_ortu: string;
}

interface ImportError {
    row: number;
    field: string;
    value: string;
    message: string;
}

interface PreviewSiswa {
    row: number;
    nis: string;
    nisn: string;
    nik: string;
    nama: string;
    tempat_lahir: string;
    jenis_kelamin: 'L' | 'P';
    status: 'valid' | 'warning' | 'error';
    errors: string[];
    existing?: boolean;
}

/**
 * Halaman Import/Export Siswa Excel
 * 
 * Fitur:
 * - Download template Excel
 * - Import siswa dari Excel dengan validasi
 * - Preview sebelum import
 * - Ekspor siswa ke Excel
 * 
 * Akses: Admin
 */
export default function ImportSiswaPage() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<PreviewSiswa[]>([]);
    const [errors, setErrors] = useState<ImportError[]>([]);
    const [step, setStep] = useState<'upload' | 'preview'>('upload');
    const [importStats, setImportStats] = useState<{ baru: number; update: number; error: number } | null>(null);

    // Download template
    function downloadTemplate() {
        const wb = XLSX.utils.book_new();

        // Sheet template
        const templateData = [
            ['NIS', 'NISN', 'Nama Lengkap', 'NIK', 'Jenis Kelamin (L/P)', 'Tempat Lahir', 'Tanggal Lahir (YYYY-MM-DD)', 'Agama', 'Alamat', 'Nama Orang Tua'],
            ['12345', '0012345678', 'Nama Siswa', '33010xxxxxxxxxx', 'L', 'Jakarta', '2010-01-15', 'Islam', 'Jl. Contoh No. 1', 'Bapak Contoh'],
        ];

        const ws = XLSX.utils.aoa_to_sheet(templateData);
        XLSX.utils.book_append_sheet(wb, ws, 'Template');

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'Template_Import_Siswa.xlsx';
        a.click();

        URL.revokeObjectURL(url);
        toast({ title: 'Berhasil', description: 'Template berhasil diunduh' });
    }

    // Handle file select
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
        setPreviewData([]);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];

                const jsonData = XLSX.utils.sheet_to_json<SiswaImport>(sheet, {
                    header: ['nis', 'nisn', 'nama', 'nik', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir', 'agama', 'alamat', 'nama_ortu'],
                    range: 1,
                }) as any[];

                // Validate data
                const preview: PreviewSiswa[] = [];
                const validationErrors: ImportError[] = [];
                let rowNum = 2;

                for (const row of jsonData) {
                    // Skip empty rows
                    if (!row.nis && !row.nama) {
                        rowNum++;
                        continue;
                    }

                    const rowErrors: string[] = [];
                    let status: 'valid' | 'warning' | 'error' = 'valid';

                    // Validate NIS (required, unique)
                    if (!row.nis) {
                        rowErrors.push('NIS wajib diisi');
                        status = 'error';
                    } else if (String(row.nis).length < 4) {
                        rowErrors.push('NIS minimal 4 digit');
                        status = 'warning';
                    }

                    // Validate Nama (required)
                    if (!row.nama) {
                        rowErrors.push('Nama wajib diisi');
                        status = 'error';
                    }

                    // Validate Jenis Kelamin
                    const jk = String(row.jenis_kelamin || '').toUpperCase();
                    if (jk && jk !== 'L' && jk !== 'P') {
                        rowErrors.push('Jenis Kelamin harus L atau P');
                        status = status === 'error' ? 'error' : 'warning';
                    }

                    // Validate Tanggal Lahir format
                    if (row.tanggal_lahir && !/^\d{4}-\d{2}-\d{2}$/.test(String(row.tanggal_lahir))) {
                        rowErrors.push('Format Tanggal Lahir harus YYYY-MM-DD');
                        status = status === 'error' ? 'error' : 'warning';
                    }

                    preview.push({
                        row: rowNum,
                        nis: String(row.nis || ''),
                        nisn: String(row.nisn || ''),
                        nik: String(row.nik || ''),
                        nama: String(row.nama || ''),
                        tempat_lahir: String(row.tempat_lahir || ''),
                        jenis_kelamin: (jk === 'L' || jk === 'P') ? jk as 'L' | 'P' : 'L',
                        status,
                        errors: rowErrors,
                    });

                    rowNum++;
                }

                if (preview.length === 0) {
                    toast({
                        title: 'Error',
                        description: 'Tidak ada data siswa di file',
                        variant: 'destructive',
                    });
                    return;
                }

                setPreviewData(preview);
                setStep('preview');

                // Check for existing NIS
                const nisList = preview.filter(p => p.nis).map(p => p.nis);
                if (nisList.length > 0) {
                    const { data: existing } = await supabase
                        .from('siswa')
                        .select('nis')
                        .in('nis', nisList);

                    const existingSet = new Set(existing?.map((s: any) => s.nis) || []);
                    setPreviewData(prev => prev.map(p => ({
                        ...p,
                        existing: existingSet.has(p.nis),
                        status: existingSet.has(p.nis) ? 'warning' : p.status,
                        errors: existingSet.has(p.nis)
                            ? ['NIS sudah ada (akan diupdate)'].concat(p.errors)
                            : p.errors,
                    })));
                }

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

    // Execute import
    async function handleImport() {
        const validData = previewData.filter(p => p.status !== 'error');
        if (validData.length === 0) {
            toast({
                title: 'Error',
                description: 'Tidak ada data valid untuk diimport',
                variant: 'destructive',
            });
            return;
        }

        setImporting(true);
        try {
            let baru = 0;
            let update = 0;
            let error = 0;

            for (const siswa of validData) {
                const siswaData = {
                    nis: siswa.nis,
                    nisn: siswa.nisn || null,
                    nama: siswa.nama,
                    nik: siswa.nik || null,
                    jenis_kelamin: siswa.jenis_kelamin,
                    tempat_lahir: siswa.tempat_lahir || null,
                    tanggal_lahir: null,
                    agama: 'Islam',
                    alamat: '',
                    nama_ortu: '',
                    status: 'aktif',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                const { error: err } = await supabase
                    .from('siswa')
                    .upsert(siswaData, { onConflict: 'nis' });

                if (err) {
                    error++;
                } else if (siswa.existing) {
                    update++;
                } else {
                    baru++;
                }
            }

            setImportStats({ baru, update, error });
            toast({
                title: 'Berhasil',
                description: `Import selesai: ${baru} baru, ${update} diupdate, ${error} error`,
            });

            // Reset
            setStep('upload');
            setFile(null);
            setPreviewData([]);

        } catch (error) {
            console.error('Error importing:', error);
            toast({
                title: 'Error',
                description: 'Gagal import data',
                variant: 'destructive',
            });
        } finally {
            setImporting(false);
        }
    }

    // Export to Excel
    async function handleExport() {
        setExporting(true);
        try {
            const { data: siswa } = await supabase
                .from('siswa')
                .select('*')
                .order('nis');

            if (!siswa || siswa.length === 0) {
                toast({
                    title: 'Info',
                    description: 'Tidak ada data siswa untuk diekspor',
                });
                return;
            }

            const wb = XLSX.utils.book_new();
            const exportData = siswa.map((s: any) => ({
                'NIS': s.nis,
                'NISN': s.nisn || '',
                'Nama': s.nama,
                'NIK': s.nik || '',
                'JK': s.jenis_kelamin,
                'Tempat Lahir': s.tempat_lahir || '',
                'Tanggal Lahir': s.tanggal_lahir || '',
                'Agama': s.agama || '',
                'Alamat': s.alamat || '',
                'Nama Ortu': s.nama_ortu || '',
                'Status': s.status,
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');

            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `Data_Siswa_${new Date().toISOString().split('T')[0]}.xlsx`;
            a.click();

            URL.revokeObjectURL(url);
            toast({ title: 'Berhasil', description: 'File Excel berhasil diunduh' });

        } catch (error) {
            console.error('Error exporting:', error);
            toast({
                title: 'Error',
                description: 'Gagal export data',
                variant: 'destructive',
            });
        } finally {
            setExporting(false);
        }
    }

    const validCount = previewData.filter(p => p.status !== 'error').length;
    const errorCount = previewData.filter(p => p.status === 'error').length;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Import / Export Siswa</h1>
                    <p className="text-muted-foreground">
                        Import data siswa dari Excel atau export ke Excel
                    </p>
                </div>
                <Button onClick={handleExport} disabled={exporting} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    {exporting ? 'Exporting...' : 'Export Excel'}
                </Button>
            </div>

            {/* Import Stats */}
            {importStats && (
                <Alert>
                    <Check className="h-4 w-4" />
                    <AlertTitle>Import Selesai</AlertTitle>
                    <AlertDescription>
                        {importStats.baru} data baru, {importStats.update} diupdate, {importStats.error} error
                    </AlertDescription>
                </Alert>
            )}

            {/* Step 1: Upload */}
            {step === 'upload' && (
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Template */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Template Import</CardTitle>
                            <CardDescription>
                                Download template Excel untuk import data siswa
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={downloadTemplate} className="w-full">
                                <Download className="mr-2 h-4 w-4" />
                                Download Template
                            </Button>

                            <div className="mt-4 text-sm text-muted-foreground">
                                <p className="font-medium">Format Kolom:</p>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li><strong>NIS</strong> - Nomor Induk Siswa (wajib, unik)</li>
                                    <li><strong>NISN</strong> - Nomor Induk Siswa Nasional</li>
                                    <li><strong>Nama Lengkap</strong> - Nama siswa (wajib)</li>
                                    <li><strong>NIK</strong> - Nomor Induk Kependudukan</li>
                                    <li><strong>Jenis Kelamin</strong> - L atau P</li>
                                    <li><strong>Tempat Lahir</strong> - Kota kelahiran</li>
                                    <li><strong>Tanggal Lahir</strong> - Format YYYY-MM-DD</li>
                                    <li><strong>Agama</strong> - Islam, Kristen, dll</li>
                                    <li><strong>Alamat</strong> - Alamat lengkap</li>
                                    <li><strong>Nama Orang Tua</strong> - Nama ayah/ibu</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upload */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload File</CardTitle>
                            <CardDescription>
                                Upload file Excel yang sudah diisi sesuai template
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
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
                                        {previewData.length} baris • {validCount} valid • {errorCount} error
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setStep('upload')}>
                                        Batal
                                    </Button>
                                    <Button onClick={handleImport} disabled={importing || validCount === 0}>
                                        {importing ? 'Mengimport...' : `Import ${validCount} Data`}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead className="sticky top-0 bg-muted">
                                        <tr className="border-b">
                                            <th className="px-2 py-2 text-left w-12">Row</th>
                                            <th className="px-2 py-2 text-left">NIS</th>
                                            <th className="px-2 py-2 text-left">Nama</th>
                                            <th className="px-2 py-2 text-center">JK</th>
                                            <th className="px-2 py-2 text-left">Status</th>
                                            <th className="px-2 py-2 text-left">Errors</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.map((row) => (
                                            <tr
                                                key={row.row}
                                                className={`border-b ${row.status === 'error' ? 'bg-red-50' :
                                                    row.status === 'warning' ? 'bg-yellow-50' : ''
                                                    }`}
                                            >
                                                <td className="px-2 py-1">{row.row}</td>
                                                <td className="px-2 py-1 font-mono">{row.nis}</td>
                                                <td className="px-2 py-1">{row.nama}</td>
                                                <td className="px-2 py-1 text-center">{row.jenis_kelamin}</td>
                                                <td className="px-2 py-1">
                                                    {row.status === 'error' && (
                                                        <span className="inline-flex items-center gap-1 text-red-600">
                                                            <X className="h-3 w-3" /> Error
                                                        </span>
                                                    )}
                                                    {row.status === 'warning' && (
                                                        <span className="inline-flex items-center gap-1 text-yellow-600">
                                                            <AlertCircle className="h-3 w-3" /> {row.existing ? 'Update' : 'Warning'}
                                                        </span>
                                                    )}
                                                    {row.status === 'valid' && (
                                                        <span className="inline-flex items-center gap-1 text-green-600">
                                                            <Check className="h-3 w-3" /> Valid
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-2 py-1 text-xs text-red-600">
                                                    {row.errors.slice(0, 2).join(', ')}
                                                    {row.errors.length > 2 && ` (+${row.errors.length - 2} more)`}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Info */}
            <Card className="bg-muted/50">
                <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium">Petunjuk:</p>
                            <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                                <li>Download template terlebih dahulu</li>
                                <li>Isi data sesuai format kolom yang ditentukan</li>
                                <li>NIS yang sudah ada akan diupdate, NIS baru akan ditambahkan</li>
                                <li>Baris dengan error tidak akan diimport</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}