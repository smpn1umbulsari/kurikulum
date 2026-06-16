'use client';

import { useEffect, useCallback } from 'react';
import { useAuth, useActiveSemester } from '@/components/providers/session-provider';
import { useDashboard } from '@/hooks/useDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Users,
    BookOpen,
    ClipboardList,
    Calendar,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Clock,
    GraduationCap,
    Award,
    FileText,
    RefreshCw,
} from 'lucide-react';

/**
 * Dashboard Page
 * 
 * Halaman utama yang menampilkan ringkasan data berdasarkan role pengguna.
 * Menggunakan RPC functions untuk performa tinggi.
 */
export default function DashboardPage() {
    const { profile } = useAuth();
    const { semester } = useActiveSemester();

    // Determine which dashboard to show based on role
    const role = profile?.role;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Selamat datang, {profile?.nama || 'User'}
                </p>
                {semester && (
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant={semester.mode_penilaian === 'pts' ? 'secondary' : 'default'}>
                            Semester aktif: {semester.nama}
                        </Badge>
                        <Badge variant={semester.mode_penilaian === 'pts' ? 'warning' : 'success'}>
                            Mode {semester.mode_penilaian === 'pts' ? 'PTS' : 'Semester'}
                        </Badge>
                    </div>
                )}
            </div>

            {/* Content based on role */}
            {role === 'superadmin' ? (
                <SuperadminDashboard />
            ) : role === 'admin' || role === 'urusan' ? (
                <AdminDashboard />
            ) : role === 'guru' ? (
                <GuruDashboard />
            ) : role === 'siswa' ? (
                <SiswaDashboard />
            ) : (
                <DashboardSkeleton />
            )}
        </div>
    );
}

/**
 * Dashboard Skeleton Loading
 */
function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-3 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-48" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-32 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

/**
 * Superadmin Dashboard Component
 */
