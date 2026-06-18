-- ============================================================================
-- DATABASE SCHEMA: GURU SPENTURI V2 (Supabase PostgreSQL)
-- ============================================================================
-- 
-- Versi: 2.2
-- Tanggal Update: 17 Juni 2026
-- Author: AI Database Architect
-- 
-- Schema ini mengkonsolidasikan semua tabel dari migrations 001-013
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ----------------------------------------------------------------------------

-- Role enum untuk RBAC
CREATE TYPE role_enum AS ENUM ('superadmin', 'admin', 'urusan', 'guru', 'siswa');
CREATE TYPE status_enum AS ENUM ('aktif', 'nonaktif');
CREATE TYPE status_siswa_enum AS ENUM ('aktif', 'nonaktif', 'alumni');
CREATE TYPE status_pegawai_enum AS ENUM ('PNS', 'PPPK', 'PPPK PW', 'GTT');
CREATE TYPE mode_penilaian_enum AS ENUM ('pts', 'semester');
CREATE TYPE mode_ttd_enum AS ENUM ('digital', 'basah');
CREATE TYPE jenis_kelamin_enum AS ENUM ('L', 'P');
CREATE TYPE acuan_kelas_enum AS ENUM ('real', 'dapo');
CREATE TYPE jam_ujian_enum AS ENUM ('Jam ke - 1', 'Jam ke - 2');
CREATE TYPE status_backup_enum AS ENUM ('sukses', 'gagal');

-- Jenis ujian Asesmen
CREATE TYPE jenis_ujian_enum AS ENUM (
  'Asesmen Sumatif Tengah Semester',
  'Asesmen Sumatif Akhir Semester',
  'Asesmen Sumatif Akhir Tahun',
  'Asesmen Sumatif Akhir Jenjang'
);

-- Hari enum
CREATE TYPE hari_enum AS ENUM (
  'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
);

-- Jenis tugas tambahan
CREATE TYPE jenis_tugas_enum AS ENUM (
  'wali_kelas',
  'koordinator_7',
  'koordinator_8',
  'koordinator_9',
  'kepala_kurikulum',
  'laboran',
  'perpustakaan',
  '辅导员'
);

-- ----------------------------------------------------------------------------
-- 2. MASTER DATA & PERIOD TABLES (INDEPENDENT)
-- ----------------------------------------------------------------------------

