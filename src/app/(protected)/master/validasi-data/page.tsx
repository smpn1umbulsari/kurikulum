'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    RefreshCw,
    ArrowRight,
    Loader2,
    Database,
    Users,
    BookOpen,
    GraduationCap,
    ShieldCheck,
} from 'lucide-react';

interface ValidationResult {
    id: string;
    category: 'siswa_tanpa_nilai' | 'kelas_tanpa_wali' | 'kepala_sekolah_kosong' | 'guru_belum_input_nilai';
    severity: 'error' | 'warning';
    title: string;
    description: string;
    count: number;
    data: Record<string, unknown>[];
    fix_url?: string;
}

interface ValidationSummary {
    total_issues: number;
    errors: number;
    warnings: number;
    by_category: Record<string, number>;
}

export default function LaporanValidasiPage() {
    const router = useRouter();
    const { toast } = useToast();
    
    const [results, setResults] = useState<ValidationResult[]>([]);
    const [summary, setSummary] = useState<ValidationSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [validating, setValidating] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const fetchValidation = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/master/validasi-data');
            if (res.ok) {
                const data = await res.json();
                setResults(data.results || []);
                setSummary(data.summary || null);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Gagal memuat data validasi',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchValidation();
    }, []);

    const handleValidate = async () => {
        setValidating(true);
        try {
            const res = await fetch('/api/master/validasi-data/validate', {
                method: 'POST',
            });
            
            if (res.ok) {
                const data = await res.json();
                setResults(data.results || []);
                setSummary(data.summary || null);
                toast({
                    title: 'Validasi Selesai',
                    description: `Ditemukan ${data.summary?.total_issues || 0} masalah`,
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Gagal menjalankan validasi',
                variant: 'destructive',
            });
        } finally {
            setValidating(false);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'siswa_tanpa_nilai':
                return <Users className="h-5 w-5" />;
            case 'kelas_tanpa_wali':
                return <GraduationCap className="h-5 w-5" />;
            case 'kepala_sekolah_kosong':
                return <ShieldCheck className="h-5 w-5" />;
            case 'guru_belum_input_nilai':
                return <BookOpen className="h-5 w-5" />;
            default:
                return <AlertTriangle className="h-5 w-5" />;
        }
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'siswa_tanpa_nilai':
                return 'Siswa Tanpa Nilai';
            case 'kelas_tanpa_wali':
                return 'Kelas Tanpa Wali Kelas';
            case 'kepala_sekolah_kosong':
                return 'Kepala Sekolah Kosong';
            case 'guru_belum_input_nilai':
                return 'Guru Belum Input Nilai';
            default:
                return category;
        }
    };

    const getFixUrl = (category: string) => {
        switch (category) {
            case 'siswa_tanpa_nilai':
                return '/master/nilai';
            case 'kelas_tanpa_wali':
                return '/master/kelas-real';
            case 'kepala_sekolah_kosong':
                return '/master/kepala-sekolah';
            case 'guru_belum_input_nilai':
                return '/master/guru';
            default:
                return null;
        }
    };

    const filteredResults = selectedCategory
        ? results.filter(r => r.category === selectedCategory)
        : results;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Laporan Validasi Data</h1>
                    <p className="text-muted-foreground">
                        Deteksi inkonsistensi dan masalah dalam data akademik
                    </p>
                </div>
                <Button onClick={handleValidate} disabled={validating}>
                    {validating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Jalankan Validasi
                </Button>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <Database className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Masalah</p>
                                    <p className="text-2xl font-bold">{summary.total_issues}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className={summary.errors > 0 ? 'border-red-500' : 'border-green-500'}>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${summary.errors > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                                    <XCircle className={`h-6 w-6 ${summary.errors > 0 ? 'text-red-600' : 'text-green-600'}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Error</p>
                                    <p className="text-2xl font-bold">{summary.errors}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={summary.warnings > 0 ? 'border-orange-500' : 'border-green-500'}>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${summary.warnings > 0 ? 'bg-orange-100' : 'bg-green-100'}`}>
                                    <AlertTriangle className={`h-6 w-6 ${summary.warnings > 0 ? 'text-orange-600' : 'text-green-600'}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Warning</p>
                                    <p className="text-2xl font-bold">{summary.warnings}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={summary.total_issues === 0 ? 'border-green-500' : ''}>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${summary.total_issues === 0 ? 'bg-green-100' : 'bg-muted'}`}>
                                    <CheckCircle2 className={`h-6 w-6 ${summary.total_issues === 0 ? 'text-green-600' : 'text-muted-foreground'}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <p className="text-lg font-bold">
                                        {summary.total_issues === 0 ? 'Semua OK' : 'Perlu Perbaikan'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
                <Button
                    variant={selectedCategory === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                >
                    Semua ({results.length})
                </Button>
                {Object.entries(summary?.by_category || {}).map(([cat, count]) => (
                    <Button
                        key={cat}
                        variant={selectedCategory === cat ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(cat)}
                    >
                        {getCategoryLabel(cat)} ({count})
                    </Button>
                ))}
            </div>

            {/* Results */}
            {filteredResults.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                        <h3 className="text-lg font-medium mb-2">Semua Data Valid!</h3>
                        <p className="text-muted-foreground">
                            Tidak ditemukan inkonsistensi data.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredResults.map((result) => (
                        <Card key={result.id}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${
                                            result.severity === 'error' ? 'bg-red-100' : 'bg-orange-100'
                                        }`}>
                                            <span className={result.severity === 'error' ? 'text-red-600' : 'text-orange-600'}>
                                                {getCategoryIcon(result.category)}
                                            </span>
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">
                                                {getCategoryLabel(result.category)}
                                            </CardTitle>
                                            <CardDescription>{result.description}</CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={result.severity === 'error' ? 'destructive' : 'secondary'}>
                                            {result.count} item
                                        </Badge>
                                        {getFixUrl(result.category) && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(getFixUrl(result.category)!)}
                                            >
                                                Perbaiki
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {result.data.length > 0 && (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>No</TableHead>
                                                <TableHead>Item</TableHead>
                                                <TableHead>Detail</TableHead>
                                                <TableHead>Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {result.data.slice(0, 10).map((item: any, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{idx + 1}</TableCell>
                                                    <TableCell className="font-medium">
                                                        {item.nama || item.label || item.siswa_nama || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {item.detail || item.kelas_nama || item.keterangan || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.fix_url && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => router.push(item.fix_url as string)}
                                                            >
                                                                <ArrowRight className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                                {result.data.length > 10 && (
                                    <p className="text-sm text-muted-foreground mt-2 text-center">
                                        Dan {result.data.length - 10} item lainnya...
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}