function SuperadminDashboard() {
    const { profile } = useAuth();
    const { data, loading, error, fetchDashboard, refresh } = useDashboard();

    useEffect(() => {
        if (profile?.id) {
            fetchDashboard(profile.id);
        }
    }, [profile?.id, fetchDashboard]);

    const handleRetry = useCallback(() => {
        if (profile?.id) refresh(profile.id);
    }, [profile?.id, refresh]);

    if (loading) return <DashboardSkeleton />;
    if (error) return <ErrorState message={error} onRetry={handleRetry} />;

    const dashboard = data as any;
    const stats = dashboard?.stats || {};
    const breakdown = dashboard?.breakdown || {};

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Guru"
                    value={stats.total_guru || 0}
                    icon={Users}
                    description="Guru aktif"
                />
                <StatCard
                    title="Total Siswa"
                    value={stats.total_siswa || 0}
                    icon={GraduationCap}
                    description="Siswa aktif"
                />
                <StatCard
                    title="Total Kelas"
                    value={stats.total_kelas || 0}
                    icon={BookOpen}
                    description="Kelas real"
                />
                <StatCard
                    title="Total Mapel"
                    value={stats.total_mapel || 0}
                    icon={ClipboardList}
                    description="Mapel aktif"
                />
            </div>

            {/* Breakdown by Jenjang */}
            <div className="grid gap-4 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Guru by Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Object.entries(breakdown.guru_by_status || {}).map(([status, count]) => (
                                <div key={status} className="flex justify-between items-center">
                                    <Badge variant="outline">{status}</Badge>
                                    <span className="font-medium">{count as number}</span>
                                </div>
                            ))}
                            {Object.keys(breakdown.guru_by_status || {}).length === 0 && (
                                <p className="text-muted-foreground text-sm">Tidak ada data</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Siswa by Jenjang</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Object.entries(breakdown.siswa_by_jenjang || {}).map(([jenjang, count]) => (
                                <div key={jenjang} className="flex justify-between items-center">
                                    <Badge variant="secondary">Kelas {jenjang}</Badge>
                                    <span className="font-medium">{count as number}</span>
                                </div>
                            ))}
                            {Object.keys(breakdown.siswa_by_jenjang || {}).length === 0 && (
                                <p className="text-muted-foreground text-sm">Tidak ada data</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Kelas by Jenjang</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Object.entries(breakdown.kelas_by_jenjang || {}).map(([jenjang, count]) => (
                                <div key={jenjang} className="flex justify-between items-center">
                                    <Badge variant="outline">Kelas {jenjang}</Badge>
                                    <span className="font-medium">{count as number}</span>
                                </div>
                            ))}
                            {Object.keys(breakdown.kelas_by_jenjang || {}).length === 0 && (
                                <p className="text-muted-foreground text-sm">Tidak ada data</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Audit */}
            <Card>
                <CardHeader>
                    <CardTitle>Aktivitas Terbaru</CardTitle>
                    <CardDescription>Aktivitas sistem dalam 7 hari terakhir</CardDescription>
                </CardHeader>
                <CardContent>
                    {dashboard?.audit_recent?.length > 0 ? (
                        <div className="space-y-3">
                            {dashboard.audit_recent.slice(0, 5).map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                    <div>
                                        <span className="font-medium">{item.user}</span>
                                        <span className="text-muted-foreground"> - {item.action}</span>
                                    </div>
                                    <span className="text-muted-foreground text-xs">
                                        {new Date(item.timestamp).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">Tidak ada aktivitas terbaru</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Admin Dashboard Component
 */
function AdminDashboard() {
    const { profile } = useAuth();
    const { data, loading, error, fetchDashboard, refresh } = useDashboard();

    useEffect(() => {
        if (profile?.id) {
            fetchDashboard(profile.id);
        }
    }, [profile?.id, fetchDashboard]);

    const handleRetry = useCallback(() => {
        if (profile?.id) refresh(profile.id);
    }, [profile?.id, refresh]);

    if (loading) return <DashboardSkeleton />;
    if (error) return <ErrorState message={error} onRetry={handleRetry} />;

    const dashboard = data as any;
    const stats = dashboard?.stats || {};

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Guru"
                    value={stats.total_guru || 0}
                    icon={Users}
                    description="Guru aktif"
                />
                <StatCard
                    title="Total Siswa"
                    value={stats.total_siswa || 0}
                    icon={GraduationCap}
                    description="Siswa aktif"
                />
                <StatCard
                    title="Total Kelas"
                    value={stats.total_kelas || 0}
                    icon={BookOpen}
                    description="Kelas real"
                />
                <StatCard
                    title="Total Mapel"
                    value={stats.total_mapel || 0}
                    icon={ClipboardList}
                    description="Mapel aktif"
                />
            </div>

            {/* Quick Links */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Guru Terbaru</CardTitle>
                        <CardDescription>5 guru yang baru ditambahkan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {dashboard?.guru_terbaru?.length > 0 ? (
                            <div className="space-y-3">
                                {dashboard.guru_terbaru.map((guru: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{guru.nama}</p>
                                            <p className="text-sm text-muted-foreground">NIS: {guru.nis}</p>
                                        </div>
                                        <Badge variant="outline">{guru.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">Tidak ada data</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Siswa Terbaru</CardTitle>
                        <CardDescription>5 siswa yang baru ditambahkan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {dashboard?.siswa_terbaru?.length > 0 ? (
                            <div className="space-y-3">
                                {dashboard.siswa_terbaru.map((siswa: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{siswa.nama}</p>
                                            <p className="text-sm text-muted-foreground">NIS: {siswa.nis}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">Tidak ada data</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Tugas Tambahan */}
            <Card>
                <CardHeader>
                    <CardTitle>Tugas Tambahan</CardTitle>
                    <CardDescription>Koordinator dan Kepala Kurikulum semester ini</CardDescription>
                </CardHeader>
                <CardContent>
                    {dashboard?.tugas_tambahan?.length > 0 ? (
                        <div className="space-y-2">
                            {dashboard.tugas_tambahan.map((tt: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <Badge variant="secondary">{tt.jenis}</Badge>
                                    <span>{tt.guru}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">Belum ada tugas tambahan</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Guru Dashboard Component
 */
function GuruDashboard() {
    const { profile } = useAuth();
    const { data, loading, error, fetchDashboard, refresh } = useDashboard();

    useEffect(() => {
        if (profile?.id) {
            fetchDashboard(profile.id);
        }
    }, [profile?.id, fetchDashboard]);

    const handleRetry = useCallback(() => {
        if (profile?.id) refresh(profile.id);
    }, [profile?.id, refresh]);

    if (loading) return <DashboardSkeleton />;
    if (error) return <ErrorState message={error} onRetry={handleRetry} />;

    const dashboard = data as any;
    const stats = dashboard?.stats || {};

    return (
        <div className="space-y-6">
            {/* Guru Info */}
            {dashboard?.guru && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                <Users className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{dashboard.guru.nama}</p>
                                <Badge variant="outline">{dashboard.guru.status_pegawai}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatCard
                    title="Kelas"
                    value={stats.jumlah_kelas || 0}
                    icon={BookOpen}
                    description="Kelas yang diajar"
                />
                <StatCard
                    title="Mata Pelajaran"
                    value={stats.jumlah_mapel || 0}
                    icon={ClipboardList}
                    description="Mapel yang diajar"
                />
                <StatCard
                    title="Total Jam"
                    value={stats.total_jam || 0}
                    icon={Clock}
                    description="Jam mengajar/minggu"
                />
            </div>

            {/* Tugas Tambahan & Wali Kelas */}
            <div className="grid gap-4 lg:grid-cols-2">
                {dashboard?.tugas_tambahan?.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Tugas Tambahan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {dashboard.tugas_tambahan.map((tt: any, idx: number) => (
                                    <Badge key={idx} variant="secondary">{tt.jenis}</Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {dashboard?.wali_kelas?.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Wali Kelas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {dashboard.wali_kelas.map((wk: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4" />
                                        <span>Kelas {wk.jenjang} - {wk.kelas}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Jadwal Hari Ini */}
            {dashboard?.jadwal_hari_ini?.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Jadwal Hari Ini</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {dashboard.jadwal_hari_ini.map((j: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <p className="font-medium">{j.mapel}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Kelas {j.jenjang} - {j.kelas}
                                        </p>
                                    </div>
                                    <Badge variant="outline">{j.hari} ({j.jam_ke})</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

/**
 * Siswa Dashboard Component
 */
function SiswaDashboard() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Informasi Akademik</CardTitle>
                    <CardDescription>Ringkasan akademik semester ini</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Fitur dalam pengembangan...</p>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Error State Component
 */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <Card className="border-destructive">
            <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <p className="text-lg font-medium text-destructive">Error</p>
                <p className="text-muted-foreground mb-4">{message}</p>
                <Button onClick={onRetry}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Coba Lagi
                </Button>
            </CardContent>
        </Card>
    );
}

/**
 * Stat Card Component
 */
function StatCard({
    title,
    value,
    icon: Icon,
    description,
}: {
    title: string;
    value: number | string;
    icon: React.ElementType;
    description: string;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}