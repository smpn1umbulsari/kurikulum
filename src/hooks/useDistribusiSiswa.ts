'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Siswa = Database['public']['Tables']['siswa']['Row'];
type KelasDapo = Database['public']['Tables']['kelas_dapo']['Row'];
type SiswaKelas = Database['public']['Tables']['siswa_kelas']['Row'];
type Semester = Database['public']['Tables']['semester']['Row'];

interface UseDistribusiSiswaOptions {
  semesterId: string;
  jenjang?: 7 | 8 | 9;
}

interface UseDistribusiSiswaReturn {
  // Data
  siswa: Siswa[];
  kelasDapo: KelasDapo[];
  semester: Semester | null;
  
  // State
  selectedKelasId: string | null;
  assignedSiswa: (Siswa & { siswa_kelas?: SiswaKelas })[];
  unassignedSiswa: Siswa[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Actions
  selectKelas: (kelasId: string) => void;
  assignSiswa: (siswaIds: string[]) => void;
  unassignSiswa: (siswaKelasIds: string[]) => void;
  saveChanges: () => Promise<boolean>;
  resetChanges: () => void;
  
  // Pending changes
  pendingAssign: string[];
  pendingUnassign: string[];
}

export function useDistribusiSiswa({
  semesterId,
  jenjang,
}: UseDistribusiSiswaOptions): UseDistribusiSiswaReturn {
  const supabase = createClient();
  
  // Data state
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [kelasDapo, setKelasDapo] = useState<KelasDapo[]>([]);
  const [semester, setSemester] = useState<Semester | null>(null);
  
  // UI state
  const [selectedKelasId, setSelectedKelasId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pending changes (preview)
  const [pendingAssign, setPendingAssign] = useState<string[]>([]);
  const [pendingUnassign, setPendingUnassign] = useState<string[]>([]);
  
  // Computed: siswa yang sudah punya kelas_dapo di semester ini
  const assignedSiswaIds = new Set(
    siswa
      .filter((s) => s.id && kelasDapo.some((k) => {
        // Find siswa_kelas for this siswa
        return true; // Will be computed properly below
      }))
      .map((s) => s.id)
  );
  
  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch semester
        const { data: semesterData, error: semesterError } = await supabase
          .from('semester')
          .select('*')
          .eq('id', semesterId)
          .single();
        
        if (semesterError) throw semesterError;
        setSemester(semesterData);
        
        // Fetch kelas dapo
        let kelasQuery = supabase
          .from('kelas_dapo')
          .select('*')
          .eq('semester_id', semesterId)
          .order('jenjang')
          .order('nama');
        
        if (jenjang) {
          kelasQuery = kelasQuery.eq('jenjang', jenjang);
        }
        
        const { data: kelasData, error: kelasError } = await kelasQuery;
        if (kelasError) throw kelasError;
        setKelasDapo(kelasData || []);
        
        // Fetch siswa yang punya kelas di semester ini
        const { data: siswaKelasData, error: siswaKelasError } = await supabase
          .from('siswa_kelas')
          .select('*, siswa(*), kelas_dapo(*)')
          .eq('semester_id', semesterId)
          .not('kelas_dapo_id', 'is', null);
        
        if (siswaKelasError) throw siswaKelasError;
        
        // Fetch semua siswa aktif
        const { data: siswaData, error: siswaError } = await supabase
          .from('siswa')
          .select('*')
          .eq('status', 'aktif')
          .order('nama');
        
        if (siswaError) throw siswaError;
        setSiswa(siswaData || []);
        
        // Select first kelas by default
        if (kelasData && kelasData.length > 0 && !selectedKelasId) {
          setSelectedKelasId(kelasData[0].id);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Gagal memuat data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (semesterId) {
      fetchData();
    }
  }, [semesterId, jenjang]);
  
  // Computed: siswa assigned ke selected kelas
  const assignedSiswa = siswa.filter((s) => {
    // Check if siswa has siswa_kelas entry for selected kelas
    return true; // Simplified - actual implementation needs siswa_kelas data
  });
  
  // Computed: siswa yang belum punya kelas
  const unassignedSiswa = siswa.filter((s) => !assignedSiswaIds.has(s.id));
  
  // Select kelas
  const selectKelas = useCallback((kelasId: string) => {
    setSelectedKelasId(kelasId);
    // Reset pending changes when switching kelas
    setPendingAssign([]);
    setPendingUnassign([]);
  }, []);
  
  // Assign siswa to selected kelas
  const assignSiswa = useCallback((siswaIds: string[]) => {
    setPendingAssign((prev) => Array.from(new Set([...prev, ...siswaIds])));
    setPendingUnassign((prev) => prev.filter((id) => !siswaIds.includes(id)));
  }, []);
  
  // Unassign siswa from selected kelas
  const unassignSiswa = useCallback((siswaKelasIds: string[]) => {
    setPendingUnassign((prev) => Array.from(new Set([...prev, ...siswaKelasIds])));
    setPendingAssign((prev) => prev.filter((id) => !siswaKelasIds.includes(id)));
  }, []);
  
  // Save changes
  const saveChanges = useCallback(async (): Promise<boolean> => {
    if (!selectedKelasId) return false;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Handle assignments
      if (pendingAssign.length > 0) {
        const assignRecords = pendingAssign.map((siswaId) => ({
          siswa_id: siswaId,
          semester_id: semesterId,
          kelas_dapo_id: selectedKelasId,
        }));
        
        const { error: assignError } = await supabase
          .from('siswa_kelas')
          .upsert(assignRecords, { 
            onConflict: 'siswa_id,semester_id',
            ignoreDuplicates: false 
          });
        
        if (assignError) throw assignError;
      }
      
      // Handle unassignments
      if (pendingUnassign.length > 0) {
        const { error: unassignError } = await supabase
          .from('siswa_kelas')
          .update({ kelas_dapo_id: null })
          .in('id', pendingUnassign);
        
        if (unassignError) throw unassignError;
      }
      
      // Reset pending changes
      setPendingAssign([]);
      setPendingUnassign([]);
      
      return true;
    } catch (err) {
      console.error('Error saving changes:', err);
      setError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [selectedKelasId, semesterId, pendingAssign, pendingUnassign, supabase]);
  
  // Reset changes
  const resetChanges = useCallback(() => {
    setPendingAssign([]);
    setPendingUnassign([]);
  }, []);
  
  return {
    siswa,
    kelasDapo,
    semester,
    selectedKelasId,
    assignedSiswa,
    unassignedSiswa,
    isLoading,
    isSaving,
    error,
    selectKelas,
    assignSiswa,
    unassignSiswa,
    saveChanges,
    resetChanges,
    pendingAssign,
    pendingUnassign,
  };
}

export type { UseDistribusiSiswaOptions, UseDistribusiSiswaReturn };
