'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface Nilai {
    id: string;
    siswa_id: string;
    semester_id: string;
    mata_pelajaran_id: string;
    guru_id: string;
    jenjang: number;
    jenis_nilai: 'UH1' | 'UH2' | 'UH3' | 'UH4' | 'UH5' | 'PTS' | 'PAS' | 'SEMESTER' | 'RAPOR';
    nilai: number | null;
    deskripsi?: string;
    status_nilai: 'draft' | 'submitted' | 'approved';
    entered_at: string;
    updated_at: string;
}

export interface SiswaNilaiInput {
    id: string;
    nis: string;
    nama: string;
    kelas: string;
    existing_values: Record<string, { id: string; nilai: number; status: string }>;
}

export interface NilaiSaveResult {
    success: boolean;
    saved_count: number;
    error_count: number;
    errors: string;
}

export interface RaporData {
    header: {
        sekolah: string;
        alamat: string;
        nama: string;
        nis: string;
        nisn: string;
        kelas: string;
        jenjang: number;
        semester: string;
        tahun_pelajaran: string;
    };
    nilai: Array<{
        mapel: string;
        uh1: number | null;
        uh2: number | null;
        uh3: number | null;
        pts: number | null;
        pas: number | null;
        semester: number | null;
    }>;
    kehadiran: {
        sakit: number;
        izin: number;
        alpha: number;
        total: number;
    };
}

export function useNilai() {
    const supabase = createClient();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Get siswa for nilai input
    const getSiswaForInput = useCallback(async (
        semesterId: string,
        guruId: string,
        mapelId: string,
        jenjang: number
    ) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_siswa_for_nilai_input', {
                p_semester_id: semesterId,
                p_guru_id: guruId,
                p_mapel_id: mapelId,
                p_jenjang: jenjang
            });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error getting siswa for input:', err);
            toast({
                title: 'Error',
                description: 'Gagal memuat data siswa',
                variant: 'destructive',
            });
            return null;
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    // Save nilai batch
    const saveNilaiBatch = useCallback(async (
        nilaiData: Array<{
            siswa_id: string;
            semester_id: string;
            mata_pelajaran_id: string;
            guru_id: string;
            jenjang: number;
            jenis_nilai: string;
            nilai: number | null;
            status_nilai?: string;
        }>,
        userId: string
    ): Promise<NilaiSaveResult | null> => {
        try {
            const { data, error } = await supabase.rpc('save_nilai_batch', {
                p_nilai_data: nilaiData,
                p_user_id: userId
            });

            if (error) throw error;

            const result = data as NilaiSaveResult;
            
            if (result.success) {
                toast({
                    title: 'Berhasil',
                    description: `${result.saved_count} nilai berhasil disimpan`,
                });
            } else {
                toast({
                    title: 'Peringatan',
                    description: `${result.saved_count} disimpan, ${result.error_count} gagal`,
                    variant: 'default',
                });
            }

            return result;
        } catch (err) {
            console.error('Error saving nilai:', err);
            toast({
                title: 'Error',
                description: 'Gagal menyimpan nilai',
                variant: 'destructive',
            });
            return null;
        }
    }, [supabase, toast]);

    // Get rekap nilai
    const getRekapNilai = useCallback(async (
        semesterId: string,
        jenjang?: number,
        kelasId?: string,
        mapelId?: string,
        guruId?: string
    ) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_rekap_nilai', {
                p_semester_id: semesterId,
                p_jenjang: jenjang ?? null,
                p_kelas_id: kelasId ?? null,
                p_mapel_id: mapelId ?? null,
                p_guru_id: guruId ?? null
            });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Error getting rekap nilai:', err);
            toast({
                title: 'Error',
                description: 'Gagal memuat rekap nilai',
                variant: 'destructive',
            });
            return [];
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    // Check rapor prasyarat
    const checkRaporPrasyarat = useCallback(async (
        semesterId: string,
        siswaId: string
    ) => {
        try {
            const { data, error } = await supabase.rpc('check_rapor_prasyarat', {
                p_semester_id: semesterId,
                p_siswa_id: siswaId
            });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error checking prasyarat:', err);
            return null;
        }
    }, [supabase]);

    // Generate rapor data
    const generateRaporData = useCallback(async (
        semesterId: string,
        siswaId: string
    ): Promise<RaporData | null> => {
        try {
            const { data, error } = await supabase.rpc('generate_rapor_data', {
                p_semester_id: semesterId,
                p_siswa_id: siswaId
            });

            if (error) throw error;
            return data as RaporData;
        } catch (err) {
            console.error('Error generating rapor:', err);
            toast({
                title: 'Error',
                description: 'Gagal generate rapor',
                variant: 'destructive',
            });
            return null;
        }
    }, [supabase, toast]);

    // Generate nilai template
    const generateNilaiTemplate = useCallback(async (
        semesterId: string,
        mapelId: string,
        jenjang: number,
        jenisNilai: string
    ) => {
        try {
            const { data, error } = await supabase.rpc('generate_nilai_template', {
                p_semester_id: semesterId,
                p_mapel_id: mapelId,
                p_jenjang: jenjang,
                p_jenis_nilai: jenisNilai
            });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error generating template:', err);
            toast({
                title: 'Error',
                description: 'Gagal generate template',
                variant: 'destructive',
            });
            return null;
        }
    }, [supabase, toast]);

    return {
        loading,
        getSiswaForInput,
        saveNilaiBatch,
        getRekapNilai,
        checkRaporPrasyarat,
        generateRaporData,
        generateNilaiTemplate,
    };
}

export default useNilai;
