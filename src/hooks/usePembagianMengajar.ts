'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { 
    PembagianMengajar, 
    PembagianMengajarWithRelations,
    KonflikResult,
    SyncResult 
} from '@/types/database-extended';

export function usePembagianMengajar() {
    const supabase = createClient();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Fetch all pembagian mengajar
    const fetchAll = useCallback(async (semesterId: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('pembagian_mengajar')
                .select(`
                    *,
                    guru:guru_id(id, nama, kode_guru),
                    mata_pelajaran:mata_pelajaran_id(id, nama, kode_mapel)
                `)
                .eq('semester_id', semesterId)
                .order('jenjang', { ascending: true })
                .order('jenis_mengajar', { ascending: true });

            if (error) throw error;
            return data as PembagianMengajarWithRelations[];
        } catch (err) {
            console.error('Error fetching pembagian:', err);
            toast({
                title: 'Error',
                description: 'Gagal memuat data pembagian mengajar',
                variant: 'destructive',
            });
            return null;
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    // Fetch by guru
    const fetchByGuru = useCallback(async (semesterId: string, guruId: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('pembagian_mengajar')
                .select(`
                    *,
                    mata_pelajaran:mata_pelajaran_id(id, nama, kode_mapel)
                `)
                .eq('semester_id', semesterId)
                .eq('guru_id', guruId)
                .order('jenjang');

            if (error) throw error;
            return data as PembagianMengajar[];
        } catch (err) {
            console.error('Error fetching guru pembagian:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    // Create new pembagian
    const create = useCallback(async (data: Omit<PembagianMengajar, 'id' | 'created_at' | 'updated_at'>) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('pembagian_mengajar')
                .insert(data);

            if (error) throw error;

            toast({
                title: 'Berhasil',
                description: 'Pembagian mengajar berhasil ditambahkan',
            });
            return true;
        } catch (err) {
            console.error('Error creating pembagian:', err);
            toast({
                title: 'Error',
                description: 'Gagal menambahkan pembagian mengajar',
                variant: 'destructive',
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    // Update pembagian
    const update = useCallback(async (id: string, data: Partial<PembagianMengajar>) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('pembagian_mengajar')
                .update(data)
                .eq('id', id);

            if (error) throw error;

            toast({
                title: 'Berhasil',
                description: 'Pembagian mengajar berhasil diperbarui',
            });
            return true;
        } catch (err) {
            console.error('Error updating pembagian:', err);
            toast({
                title: 'Error',
                description: 'Gagal memperbarui pembagian mengajar',
                variant: 'destructive',
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    // Delete pembagian
    const remove = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('pembagian_mengajar')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({
                title: 'Berhasil',
                description: 'Pembagian mengajar berhasil dihapus',
            });
            return true;
        } catch (err) {
            console.error('Error deleting pembagian:', err);
            toast({
                title: 'Error',
                description: 'Gagal menghapus pembagian mengajar',
                variant: 'destructive',
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    // Detect conflicts
    const detectConflicts = useCallback(async (semesterId: string): Promise<KonflikResult[]> => {
        try {
            const { data, error } = await supabase.rpc('detect_pembagian_konflik', {
                p_semester_id: semesterId,
            });

            if (error) throw error;
            return (data || []) as KonflikResult[];
        } catch (err) {
            console.error('Error detecting conflicts:', err);
            toast({
                title: 'Error',
                description: 'Gagal mendeteksi konflik',
                variant: 'destructive',
            });
            return [];
        }
    }, [supabase, toast]);

    // Sync dapo to real
    const syncDapoToReal = useCallback(async (
        semesterId: string, 
        userId: string,
        forceOverride: boolean = false
    ): Promise<SyncResult | null> => {
        try {
            const { data, error } = await supabase.rpc('sync_pembagian_dapo_to_real', {
                p_semester_id: semesterId,
                p_user_id: userId,
                p_force_override: forceOverride,
            });

            if (error) throw error;

            const result = data as SyncResult;
            
            if (result.success) {
                toast({
                    title: 'Berhasil',
                    description: result.message,
                });
            } else {
                toast({
                    title: 'Peringatan',
                    description: result.message,
                    variant: 'default',
                });
            }

            return result;
        } catch (err) {
            console.error('Error syncing:', err);
            toast({
                title: 'Error',
                description: 'Gagal sinkronisasi pembagian',
                variant: 'destructive',
            });
            return null;
        }
    }, [supabase, toast]);

    // Batch create/update
    const batchUpsert = useCallback(async (
        items: Array<Omit<PembagianMengajar, 'id' | 'created_at' | 'updated_at'>>
    ) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('pembagian_mengajar')
                .upsert(items, {
                    onConflict: 'semester_id,guru_id,mata_pelajaran_id,jenjang,jenis_mengajar,kelas_id',
                });

            if (error) throw error;

            toast({
                title: 'Berhasil',
                description: `${items.length} pembagian mengajar berhasil disimpan`,
            });
            return true;
        } catch (err) {
            console.error('Error batch upsert:', err);
            toast({
                title: 'Error',
                description: 'Gagal menyimpan pembagian mengajar',
                variant: 'destructive',
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    return {
        loading,
        fetchAll,
        fetchByGuru,
        create,
        update,
        remove,
        detectConflicts,
        syncDapoToReal,
        batchUpsert,
    };
}

export default usePembagianMengajar;
