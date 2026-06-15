# Database Review — Guru Spenturi v2
## Tinjauan oleh: Database Administrator & Software Architect

---

## Ringkasan Eksekutif

Schema yang ada sudah cukup solid untuk tahap awal. Fondasi relasional sudah benar, UUID sebagai PK sudah tepat, dan pemisahan kelas Dapo vs Real adalah keputusan desain yang baik. Namun ada beberapa isu yang perlu diperbaiki sebelum implementasi — mulai dari anomali data, tipe data yang kurang optimal, indeks yang belum terdefinisi, hingga celah keamanan kecil.

---

## 1. Normalisasi & Relasi

### 🔴 Isu Kritis

**1.1 — `nilai.kelas_dapo_id` redundan**

Kolom `kelas_dapo_id` di tabel `nilai` tidak diperlukan karena informasi kelas Dapo sudah bisa didapat melalui relasi `nilai.siswa_id → siswa_kelas.siswa_id → siswa_kelas.kelas_dapo_id`.

Menyimpan `kelas_dapo_id` langsung di `nilai` menciptakan risiko **anomali update**: jika siswa dipindah kelas Dapo, `nilai.kelas_dapo_id` bisa tidak sinkron dengan `siswa_kelas.kelas_dapo_id`.

```sql
-- ❌ Sebelum: redundan dan rawan anomali
nilai (semester_id, siswa_id, kelas_dapo_id, mata_pelajaran_id, ...)

-- ✅ Sesudah: hapus kelas_dapo_id, lookup via siswa_kelas
nilai (semester_id, siswa_id, mata_pelajaran_id, ...)
-- kelas_dapo bisa didapat via: siswa_kelas WHERE siswa_id AND semester_id
```

---

**1.2 — `kehadiran.kelas_real_id` berpotensi anomali**

Sama seperti di atas — `kelas_real_id` di tabel `kehadiran` sudah tersimpan di `siswa_kelas`. Menyimpannya lagi di `kehadiran` menciptakan risiko inkonsistensi.

```sql
-- ✅ Hapus kelas_real_id dari kehadiran
-- lookup via: siswa_kelas WHERE siswa_id AND semester_id → kelas_real_id
kehadiran (semester_id, siswa_id, sakit, izin, alpha, catatan_wali, ...)
```

---

**1.3 — `semester_id` redundan di beberapa tabel**

Tabel `nilai`, `kehadiran`, `pembagian_mengajar_dapo`, `pembagian_mengajar_real` menyimpan `semester_id` secara langsung, padahal `semester_id` sudah bisa didapat via `kelas_dapo_id → kelas_dapo.semester_id` atau `kelas_real_id → kelas_real.semester_id`.

**Namun untuk kasus ini, saya rekomendasikan TETAP menyimpan `semester_id`** secara langsung — ini adalah denormalisasi yang disengaja (intentional denormalization) untuk kepentingan performa query dan kemudahan RLS policy. Ini praktik umum di aplikasi SaaS yang data-nya berbasis tenant/periode.

---

### 🟡 Isu Sedang

**1.4 — `siswa_kelas` tidak memiliki validasi konsistensi jenjang**

Saat ini tidak ada constraint yang mencegah siswa kelas Dapo jenjang 7 dipasangkan dengan kelas Real jenjang 8 di tabel `siswa_kelas`. Perlu constraint atau trigger.

```sql
-- Tambahkan trigger untuk validasi jenjang
CREATE OR REPLACE FUNCTION validate_siswa_kelas_jenjang()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT jenjang FROM kelas_dapo WHERE id = NEW.kelas_dapo_id) !=
     (SELECT jenjang FROM kelas_real WHERE id = NEW.kelas_real_id) THEN
    RAISE EXCEPTION 'Jenjang kelas Dapo dan kelas Real harus sama';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_jenjang
BEFORE INSERT OR UPDATE ON siswa_kelas
FOR EACH ROW EXECUTE FUNCTION validate_siswa_kelas_jenjang();
```

