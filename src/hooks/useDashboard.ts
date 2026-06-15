'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/components/providers/session-provider';

/**
 * Dashboard data types
 */
export interface DashboardGuru {
    guru: {
        id: string;
        nama: string;
        status_pegawai: string;
    };
    stats: {
        jumlah_mapel: number;
        jumlah_kelas: number;
        total_jam: number;
    };
    tugas_tambahan: { jenis: string }[];
    wali_kelas: { kelas: string; jenjang: number }[];
    jadwal_hari_ini: {
        hari: string;
        jam_ke: string;
        mapel: string;
        kelas: string;
    }[];
}

export interface DashboardAdmin {
    stats: {
        total_guru: number;
        total_siswa: number;
        total_kelas: number;
        total_mapel: number;
    };
    guru_terbaru: {
        id: string;
        nama: string;
        status: string;
    }[];
    siswa_terbaru: {
        id: string;
        nama: string;
        nis: string;
    }[];
    kelas_list: {
        id: string;
        nama: string;
        jenjang: number;
        wali: string | null;
        jumlah_siswa: number;
    }[];
    tugas_tambahan: {
        jenis: string;
        guru: string;
    }[];
}

export interface DashboardSuperadmin {
    stats: {
        total_guru: number;
        total_siswa: number;
        total_kelas: number;
        total_mapel: number;
        total_users: number;
        tahun_pelajaran_aktif: string;
    };
    breakdown: {
        guru_by_status: Record<string, number>;
        siswa_by_jenjang: Record<string, number>;
        kelas_by_jenjang: Record<string, number>;
    };
    audit_recent: {
        user: string;
        action: string;
        table: string;
        timestamp: string;
    }[];
}

export interface DashboardWaliKelas {
    kelas: {
        id: string;
        nama: string;
        jenjang: number;
    };
    stats: {
        total_siswa: number;
        siswa_sakit: number;
        siswa_izin: number;
        siswa_alpha: number;
    };
    siswa_list: {
        id: string;
        nama: string;
        nis: string;
        jenis_kelamin: string;
        kehadiran: {
            sakit: number;
            izin: number;
            alpha: number;
        };
        catatan: string | null;
    }[];
}

export type DashboardData = DashboardGuru | DashboardAdmin | DashboardSuperadmin | DashboardWaliKelas;

/**
 * Cache manager untuk dashboard data
 * Mencegah refetch saat navigasi balik
 */
class DashboardCache {
    private cache: Map<string, { data: DashboardData; timestamp: number }> = new Map();
    private readonly TTL = 60000; // 1 minute cache

    get(key: string): DashboardData | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // Check if expired
        if (Date.now() - entry.timestamp > this.TTL) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    set(key: string, data: DashboardData): void {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    invalidate(key?: string): void {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }
}

const dashboardCache = new DashboardCache();

/**
 * Hook untuk mengambil data dashboard berdasarkan role user
 */
export function useDashboard(profile: UserProfile | null) {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const supabase = createClient();

    const fetchDashboard = useCallback(async () => {
        if (!profile) {
            setData(null);
            setLoading(false);
            return;
        }

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const cacheKey = `dashboard_${profile.role}_${profile.id}`;

        // Check cache first
        const cachedData = dashboardCache.get(cacheKey);
        if (cachedData) {
            setData(cachedData);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let result: DashboardData | null = null;

            switch (profile.role) {
                case 'guru': {
                    const { data: guruData } = await supabase.rpc('get_dashboard_summary_guru', {
                        p_guru_id: profile.id
                    });
                    result = guruData as DashboardGuru;
                    break;
                }

                case 'admin': {
                    const { data: adminData } = await supabase.rpc('get_dashboard_summary_admin');
                    result = adminData as DashboardAdmin;
                    break;
                }

                case 'superadmin': {
                    const { data: superadminData } = await supabase.rpc('get_dashboard_summary_superadmin');
                    result = superadminData as DashboardSuperadmin;
                    break;
                }

                case 'urusan': {
                    // Urusan uses same as admin for now
                    const { data: adminData } = await supabase.rpc('get_dashboard_summary_admin');
                    result = adminData as DashboardAdmin;
                    break;
                }

                case 'siswa': {
                    // Siswa dashboard - simplified version
                    const { data: siswaData } = await supabase
                        .from('siswa')
                        .select('id, nama, nis, jenis_kelamin')
                        .eq('pengguna_id', profile.id)
                        .single();
                    result = siswaData as any;
                    break;
                }
            }

            if (result) {
                setData(result);
                dashboardCache.set(cacheKey, result);
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Error fetching dashboard:', err);
                setError(err.message || 'Gagal memuat data dashboard');
            }
        } finally {
            setLoading(false);
        }
    }, [profile, supabase]);

    useEffect(() => {
        fetchDashboard();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [fetchDashboard]);

    const refresh = useCallback(() => {
        if (profile) {
            dashboardCache.invalidate(`dashboard_${profile.role}_${profile.id}`);
        }
        fetchDashboard();
    }, [fetchDashboard, profile]);

    const invalidateCache = useCallback(() => {
        dashboardCache.invalidate();
    }, []);

    return {
        data,
        loading,
        error,
        refresh,
        invalidateCache,
    };
}

/**
 * Hook untuk polling dashboard updates (for real-time features)
 */
export function useDashboardPolling(
    profile: UserProfile | null,
    interval: number = 30000 // default 30 seconds
) {
    const { data, loading, error, refresh } = useDashboard(profile);

    useEffect(() => {
        if (!profile) return;

        const pollInterval = setInterval(() => {
            refresh();
        }, interval);

        return () => clearInterval(pollInterval);
    }, [profile, interval, refresh]);

    return { data, loading, error, refresh };
}