# Struktur Database — Guru Spenturi v2
## Supabase PostgreSQL — Revisi 4 (Post-Analysis 2)

---

## Konvensi

- Semua tabel menggunakan `uuid` sebagai primary key — auto-generated via `gen_random_uuid()`.
- Kolom `created_at` dan `updated_at` ada di semua tabel transaksional.
- Semua foreign key menggunakan `ON DELETE RESTRICT` kecuali disebutkan lain.
- RLS diterapkan pada seluruh tabel — akses anon ditutup secara default.
- Kolom dengan nilai tetap menggunakan **ENUM type** PostgreSQL.
- Nilai numerik kecil menggunakan `smallint`. Nilai desimal menggunakan `numeric(5,2)`.

---

## ENUM Types

```sql
CREATE TYPE role_enum            AS ENUM ('superadmin','admin','urusan','guru','siswa');
CREATE TYPE status_enum          AS ENUM ('aktif','nonaktif');
CREATE TYPE status_siswa_enum    AS ENUM ('aktif','nonaktif','alumni');
CREATE TYPE status_pegawai_enum  AS ENUM ('PNS','PPPK','PPPK PW','GTT');
CREATE TYPE mode_penilaian_enum  AS ENUM ('pts','semester');
CREATE TYPE mode_ttd_enum        AS ENUM ('digital','basah');
CREATE TYPE jenis_kelamin_enum   AS ENUM ('L','P');
CREATE TYPE acuan_kelas_enum     AS ENUM ('real','dapo');
CREATE TYPE jam_ujian_enum       AS ENUM ('Jam ke - 1','Jam ke - 2');
CREATE TYPE status_backup_enum   AS ENUM ('sukses','gagal');
CREATE TYPE tugas_tambahan_enum  AS ENUM (
  'kepala_kurikulum',
  'koordinator_7',
  'koordinator_8',
  'koordinator_9',
  'wali_kelas'
);
CREATE TYPE jenis_ujian_enum AS ENUM (
  'Asesmen Sumatif Tengah Semester',
  'Asesmen Sumatif Akhir Semester',
  'Asesmen Sumatif Akhir Tahun',
  'Asesmen Sumatif Akhir Jenjang'
);
CREATE TYPE hari_enum AS ENUM (
  'Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'
);
```

---

## 1. Autentikasi & Pengguna

### `pengguna`

```sql
CREATE TABLE pengguna (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    text UNIQUE NOT NULL,
  nama        text NOT NULL,
  role        role_enum NOT NULL,
  status      status_enum NOT NULL DEFAULT 'aktif',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_pengguna_role ON pengguna (role);
```

---

### `tugas_tambahan`

```sql
CREATE TABLE tugas_tambahan (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pengguna_id   uuid NOT NULL REFERENCES pengguna(id),
  semester_id   uuid NOT NULL REFERENCES semester(id),
  jenis         tugas_tambahan_enum NOT NULL,
  kelas_real_id uuid REFERENCES kelas_real(id),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),

  UNIQUE (pengguna_id, semester_id, jenis),

  CONSTRAINT chk_wali_kelas_harus_ada_kelas CHECK (
    (jenis = 'wali_kelas' AND kelas_real_id IS NOT NULL) OR
    (jenis != 'wali_kelas' AND kelas_real_id IS NULL)
  )
);

CREATE INDEX idx_tugas_tambahan_pengguna_semester
  ON tugas_tambahan (pengguna_id, semester_id);
```

---

## 2. Periode Akademik

### `tahun_pelajaran`

```sql
CREATE TABLE tahun_pelajaran (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama        text NOT NULL UNIQUE,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
```

---

### `semester`

```sql
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

-- Hanya satu semester aktif dalam satu waktu
CREATE UNIQUE INDEX idx_semester_satu_aktif
  ON semester (status) WHERE status = 'aktif';
```

---

## 3. Data Master

### `guru`

```sql
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

CREATE INDEX idx_guru_urutan ON guru (urutan NULLS LAST);
CREATE INDEX idx_guru_status ON guru (status);
```

---

### `siswa`