---

**1.5 — `kepala_sekolah` tidak memiliki partial unique index**

Dokumen menyebutkan "hanya satu aktif dalam satu waktu" tapi tidak ada constraint database yang memaksa ini.

```sql
-- Partial unique index: hanya satu baris dengan status 'aktif'
CREATE UNIQUE INDEX idx_kepala_sekolah_satu_aktif
ON kepala_sekolah (status)
WHERE status = 'aktif';
```

---

**1.6 — `semester` tidak memiliki partial unique index untuk status aktif**

Sama seperti kepala sekolah — harus ada constraint yang memastikan hanya satu semester yang aktif.

```sql
CREATE UNIQUE INDEX idx_semester_satu_aktif
ON semester (status)
WHERE status = 'aktif';
```

---

**1.7 — `asesmen_ruang` terlalu banyak bergantung pada JSONB**

Kolom `pengaturan_7`, `pengaturan_8`, `pengaturan_9`, dan `assignments` semua JSONB. Ini nyaman untuk prototyping tapi `assignments` (yang berisi ratusan siswa) akan sulit di-query, di-debug, dan tidak bisa di-index secara efisien.

Rekomendasi: pisahkan `assignments` ke tabel terpisah `asesmen_siswa_ruang`.

```sql
-- Ganti assignments JSONB dengan tabel relasional
CREATE TABLE asesmen_siswa_ruang (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asesmen_id      uuid NOT NULL REFERENCES asesmen(id) ON DELETE CASCADE,
  siswa_id        uuid NOT NULL REFERENCES siswa(id),
  nomor_ruang     integer NOT NULL,
  nomor_urut      integer,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (asesmen_id, siswa_id)
);
```

---

## 2. Performa & Indeks

### 🔴 Indeks Wajib yang Belum Ada

```sql
-- === TABEL: nilai (tabel paling sering di-query) ===
CREATE INDEX idx_nilai_semester_siswa ON nilai (semester_id, siswa_id);
CREATE INDEX idx_nilai_semester_mapel ON nilai (semester_id, mata_pelajaran_id);
CREATE INDEX idx_nilai_terkunci ON nilai (terkunci) WHERE terkunci = true;

-- === TABEL: siswa_kelas ===
CREATE INDEX idx_siswa_kelas_kelas_real ON siswa_kelas (kelas_real_id);
CREATE INDEX idx_siswa_kelas_kelas_dapo ON siswa_kelas (kelas_dapo_id);
CREATE INDEX idx_siswa_kelas_semester ON siswa_kelas (semester_id);

-- === TABEL: pembagian_mengajar_real ===
CREATE INDEX idx_pmr_guru_semester ON pembagian_mengajar_real (guru_id, semester_id);
CREATE INDEX idx_pmr_kelas_real ON pembagian_mengajar_real (kelas_real_id);

-- === TABEL: pembagian_mengajar_dapo ===
CREATE INDEX idx_pmd_guru_semester ON pembagian_mengajar_dapo (guru_id, semester_id);

-- === TABEL: tugas_tambahan ===
CREATE INDEX idx_tugas_tambahan_pengguna_semester ON tugas_tambahan (pengguna_id, semester_id);

-- === TABEL: audit_log (append-only, data tumbuh cepat) ===
CREATE INDEX idx_audit_log_pengguna ON audit_log (pengguna_id, created_at DESC);
CREATE INDEX idx_audit_log_tabel ON audit_log (tabel, created_at DESC);
CREATE INDEX idx_audit_log_waktu ON audit_log (created_at DESC);

-- === TABEL: kehadiran ===
CREATE INDEX idx_kehadiran_semester ON kehadiran (semester_id);

-- === TABEL: asesmen_nomor_peserta ===
CREATE INDEX idx_nomor_peserta_asesmen ON asesmen_nomor_peserta (asesmen_id);
```

