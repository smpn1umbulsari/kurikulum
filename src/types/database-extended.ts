// Extended database types for Sprint 2 - Pembagian Mengajar
// Add these to database.ts

export type jenis_mengajar_enum = 'dapo' | 'real'
export type status_pembagian_enum = 'draft' | 'published' | 'archived'

// Pembagian Mengajar types
export interface PembagianMengajar {
  id: string
  semester_id: string
  guru_id: string
  mata_pelajaran_id: string
  jenjang: number
  jenis_mengajar: jenis_mengajar_enum
  kelas_id: string
  tahun_pelajaran_id: string
  jam_mengajar: number
  status_pembagian: status_pembagian_enum
  created_by: string | null
  created_at: string
  updated_at: string
  updated_by: string | null
}

export interface PembagianMengajarWithRelations extends PembagianMengajar {
  guru?: { id: string; nama: string; kode_guru: string }
  mata_pelajaran?: { id: string; nama: string; kode_mapel: string }
  semester?: { id: string; nama: string }
  tahun_pelajaran?: { id: string; nama: string }
}

// Konflik types
export interface KonflikPembagian {
  id: string
  semester_id: string
  guru_id: string
  mata_pelajaran_id: string
  jenjang: number
  jenis_mengajar: jenis_mengajar_enum
  kelas_id: string
  konflik_type: string
  deskripsi: string | null
  resolved: boolean
  resolved_at: string | null
  resolved_by: string | null
  created_at: string
}

// Audit Log Sync
export interface AuditLogSync {
  id: string
  semester_id: string
  action: string
  total_records: number
  conflicts_found: number
  records_updated: number
  performed_by: string
  performed_at: string
  details: Record<string, unknown> | null
}

// Dashboard Summary types
export interface DashboardSummary {
  total_guru?: number
  total_siswa?: number
  total_siswa_alumni?: number
  total_mapel?: number
  total_kelas_dapo?: number
  total_kelas_real?: number
  total_kelas?: number
  pembagian_mengajar_pending?: number
  konflik_pending?: number
  semester_aktif?: {
    id: string
    nama: string
    tahun_pelajaran?: string
  }
  recent_activity?: Array<{
    action: string
    table: string
    timestamp: string
  }>
  guru_info?: {
    id: string
    nama: string
    kode_guru: string
  }
  total_mapel_diampu?: number
  total_kelas_diampu?: number
  total_jam_mengajar?: number
  jadwal_mengajar?: Array<{
    mapel: string
    jenjang: number
    jenis: string
    jam: number
  }>
  siswa_info?: {
    id: string
    nama: string
    nis: string
  }
  kelas_info?: {
    kelas_dapo: string
    kelas_real: string
  }
  error?: string
}

// Konflik detection result
export interface KonflikResult {
  type: 'guru_double' | 'mapel_double' | 'jenjang_mismatch' | 'real_exists'
  guru_id?: string
  mata_pelajaran_id?: string
  jenjang: number
  jenjangs?: number[]
  count?: number
  guru_count?: number
}

// Sync result
export interface SyncResult {
  success: boolean
  sync_count: number
  conflict_count: number
  message: string
}

// Nilai status per kelas
export interface NilaiStatusPerKelas {
  kelas_id: string
  kelas_nama: string
  jenjang: number
  wali_kelas: string | null
  total_siswa: number
  kelengkapan: number | null
}