```sql
CREATE TABLE siswa (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nis             text UNIQUE NOT NULL,
  nisn            text,
  nipd            text,
  nama            text NOT NULL,
  jenis_kelamin   jenis_kelamin_enum NOT NULL,
  status          status_siswa_enum NOT NULL DEFAULT 'aktif',
  pengguna_id     uuid REFERENCES pengguna(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_siswa_status ON siswa (status);
CREATE INDEX idx_siswa_nama   ON siswa (nama);
```

---

### `kepala_sekolah`

```sql
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

CREATE UNIQUE INDEX idx_kepala_sekolah_satu_aktif
  ON kepala_sekolah (status) WHERE status = 'aktif';
```

---

### `mata_pelajaran`

```sql
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

CREATE INDEX idx_mata_pelajaran_status ON mata_pelajaran (status);
```

---

### `kelas_dapo`

```sql
CREATE TABLE kelas_dapo (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id uuid NOT NULL REFERENCES semester(id),
  nama        text NOT NULL,
  jenjang     smallint NOT NULL CHECK (jenjang IN (7, 8, 9)),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),

  UNIQUE (semester_id, nama)
);

CREATE INDEX idx_kelas_dapo_semester_jenjang ON kelas_dapo (semester_id, jenjang);
```

---

### `kelas_real`

```sql
CREATE TABLE kelas_real (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id uuid NOT NULL REFERENCES semester(id),
  nama        text NOT NULL,
  jenjang     smallint NOT NULL CHECK (jenjang IN (7, 8, 9)),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),

  UNIQUE (semester_id, nama)
);

CREATE INDEX idx_kelas_real_semester_jenjang ON kelas_real (semester_id, jenjang);
```

---

### `siswa_kelas`

Perubahan dari revisi sebelumnya:
- `nomor_absen` dipecah menjadi `nomor_absen_dapo` dan `nomor_absen_real` karena siswa titipan bisa memiliki nomor absen berbeda di kelas Dapo dan kelas Real.
- Unique index partial untuk masing-masing nomor absen.

```sql
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

-- Nomor absen Dapo unik per kelas Dapo
CREATE UNIQUE INDEX idx_absen_dapo_unik
  ON siswa_kelas (kelas_dapo_id, nomor_absen_dapo)
  WHERE nomor_absen_dapo IS NOT NULL;

-- Nomor absen Real unik per kelas Real
CREATE UNIQUE INDEX idx_absen_real_unik
  ON siswa_kelas (kelas_real_id, nomor_absen_real)
  WHERE nomor_absen_real IS NOT NULL;

CREATE INDEX idx_siswa_kelas_kelas_real_semester
  ON siswa_kelas (kelas_real_id, semester_id);
CREATE INDEX idx_siswa_kelas_kelas_dapo
  ON siswa_kelas (kelas_dapo_id);
CREATE INDEX idx_siswa_kelas_semester
  ON siswa_kelas (semester_id);

-- Trigger: validasi jenjang kelas Dapo dan kelas Real harus sama
CREATE OR REPLACE FUNCTION validate_siswa_kelas_jenjang()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.kelas_dapo_id IS NOT NULL AND NEW.kelas_real_id IS NOT NULL THEN
    IF (SELECT jenjang FROM kelas_dapo WHERE id = NEW.kelas_dapo_id) !=
       (SELECT jenjang FROM kelas_real  WHERE id = NEW.kelas_real_id) THEN
      RAISE EXCEPTION 'Jenjang kelas Dapo dan kelas Real harus sama untuk siswa %',
        NEW.siswa_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_jenjang
BEFORE INSERT OR UPDATE ON siswa_kelas
FOR EACH ROW EXECUTE FUNCTION validate_siswa_kelas_jenjang();
```

---

## 4. Kurikulum

### `komponen_nilai`

```sql
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
```

---

### `pembagian_mengajar_dapo`

```sql
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

CREATE INDEX idx_pmd_guru_semester ON pembagian_mengajar_dapo (guru_id, semester_id);
CREATE INDEX idx_pmd_kelas_dapo    ON pembagian_mengajar_dapo (kelas_dapo_id);
```

---

### `pembagian_mengajar_real`

```sql
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

CREATE INDEX idx_pmr_guru_semester ON pembagian_mengajar_real (guru_id, semester_id);
CREATE INDEX idx_pmr_kelas_real    ON pembagian_mengajar_real (kelas_real_id);
```

---

## 5. Penilaian

### `nilai`