---

### 🟡 Tipe Data yang Perlu Diperbaiki

```sql
-- ❌ numeric tanpa presisi untuk nilai — boros dan ambigu
uh1 numeric

-- ✅ Gunakan numeric(5,2) — cukup untuk 0.00 sampai 100.00
uh1 numeric(5,2) CHECK (uh1 BETWEEN 0 AND 100)

-- ❌ integer untuk sakit/izin/alpha — boleh tapi smallint lebih tepat
-- (tidak ada sekolah dengan kehadiran > 32767 hari)
sakit integer

-- ✅ smallint lebih hemat memori untuk nilai kecil
sakit smallint NOT NULL DEFAULT 0 CHECK (sakit >= 0)

-- ❌ integer untuk nomor_absen dan jam_pelajaran
-- ✅ smallint sudah cukup
nomor_absen smallint
jam_pelajaran smallint

-- ❌ text untuk jenis_kelamin, role, status — perlu ENUM PostgreSQL
-- ✅ Gunakan custom ENUM untuk kolom yang nilai-nya tetap
CREATE TYPE jenis_kelamin_enum AS ENUM ('L', 'P');
CREATE TYPE role_enum AS ENUM ('superadmin','admin','urusan','guru','siswa');
CREATE TYPE status_pegawai_enum AS ENUM ('PNS','PPPK','PPPK PW','GTT');
CREATE TYPE mode_penilaian_enum AS ENUM ('pts','semester');
```

---

## 3. Praktik Terbaik (Best Practices)

### 🟡 Penamaan

**3.1 — Inkonsistensi penamaan kolom**

```sql
-- ❌ Campur antara nama deskriptif dan singkatan:
mata_pelajaran_id   -- terlalu panjang
mapel_id            -- terlalu pendek
kode_mapel          -- oke
nama_mapel          -- oke tapi tidak konsisten dengan kolom 'nama' di tabel lain

-- ✅ Rekomendasikan konsistensi: gunakan 'nama' untuk semua tabel
-- gunakan suffix _id untuk semua FK
```

**3.2 — `semester` sebagai nama kolom di tabel `nilai` membingungkan**

Kolom `semester` (nilai semester) bertabrakan secara semantik dengan tabel `semester`. Ganti nama kolom:

```sql
-- ❌ Ambigu
nilai.semester

-- ✅ Jelas
nilai.nilai_semester
```

---

### 🟡 Integritas Data

**3.3 — Tidak ada validasi bobot komponen = 100%**

```sql
-- Tambahkan constraint di komponen_nilai
ALTER TABLE komponen_nilai
ADD CONSTRAINT chk_bobot_total
CHECK (bobot_uh + bobot_pts + bobot_semester = 100);
```

**3.4 — `nip` DEFAULT '-' untuk GTT tidak divalidasi di database**

Saat ini hanya bergantung pada logika frontend. Tambahkan constraint:

```sql
ALTER TABLE guru
ADD CONSTRAINT chk_nip_gtt
CHECK (
  (status_pegawai = 'GTT' AND nip = '-') OR
  (status_pegawai != 'GTT' AND nip != '-')
);
```

**3.5 — `tugas_tambahan.kelas_real_id` nullable tanpa validasi kontekstual**

Kolom ini wajib diisi jika `jenis = 'wali_kelas'` tapi nullable untuk jenis lain. Perlu constraint:

```sql
ALTER TABLE tugas_tambahan
ADD CONSTRAINT chk_wali_kelas_harus_ada_kelas
CHECK (
  (jenis = 'wali_kelas' AND kelas_real_id IS NOT NULL) OR
  (jenis != 'wali_kelas' AND kelas_real_id IS NULL)
);
```

---

## 4. Keamanan & Skalabilitas

### 🔴 Keamanan

**4.1 — `audit_log` bisa dimanipulasi via Supabase Dashboard**

