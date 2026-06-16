'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export type jenis_tugas_enum = 'wali_kelas' | 'koordinator_7' | 'koordinator_8' | 'koordinator_9' | 'kepala_kurikulum' | 'laboran' | 'perpustakaan';

export interface TugasTambahan {
    id: string;
    pengguna_id: string;
    semester_id: string;
    kelas_real_id: string | null;
    jenis_tugas: jenis_tugas_enum;
    jam_tugas: number;
    keterangan: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface GuruEligible {
    id: string;
    nama: string;
    kode_guru: string;
    current_tugas: jenis_tugas_enum[];
    is_eligible: boolean;
}

export interface TugasTambahanSummary {
    wali_kelas: Array<{ guru: string; kelas: string; jenjang: number }>;
    koordinator: Array<{ jenis: string; guru: string }>;
    kepala_kurikulum: Array<{ guru: string }>;
}

export function useTugasTambahan() {
    const supabase = createClient();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Get guru eligible for Wali Kelas
    const getGuruEligible = useCallback(async (semesterId: string, jenjang?: number) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_guru_eligible_for_walas', {
                p_semester_id: semesterId,
                p_jenjang: jenjang ?? null
            });

            if (error) throw error;
            return data as GuruEligible[];
        } catch (err) {
            console.error('Error getting eligible guru:', err);
            toast({
                title: 'Error',
                description: 'Gagal memuat data guru',
                variant: 'destructive',
            });
            return [];
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    // Assign Wali Kelas
    const assignWaliKelas = useCallback(async (
        penggunaId: string,
        semesterId: string,
        kelasRealId: string,
        jenjang: number,
        userId: string
    ) => {
        try {
            const { data, error } = await supabase.rpc('assign_wali_kelas', {
                p_pengguna_id: penggunaId,
                p_semester_id: semesterId,
                p_kelas_real_id: kelasRealId,
                p_jenjang: jenjang,
                p_user_id: userId
            });

            if (error) throw error;

            if (data.success) {
                toast({
                    title: 'Berhasil',
                    description: data.message,
                });
            } else {
                toast({
                    title: 'Gagal',
                    description: data.message,
                    variant: 'destructive',
                });
            }

            return data;
        } catch (err) {
            console.error('Error assigning walas:', err);
            toast({
                title: 'Error',
                description: 'Gagal assigning Wali Kelas',
                variant: 'destructive',
            });
            return { success: false, message: 'Error' };
        }
    }, [supabase, toast]);

    // Get tugas tambahan summary
    const getSummary = useCallback(async (semesterId: string): Promise<TugasTambahanSummary | null> => {
        try {
            const { data, error } = await supabase.rpc('get_tugas_tambahan_summary', {
                p_semester_id: semesterId
            });

            if (error) throw error;
            return data as TugasTambahanSummary;
        } catch (err) {
            console.error('Error getting summary:', err);
            return null;
        }
    }, [supabase]);

    // Get all tugas tambahan for semester
    const getAllTugas = useCallback(async (semesterId: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tugas_tambahan')
                .select(`
                    *,
                    guru:guru!inner(id, nama, kode_guru),
                    kelas_real:kelas_real(id, nama, jenjang)
                `)
                .eq('semester_id', semesterId)
                .eq('is_active', true)
                .order('jenis_tugas');

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error getting tugas:', err);
            return [];
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    // Create tugas tambahan
    const createTugas = useCallback(async (tugas: Omit<TugasTambahan, 'id' | 'created_at' | 'updated_at'>) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('tugas_tambahan')
                .insert(tugas);

            if (error) throw error;

            toast({
                title: 'Berhasil',
                description: 'Tugas tambahan berhasil ditambahkan',
            });
            return true;
        } catch (err) {
            console.error('Error creating tugas:', err);
            toast({
                title: 'Error',
                description: 'Gagal menambahkan tugas tambahan',
                variant: 'destructive',
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    // Update tugas tambahan
    const updateTugas = useCallback(async (id: string, tugas: Partial<TugasTambahan>) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('tugas_tambahan')
                .update(tugas)
                .eq('id', id);

            if (error) throw error;

            toast({
                title: 'Berhasil',
                description: 'Tugas tambahan berhasil diperbarui',
            });
            return true;
        } catch (err) {
            console.error('Error updating tugas:', err);
            toast({
                title: 'Error',
                description: 'Gagal memperbarui tugas tambahan',
                variant: 'destructive',
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    // Delete tugas tambahan (soft delete)
    const deleteTugas = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('tugas_tambahan')
                .update({ is_active: false })
                .eq('id', id);

            if (error) throw error;

            toast({
                title: 'Berhasil',
                description: 'Tugas tambahan berhasil dihapus',
            });
            return true;
        } catch (err) {
            console.error('Error deleting tugas:', err);
            toast({
                title: 'Error',
                description: 'Gagal menghapus tugas tambahan',
                variant: 'destructive',
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    return {
        loading,
        getGuruEligible,
        assignWaliKelas,
        getSummary,
        getAllTugas,
        createTugas,
        updateTugas,
        deleteTugas,
    };
}

export default useTugasTambahan;