Perubahan dari revisi sebelumnya:
- `kelas_dapo_id` dihapus — lookup via `siswa_kelas`.
- `nilai_semester` menggantikan nama kolom `semester` yang ambigu.
- Snapshot bobot disalin via trigger `trg_snapshot_bobot` saat INSERT.
- `rapor` sebagai generated column dengan sintaks PostgreSQL yang benar.
- Constraint sequential UH diterapkan di level database.

```sql
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

  -- Snapshot bobot (disalin dari komponen_nilai saat INSERT via trigger)
  bobot_uh_pct          numeric(5,2) NOT NULL DEFAULT 40,
  bobot_pts_pct         numeric(5,2) NOT NULL DEFAULT 30,
  bobot_semester_pct    numeric(5,2) NOT NULL DEFAULT 30,

  -- RAPOR: generated column, hanya terisi jika semua komponen lengkap
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

  -- Validasi sequential UH di level database
  CONSTRAINT chk_uh_sequential CHECK (
    (uh2 IS NULL OR uh1 IS NOT NULL) AND
    (uh3 IS NULL OR uh2 IS NOT NULL) AND
    (uh4 IS NULL OR uh3 IS NOT NULL) AND
    (uh5 IS NULL OR uh4 IS NOT NULL)
  )
);

CREATE INDEX idx_nilai_semester_siswa     ON nilai (semester_id, siswa_id);
CREATE INDEX idx_nilai_semester_mapel     ON nilai (semester_id, mata_pelajaran_id);
CREATE INDEX idx_nilai_siswa_semester_mapel ON nilai (siswa_id, semester_id, mata_pelajaran_id);
CREATE INDEX idx_nilai_terkunci           ON nilai (terkunci) WHERE terkunci = true;

-- Trigger: salin snapshot bobot dari komponen_nilai saat INSERT
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

-- Trigger: pastikan siswa sudah punya kelas Dapo dan Real sebelum nilai diinput
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
    RAISE EXCEPTION
      'Siswa % belum memiliki kelas Dapo dan kelas Real di semester ini',
      NEW.siswa_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_siswa_punya_kelas_nilai
BEFORE INSERT ON nilai
FOR EACH ROW EXECUTE FUNCTION validate_siswa_sudah_punya_kelas();
```

---

## 6. Wali Kelas & Kehadiran

### `kehadiran`

Perubahan: `kelas_real_id` dihapus — lookup via `siswa_kelas`.

```sql
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

CREATE INDEX idx_kehadiran_semester ON kehadiran (semester_id);

CREATE TRIGGER trg_validate_siswa_punya_kelas_kehadiran
BEFORE INSERT ON kehadiran
FOR EACH ROW EXECUTE FUNCTION validate_siswa_sudah_punya_kelas();
```

---

## 7. Asesmen

### `asesmen`

```sql
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

CREATE INDEX idx_asesmen_semester ON asesmen (semester_id);
```

---

### `asesmen_jadwal`

Perubahan: kolom `jam` dikonversi ke ENUM `jam_ujian_enum`.

```sql
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

CREATE INDEX idx_asesmen_jadwal_asesmen ON asesmen_jadwal (asesmen_id);
```

---

### `asesmen_ruang`

```sql
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
```

---

### `asesmen_siswa_ruang`

```sql
CREATE TABLE asesmen_siswa_ruang (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asesmen_id  uuid NOT NULL REFERENCES asesmen(id) ON DELETE CASCADE,
  siswa_id    uuid NOT NULL REFERENCES siswa(id),
  nomor_ruang smallint NOT NULL,
  nomor_urut  smallint,
  created_at  timestamptz DEFAULT now(),

  UNIQUE (asesmen_id, siswa_id)
);

CREATE INDEX idx_asesmen_siswa_ruang
  ON asesmen_siswa_ruang (asesmen_id, nomor_ruang);
```

---

### `asesmen_nomor_peserta`

Perubahan: `nomor_ruang` dihapus — lookup via join ke `asesmen_siswa_ruang` untuk menghindari redundansi.