-- Tabel tahun pelajaran
CREATE TABLE tahun_pelajaran (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama        text NOT NULL UNIQUE,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Pengguna table (extends Supabase auth.users)
CREATE TABLE pengguna (
  id          uuid PRIMARY KEY,
  username    text UNIQUE NOT NULL,
  nama        text NOT NULL,
  role        role_enum NOT NULL,
  status      status_enum NOT NULL DEFAULT 'aktif',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Tabel guru
CREATE TABLE guru (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_guru       text UNIQUE NOT NULL,
  urutan          smallint,
  nama            text NOT NULL,
  status_pegawai  status_pegawai_enum NOT NULL,
  nip             text NOT NULL DEFAULT '-',
  status          status_enum NOT NULL DEFAULT 'aktif',
  pengguna_id     uuid REFERENCES pengguna(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),

  CONSTRAINT chk_nip_gtt CHECK (
    (status_pegawai = 'GTT' AND nip = '-') OR
    (status_pegawai != 'GTT' AND nip != '-')
  )
);

-- Tabel siswa
CREATE TABLE siswa (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nis             text UNIQUE NOT NULL,
  nisn            text,
  nipd            text,
  nama            text NOT NULL,
  jenis_kelamin   jenis_kelamin_enum NOT NULL,
  status          status_siswa_enum NOT NULL DEFAULT 'aktif',
  tahun_lulus     smallint,
  pengguna_id     uuid REFERENCES pengguna(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Tabel kepala sekolah
CREATE TABLE kepala_sekolah (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama                text NOT NULL,
  nip                 text NOT NULL,
  tanda_tangan_url    text CHECK (
    tanda_tangan_url IS NULL OR tanda_tangan_url LIKE 'https://%'
  ),
  status              status_enum NOT NULL DEFAULT 'aktif',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Tabel mata pelajaran
CREATE TABLE mata_pelajaran (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_mapel  text UNIQUE NOT NULL,
  nama        text NOT NULL,
  kelompok    text,
  agama       text,
  status      status_enum NOT NULL DEFAULT 'aktif',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. SEMESTER-DEPENDENT TABLES
-- ----------------------------------------------------------------------------

-- Tabel semester
CREATE TABLE semester (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tahun_pelajaran_id  uuid NOT NULL REFERENCES tahun_pelajaran(id),
  nama                text NOT NULL,
  status              status_enum NOT NULL DEFAULT 'nonaktif',
  mode_penilaian      mode_penilaian_enum NOT NULL DEFAULT 'pts',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),

  UNIQUE (tahun_pelajaran_id, nama)
);

-- Tabel kelas Dapodik
CREATE TABLE kelas_dapo (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id uuid NOT NULL REFERENCES semester(id),
  nama        text NOT NULL,
  jenjang     smallint NOT NULL CHECK (jenjang IN (7, 8, 9)),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),

  UNIQUE (semester_id, nama)
);

-- Tabel kelas Real
CREATE TABLE kelas_real (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id uuid NOT NULL REFERENCES semester(id),
  nama        text NOT NULL,
  jenjang     smallint NOT NULL CHECK (jenjang IN (7, 8, 9)),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),

  UNIQUE (semester_id, nama)
);

-- Tabel distribusi siswa ke kelas
CREATE TABLE siswa_kelas (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id            uuid NOT NULL REFERENCES siswa(id),
  semester_id         uuid NOT NULL REFERENCES semester(id),
  kelas_dapo_id       uuid REFERENCES kelas_dapo(id),
  kelas_real_id       uuid REFERENCES kelas_real(id),
  nomor_absen_dapo    smallint,
  nomor_absen_real    smallint,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),

  UNIQUE (siswa_id, semester_id)
);

-- ----------------------------------------------------------------------------
-- 4. TUGAS TAMBAHAN TABLES (v2.2)
-- ----------------------------------------------------------------------------

-- Tabel tugas tambahan
CREATE TABLE tugas_tambahan (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pengguna_id   uuid NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  semester_id   uuid NOT NULL REFERENCES semester(id) ON DELETE CASCADE,
  kelas_real_id uuid REFERENCES kelas_real(id),
  jenis         jenis_tugas_enum NOT NULL,
  jam_tugas     decimal(4,2) DEFAULT 0,
  keterangan    text,
  is_active     boolean DEFAULT true,
  created_by    uuid REFERENCES pengguna(id),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),

  UNIQUE (semester_id, pengguna_id, jenis),

  CONSTRAINT chk_wali_kelas_harus_ada_kelas CHECK (
    (jenis = 'wali_kelas' AND kelas_real_id IS NOT NULL) OR
    (jenis != 'wali_kelas' AND kelas_real_id IS NULL)
  )
);

-- Tabel kategori tugas
CREATE TABLE kategori_tugas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama            varchar(100) NOT NULL UNIQUE,
  deskripsi       text,
  jam_default     decimal(4,2) DEFAULT 0,
  is_wali_kelas   boolean DEFAULT false,
  is_koordinator  boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. CURRICULUM CONFIG & ASSIGNMENT TABLES
-- ----------------------------------------------------------------------------

-- Tabel komponen nilai (bobot penilaian)
CREATE TABLE komponen_nilai (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id         uuid NOT NULL REFERENCES semester(id),
  mata_pelajaran_id   uuid NOT NULL REFERENCES mata_pelajaran(id),
  bobot_uh            numeric(5,2) NOT NULL DEFAULT 40,
  bobot_pts           numeric(5,2) NOT NULL DEFAULT 30,
  bobot_semester      numeric(5,2) NOT NULL DEFAULT 30,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),

  UNIQUE (semester_id, mata_pelajaran_id),

  CONSTRAINT chk_bobot_total
    CHECK (bobot_uh + bobot_pts + bobot_semester = 100)
);

-- Tabel pembagian mengajar Dapodik
CREATE TABLE pembagian_mengajar_dapo (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id         uuid NOT NULL REFERENCES semester(id),
  guru_id             uuid NOT NULL REFERENCES guru(id),
  mata_pelajaran_id   uuid NOT NULL REFERENCES mata_pelajaran(id),
  kelas_dapo_id       uuid NOT NULL REFERENCES kelas_dapo(id),
  jam_pelajaran       smallint,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),

  UNIQUE (semester_id, guru_id, mata_pelajaran_id, kelas_dapo_id)
);