Supabase Admin (Superadmin Supabase, bukan Superadmin aplikasi) tetap bisa mengubah data `audit_log` via dashboard. Untuk audit log yang benar-benar immutable, gunakan **append-only role**:

```sql
-- Buat role khusus untuk insert audit_log
-- Revoke UPDATE dan DELETE dari semua role termasuk service_role
REVOKE UPDATE, DELETE ON audit_log FROM service_role;

-- Atau gunakan Supabase Vault + pg_audit untuk audit yang lebih ketat
```

**4.2 — `pengaturan_sekolah` sebaiknya singleton yang dilindungi**

Tabel ini harus selalu punya tepat satu baris. Tambahkan constraint:

```sql
-- Pastikan hanya ada satu baris
CREATE UNIQUE INDEX idx_pengaturan_sekolah_singleton
ON pengaturan_sekolah ((true));
```

**4.3 — URL file di kolom `*_url` dan `storage_path` tidak divalidasi**

Kolom seperti `tanda_tangan_url`, `logo_url`, `template_rapor_url`, dan `storage_path` menerima teks bebas. Validasi format URL harus ada minimal di application layer, dan idealnya di constraint:

```sql
ALTER TABLE kepala_sekolah
ADD CONSTRAINT chk_ttd_url_format
CHECK (tanda_tangan_url IS NULL OR tanda_tangan_url LIKE 'https://%');
```

---

### 🟡 Skalabilitas

**4.4 — `audit_log` akan tumbuh sangat cepat**

Dengan ratusan operasi per hari, `audit_log` bisa mencapai jutaan baris dalam beberapa tahun. Rencanakan dari awal:

```sql
-- Opsi 1: Partisi by range per tahun
CREATE TABLE audit_log (
  ...
  created_at timestamptz NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_log_2025 PARTITION OF audit_log
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE audit_log_2026 PARTITION OF audit_log
FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- Opsi 2 (lebih simpel untuk solo dev): 
-- Tambahkan job untuk archive log > 2 tahun ke storage
```

**4.5 — `kepengawasan.assignments` JSONB bisa sangat besar**

Jika assignments berisi data seluruh siswa per slot per ruang (misal 500 siswa × 10 sesi), satu baris bisa berukuran beberapa MB. Ini masalah saat query dan backup. Solusi: pisahkan ke tabel `asesmen_siswa_ruang` seperti disebutkan di 1.7.

---

## 5. Draf SQL Perbaikan Lengkap