```sql
CREATE TABLE asesmen_nomor_peserta (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asesmen_id      uuid NOT NULL REFERENCES asesmen(id) ON DELETE CASCADE,
  siswa_id        uuid NOT NULL REFERENCES siswa(id),
  nomor_peserta   text NOT NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),

  UNIQUE (asesmen_id, siswa_id)
);

CREATE INDEX idx_nomor_peserta_asesmen ON asesmen_nomor_peserta (asesmen_id);
```

---

### `kepengawasan`

Perubahan: `assignments` JSONB dipindah ke tabel relasional `kepengawasan_assignments`.

```sql
CREATE TABLE kepengawasan (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asesmen_id        uuid NOT NULL REFERENCES asesmen(id) ON DELETE CASCADE,
  matrix_mengawasi  jsonb,  -- sementara; kandidat migrasi ke kepengawasan_ketersediaan
  pengaturan        jsonb,
  -- teacher_codes dihapus: gunakan guru.kode_guru langsung via JOIN
  publish_kartu     boolean NOT NULL DEFAULT false,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),

  UNIQUE (asesmen_id)
);
```

---

### `kepengawasan_assignments`

Tabel baru — menggantikan `kepengawasan.assignments` JSONB agar bisa di-query secara relasional.

```sql
CREATE TABLE kepengawasan_assignments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kepengawasan_id   uuid NOT NULL REFERENCES kepengawasan(id) ON DELETE CASCADE,
  jadwal_id         uuid NOT NULL REFERENCES asesmen_jadwal(id),
  nomor_ruang       smallint NOT NULL,
  guru_id           uuid NOT NULL REFERENCES guru(id),
  urutan_pengawas   smallint NOT NULL DEFAULT 1
                    CHECK (urutan_pengawas IN (1, 2)),
  created_at        timestamptz DEFAULT now(),

  UNIQUE (kepengawasan_id, jadwal_id, nomor_ruang, urutan_pengawas)
);

CREATE INDEX idx_kepengawasan_assignments_guru
  ON kepengawasan_assignments (guru_id);
CREATE INDEX idx_kepengawasan_assignments_jadwal
  ON kepengawasan_assignments (jadwal_id, nomor_ruang);
```

---

### `kartu_pengawas`

```sql
CREATE TABLE kartu_pengawas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asesmen_id    uuid NOT NULL REFERENCES asesmen(id) ON DELETE CASCADE,
  guru_id       uuid NOT NULL REFERENCES guru(id),
  -- kolom 'rows' dihapus: isi kartu di-generate dari kepengawasan_assignments saat dibutuhkan
  -- query: JOIN kepengawasan_assignments → asesmen_jadwal → mata_pelajaran WHERE guru_id
  published_at  timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),

  UNIQUE (asesmen_id, guru_id)
);

CREATE INDEX idx_kartu_pengawas_guru ON kartu_pengawas (guru_id);
```

---

## 8. Sistem

### `audit_log`

```sql
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

CREATE INDEX idx_audit_log_pengguna ON audit_log (pengguna_id, created_at DESC);
CREATE INDEX idx_audit_log_tabel    ON audit_log (tabel, created_at DESC);
CREATE INDEX idx_audit_log_waktu    ON audit_log (created_at DESC);

-- Audit log bersifat immutable — tidak ada yang boleh UPDATE atau DELETE
REVOKE UPDATE, DELETE ON audit_log FROM authenticated;
REVOKE UPDATE, DELETE ON audit_log FROM anon;
```

---

### `backup_log`

Perubahan: `status` dikonversi ke ENUM `status_backup_enum`.

```sql
CREATE TABLE backup_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pengguna_id   uuid REFERENCES pengguna(id),
  keterangan    text,
  storage_path  text,
  ukuran_bytes  bigint,
  status        status_backup_enum NOT NULL,
  created_at    timestamptz DEFAULT now()
);
```

---

### `import_template_log`

```sql
CREATE TABLE import_template_log (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id         uuid NOT NULL REFERENCES semester(id),
  kelas_real_id       uuid NOT NULL REFERENCES kelas_real(id),
  mata_pelajaran_id   uuid NOT NULL REFERENCES mata_pelajaran(id),
  generated_at        timestamptz NOT NULL DEFAULT now(),
  storage_path        text,
  created_at          timestamptz DEFAULT now()
);

-- Index untuk validasi metadata saat upload Excel
CREATE INDEX idx_import_template_log_lookup
  ON import_template_log (semester_id, kelas_real_id, mata_pelajaran_id, generated_at DESC);

-- Catatan: buat pg_cron job untuk hapus log > 30 hari secara otomatis
-- SELECT cron.schedule('cleanup-import-log', '0 2 * * *',
--   $$DELETE FROM import_template_log WHERE created_at < now() - interval '30 days'$$);
```