-- Tabel pembagian mengajar Real
CREATE TABLE pembagian_mengajar_real (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id         uuid NOT NULL REFERENCES semester(id),
  guru_id             uuid NOT NULL REFERENCES guru(id),
  mata_pelajaran_id   uuid NOT NULL REFERENCES mata_pelajaran(id),
  kelas_real_id       uuid NOT NULL REFERENCES kelas_real(id),
  jam_pelajaran       smallint,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),

  UNIQUE (semester_id, guru_id, mata_pelajaran_id, kelas_real_id)
);

-- ----------------------------------------------------------------------------
-- 6. GRADES & ATTENDANCE
-- ----------------------------------------------------------------------------

-- Tabel nilai siswa
CREATE TABLE nilai (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id           uuid NOT NULL REFERENCES semester(id),
  siswa_id              uuid NOT NULL REFERENCES siswa(id),
  mata_pelajaran_id     uuid NOT NULL REFERENCES mata_pelajaran(id),

  -- Komponen nilai
  uh1                   numeric(5,2) CHECK (uh1 BETWEEN 0 AND 100),
  uh2                   numeric(5,2) CHECK (uh2 BETWEEN 0 AND 100),
  uh3                   numeric(5,2) CHECK (uh3 BETWEEN 0 AND 100),
  uh4                   numeric(5,2) CHECK (uh4 BETWEEN 0 AND 100),
  uh5                   numeric(5,2) CHECK (uh5 BETWEEN 0 AND 100),
  pts                   numeric(5,2) CHECK (pts BETWEEN 0 AND 100),
  nilai_semester        numeric(5,2) CHECK (nilai_semester BETWEEN 0 AND 100),

  -- Snapshot bobot
  bobot_uh_pct          numeric(5,2) NOT NULL DEFAULT 40,
  bobot_pts_pct         numeric(5,2) NOT NULL DEFAULT 30,
  bobot_semester_pct    numeric(5,2) NOT NULL DEFAULT 30,

  -- RAPOR: generated column
  rapor                 numeric(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN uh1 IS NOT NULL AND uh2 IS NOT NULL AND uh3 IS NOT NULL
        AND uh4 IS NOT NULL AND uh5 IS NOT NULL
        AND pts IS NOT NULL AND nilai_semester IS NOT NULL
      THEN ROUND(
        ((uh1 + uh2 + uh3 + uh4 + uh5) / 5.0 * bobot_uh_pct / 100.0) +
        (pts * bobot_pts_pct / 100.0) +
        (nilai_semester * bobot_semester_pct / 100.0),
        2
      )
      ELSE NULL
    END
  ) STORED,

  terkunci              boolean NOT NULL DEFAULT false,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),

  UNIQUE (semester_id, siswa_id, mata_pelajaran_id),

  CONSTRAINT chk_uh_sequential CHECK (
    (uh2 IS NULL OR uh1 IS NOT NULL) AND
    (uh3 IS NULL OR uh2 IS NOT NULL) AND
    (uh4 IS NULL OR uh3 IS NOT NULL) AND
    (uh5 IS NULL OR uh4 IS NOT NULL)
  )
);

-- Tabel kehadiran siswa
CREATE TABLE kehadiran (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id   uuid NOT NULL REFERENCES semester(id),
  siswa_id      uuid NOT NULL REFERENCES siswa(id),
  sakit         smallint NOT NULL DEFAULT 0 CHECK (sakit >= 0),
  izin          smallint NOT NULL DEFAULT 0 CHECK (izin >= 0),
  alpha         smallint NOT NULL DEFAULT 0 CHECK (alpha >= 0),
  catatan_wali  text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),

  UNIQUE (semester_id, siswa_id)
);

-- ----------------------------------------------------------------------------
-- 7. ASSESSMENT PROCESS TABLES (v2.2)
-- ----------------------------------------------------------------------------

