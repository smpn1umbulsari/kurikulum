# SPEC.md - Guru Spenturi v2 Database Specification

**Version:** 2.0  
**Date:** 15 Juni 2026  
**Status:** Backend Complete (UI Pending)

---

## Table of Contents

1. [Database Overview](#database-overview)
2. [Migrations Summary](#migrations-summary)
3. [Tables Documentation](#tables-documentation)
4. [RPC Functions](#rpc-functions)
5. [Hooks Reference](#hooks-reference)
6. [Type Definitions](#type-definitions)
7. [RLS Policies](#rls-policies)

---

## Database Overview

### Technology Stack

- **Database:** PostgreSQL (via Supabase)
- **Auth:** Supabase Auth with JWT
- **RLS:** Row Level Security enabled on all tables

### Migration Files

| Migration | File                              | Purpose                        |
| --------- | --------------------------------- | ------------------------------ |
| 006       | 006_add_tahun_lulus_siswa.sql     | Add tahun_lulus to siswa       |
| 007       | 007_pembagian_mengajar_tables.sql | Pembagian Mengajar tables      |
| 008       | 008_rpc_functions.sql             | Dashboard & Sync RPCs          |
| 009       | 009_nilai_tables.sql              | Nilai, Kehadiran, Rapor tables |
| 010       | 010_nilai_rpc_functions.sql       | Nilai Input & Rapor RPCs       |
| 011       | 011_asesmen_tables.sql            | Asesmen & Jadwal tables        |
| 012       | 012_finalisasi_tables.sql         | Backup, Validation, Settings   |
| 013       | 013_tugas_tambahan_tables.sql     | Tugas Tambahan tables          |

---

## Tables Documentation

### 006 - Siswa Enhancement

#### `siswa` (Modified)

```sql
-- Added columns:
tahun_lulus INTEGER  -- Tahun lulus alumni
```

---

### 007 - Pembagian Mengajar

#### `pembagian_mengajar`

| Column             | Type        | Description                      |
| ------------------ | ----------- | -------------------------------- |
| id                 | UUID        | Primary key                      |
| semester_id        | UUID        | FK to semester                   |
| guru_id            | UUID        | FK to guru                       |
| mata_pelajaran_id  | UUID        | FK to mata_pelajaran             |
| jenjang            | INTEGER     | 7, 8, or 9                       |
| jenis_mengajar     | ENUM        | 'dapo' or 'real'                 |
| kelas_id           | UUID        | FK to kelas_dapo or kelas_real   |
| tahun_pelajaran_id | UUID        | FK to tahun_pelajaran            |
| jam_mengajar       | DECIMAL     | Hours per week                   |
| status_pembagian   | ENUM        | 'draft', 'published', 'archived' |
| created_by         | UUID        | FK to pengguna                   |
| created_at         | TIMESTAMPTZ | Creation timestamp               |
| updated_at         | TIMESTAMPTZ | Last update                      |
| updated_by         | UUID        | Last modifier                    |

**Unique Constraint:** semester_id, guru_id, mata_pelajaran_id, jenjang, jenis_mengajar, kelas_id

#### `konflik_pembagian`

| Column            | Type        | Description                                       |
| ----------------- | ----------- | ------------------------------------------------- |
| id                | UUID        | Primary key                                       |
| semester_id       | UUID        | FK to semester                                    |
| guru_id           | UUID        | FK to guru                                        |
| mata_pelajaran_id | UUID        | FK to mata_pelajaran                              |
| jenjang           | INTEGER     | 7, 8, or 9                                        |
| jenis_mengajar    | ENUM        | 'dapo' or 'real'                                  |
| kelas_id          | UUID        | Target class                                      |
| konflik_type      | TEXT        | 'guru_double', 'mapel_double', 'jenjang_mismatch' |
| deskripsi         | TEXT        | Conflict details                                  |
| resolved          | BOOLEAN     | Resolution status                                 |
| resolved_at       | TIMESTAMPTZ | Resolution time                                   |
| resolved_by       | UUID        | Resolver                                          |
| created_at        | TIMESTAMPTZ | Creation timestamp                                |

#### `audit_log_sync`

| Column          | Type        | Description                                                |
| --------------- | ----------- | ---------------------------------------------------------- |
| id              | UUID        | Primary key                                                |
| semester_id     | UUID        | FK to semester                                             |
| action          | TEXT        | 'sync_dapo_to_real', 'sync_real_to_dapo', 'force_override' |
| total_records   | INTEGER     | Total records processed                                    |
| conflicts_found | INTEGER     | Conflicts found                                            |
| records_updated | INTEGER     | Records updated                                            |
| performed_by    | UUID        | FK to pengguna                                             |
| performed_at    | TIMESTAMPTZ | Action timestamp                                           |
| details         | JSONB       | Additional details                                         |

---

### 009 - Nilai & Penilaian

#### `nilai`

| Column            | Type        | Description                                    |
| ----------------- | ----------- | ---------------------------------------------- |
| id                | UUID        | Primary key                                    |
| siswa_id          | UUID        | FK to siswa                                    |
| semester_id       | UUID        | FK to semester                                 |
| mata_pelajaran_id | UUID        | FK to mata_pelajaran                           |
| guru_id           | UUID        | FK to guru                                     |
| jenjang           | INTEGER     | 7, 8, or 9                                     |
| jenis_nilai       | ENUM        | 'UH1'-'UH5', 'PTS', 'PAS', 'SEMESTER', 'RAPOR' |
| nilai             | DECIMAL     | Grade value (0-100)                            |
| deskripsi         | TEXT        | Optional description                           |
| status_nilai      | ENUM        | 'draft', 'submitted', 'approved'               |
| entered_by        | UUID        | FK to pengguna                                 |
| entered_at        | TIMESTAMPTZ | Entry timestamp                                |
| updated_by        | UUID        | Last modifier                                  |
| updated_at        | TIMESTAMPTZ | Last update                                    |

**Unique Constraint:** siswa_id, semester_id, mata_pelajaran_id, jenis_nilai

#### `kehadiran`

| Column      | Type        | Description        |
| ----------- | ----------- | ------------------ |
| id          | UUID        | Primary key        |
| siswa_id    | UUID        | FK to siswa        |
| semester_id | UUID        | FK to semester     |
| total_sakit | INTEGER     | Sick days count    |
| total_izin  | INTEGER     | Permitted absences |
| total_alpha | INTEGER     | Unexcused absences |
| catatan     | TEXT        | Additional notes   |
| entered_by  | UUID        | FK to pengguna     |
| entered_at  | TIMESTAMPTZ | Entry timestamp    |
| updated_by  | UUID        | Last modifier      |
| updated_at  | TIMESTAMPTZ | Last update        |

**Unique Constraint:** siswa_id, semester_id

#### `catatan_walas`

| Column        | Type        | Description                                    |
| ------------- | ----------- | ---------------------------------------------- |
| id            | UUID        | Primary key                                    |
| semester_id   | UUID        | FK to semester                                 |
| kelas_id      | UUID        | FK to kelas_real                               |
| siswa_id      | UUID        | FK to siswa                                    |
| catatan       | TEXT        | Note content                                   |
| jenis_catatan | TEXT        | 'umum', 'akademik', 'non_akademik', 'karakter' |
| created_by    | UUID        | FK to pengguna                                 |
| created_at    | TIMESTAMPTZ | Creation timestamp                             |
| updated_by    | UUID        | Last modifier                                  |
| updated_at    | TIMESTAMPTZ | Last update                                    |

**Unique Constraint:** semester_id, kelas_id, siswa_id, jenis_catatan

#### `rapor_status`

| Column                | Type        | Description        |
| --------------------- | ----------- | ------------------ |
| id                    | UUID        | Primary key        |
| semester_id           | UUID        | FK to semester     |
| siswa_id              | UUID        | FK to siswa        |
| status_prasyarat      | BOOLEAN     | Prerequisites met  |
| status_nilai          | BOOLEAN     | Grades complete    |
| status_kehadiran      | BOOLEAN     | Attendance entered |
| status_catatan        | BOOLEAN     | Notes added        |
| status_ditandatangani | BOOLEAN     | Signed             |
| status_cetak          | BOOLEAN     | Printed            |
| last_checked_at       | TIMESTAMPTZ | Last check         |
| generated_at          | TIMESTAMPTZ | Generation time    |
| generated_by          | UUID        | FK to pengguna     |
| created_at            | TIMESTAMPTZ | Creation timestamp |
| updated_at            | TIMESTAMPTZ | Last update        |

**Unique Constraint:** semester_id, siswa_id

---

### 011 - Asesmen

#### `asesmen`

| Column          | Type        | Description                       |
| --------------- | ----------- | --------------------------------- |
| id              | UUID        | Primary key                       |
| nama            | VARCHAR     | Assessment name                   |
| jenis_asesmen   | ENUM        | 'ASTS', 'ASAS', 'ASAT', 'ASAJ'    |
| semester_id     | UUID        | FK to semester                    |
| tanggal_mulai   | DATE        | Start date                        |
| tanggal_selesai | DATE        | End date                          |
| status          | ENUM        | 'draft', 'published', 'completed' |
| created_by      | UUID        | FK to pengguna                    |
| created_at      | TIMESTAMPTZ | Creation timestamp                |
| updated_at      | TIMESTAMPTZ | Last update                       |

**Unique Constraint:** semester_id, jenis_asesmen

#### `jadwal_ujian`

| Column            | Type        | Description          |
| ----------------- | ----------- | -------------------- |
| id                | UUID        | Primary key          |
| asesmen_id        | UUID        | FK to asesmen        |
| mata_pelajaran_id | UUID        | FK to mata_pelajaran |
| jenjang           | INTEGER     | 7, 8, or 9           |
| hari              | VARCHAR     | Day name             |
| tanggal           | DATE        | Exam date            |
| jam_mulai         | TIME        | Start time           |
| jam_selesai       | TIME        | End time             |
| created_by        | UUID        | FK to pengguna       |
| created_at        | TIMESTAMPTZ | Creation timestamp   |
| updated_at        | TIMESTAMPTZ | Last update          |

#### `jadwal_mengawasi`

| Column       | Type        | Description         |
| ------------ | ----------- | ------------------- |
| id           | UUID        | Primary key         |
| asesmen_id   | UUID        | FK to asesmen       |
| guru_id      | UUID        | FK to guru          |
| hari         | VARCHAR     | Day name            |
| jam_mulai    | TIME        | Start time          |
| jam_selesai  | TIME        | End time            |
| is_available | BOOLEAN     | Availability status |
| keterangan   | TEXT        | Notes               |
| created_at   | TIMESTAMPTZ | Creation timestamp  |

#### `nomor_peserta`

| Column             | Type        | Description           |
| ------------------ | ----------- | --------------------- |
| id                 | UUID        | Primary key           |
| asesmen_id         | UUID        | FK to asesmen         |
| siswa_id           | UUID        | FK to siswa           |
| nomor_peserta      | VARCHAR     | Exam number           |
| jenjang            | INTEGER     | Grade level           |
| tahun_pelajaran_id | UUID        | FK to tahun_pelajaran |
| ruang_id           | UUID        | FK to ruang_ujian     |
| nomor_absen        | INTEGER     | Seat number           |
| created_at         | TIMESTAMPTZ | Creation timestamp    |

**Unique Constraint:** asesmen_id, siswa_id

#### `ruang_ujian`

| Column     | Type        | Description           |
| ---------- | ----------- | --------------------- |
| id         | UUID        | Primary key           |
| nama       | VARCHAR     | Room name             |
| kapasitas  | INTEGER     | Capacity (default 36) |
| jenjang    | INTEGER     | Grade level           |
| created_at | TIMESTAMPTZ | Creation timestamp    |

#### `pembagian_ruang`

| Column     | Type        | Description        |
| ---------- | ----------- | ------------------ |
| id         | UUID        | Primary key        |
| asesmen_id | UUID        | FK to asesmen      |
| jenjang    | INTEGER     | Grade level        |
| ruang_id   | UUID        | FK to ruang_ujian  |
| siswa_id   | UUID        | FK to siswa        |
| created_at | TIMESTAMPTZ | Creation timestamp |

**Unique Constraint:** asesmen_id, siswa_id

#### `kepengawasan`

| Column          | Type        | Description        |
| --------------- | ----------- | ------------------ |
| id              | UUID        | Primary key        |
| asesmen_id      | UUID        | FK to asesmen      |
| jadwal_ujian_id | UUID        | FK to jadwal_ujian |
| guru_id         | UUID        | FK to guru         |
| ruang_id        | UUID        | FK to ruang_ujian  |
| created_at      | TIMESTAMPTZ | Creation timestamp |

**Unique Constraint:** asesmen_id, jadwal_ujian_id, guru_id

---

### 012 - Finalisasi

#### `backup_log`

| Column        | Type        | Description                          |
| ------------- | ----------- | ------------------------------------ |
| id            | UUID        | Primary key                          |
| backup_type   | TEXT        | 'manual', 'scheduled'                |
| file_name     | VARCHAR     | Backup file name                     |
| file_size     | BIGINT      | File size in bytes                   |
| status        | TEXT        | 'in_progress', 'completed', 'failed' |
| error_message | TEXT        | Error details                        |
| started_at    | TIMESTAMPTZ | Start time                           |
| completed_at  | TIMESTAMPTZ | Completion time                      |
| performed_by  | UUID        | FK to pengguna                       |

#### `restore_log`

| Column            | Type        | Description                          |
| ----------------- | ----------- | ------------------------------------ |
| id                | UUID        | Primary key                          |
| backup_file       | VARCHAR     | Backup file reference                |
| status            | TEXT        | 'in_progress', 'completed', 'failed' |
| tables_restored   | INTEGER     | Tables count                         |
| records_restored  | BIGINT      | Records count                        |
| error_message     | TEXT        | Error details                        |
| started_at        | TIMESTAMPTZ | Start time                           |
| completed_at      | TIMESTAMPTZ | Completion time                      |
| performed_by      | UUID        | FK to pengguna                       |
| confirmed_by      | UUID        | FK to pengguna                       |
| confirmation_note | TEXT        | Confirmation notes                   |

#### `validation_rule`

| Column        | Type        | Description                             |
| ------------- | ----------- | --------------------------------------- |
| id            | UUID        | Primary key                             |
| rule_name     | VARCHAR     | Rule identifier                         |
| table_name    | VARCHAR     | Target table                            |
| field_name    | VARCHAR     | Target field                            |
| rule_type     | TEXT        | 'unique', 'required', 'range', 'custom' |
| rule_config   | JSONB       | Rule configuration                      |
| error_message | TEXT        | Error message                           |
| severity      | TEXT        | 'error', 'warning'                      |
| is_active     | BOOLEAN     | Active status                           |
| created_at    | TIMESTAMPTZ | Creation timestamp                      |

**Unique Constraint:** table_name, rule_name

#### `validation_result`

| Column       | Type        | Description           |
| ------------ | ----------- | --------------------- |
| id           | UUID        | Primary key           |
| rule_id      | UUID        | FK to validation_rule |
| record_id    | UUID        | Failed record ID      |
| semester_id  | UUID        | FK to semester        |
| error_detail | TEXT        | Error details         |
| is_resolved  | BOOLEAN     | Resolution status     |
| resolved_at  | TIMESTAMPTZ | Resolution time       |
| resolved_by  | UUID        | FK to pengguna        |
| created_at   | TIMESTAMPTZ | Creation timestamp    |

#### `system_settings`

| Column        | Type        | Description                           |
| ------------- | ----------- | ------------------------------------- |
| id            | UUID        | Primary key                           |
| setting_key   | VARCHAR     | Setting identifier                    |
| setting_value | TEXT        | Setting value                         |
| setting_type  | TEXT        | 'string', 'boolean', 'number', 'json' |
| description   | TEXT        | Setting description                   |
| updated_by    | UUID        | FK to pengguna                        |
| updated_at    | TIMESTAMPTZ | Last update                           |

**Unique Constraint:** setting_key

#### `notification`

| Column     | Type        | Description                           |
| ---------- | ----------- | ------------------------------------- |
| id         | UUID        | Primary key                           |
| user_id    | UUID        | FK to pengguna                        |
| title      | VARCHAR     | Notification title                    |
| message    | TEXT        | Notification message                  |
| type       | TEXT        | 'info', 'success', 'warning', 'error' |
| is_read    | BOOLEAN     | Read status                           |
| link       | TEXT        | Related link                          |
| created_at | TIMESTAMPTZ | Creation timestamp                    |

---

### 013 - Tugas Tambahan

#### `tugas_tambahan`

| Column        | Type        | Description                                                                      |
| ------------- | ----------- | -------------------------------------------------------------------------------- |
| id            | UUID        | Primary key                                                                      |
| pengguna_id   | UUID        | FK to pengguna (linked to guru)                                                  |
| semester_id   | UUID        | FK to semester                                                                   |
| kelas_real_id | UUID        | FK to kelas_real (NULL if not walas)                                             |
| jenis_tugas   | ENUM        | 'wali_kelas', 'koordinator_7/8/9', 'kepala_kurikulum', 'laboran', 'perpustakaan' |
| jam_tugas     | DECIMAL     | Hours per week                                                                   |
| keterangan    | TEXT        | Notes                                                                            |
| is_active     | BOOLEAN     | Active status                                                                    |
| created_by    | UUID        | FK to pengguna                                                                   |
| created_at    | TIMESTAMPTZ | Creation timestamp                                                               |
| updated_at    | TIMESTAMPTZ | Last update                                                                      |

**Unique Constraint:** semester_id, pengguna_id, jenis_tugas

#### `kategori_tugas`

| Column         | Type        | Description             |
| -------------- | ----------- | ----------------------- |
| id             | UUID        | Primary key             |
| nama           | VARCHAR     | Category name           |
| deskripsi      | TEXT        | Description             |
| jam_default    | DECIMAL     | Default hours           |
| is_wali_kelas  | BOOLEAN     | Is wali kelas category  |
| is_koordinator | BOOLEAN     | Is coordinator category |
| created_at     | TIMESTAMPTZ | Creation timestamp      |

**Default Categories:**

- Wali Kelas 7/8/9 (24 jam)
- Koordinator 7/8/9 (8 jam)
- Kepala Kurikulum (40 jam)
- Laboran (20 jam)
- Perpustakaan (20 jam)

#### `ketersediaan_pengawas`

| Column       | Type        | Description         |
| ------------ | ----------- | ------------------- |
| id           | UUID        | Primary key         |
| guru_id      | UUID        | FK to guru          |
| semester_id  | UUID        | FK to semester      |
| hari         | VARCHAR     | Day name            |
| jam_mulai    | TIME        | Start time          |
| jam_selesai  | TIME        | End time            |
| is_available | BOOLEAN     | Availability status |
| keterangan   | TEXT        | Notes               |
| created_at   | TIMESTAMPTZ | Creation timestamp  |

**Unique Constraint:** guru_id, semester_id, hari, jam_mulai

---

## RPC Functions

### 008 - Dashboard & Sync

#### `get_dashboard_summary(p_user_id UUID)`

Returns role-specific dashboard data.

- **Superadmin:** Total guru, siswa, mapel, kelas, konflik, recent activity
- **Admin:** Total guru, siswa, mapel, kelas, pembagian pending
- **Guru:** Guru info, mapel diampu, kelas diampu, jam mengajar, jadwal
- **Siswa:** Siswa info, kelas info

#### `detect_pembagian_konflik(p_semester_id UUID)`

Detects conflicts in pembagian mengajar:

- Guru double assignment
- Mapel double assignment (same jenjang, different guru)

#### `sync_pembagian_dapo_to_real(p_semester_id, p_user_id, p_force_override)`

Syncs pembagian from Dapo to Real based on jenjang match.

#### `get_nilai_status_per_kelas(p_semester_id, p_jenjang)`

Returns nilai completion status per class.

---

### 010 - Nilai

#### `get_siswa_for_nilai_input(p_semester_id, p_guru_id, p_mapel_id, p_jenjang)`

Returns students with existing nilai for input interface.

#### `save_nilai_batch(p_nilai_data JSONB, p_user_id)`

Batch save nilai for multiple students.

#### `get_rekap_nilai(p_semester_id, p_jenjang, p_kelas_id, p_mapel_id, p_guru_id)`

Returns rekap nilai per kelas/mapel with statistics.

#### `check_rapor_prasyarat(p_semester_id, p_siswa_id)`

Checks if all prerequisites for rapor generation are met.

#### `generate_rapor_data(p_semester_id, p_siswa_id)`

Generates complete rapor data for a student.

#### `generate_nilai_template(p_semester_id, p_mapel_id, p_jenjang, p_jenis_nilai)`

Generates Excel template for nilai upload.

---

### 012 - System

#### `get_system_setting(p_key VARCHAR)`

Gets a system setting value.

#### `set_system_setting(p_key, p_value, p_user_id)`

Sets a system setting value.

#### `toggle_maintenance_mode(p_enabled, p_user_id)`

Toggles maintenance mode and notifies users.

---

### 013 - Tugas Tambahan

#### `get_guru_eligible_for_walas(p_semester_id, p_jenjang)`

Returns list of guru eligible for Wali Kelas with current assignments.

#### `assign_wali_kelas(p_pengguna_id, p_semester_id, p_kelas_real_id, p_jenjang, p_user_id)`

Assigns a guru as Wali Kelas with validation.

#### `get_tugas_tambahan_summary(p_semester_id)`

Returns summary of all tugas tambahan for a semester.

---

## Hooks Reference

### useAlumni

```typescript
// Hook for managing student alumni status
makeAlumni(siswaId: string, tahunLulus: number): Promise<boolean>
revertAlumni(siswaId: string): Promise<boolean>
getAlumniStats(): Promise<AlumniStats>
```

### useDashboard

```typescript
// Hook for fetching dashboard data
fetchDashboard(userId: string): Promise<DashboardSummary | null>
refresh(userId: string): Promise<DashboardSummary | null>
```

### usePembagianMengajar

```typescript
// Hook for managing teacher assignments
fetchAll(semesterId: string): Promise<PembagianMengajarWithRelations[]>
fetchByGuru(semesterId: string, guruId: string): Promise<PembagianMengajar[]>
create(data: Omit<PembagianMengajar, 'id' | 'timestamps'>): Promise<boolean>
update(id: string, data: Partial<PembagianMengajar>): Promise<boolean>
remove(id: string): Promise<boolean>
detectConflicts(semesterId: string): Promise<KonflikResult[]>
syncDapoToReal(semesterId: string, userId: string, forceOverride?: boolean): Promise<SyncResult | null>
batchUpsert(items: Array<Omit<PembagianMengajar, 'id' | 'timestamps'>>): Promise<boolean>
```

### useNilai

```typescript
// Hook for managing grades
getSiswaForInput(semesterId, guruId, mapelId, jenjang): Promise<SiswaNilaiInput[]>
saveNilaiBatch(nilaiData, userId): Promise<NilaiSaveResult | null>
getRekapNilai(semesterId, jenjang?, kelasId?, mapelId?, guruId?): Promise<RekapNilai[]>
checkRaporPrasyarat(semesterId, siswaId): Promise<PrasyaratResult>
generateRaporData(semesterId, siswaId): Promise<RaporData | null>
generateNilaiTemplate(semesterId, mapelId, jenjang, jenisNilai): Promise<TemplateData>
```

### useTugasTambahan

```typescript
// Hook for managing additional tasks
getGuruEligible(semesterId: string, jenjang?: number): Promise<GuruEligible[]>
assignWaliKelas(penggunaId, semesterId, kelasRealId, jenjang, userId): Promise<AssignResult>
getSummary(semesterId: string): Promise<TugasTambahanSummary | null>
getAllTugas(semesterId: string): Promise<TugasTambahan[]>
createTugas(tugas: Omit<TugasTambahan, 'id' | 'timestamps'>): Promise<boolean>
updateTugas(id: string, tugas: Partial<TugasTambahan>): Promise<boolean>
deleteTugas(id: string): Promise<boolean>
```

---

## Type Definitions

### database-extended.ts

```typescript
// Core Types
type jenis_mengajar_enum = 'dapo' | 'real'
type status_pembagian_enum = 'draft' | 'published' | 'archived'
type jenis_nilai_enum = 'UH1' | 'UH2' | 'UH3' | 'UH4' | 'UH5' | 'PTS' | 'PAS' | 'SEMESTER' | 'RAPOR'
type status_nilai_enum = 'draft' | 'submitted' | 'approved'
type jenis_tugas_enum = 'wali_kelas' | 'koordinator_7' | 'koordinator_8' | 'koordinator_9' | 'kepala_kurikulum' | 'laboran' | 'perpustakaan'

// Interfaces
interface PembagianMengajar { ... }
interface PembagianMengajarWithRelations { ... }
interface KonflikPembagian { ... }
interface AuditLogSync { ... }
interface DashboardSummary { ... }
interface KonflikResult { ... }
interface SyncResult { ... }
interface NilaiStatusPerKelas { ... }
interface Nilai { ... }
interface SiswaNilaiInput { ... }
interface NilaiSaveResult { ... }
interface RaporData { ... }
interface TugasTambahan { ... }
interface GuruEligible { ... }
interface TugasTambahanSummary { ... }
```

---

## RLS Policies

All tables have RLS enabled with the following patterns:

### Admin Policies

```sql
CREATE POLICY "[table]_all_admin" ON [table]
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));
```

### User-Specific Policies

```sql
-- Guru can manage their own data
CREATE POLICY "[table]_manage_guru" ON [table]
    FOR ALL USING (guru_id IN (SELECT id FROM guru WHERE pengguna_id = auth.uid()));

-- Guru can view assigned data
CREATE POLICY "[table]_read_guru" ON [table]
    FOR SELECT USING (guru_id IN (SELECT id FROM guru WHERE pengguna_id = auth.uid()));

-- Siswa can view their own data
CREATE POLICY "[table]_read_siswa" ON [table]
    FOR SELECT USING (siswa_id IN (SELECT id FROM siswa WHERE pengguna_id = auth.uid()));
```

---

## Notes

### UI Implementation Status

- **Backend:** 100% Complete
- **Frontend:** Pending (SKIPPED per request)

### Next Steps for UI Development

1. Create page components using existing hooks
2. Implement TwoColumnPanel for distribusi-siswa
3. Build spreadsheet-like input for nilai
4. Create PDF export for rapor

### Database Best Practices Applied

- All tables use UUID primary keys
- All tables have created_at/updated_at timestamps
- RLS enabled on all tables
- Proper foreign key constraints
- Indexes on frequently queried columns
- Unique constraints where needed

---

_Generated: 15 Juni 2026_  
_Last Updated: 15 Juni 2026_