---

### `pengaturan_sekolah`

```sql
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

-- Singleton — hanya boleh ada satu baris
CREATE UNIQUE INDEX idx_pengaturan_sekolah_singleton
  ON pengaturan_sekolah ((true));
```

---

## 9. Relasi Antar Tabel

```
auth.users ──────────────── pengguna
                                │
                    ┌───────────┼────────────┐
                    │           │            │
                  guru        siswa    tugas_tambahan
                    │           │
          ┌─────────┘      siswa_kelas
          │                ├── kelas_dapo ──┐
          │                └── kelas_real   │
          │                                 │
pembagian_mengajar_dapo ─────────────── semester ── tahun_pelajaran
pembagian_mengajar_real ─── kelas_real      │
                                            ├── komponen_nilai
                          nilai ────────────┤
                          kehadiran         ├── asesmen
                                            │     ├── asesmen_jadwal
                                            │     ├── asesmen_ruang
                                            │     ├── asesmen_siswa_ruang
                                            │     ├── asesmen_nomor_peserta
                                            │     ├── kepengawasan
                                            │     │     └── kepengawasan_assignments
                                            │     └── kartu_pengawas
                                            └── import_template_log
```

---

## 10. Supabase Storage Buckets

| Bucket | Isi | Akses |
|---|---|---|
| `tanda-tangan` | Gambar TTD kepala sekolah (PNG transparan) | Private — hanya server |
| `template-rapor` | Template PDF rapor sekolah | Private — hanya server |
| `logo-sekolah` | Logo sekolah | Public |
| `backup` | File backup database | Private — hanya admin & superadmin |
| `import-temp` | File Excel upload sementara (auto-delete 24 jam) | Private — hanya pengguna yang upload |

---

## 11. Catatan Implementasi

- **Urutan CREATE:** ENUM types → tabel independen (tahun_pelajaran, guru, siswa, mata_pelajaran) → tabel dependen (semester, kelas, siswa_kelas) → tabel transaksional (nilai, kehadiran) → tabel asesmen → tabel sistem.
- **Trigger `trg_snapshot_bobot`** harus terdaftar sebelum data `nilai` pertama diinput. Jika `komponen_nilai` belum ada untuk mapel tersebut, snapshot menggunakan DEFAULT (40/30/30).
- **Trigger `trg_validate_jenjang`** harus terdaftar sebelum data `siswa_kelas` pertama diinput.
- **Generated column `rapor`** tidak bisa di-UPDATE secara langsung — nilainya dihitung ulang otomatis setiap kali kolom komponen diubah.
- **RLS policy** didefinisikan per tabel menggunakan `auth.uid()` → join `pengguna` → cek role dan tugas_tambahan aktif.
- **`audit_log`** disarankan mencatat hanya kolom yang berubah di `data_sesudah`, bukan seluruh baris, untuk efisiensi storage.
- **`kepengawasan.matrix_mengawasi`** saat ini masih JSONB. Jika kebutuhan query matrix berkembang, migrasi ke tabel `kepengawasan_ketersediaan (kepengawasan_id, guru_id, jadwal_id, tersedia)` untuk integritas referensial yang lebih ketat.
- **`kartu_pengawas`** tidak menyimpan data jadwal — generate isi kartu via query ke `kepengawasan_assignments → asesmen_jadwal → mata_pelajaran` saat ekspor PDF diperlukan.
- **`guru.kode_guru`** digunakan sebagai referensi kode guru di seluruh modul termasuk kepengawasan — tidak perlu mapping terpisah.

---

*Revisi 4 — Juni 2026.*
*Perubahan dari Revisi 3: kartu_pengawas.rows dihapus (generate dari kepengawasan_assignments), teacher_codes dihapus (gunakan guru.kode_guru), ENUM jenis_ujian_enum dan hari_enum ditambahkan, trigger validasi siswa punya kelas sebelum insert nilai & kehadiran, index import_template_log ditambahkan.*