-- Tabel asesmen
CREATE TABLE asesmen (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id     uuid NOT NULL REFERENCES semester(id),
  jenis_ujian     jenis_ujian_enum NOT NULL,
  tanggal_mulai   date,
  tanggal_selesai date,
  tanggal_ttd     date,
  kode_nus        text,
  acuan_kelas     acuan_kelas_enum NOT NULL DEFAULT 'real',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Tabel jadwal asesmen
CREATE TABLE asesmen_jadwal (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asesmen_id          uuid NOT NULL REFERENCES asesmen(id) ON DELETE CASCADE,
  hari                hari_enum,
  tanggal             date,
  jam                 jam_ujian_enum,
  jam_mulai           time,
  durasi_menit        smallint,
  mata_pelajaran_id   uuid REFERENCES mata_pelajaran(id),
  urutan              smallint,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Tabel pengaturan ruang asesmen
CREATE TABLE asesmen_ruang (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asesmen_id    uuid NOT NULL REFERENCES asesmen(id) ON DELETE CASCADE,
  pengaturan    jsonb,
  pengaturan_7  jsonb,
  pengaturan_8  jsonb,
  pengaturan_9  jsonb,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),

  UNIQUE (asesmen_id)
);

-- Tabel siswa per ruang ujian
CREATE TABLE asesmen_siswa_ruang (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asesmen_id  uuid NOT NULL REFERENCES asesmen(id) ON DELETE CASCADE,
  siswa_id    uuid NOT NULL REFERENCES siswa(id),
  nomor_ruang smallint NOT NULL,
  nomor_urut  smallint,
  created_at  timestamptz DEFAULT now(),

  UNIQUE (asesmen_id, siswa_id)
);

-- Tabel nomor peserta asesmen
CREATE TABLE asesmen_nomor_peserta (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asesmen_id      uuid NOT NULL REFERENCES asesmen(id) ON DELETE CASCADE,
  siswa_id        uuid NOT NULL REFERENCES siswa(id),
  nomor_peserta   text NOT NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),

  UNIQUE (asesmen_id, siswa_id)
);

-- Tabel kepengawasan
CREATE TABLE kepengawasan (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asesmen_id        uuid NOT NULL REFERENCES asesmen(id) ON DELETE CASCADE,
  matrix_mengawasi  jsonb,
  pengaturan        jsonb,
  publish_kartu     boolean NOT NULL DEFAULT false,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),

  UNIQUE (asesmen_id)
);

-- Tabel分配 pengawas
CREATE TABLE kepengawasan_assignments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kepengawasan_id   uuid NOT NULL REFERENCES kepengawasan(id) ON DELETE CASCADE,
  jadwal_id         uuid NOT NULL REFERENCES asesmen_jadwal(id),
  nomor_ruang       smallint NOT NULL,
  guru_id           uuid NOT NULL REFERENCES guru(id),
  urutan_pengawas   smallint NOT NULL DEFAULT 1 CHECK (urutan_pengawas IN (1, 2)),
  created_at        timestamptz DEFAULT now(),

  UNIQUE (kepengawasan_id, jadwal_id, nomor_ruang, urutan_pengawas)
);

-- Tabel kartu pengawas
CREATE TABLE kartu_pengawas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asesmen_id    uuid NOT NULL REFERENCES asesmen(id) ON DELETE CASCADE,
  guru_id       uuid NOT NULL REFERENCES guru(id),
  published_at  timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),

  UNIQUE (asesmen_id, guru_id)
);

-- Tabel ketersediaan pengawas
CREATE TABLE ketersediaan_pengawas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guru_id         uuid NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
  semester_id     uuid NOT NULL REFERENCES semester(id),
  hari            varchar(50) NOT NULL,
  jam_mulai       time NOT NULL,
  jam_selesai     time NOT NULL,
  is_available    boolean DEFAULT true,
  keterangan      text,
  created_at      timestamptz DEFAULT now(),

  UNIQUE(guru_id, semester_id, hari, jam_mulai)
);

-- ----------------------------------------------------------------------------
-- 8. SYSTEM LOGS & SETTINGS TABLES (v2.2)
-- ----------------------------------------------------------------------------

-- Tabel audit log
CREATE TABLE audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pengguna_id   uuid REFERENCES pengguna(id),
  aksi          text NOT NULL,
  tabel         text,
  record_id     uuid,
  data_sebelum  jsonb,
  data_sesudah  jsonb,
  created_at    timestamptz DEFAULT now()
);

