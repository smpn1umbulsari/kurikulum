'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TwoColumnPanel, TwoColumnItem } from '@/components/data-master/two-column-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, AlertTriangle, Info } from 'lucide-react';
import type { Database } from '@/types/database';

type Semester = Database['public']['Tables']['semester']['Row'];
type KelasReal = Database['public']['Tables']['kelas_real']['Row'];
type Siswa = Database['public']['Tables']['siswa']['Row'];
type SiswaKelas = Database['public']['Tables']['siswa_kelas']['Row'];

interface JenjangOption {
  jenjang: number;
  label: string;
}

export default function DistribusiSiswaTitipanPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // Data state
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [kelasReal, setKelasReal] = useState<KelasReal[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState<string | null>(null);
  const [selectedJenjang, setSelectedJenjang] = useState<number | null>(null);
  const [siswaKelas, setSiswaKelas] = useState<SiswaKelas[]>([]);
  const [allSiswa, setAllSiswa] = useState<Siswa[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pending changes
  const [pendingAssign, setPendingAssign] = useState<string[]>([]);
  const [pendingUnassign, setPendingUnassign] = useState<string[]>([]);

  // Jenjang options (7, 8, 9)
  const jenjangOptions: JenjangOption[] = [
    { jenjang: 7, label: 'Kelas 7 (VII)' },
    { jenjang: 8, label: 'Kelas 8 (VIII)' },
    { jenjang: 9, label: 'Kelas 9 (IX)' },
  ];

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
        // Fetch kelas real
        const { data: kelasData, error: kelasError } = await supabase
          .from('kelas_real')
          .select('*')
          .eq('semester_id', selectedSemesterId)
          .order('jenjang')
          .order('nama');
        
        if (kelasError) throw kelasError;
        setKelasReal(kelasData || []);
        
        // Auto-select first jenjang
        if (kelasData && kelasData.length > 0) {
          const firstJenjang = Math.min(...kelasData.map(k => k.jenjang));
          setSelectedJenjang(firstJenjang);
          
          // Select first kelas of that jenjang
          const firstKelasOfJenjang = kelasData.find(k => k.jenjang === firstJenjang);
          if (firstKelasOfJenjang) {
            setSelectedKelasId(firstKelasOfJenjang.id);
          }
        }
        
        // Fetch siswa_kelas for this semester
        const { data: siswaKelasData, error: siswaKelasError } = await supabase
          .from('siswa_kelas')
          .select('*')
          .eq('semester_id', selectedSemesterId);
        
        if (siswaKelasError) throw siswaKelasError;
        setSiswaKelas(siswaKelasData || []);
        
        // Fetch all active students with their kelas info
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

  // Reset kelas when jenjang changes
  useEffect(() => {
    if (!selectedJenjang || kelasReal.length === 0) return;
    
    const kelasOfJenjang = kelasReal.filter(k => k.jenjang === selectedJenjang);
    if (kelasOfJenjang.length > 0) {
      setSelectedKelasId(kelasOfJenjang[0].id);
    }
    
    // Reset pending changes
    setPendingAssign([]);
    setPendingUnassign([]);
  }, [selectedJenjang, kelasReal]);

  // Filter kelas by jenjang
  const filteredKelas = useMemo(() => {
    if (!selectedJenjang) return kelasReal;
    return kelasReal.filter(k => k.jenjang === selectedJenjang);
  }, [kelasReal, selectedJenjang]);

  // Get jenjang of selected kelas
  const selectedKelasJenjang = useMemo(() => {
    const kelas = kelasReal.find(k => k.id === selectedKelasId);
    return kelas?.jenjang || null;
  }, [kelasReal, selectedKelasId]);

  // Check if more than 2 jenjang in target kelas
  const jenjangWarning = useMemo(() => {
    if (!selectedKelasId || !selectedJenjang) return null;
    
    // Get all jenjang in selected kelas
    const jenjangsInKelas = new Set(
      siswaKelas
        .filter(sk => sk.kelas_real_id === selectedKelasId && sk.jenjang !== selectedJenjang)
        .map(sk => sk.jenjang)
        .filter(Boolean)
    );
    
    // Add the target jenjang
    jenjangsInKelas.add(selectedJenjang);
    
    if (jenjangsInKelas.size > 2) {
      return `PERINGATAN: Ruang ini sudah diisi ${jenjangsInKelas.size} jenjang berbeda. Maksimal 2 jenjang per ruang ujian.`;
    }
    
    if (jenjangsInKelas.size === 2) {
      return `CATATAN: Ruang ini sudah diisi 2 jenjang. Jenjang yang akan ditambahkan: ${Array.from(jenjangsInKelas).join(', ')}`;
    }
    
    return null;
  }, [selectedKelasId, selectedJenjang, siswaKelas]);

  // Compute assigned and unassigned students for titipan
  const assignedSiswaKelas = siswaKelas.filter(
    (sk) => sk.kelas_real_id === selectedKelasId && sk.is_titipan
  );
  
  const assignedSiswaIds = new Set(assignedSiswaKelas.map((sk) => sk.siswa_id));
  
  const assignedItems: TwoColumnItem[] = assignedSiswaKelas
    .map((sk) => {
      const siswa = allSiswa.find(s => s.id === sk.siswa_id);
      return {
        id: sk.id,
        name: siswa?.nama || 'Unknown',
        secondary: siswa?.nis || '',
        metadata: { jenjang: sk.jenjang },
      };
    });
  
  // Unassigned items: siswa from other kelas of SAME jenjang who are not yet titipan
  const unassignedItems: TwoColumnItem[] = allSiswa
    .filter((s) => {
      // Must be same jenjang
      if (s.jenjang !== selectedJenjang) return false;
      
      // Must not be already assigned to this kelas as titipan
      if (assignedSiswaIds.has(s.id)) return false;
      
      // Must be assigned to SOME kelas_real (not titipan)
      const existingAssignment = siswaKelas.find(
        sk => sk.siswa_id === s.id && !sk.is_titipan
      );
      
      return !!existingAssignment;
    })
    .map((s) => ({
      id: s.id,
      name: s.nama,
      secondary: s.nis,
      metadata: { jenjang: s.jenjang },
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
    if (!selectedSemesterId || !selectedKelasId || !selectedJenjang) return;
    
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Handle unassignments (remove titipan status)
      if (pendingUnassign.length > 0) {
        // First, get siswa_ids from siswa_kelas ids
        const siswaKelasToUpdate = siswaKelas.filter(sk => pendingUnassign.includes(sk.id));
        const siswaIds = siswaKelasToUpdate.map(sk => sk.siswa_id);
        
        // Update to remove from current kelas and keep titipan = false
        for (const siswaKelasId of pendingUnassign) {
          const sk = siswaKelas.find(s => s.id === siswaKelasId);
          if (sk && sk.is_titipan) {
            // Just set kelas_real_id to null, keep them in their main kelas
            const { error: unassignError } = await supabase
              .from('siswa_kelas')
              .update({ kelas_real_id: null, is_titipan: false })
              .eq('id', siswaKelasId);
            
            if (unassignError) throw unassignError;
          }
        }
      }
      
      // Handle assignments (add as titipan)
      if (pendingAssign.length > 0) {
        for (const siswaId of pendingAssign) {
          // Check if siswa_kelas record exists for this siswa
          const existingRecord = siswaKelas.find(
            sk => sk.siswa_id === siswaId && sk.semester_id === selectedSemesterId
          );
          
          if (existingRecord) {
            // Update existing record to add as titipan
            const { error: assignError } = await supabase
              .from('siswa_kelas')
              .update({
                kelas_real_id: selectedKelasId,
                jenjang: selectedJenjang,
                is_titipan: true,
              })
              .eq('id', existingRecord.id);
            
            if (assignError) throw assignError;
          } else {
            // Create new siswa_kelas record for titipan
            const { error: assignError } = await supabase
              .from('siswa_kelas')
              .insert({
                siswa_id: siswaId,
                semester_id: selectedSemesterId,
                kelas_real_id: selectedKelasId,
                jenjang: selectedJenjang,
                is_titipan: true,
              });
            
            if (assignError) throw assignError;
          }
        }
      }
      
      // Refresh data
      const { data: refreshedData, error: refreshError } = await supabase
        .from('siswa_kelas')
        .select('*')
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

  const selectedKelas = kelasReal.find((k) => k.id === selectedKelasId);

  // Count students per jenjang in selected kelas
  const jenjangCounts = useMemo(() => {
    if (!selectedKelasId) return {};
    
    const counts: Record<number, number> = {};
    siswaKelas
      .filter(sk => sk.kelas_real_id === selectedKelasId)
      .forEach(sk => {
        if (sk.jenjang) {
          counts[sk.jenjang] = (counts[sk.jenjang] || 0) + 1;
        }
      });
    
    return counts;
  }, [selectedKelasId, siswaKelas]);

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
          <h1 className="text-3xl font-bold">Distribusi Siswa Titipan</h1>
          <p className="text-muted-foreground">
            Bagikan siswa titipan ke kelas Real (jenjang SAMA)
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="border-blue-500 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          <strong>Aturan Penitipan:</strong> Siswa titipan hanya boleh ditempatkan di kelas dengan jenjang yang SAMA. 
          Maksimal 2 jenjang berbeda dalam 1 ruang ujian.
        </AlertDescription>
      </Alert>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-500 bg-green-50">
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Warning Alert */}
      {jenjangWarning && (
        <Alert variant="destructive" className="border-orange-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{jenjangWarning}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-48">
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
          
          <div className="w-full md:w-48">
            <label className="text-sm font-medium mb-2 block">Jenjang</label>
            <Select
              value={selectedJenjang?.toString() || ''}
              onValueChange={(value) => setSelectedJenjang(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenjang" />
              </SelectTrigger>
              <SelectContent>
                {jenjangOptions.map((opt) => (
                  <SelectItem key={opt.jenjang} value={opt.jenjang.toString()}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-64">
            <label className="text-sm font-medium mb-2 block">Kelas Real Tujuan</label>
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
                {filteredKelas.map((kelas) => {
                  const count = jenjangCounts[kelas.jenjang] || 0;
                  return (
                    <SelectItem key={kelas.id} value={kelas.id}>
                      Kelas {kelas.nama} (Ruang {kelas.ruang || '-'})
                      {count > 0 && ` - ${count} siswa`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 flex items-end">
            <div className="text-sm text-muted-foreground">
              <Users className="inline-block h-4 w-4 mr-1" />
              Siswa titipan di kelas ini: {assignedItems.length}
              {selectedKelas && selectedJenjang && (
                <> | Jenjang {selectedJenjang}: {jenjangCounts[selectedJenjang] || 0} siswa</>
              )}
            </div>
          </div>
        </CardContent>
        
        {/* Jenjang breakdown */}
        {selectedKelasId && Object.keys(jenjangCounts).length > 0 && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Distribusi Jenjang:</span>
              {Object.entries(jenjangCounts).map(([jenjang, count]) => (
                <Badge 
                  key={jenjang} 
                  variant={parseInt(jenjang) === selectedJenjang ? 'default' : 'secondary'}
                >
                  Kelas {jenjang}: {count} siswa
                </Badge>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Two Column Panel */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : !selectedKelasId || !selectedJenjang ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Pilih jenjang dan kelas untuk memulai distribusi siswa titipan
          </CardContent>
        </Card>
      ) : unassignedItems.length === 0 && assignedItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Tidak ada siswa yang bisa dititipkan di jenjang {selectedJenjang}
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
          leftTitle={`Siswa Titipan Jenjang ${selectedJenjang}`}
          rightTitle={`Siswa Tersedia (Jenjang ${selectedJenjang})`}
          renderItem={(item) => {
            const jenjangVal = item.metadata?.jenjang as number | undefined;
            return (
              <div className="flex flex-col">
                <span className="font-medium">{item.name}</span>
                <span className="text-sm text-muted-foreground">
                  NIS: {item.secondary || '-'}
                  {jenjangVal != null && ` | Kelas ${jenjangVal}`}
                </span>
              </div>
            );
          }}
        />
      )}

      {/* Legend */}
      <Card>
        <CardContent className="py-4">
          <div className="text-sm text-muted-foreground">
            <p><strong>Petunjuk:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Siswa titipan hanya bisa dipindahkan antar kelas dengan jenjang SAMA</li>
              <li>Klik siswa di panel kanan untuk menambahkan sebagai titipan</li>
              <li>Klik siswa di panel kiri untuk menghapus status titipan</li>
              <li>Perubahan akan disimpan saat tombol &quot;Simpan Perubahan&quot; ditekan</li>
              <li>Perhatikan warning jika lebih dari 2 jenjang dalam 1 ruang</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