```sql
-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE jenis_kelamin_enum AS ENUM ('L', 'P');
CREATE TYPE role_enum AS ENUM ('superadmin','admin','urusan','guru','siswa');
CREATE TYPE status_enum AS ENUM ('aktif','nonaktif');
CREATE TYPE status_siswa_enum AS ENUM ('aktif','nonaktif','alumni');
CREATE TYPE status_pegawai_enum AS ENUM ('PNS','PPPK','PPPK PW','GTT');
CREATE TYPE mode_penilaian_enum AS ENUM ('pts','semester');
CREATE TYPE mode_ttd_enum AS ENUM ('digital','basah');

-- ============================================================
-- TABEL: nilai (perbaikan utama)
-- ============================================================
CREATE TABLE nilai (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id         uuid NOT NULL REFERENCES semester(id),
  siswa_id            uuid NOT NULL REFERENCES siswa(id),
  -- HAPUS kelas_dapo_id (redundan, rawan anomali)
  mata_pelajaran_id   uuid NOT NULL REFERENCES mata_pelajaran(id),
  uh1                 numeric(5,2) CHECK (uh1 BETWEEN 0 AND 100),
  uh2                 numeric(5,2) CHECK (uh2 BETWEEN 0 AND 100),
  uh3                 numeric(5,2) CHECK (uh3 BETWEEN 0 AND 100),
  uh4                 numeric(5,2) CHECK (uh4 BETWEEN 0 AND 100),
  uh5                 numeric(5,2) CHECK (uh5 BETWEEN 0 AND 100),
  pts                 numeric(5,2) CHECK (pts BETWEEN 0 AND 100),
  nilai_semester      numeric(5,2) CHECK (nilai_semester BETWEEN 0 AND 100), -- rename dari 'semester'
  rapor               numeric(5,2) GENERATED ALWAYS AS (         -- computed column
    CASE
      WHEN uh1 IS NOT NULL AND uh2 IS NOT NULL AND uh3 IS NOT NULL
        AND uh4 IS NOT NULL AND uh5 IS NOT NULL
        AND pts IS NOT NULL AND nilai_semester IS NOT NULL
      THEN ROUND(
        (((uh1+uh2+uh3+uh4+uh5)/5.0) * bobot_uh_pct / 100.0) +
        (pts * bobot_pts_pct / 100.0) +
        (nilai_semester * bobot_semester_pct / 100.0),
        2
      )
      ELSE NULL
    END
  ) STORED,
  -- Catatan: bobot perlu di-join dari komponen_nilai atau disimpan snapshot
  terkunci            boolean NOT NULL DEFAULT false,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (semester_id, siswa_id, mata_pelajaran_id)
);

-- Index wajib
CREATE INDEX idx_nilai_semester_siswa    ON nilai (semester_id, siswa_id);
CREATE INDEX idx_nilai_semester_mapel    ON nilai (semester_id, mata_pelajaran_id);
CREATE INDEX idx_nilai_terkunci          ON nilai (terkunci) WHERE terkunci = true;

-- ============================================================
-- TABEL: kehadiran (hapus kelas_real_id)
-- ============================================================
CREATE TABLE kehadiran (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id     uuid NOT NULL REFERENCES semester(id),
  siswa_id        uuid NOT NULL REFERENCES siswa(id),
  -- HAPUS kelas_real_id (redundan, lookup via siswa_kelas)
  sakit           smallint NOT NULL DEFAULT 0 CHECK (sakit >= 0),
  izin            smallint NOT NULL DEFAULT 0 CHECK (izin >= 0),
  alpha           smallint NOT NULL DEFAULT 0 CHECK (alpha >= 0),
  catatan_wali    text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (semester_id, siswa_id)
);

-- ============================================================
-- TABEL: guru (tambah constraint NIP + GTT)
-- ============================================================
ALTER TABLE guru
ADD CONSTRAINT chk_nip_gtt CHECK (
  (status_pegawai = 'GTT' AND nip = '-') OR
  (status_pegawai != 'GTT' AND nip != '-')
);

-- ============================================================
-- TABEL: komponen_nilai (tambah constraint bobot = 100)
-- ============================================================
ALTER TABLE komponen_nilai
ADD CONSTRAINT chk_bobot_total
CHECK (bobot_uh + bobot_pts + bobot_semester = 100);

-- Tambahkan snapshot bobot ke tabel nilai agar RAPOR bisa computed
-- (bobot bisa berubah, nilai historis harus tetap konsisten)
ALTER TABLE nilai
ADD COLUMN bobot_uh_pct      numeric(5,2) NOT NULL DEFAULT 40,
ADD COLUMN bobot_pts_pct     numeric(5,2) NOT NULL DEFAULT 30,
ADD COLUMN bobot_semester_pct numeric(5,2) NOT NULL DEFAULT 30;

-- ============================================================
-- TABEL: siswa_kelas (tambah trigger validasi jenjang)
-- ============================================================
CREATE OR REPLACE FUNCTION validate_siswa_kelas_jenjang()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.kelas_dapo_id IS NOT NULL AND NEW.kelas_real_id IS NOT NULL THEN
    IF (SELECT jenjang FROM kelas_dapo WHERE id = NEW.kelas_dapo_id) !=
       (SELECT jenjang FROM kelas_real  WHERE id = NEW.kelas_real_id) THEN
      RAISE EXCEPTION 'Jenjang kelas Dapo (%) dan kelas Real (%) harus sama',
        NEW.kelas_dapo_id, NEW.kelas_real_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_jenjang
BEFORE INSERT OR UPDATE ON siswa_kelas
FOR EACH ROW EXECUTE FUNCTION validate_siswa_kelas_jenjang();

-- ============================================================
-- PARTIAL UNIQUE INDEX
-- ============================================================
-- Hanya satu semester aktif
CREATE UNIQUE INDEX idx_semester_satu_aktif
ON semester (status) WHERE status = 'aktif';

-- Hanya satu kepala sekolah aktif
CREATE UNIQUE INDEX idx_kepala_sekolah_satu_aktif
ON kepala_sekolah (status) WHERE status = 'aktif';

-- Singleton pengaturan_sekolah
CREATE UNIQUE INDEX idx_pengaturan_sekolah_singleton
ON pengaturan_sekolah ((true));

-- ============================================================
-- TABEL: tugas_tambahan (tambah constraint wali_kelas)
-- ============================================================
ALTER TABLE tugas_tambahan
ADD CONSTRAINT chk_wali_kelas_harus_ada_kelas CHECK (
  (jenis = 'wali_kelas' AND kelas_real_id IS NOT NULL) OR
  (jenis != 'wali_kelas' AND kelas_real_id IS NULL)
);

-- ============================================================
-- TABEL: asesmen_siswa_ruang (ganti assignments JSONB)
-- ============================================================
CREATE TABLE asesmen_siswa_ruang (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asesmen_id      uuid NOT NULL REFERENCES asesmen(id) ON DELETE CASCADE,
  siswa_id        uuid NOT NULL REFERENCES siswa(id),
  nomor_ruang     smallint NOT NULL,
  nomor_urut      smallint,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (asesmen_id, siswa_id)
);

CREATE INDEX idx_asesmen_siswa_ruang_asesmen ON asesmen_siswa_ruang (asesmen_id, nomor_ruang);

-- ============================================================
-- AUDIT LOG: keamanan append-only
-- ============================================================
REVOKE UPDATE, DELETE ON audit_log FROM authenticated;
REVOKE UPDATE, DELETE ON audit_log FROM anon;
-- service_role masih bisa INSERT via server-side trigger
```