-- Tabel backup log
CREATE TABLE backup_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type   text NOT NULL,
  file_name     varchar(255),
  file_size     bigint,
  status        text NOT NULL,
  error_message text,
  started_at    timestamptz DEFAULT now(),
  completed_at  timestamptz,
  performed_by  uuid REFERENCES pengguna(id)
);

-- Tabel restore log
CREATE TABLE restore_log (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_file       varchar(255) NOT NULL,
  status            text NOT NULL,
  tables_restored   integer DEFAULT 0,
  records_restored  bigint DEFAULT 0,
  error_message     text,
  started_at        timestamptz DEFAULT now(),
  completed_at      timestamptz,
  performed_by      uuid REFERENCES pengguna(id),
  confirmed_by      uuid REFERENCES pengguna(id),
  confirmation_note text
);

-- Tabel import template log
CREATE TABLE import_template_log (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id         uuid NOT NULL REFERENCES semester(id),
  kelas_real_id       uuid NOT NULL REFERENCES kelas_real(id),
  mata_pelajaran_id   uuid NOT NULL REFERENCES mata_pelajaran(id),
  generated_at        timestamptz NOT NULL DEFAULT now(),
  storage_path        text,
  created_at          timestamptz DEFAULT now()
);

-- Tabel validation rules
CREATE TABLE validation_rule (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name       varchar(100) NOT NULL,
  table_name      varchar(100) NOT NULL,
  field_name      varchar(100),
  rule_type       text NOT NULL,
  rule_config     jsonb NOT NULL,
  error_message   text,
  severity        text DEFAULT 'error',
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),

  UNIQUE(table_name, rule_name)
);

-- Tabel validation results
CREATE TABLE validation_result (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id         uuid NOT NULL REFERENCES validation_rule(id),
  record_id       uuid NOT NULL,
  semester_id     uuid REFERENCES semester(id),
  error_detail    text,
  is_resolved     boolean DEFAULT false,
  resolved_at     timestamptz,
  resolved_by     uuid REFERENCES pengguna(id),
  created_at      timestamptz DEFAULT now()
);

-- Tabel system settings (v2.2 - replace pengaturan_sekolah)
CREATE TABLE system_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key     varchar(100) NOT NULL UNIQUE,
  setting_value   text,
  setting_type    text DEFAULT 'string',
  description     text,
  updated_by      uuid REFERENCES pengguna(id),
  updated_at      timestamptz DEFAULT now()
);

