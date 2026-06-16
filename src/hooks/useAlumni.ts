'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface AlumniInput {
    siswa_id: string;
    tahun_lulus?: number;
}

export function useAlumni() {
    const supabase = createClient();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    // Convert siswa to alumni
    const makeAlumni = useCallback(async ({ siswa_id, tahun_lulus }: AlumniInput) => {
        setIsProcessing(true);

        try {
            const updateData: Record<string, unknown> = {
                status_siswa: 'alumni',
            };

            // Set tahun_lulus, default to current year if not provided
            if (tahun_lulus) {
                updateData.tahun_lulus = tahun_lulus;
            }

            const { error } = await supabase
                .from('siswa')
                .update(updateData)
                .eq('id', siswa_id);

            if (error) throw error;

            toast({
                title: 'Berhasil',
                description: 'Siswa berhasil dijadikan alumni',
            });

            return true;
        } catch (error) {
            console.error('Error making alumni:', error);
            toast({
                title: 'Error',
                description: 'Gagal mengubah status siswa',
                variant: 'destructive',
            });
            return false;
        } finally {
            setIsProcessing(false);
        }
    }, [supabase, toast]);

    // Revert alumni to aktif
    const revertAlumni = useCallback(async (siswa_id: string) => {
        setIsProcessing(true);

        try {
            const { error } = await supabase
                .from('siswa')
                .update({
                    status_siswa: 'aktif',
                    tahun_lulus: null,
                })
                .eq('id', siswa_id);

            if (error) throw error;

            toast({
                title: 'Berhasil',
                description: 'Status alumni berhasil dibatalkan',
            });

            return true;
        } catch (error) {
            console.error('Error reverting alumni:', error);
            toast({
                title: 'Error',
                description: 'Gagal membatalkan status alumni',
                variant: 'destructive',
            });
            return false;
        } finally {
            setIsProcessing(false);
        }
    }, [supabase, toast]);

    // Get alumni statistics
    const getAlumniStats = useCallback(async (tahun?: number) => {
        try {
            let query = supabase
                .from('siswa')
                .select('id, tahun_lulus, jenjang, nama', { count: 'exact' })
                .eq('status_siswa', 'alumni');

            if (tahun) {
                query = query.eq('tahun_lulus', tahun);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Group by tahun_lulus
            const stats = (data || []).reduce((acc, item) => {
                const tahun = item.tahun_lulus || 'unknown';
                if (!acc[tahun]) {
                    acc[tahun] = { count: 0, jenjang: {} };
                }
                acc[tahun].count += 1;
                const jenjang = item.jenjang || 'unknown';
                acc[tahun].jenjang[jenjang] = (acc[tahun].jenjang[jenjang] || 0) + 1;
                return acc;
            }, {} as Record<number | string, { count: number; jenjang: Record<string, number> }>);

            return { stats, total: data?.length || 0 };
        } catch (error) {
            console.error('Error getting alumni stats:', error);
            return { stats: {}, total: 0 };
        }
    }, [supabase]);

    return {
        isProcessing,
        makeAlumni,
        revertAlumni,
        getAlumniStats,
    };
}

export default useAlumni;