---

## Ringkasan Temuan

| Kategori | Kritis 🔴 | Sedang 🟡 | Total |
|---|---|---|---|
| Normalisasi & Relasi | 2 | 5 | 7 |
| Performa & Indeks | 9 indeks | 4 tipe data | 13 |
| Best Practices | 0 | 5 | 5 |
| Keamanan & Skalabilitas | 3 | 2 | 5 |
| **Total** | **14** | **16** | **30** |

---

## Prioritas Perbaikan

**Sebelum baris kode pertama ditulis:**
1. Hapus `kelas_dapo_id` dari tabel `nilai`
2. Hapus `kelas_real_id` dari tabel `kehadiran`
3. Buat semua ENUM type
4. Tambahkan snapshot bobot di tabel `nilai`
5. Buat partial unique index untuk semester aktif dan kepala sekolah aktif

**Sebelum fitur nilai diimplementasikan:**
6. Rename `nilai.semester` → `nilai.nilai_semester`
7. Constraint `chk_bobot_total` di `komponen_nilai`
8. Constraint `chk_nip_gtt` di `guru`
9. Trigger validasi jenjang di `siswa_kelas`
10. Semua index wajib

**Sebelum fitur asesmen diimplementasikan:**
11. Pisahkan `assignments` JSONB ke tabel `asesmen_siswa_ruang`
12. Constraint `chk_wali_kelas_harus_ada_kelas` di `tugas_tambahan`

---

*Review ini bersifat rekomendasi teknis. Keputusan final tetap ada di tangan developer yang mengetahui konteks implementasi secara penuh.*
