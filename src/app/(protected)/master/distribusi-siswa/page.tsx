'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TwoColumnPanel, TwoColumnItem } from '@/components/data-master/two-column-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Users, ArrowLeft } from 'lucide-react';
import type { Database } from '@/types/database';

type Semester = Database['public']['Tables']['semester']['Row'];
type KelasDapo = Database['public']['Tables']['kelas_dapo']['Row'];
type Siswa = Database['public']['Tables']['siswa']['Row'];
type SiswaKelas = Database['public']['Tables']['siswa_kelas']['Row'];

export default function DistribusiSiswaPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // Data state
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [kelasDapo, setKelasDapo] = useState<KelasDapo[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState<string | null>(null);
  const [siswaKelas, setSiswaKelas] = useState<(SiswaKelas & { siswa: Siswa })[]>([]);
  const [allSiswa, setAllSiswa] = useState<Siswa[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pending changes
  const [pendingAssign, setPendingAssign] = useState<string[]>([]);
  const [pendingUnassign, setPendingUnassign] = useState<string[]>([]);

  // Fetch semesters on mount
  useEffect(() => {
    const fetchSemesters = async () => {
      const { data, error } = await supabase
        .from('semester')
        .select('*')
        .order('nama', { ascending: false });
      
      if (error) {
        setError('Gagal memuat data semester');
        return;
      }
      
      setSemesters(data || []);
      
      // Auto-select active semester
      const activeSemester = data?.find((s) => s.status === 'aktif');
      if (activeSemester) {
        setSelectedSemesterId(activeSemester.id);
      } else if (data && data.length > 0) {
        setSelectedSemesterId(data[0].id);
      }
    };
    
    fetchSemesters();
  }, []);

  // Fetch data when semester changes
  useEffect(() => {
    if (!selectedSemesterId) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch kelas dapo
        const { data: kelasData, error: kelasError } = await supabase
          .from('kelas_dapo')
          .select('*')
          .eq('semester_id', selectedSemesterId)
          .order('jenjang')
          .order('nama');
        
        if (kelasError) throw kelasError;
        setKelasDapo(kelasData || []);
        
        // Select first kelas by default
        if (kelasData && kelasData.length > 0) {
          setSelectedKelasId(kelasData[0].id);
        } else {
          setSelectedKelasId(null);
        }
        
        // Fetch siswa_kelas for this semester
        const { data: siswaKelasData, error: siswaKelasError } = await supabase
          .from('siswa_kelas')
          .select('*, siswa(*)')
          .eq('semester_id', selectedSemesterId);
        
        if (siswaKelasError) throw siswaKelasError;
        setSiswaKelas(siswaKelasData || []);
        
        // Fetch all active students
        const { data: siswaData, error: siswaError } = await supabase
          .from('siswa')
          .select('*')
          .eq('status', 'aktif')
          .order('nama');
        
        if (siswaError) throw siswaError;
        setAllSiswa(siswaData || []);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Gagal memuat data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [selectedSemesterId, supabase]);

  // Compute assigned and unassigned students
  const assignedSiswaIds = new Set(
    siswaKelas
      .filter((sk) => sk.kelas_dapo_id === selectedKelasId)
      .map((sk) => sk.siswa_id)
  );
  
  const assignedItems: TwoColumnItem[] = siswaKelas
    .filter((sk) => sk.kelas_dapo_id === selectedKelasId)
    .map((sk) => ({
      id: sk.id,
      name: sk.siswa?.nama || 'Unknown',
      secondary: sk.siswa?.nis || '',
    }));
  
  const unassignedItems: TwoColumnItem[] = allSiswa
    .filter((s) => !assignedSiswaIds.has(s.id))
    .map((s) => ({
      id: s.id,
      name: s.nama,
      secondary: s.nis,
    }));

  // Handlers
  const handleAssign = (siswaIds: string[]) => {
    setPendingAssign((prev) => Array.from(new Set([...prev, ...siswaIds])));
    setPendingUnassign((prev) => prev.filter((id) => !siswaIds.includes(id)));
  };

  const handleUnassign = (siswaKelasIds: string[]) => {
    setPendingUnassign((prev) => Array.from(new Set([...prev, ...siswaKelasIds])));
    setPendingAssign((prev) => prev.filter((id) => !siswaKelasIds.includes(id)));
  };

  const handleSave = async () => {
    if (!selectedSemesterId || !selectedKelasId) return;
    
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Handle unassignments
      if (pendingUnassign.length > 0) {
        const { error: unassignError } = await supabase
          .from('siswa_kelas')
          .update({ kelas_dapo_id: null })
          .in('id', pendingUnassign);
        
        if (unassignError) throw unassignError;
      }
      
      // Handle assignments
      if (pendingAssign.length > 0) {
        const assignRecords = pendingAssign.map((siswaId) => ({
          siswa_id: siswaId,
          semester_id: selectedSemesterId,
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
      
      // Refresh data
      const { data: refreshedData, error: refreshError } = await supabase
        .from('siswa_kelas')
        .select('*, siswa(*)')
        .eq('semester_id', selectedSemesterId);
      
      if (refreshError) throw refreshError;
      setSiswaKelas(refreshedData || []);
      
      // Reset pending changes
      setPendingAssign([]);
      setPendingUnassign([]);
      
      setSuccess('Perubahan berhasil disimpan!');
    } catch (err) {
      console.error('Error saving:', err);
      setError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedKelas = kelasDapo.find((k) => k.id === selectedKelasId);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Distribusi Siswa ke Kelas</h1>
          <p className="text-muted-foreground">
            Bagikan siswa ke kelas Dapodik untuk semester yang aktif
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-500 bg-green-50">
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-64">
            <label className="text-sm font-medium mb-2 block">Semester</label>
            <Select
              value={selectedSemesterId || ''}
              onValueChange={(value) => setSelectedSemesterId(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih semester" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((semester) => (
                  <SelectItem key={semester.id} value={semester.id}>
                    {semester.nama} {semester.status === 'aktif' && '(Aktif)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-64">
            <label className="text-sm font-medium mb-2 block">Kelas</label>
            <Select
              value={selectedKelasId || ''}
              onValueChange={(value) => {
                setSelectedKelasId(value);
                setPendingAssign([]);
                setPendingUnassign([]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                {kelasDapo.map((kelas) => (
                  <SelectItem key={kelas.id} value={kelas.id}>
                    Kelas {kelas.nama} (Jenjang {kelas.jenjang})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 flex items-end">
            <div className="text-sm text-muted-foreground">
              <Users className="inline-block h-4 w-4 mr-1" />
              Total siswa aktif: {allSiswa.length}
              {selectedKelas && (
                <> | Di kelas ini: {assignedItems.length}</>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Panel */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : !selectedKelasId ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Pilih semester dan kelas untuk memulai distribusi siswa
          </CardContent>
        </Card>
      ) : (
        <TwoColumnPanel
          unassignedItems={unassignedItems}
          assignedItems={assignedItems}
          onAssign={handleAssign}
          onUnassign={handleUnassign}
          onSave={handleSave}
          isSaving={isSaving}
          leftTitle={`Siswa di Kelas ${selectedKelas?.nama || ''}`}
          rightTitle="Siswa Belum Terkelas"
          renderItem={(item, source) => (
            <div className="flex flex-col">
              <span className="font-medium">{item.name}</span>
              <span className="text-sm text-muted-foreground">
                NIS: {item.secondary || '-'}
              </span>
            </div>
          )}
        />
      )}

      {/* Legend */}
      <Card>
        <CardContent className="py-4">
          <div className="text-sm text-muted-foreground">
            <p><strong>Petunjuk:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Klik siswa di panel kanan untuk menambahkan ke kelas</li>
              <li>Klik siswa di panel kiri untuk menghapus dari kelas</li>
              <li>Gunakan tombol &quot;Pilih Semua&quot; untuk memilih semua siswa yang terlihat</li>
              <li>Perubahan akan disimpan saat tombol &quot;Simpan Perubahan&quot; ditekan</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