-- Tabel pengaturan sekolah (legacy, untuk backward compatibility)
CREATE TABLE pengaturan_sekolah (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_sekolah        text,
  alamat              text,
  logo_url            text CHECK (logo_url IS NULL OR logo_url LIKE 'https://%'),
  template_rapor_url  text CHECK (
    template_rapor_url IS NULL OR template_rapor_url LIKE 'https://%'
  ),
  mode_ttd_kepsek     mode_ttd_enum NOT NULL DEFAULT 'basah',
  mode_pemeliharaan   boolean NOT NULL DEFAULT false,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Tabel notification
CREATE TABLE notification (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  title         varchar(255) NOT NULL,
  message       text NOT NULL,
  type          text DEFAULT 'info',
  is_read       boolean DEFAULT false,
  link          text,
  created_at    timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 9. INDEXES FOR PERFORMANCE
-- ----------------------------------------------------------------------------

-- Pengguna indexes
CREATE INDEX idx_pengguna_role ON pengguna (role);

-- Guru indexes
CREATE INDEX idx_guru_urutan ON guru (urutan NULLS LAST);
CREATE INDEX idx_guru_status ON guru (status);

-- Siswa indexes
CREATE INDEX idx_siswa_status ON siswa (status);
CREATE INDEX idx_siswa_nama ON siswa (nama);

-- Tugas tambahan indexes
CREATE INDEX idx_tugas_pengguna ON tugas_tambahan(pengguna_id);
CREATE INDEX idx_tugas_semester ON tugas_tambahkan(semester_id);
CREATE INDEX idx_tugas_kelas ON tugas_tambahan(kelas_real_id) WHERE kelas_real_id IS NOT NULL;
CREATE INDEX idx_tugas_jenis ON tugas_tambahan(jenis);

-- Semester indexes
CREATE UNIQUE INDEX idx_semester_satu_aktif ON semester (status) WHERE status = 'aktif';

-- Kelas indexes
CREATE INDEX idx_kelas_dapo_semester_jenjang ON kelas_dapo (semester_id, jenjang);
CREATE INDEX idx_kelas_real_semester_jenjang ON kelas_real (semester_id, jenjang);

-- Siswa kelas indexes
CREATE UNIQUE INDEX idx_absen_dapo_unik ON siswa_kelas (kelas_dapo_id, nomor_absen_dapo) WHERE nomor_absen_dapo IS NOT NULL;
CREATE UNIQUE INDEX idx_absen_real_unik ON siswa_kelas (kelas_real_id, nomor_absen_real) WHERE nomor_absen_real IS NOT NULL;
CREATE INDEX idx_siswa_kelas_kelas_real_semester ON siswa_kelas (kelas_real_id, semester_id);
CREATE INDEX idx_siswa_kelas_kelas_dapo ON siswa_kelas (kelas_dapo_id);
CREATE INDEX idx_siswa_kelas_semester ON siswa_kelas (semester_id);

-- Pembagian mengajar indexes
CREATE INDEX idx_pmd_guru_semester ON pembagian_mengajar_dapo (guru_id, semester_id);
CREATE INDEX idx_pmd_kelas_dapo ON pembagian_mengajar_dapo (kelas_dapo_id);
CREATE INDEX idx_pmr_guru_semester ON pembagian_mengajar_real (guru_id, semester_id);
CREATE INDEX idx_pmr_kelas_real ON pembagian_mengajar_real (kelas_real_id);

-- Mapel indexes
CREATE INDEX idx_mata_pelajaran_status ON mata_pelajaran (status);

-- Nilai indexes
CREATE INDEX idx_nilai_semester_siswa ON nilai (semester_id, siswa_id);
CREATE INDEX idx_nilai_semester_mapel ON nilai (semester_id, mata_pelajaran_id);
CREATE INDEX idx_nilai_siswa_semester_mapel ON nilai (siswa_id, semester_id, mata_pelajaran_id);
CREATE INDEX idx_nilai_terkunci ON nilai (terkunci) WHERE terkunci = true;

-- Kehadiran indexes
CREATE INDEX idx_kehadiran_semester ON kehadiran (semester_id);

-- Asesmen indexes
CREATE INDEX idx_asesmen_semester ON asesmen (semester_id);
CREATE INDEX idx_asesmen_jadwal_asesmen ON asesmen_jadwal (asesmen_id);
CREATE INDEX idx_asesmen_siswa_ruang ON asesmen_siswa_ruang (asesmen_id, nomor_ruang);
CREATE INDEX idx_nomor_peserta_asesmen ON asesmen_nomor_peserta (asesmen_id);
CREATE INDEX idx_kepengawasan_assignments_guru ON kepengawasan_assignments (guru_id);
CREATE INDEX idx_kepengawasan_assignments_jadwal ON kepengawasan_assignments (jadwal_id, nomor_ruang);
CREATE INDEX idx_kartu_pengawas_guru ON kartu_pengawas (guru_id);

-- Ketersediaan pengawas indexes
CREATE INDEX idx_ketersediaan_guru ON ketersediaan_pengawas (guru_id);
CREATE INDEX idx_ketersediaan_semester ON ketersediaan_pengawas (semester_id);

-- Backup & restore indexes
CREATE INDEX idx_backup_status ON backup_log (status);
CREATE INDEX idx_backup_date ON backup_log (started_at DESC);
CREATE INDEX idx_restore_status ON restore_log (status);
CREATE INDEX idx_restore_date ON restore_log (started_at DESC);

-- Audit log indexes
CREATE INDEX idx_audit_log_pengguna ON audit_log (pengguna_id, created_at DESC);
CREATE INDEX idx_audit_log_tabel ON audit_log (tabel, created_at DESC);
CREATE INDEX idx_audit_log_waktu ON audit_log (created_at DESC);
CREATE INDEX idx_import_template_log_lookup ON import_template_log (semester_id, kelas_real_id, mata_pelajaran_id, generated_at DESC);

-- Validation indexes
CREATE INDEX idx_validation_rule_table ON validation_rule(table_name) WHERE is_active = true;
CREATE INDEX idx_validation_result_semester ON validation_result(semester_id) WHERE NOT is_resolved;

-- System settings indexes
CREATE UNIQUE INDEX idx_pengaturan_sekolah_singleton ON pengaturan_sekolah ((true));

-- Notification indexes
CREATE INDEX idx_notification_user ON notification(user_id, is_read);
CREATE INDEX idx_notification_date ON notification(created_at DESC);

-- ----------------------------------------------------------------------------
-- 10. TRIGGER FUNCTIONS & TRIGGERS
-- ----------------------------------------------------------------------------

-- Trigger 1: Validate Student Class Level Match
CREATE OR REPLACE FUNCTION validate_siswa_kelas_jenjang()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.kelas_dapo_id IS NOT NULL AND NEW.kelas_real_id IS NOT NULL THEN
    IF (SELECT jenjang FROM kelas_dapo WHERE id = NEW.kelas_dapo_id) !=
       (SELECT jenjang FROM kelas_real  WHERE id = NEW.kelas_real_id) THEN
      RAISE EXCEPTION 'Jenjang kelas Dapodik dan kelas Real harus sama untuk siswa %', NEW.siswa_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_jenjang
BEFORE INSERT OR UPDATE ON siswa_kelas
FOR EACH ROW EXECUTE FUNCTION validate_siswa_kelas_jenjang();


-- Trigger 2: Take snapshot of grading weights on INSERT
CREATE OR REPLACE FUNCTION snapshot_bobot_nilai()
RETURNS TRIGGER AS $$
DECLARE
  v_bobot komponen_nilai%ROWTYPE;
BEGIN
  SELECT * INTO v_bobot
  FROM komponen_nilai
  WHERE semester_id = NEW.semester_id
    AND mata_pelajaran_id = NEW.mata_pelajaran_id;

  IF FOUND THEN
    NEW.bobot_uh_pct       := v_bobot.bobot_uh;
    NEW.bobot_pts_pct      := v_bobot.bobot_pts;
    NEW.bobot_semester_pct := v_bobot.bobot_semester;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_snapshot_bobot
BEFORE INSERT ON nilai
FOR EACH ROW EXECUTE FUNCTION snapshot_bobot_nilai();


-- Trigger 3: Validate Student has both classes configured before grades
CREATE OR REPLACE FUNCTION validate_siswa_sudah_punya_kelas()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM siswa_kelas
    WHERE siswa_id   = NEW.siswa_id
      AND semester_id = NEW.semester_id
      AND kelas_dapo_id IS NOT NULL
      AND kelas_real_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Siswa % belum memiliki kelas Dapo dan kelas Real di semester ini', NEW.siswa_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_siswa_punya_kelas_nilai
BEFORE INSERT ON nilai
FOR EACH ROW EXECUTE FUNCTION validate_siswa_sudah_punya_kelas();

CREATE TRIGGER trg_validate_siswa_punya_kelas_kehadiran
BEFORE INSERT ON kehadiran
FOR EACH ROW EXECUTE FUNCTION validate_siswa_sudah_punya_kelas();


-- Trigger 4: Updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_tugas_tambahan_updated_at
  BEFORE UPDATE ON tugas_tambahan
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guru_updated_at
  BEFORE UPDATE ON guru
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_siswa_updated_at
  BEFORE UPDATE ON siswa
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_semester_updated_at
  BEFORE UPDATE ON semester
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kelas_dapo_updated_at
  BEFORE UPDATE ON kelas_dapo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kelas_real_updated_at
  BEFORE UPDATE ON kelas_real
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_siswa_kelas_updated_at
  BEFORE UPDATE ON siswa_kelas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_komponen_nilai_updated_at
  BEFORE UPDATE ON komponen_nilai
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pembagian_mengajar_dapo_updated_at
  BEFORE UPDATE ON pembagian_mengajar_dapo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pembagian_mengajar_real_updated_at
  BEFORE UPDATE ON pembagian_mengajar_real
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nilai_updated_at
  BEFORE UPDATE ON nilai
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kehadiran_updated_at
  BEFORE UPDATE ON kehadiran
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asesmen_updated_at
  BEFORE UPDATE ON asesmen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asesmen_jadwal_updated_at
  BEFORE UPDATE ON asesmen_jadwal
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asesmen_ruang_updated_at
  BEFORE UPDATE ON asesmen_ruang
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kepengawasan_updated_at
  BEFORE UPDATE ON kepengawasan
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kartu_pengawas_updated_at
  BEFORE UPDATE ON kartu_pengawas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE pengguna ENABLE ROW LEVEL SECURITY;
ALTER TABLE guru ENABLE ROW LEVEL SECURITY;
ALTER TABLE siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE kepala_sekolah ENABLE ROW LEVEL SECURITY;
ALTER TABLE mata_pelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE tahun_pelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE semester ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas_dapo ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas_real ENABLE ROW LEVEL SECURITY;
ALTER TABLE siswa_kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tugas_tambahan ENABLE ROW LEVEL SECURITY;
ALTER TABLE kategori_tugas ENABLE ROW LEVEL SECURITY;
ALTER TABLE komponen_nilai ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembagian_mengajar_dapo ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembagian_mengajar_real ENABLE ROW LEVEL SECURITY;
ALTER TABLE nilai ENABLE ROW LEVEL SECURITY;
ALTER TABLE kehadiran ENABLE ROW LEVEL SECURITY;
ALTER TABLE asesmen ENABLE ROW LEVEL SECURITY;
ALTER TABLE asesmen_jadwal ENABLE ROW LEVEL SECURITY;
ALTER TABLE asesmen_ruang ENABLE ROW LEVEL SECURITY;
ALTER TABLE asesmen_siswa_ruang ENABLE ROW LEVEL SECURITY;
ALTER TABLE asesmen_nomor_peserta ENABLE ROW LEVEL SECURITY;
ALTER TABLE kepengawasan ENABLE ROW LEVEL SECURITY;
ALTER TABLE kepengawasan_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kartu_pengawas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ketersediaan_pengawas ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE restore_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_template_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_result ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengaturan_sekolah ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;

-- Audit log is immutable
REVOKE UPDATE, DELETE ON audit_log FROM public;

-- ----------------------------------------------------------------------------
-- 12. SEED DATA - Default System Settings (v2.2)
-- ----------------------------------------------------------------------------

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
  ('maintenance_mode', 'false', 'boolean', 'Enable/disable maintenance mode'),
  ('school_name', 'SMP NEGERI 1 UMBULSARI', 'string', 'School name for rapor'),
  ('school_address', 'Jl. Raya Umbulsari, Jepara', 'string', 'School address'),
  ('school_npsn', '20101234', 'string', 'School NPSN'),
  ('school_logo', NULL, 'string', 'Base64 encoded school logo'),
  ('principal_signature', NULL, 'string', 'Base64 encoded principal signature'),
  ('backup_schedule', 'daily', 'string', 'Backup schedule: daily, weekly, monthly'),
  ('backup_retention_days', '30', 'number', 'Number of days to retain backups')
ON CONFLICT (setting_key) DO NOTHING;

-- Seed kategori tugas
INSERT INTO kategori_tugas (nama, deskripsi, jam_default, is_wali_kelas) VALUES
  ('Wali Kelas 7', 'Wali kelas jenjang 7', 24, true),
  ('Wali Kelas 8', 'Wali kelas jenjang 8', 24, true),
  ('Wali Kelas 9', 'Wali kelas jenjang 9', 24, true)
ON CONFLICT (nama) DO NOTHING;

INSERT INTO kategori_tugas (nama, deskripsi, jam_default, is_koordinator) VALUES
  ('Koordinator 7', 'Koordinator jenjang 7', 8, true),
  ('Koordinator 8', 'Koordinator jenjang 8', 8, true),
  ('Koordinator 9', 'Koordinator jenjang 9', 8, true),
  ('Kepala Kurikulum', 'Kepala bagian kurikulum', 40, false),
  ('Laboran', 'Laboran laboratorium', 20, false),
  ('Perpustakaan', 'Staf perpustakaan', 20, false)
ON CONFLICT (nama) DO NOTHING;

-- Seed pengaturan sekolah
INSERT INTO pengaturan_sekolah (nama_sekolah, alamat) VALUES
  ('SMP NEGERI 1 UMBULSARI', 'Jl. Raya Umbulsari, Jepara')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
