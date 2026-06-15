# Analisis Database — Guru Spenturi v2
## Perspektif: Database Analyst

---

## Ringkasan Eksekutif

Schema revisi 2 sudah jauh lebih baik dari versi awal. Fondasi relasional solid, ENUM types sudah diterapkan, dan isu redundansi utama sudah diselesaikan. Analisis ini berfokus pada **pola query nyata** yang akan terjadi saat aplikasi berjalan — bukan hanya struktur tabel secara teoritis.

---

## 1. Analisis Query Path (Jalur Query Kritis)

Ini adalah query yang akan paling sering dijalankan dan paling berdampak pada performa:

---

### Q1 — Dashboard Guru (dijalankan setiap guru buka dashboard)

```sql
-- Guru butuh: daftar kelas Real + mapel yang diajar + progres nilai per kelas
SELECT
  kr.nama AS kelas_real,
  mp.nama AS mapel,
  COUNT(sk.siswa_id) AS total_siswa,
  COUNT(n.id) FILTER (WHERE n.rapor IS NOT NULL) AS sudah_lengkap
FROM pembagian_mengajar_real pmr
JOIN kelas_real kr ON pmr.kelas_real_id = kr.id
JOIN mata_pelajaran mp ON pmr.mata_pelajaran_id = mp.id
JOIN siswa_kelas sk ON sk.kelas_real_id = pmr.kelas_real_id
  AND sk.semester_id = pmr.semester_id
LEFT JOIN nilai n ON n.siswa_id = sk.siswa_id
  AND n.mata_pelajaran_id = pmr.mata_pelajaran_id
  AND n.semester_id = pmr.semester_id
WHERE pmr.guru_id = $1
  AND pmr.semester_id = $2
GROUP BY kr.nama, mp.nama;
```

**Masalah:** Query ini melibatkan 5 tabel join. Dengan index yang ada (`idx_pmr_guru_semester`, `idx_siswa_kelas_kelas_real`, `idx_nilai_semester_siswa`) query ini seharusnya cepat. Namun perlu dipastikan index `idx_nilai_semester_mapel` juga ada untuk filter `mata_pelajaran_id`.

**Rekomendasi:** Bungkus dalam Supabase RPC function `get_dashboard_guru($guru_id, $semester_id)` untuk menghindari N query dari frontend.

---

### Q2 — Input Nilai (dijalankan setiap guru buka halaman nilai)

```sql
-- Ambil daftar siswa + nilai yang sudah ada untuk satu kelas Real + mapel
SELECT
  s.id, s.nama, s.jenis_kelamin,
  sk.nomor_absen,
  n.uh1, n.uh2, n.uh3, n.uh4, n.uh5,
  n.pts, n.nilai_semester, n.rapor,
  n.terkunci
FROM siswa_kelas sk
JOIN siswa s ON s.id = sk.siswa_id
LEFT JOIN nilai n ON n.siswa_id = sk.siswa_id
  AND n.mata_pelajaran_id = $3
  AND n.semester_id = $4
WHERE sk.kelas_real_id = $1
  AND sk.semester_id = $2
ORDER BY sk.nomor_absen;
```

**Masalah yang ditemukan:** Tidak ada index pada `(kelas_real_id, semester_id)` di `siswa_kelas`. Index yang ada hanya `idx_siswa_kelas_kelas_real` (single column). Untuk query ini perlu **composite index**.

```sql
-- Tambahkan ini
CREATE INDEX idx_siswa_kelas_kelas_real_semester
  ON siswa_kelas (kelas_real_id, semester_id);
```

---

### Q3 — Rekap Nilai (dijalankan koordinator/admin, bisa untuk ratusan siswa)

```sql
-- Rekap semua nilai semua mapel untuk satu kelas Real
SELECT
  s.nama,
  mp.nama AS mapel,
  n.uh1, n.uh2, n.uh3, n.uh4, n.uh5,
  n.pts, n.nilai_semester, n.rapor
FROM siswa_kelas sk
JOIN siswa s ON s.id = sk.siswa_id
JOIN nilai n ON n.siswa_id = sk.siswa_id AND n.semester_id = sk.semester_id
JOIN mata_pelajaran mp ON mp.id = n.mata_pelajaran_id
WHERE sk.kelas_real_id = $1
  AND sk.semester_id = $2
ORDER BY sk.nomor_absen, mp.nama;
```

**Masalah:** Query ini bisa mengembalikan `(jumlah siswa) × (jumlah mapel)` baris. Untuk 35 siswa × 12 mapel = 420 baris per query. Ini wajar, tapi butuh index yang tepat.

**Rekomendasi:** Tambahkan index composite pada `nilai`:
```sql
CREATE INDEX idx_nilai_siswa_semester_mapel
  ON nilai (siswa_id, semester_id, mata_pelajaran_id);
```

---

### Q4 — Validasi Sequential UH (dijalankan setiap guru coba isi nilai)

```sql
-- Cek apakah UH sebelumnya sudah diisi sebelum membolehkan UH berikutnya
SELECT uh1, uh2, uh3, uh4, uh5
FROM nilai
WHERE siswa_id = $1
  AND mata_pelajaran_id = $2
  AND semester_id = $3;
```

Query ini ringan, tapi dijalankan **per sel** saat guru mengetik. Pastikan UNIQUE index `(semester_id, siswa_id, mata_pelajaran_id)` sudah ada — dan memang sudah ada. ✅

---

## 2. Temuan Baru dari Analisis Query

---

### 🔴 T1 — `nomor_absen` di `siswa_kelas` tidak unik per kelas

Saat ini tidak ada constraint yang mencegah dua siswa memiliki nomor absen yang sama dalam satu kelas Real.

```sql
-- Masalah: dua siswa bisa punya nomor_absen = 5 di kelas yang sama
siswa_kelas (kelas_real_id = 'X', nomor_absen = 5, siswa_id = 'A')
siswa_kelas (kelas_real_id = 'X', nomor_absen = 5, siswa_id = 'B') -- tidak dicegah!

-- Perbaikan:
CREATE UNIQUE INDEX idx_siswa_kelas_nomor_absen_unik
  ON siswa_kelas (kelas_real_id, nomor_absen)
  WHERE nomor_absen IS NOT NULL;
```

---

### 🔴 T2 — `nilai` tidak memiliki validasi sequential UH di database

Aturan "UH2 hanya bisa diisi jika UH1 sudah terisi" saat ini hanya divalidasi di frontend. Ini rawan dilewati jika ada request langsung ke API.

```sql
-- Tambahkan constraint di tabel nilai
ALTER TABLE nilai
ADD CONSTRAINT chk_uh_sequential CHECK (
  (uh2 IS NULL OR uh1 IS NOT NULL) AND
  (uh3 IS NULL OR uh2 IS NOT NULL) AND
  (uh4 IS NULL OR uh3 IS NOT NULL) AND
  (uh5 IS NULL OR uh4 IS NOT NULL)
);
```

---

### 🔴 T3 — Generated column `rapor` menggunakan sintaks yang salah

Sintaks yang ditulis di schema saat ini:

```sql
-- ❌ Sintaks ini tidak valid di PostgreSQL
rapor AS (...) STORED,
```

Sintaks yang benar untuk PostgreSQL generated column:

```sql
-- ✅ Sintaks yang benar
rapor numeric(5,2) GENERATED ALWAYS AS (
  CASE
    WHEN uh1 IS NOT NULL AND uh2 IS NOT NULL AND uh3 IS NOT NULL
      AND uh4 IS NOT NULL AND uh5 IS NOT NULL
      AND pts IS NOT NULL AND nilai_semester IS NOT NULL
    THEN ROUND(
      ((uh1+uh2+uh3+uh4+uh5) / 5.0 * bobot_uh_pct / 100.0) +
      (pts * bobot_pts_pct / 100.0) +
      (nilai_semester * bobot_semester_pct / 100.0),
      2
    )
    ELSE NULL
  END
) STORED,
```

---

### 🔴 T4 — Trigger snapshot bobot belum didefinisikan

Schema menyebutkan "snapshot bobot disalin saat INSERT pertama" tapi triggernya belum ada. Tanpa trigger ini, kolom `bobot_uh_pct`, `bobot_pts_pct`, `bobot_semester_pct` akan selalu menggunakan DEFAULT (40/30/30) meskipun Admin sudah mengubah bobot di `komponen_nilai`.

```sql
-- Trigger untuk salin bobot dari komponen_nilai saat INSERT nilai baru
CREATE OR REPLACE FUNCTION snapshot_bobot_nilai()
RETURNS TRIGGER AS $$
DECLARE
  v_bobot komponen_nilai%ROWTYPE;
BEGIN
  -- Ambil bobot dari komponen_nilai
  SELECT * INTO v_bobot
  FROM komponen_nilai
  WHERE semester_id = NEW.semester_id
    AND mata_pelajaran_id = NEW.mata_pelajaran_id;

  -- Salin ke snapshot jika ditemukan
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
```

---

### 🟡 T5 — `asesmen_jadwal.jam` masih menggunakan `text + CHECK` bukan ENUM

Kolom ini luput dari konversi ke ENUM:

```sql
-- ❌ Saat ini
jam text CHECK (jam IN ('Jam ke - 1','Jam ke - 2'))

-- ✅ Tambahkan ENUM
CREATE TYPE jam_ujian_enum AS ENUM ('Jam ke - 1', 'Jam ke - 2');
ALTER TABLE asesmen_jadwal ALTER COLUMN jam TYPE jam_ujian_enum
  USING jam::jam_ujian_enum;
```

---

### 🟡 T6 — `backup_log.status` masih menggunakan `text + CHECK` bukan ENUM

```sql
CREATE TYPE status_backup_enum AS ENUM ('sukses','gagal');
```

---

### 🟡 T7 — `asesmen_nomor_peserta` dan `asesmen_siswa_ruang` duplikasi `nomor_ruang`

Kedua tabel menyimpan `nomor_ruang` untuk siswa yang sama dalam asesmen yang sama. Ini redundan dan bisa tidak sinkron.

**Rekomendasi:** Hapus `nomor_ruang` dari `asesmen_nomor_peserta`, lookup via join ke `asesmen_siswa_ruang`:

```sql
-- Hapus kolom ini dari asesmen_nomor_peserta
-- ALTER TABLE asesmen_nomor_peserta DROP COLUMN nomor_ruang;

-- Lookup nomor_ruang via:
SELECT anp.nomor_peserta, asr.nomor_ruang
FROM asesmen_nomor_peserta anp
JOIN asesmen_siswa_ruang asr
  ON asr.asesmen_id = anp.asesmen_id
  AND asr.siswa_id = anp.siswa_id;
```

---

### 🟡 T8 — `siswa_kelas.nomor_absen` perlu dipisah antara Dapo dan Real

Saat ini hanya ada satu `nomor_absen` di `siswa_kelas`. Namun karena nomor absen siswa di kelas Dapo dan kelas Real bisa berbeda (terutama untuk siswa titipan), sebaiknya ada dua kolom:

```sql
ALTER TABLE siswa_kelas
ADD COLUMN nomor_absen_dapo smallint,
ADD COLUMN nomor_absen_real smallint;

-- Unique index per kelas
CREATE UNIQUE INDEX idx_absen_dapo_unik
  ON siswa_kelas (kelas_dapo_id, nomor_absen_dapo)
  WHERE nomor_absen_dapo IS NOT NULL;

CREATE UNIQUE INDEX idx_absen_real_unik
  ON siswa_kelas (kelas_real_id, nomor_absen_real)
  WHERE nomor_absen_real IS NOT NULL;
```

---

### 🟡 T9 — `kepengawasan.assignments` masih JSONB untuk pembagian pengawas

Berbeda dengan `asesmen_ruang` yang assignments-nya sudah dipindah ke tabel relasional, `kepengawasan.assignments` (pembagian pengawas per slot per ruang) masih JSONB. Ini akan sulit di-query jika Admin ingin melihat "siapa yang mengawas ruang 3 pada sesi kedua".

**Rekomendasi:** Buat tabel `kepengawasan_assignments`:

```sql
CREATE TABLE kepengawasan_assignments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kepengawasan_id uuid NOT NULL REFERENCES kepengawasan(id) ON DELETE CASCADE,
  jadwal_id       uuid NOT NULL REFERENCES asesmen_jadwal(id),
  nomor_ruang     smallint NOT NULL,
  guru_id         uuid NOT NULL REFERENCES guru(id),
  urutan_pengawas smallint NOT NULL DEFAULT 1, -- 1 atau 2 (jika 2 pengawas per ruang)
  created_at      timestamptz DEFAULT now(),

  UNIQUE (kepengawasan_id, jadwal_id, nomor_ruang, urutan_pengawas)
);

CREATE INDEX idx_kepengawasan_assignments_guru
  ON kepengawasan_assignments (guru_id);
```

---

## 3. Analisis Volume Data & Pertumbuhan

Estimasi volume data untuk sekolah dengan ~400 siswa, 30 guru, 3 jenjang:

| Tabel | Baris/Semester | Akumulasi 5 Tahun |
|---|---|---|
| `siswa_kelas` | ~400 | ~4.000 |
| `nilai` | ~400 × 12 mapel = 4.800 | ~48.000 |
| `kehadiran` | ~400 | ~4.000 |
| `pembagian_mengajar_real` | ~90 | ~900 |
| `audit_log` | ~50.000+ | ~500.000+ |
| `asesmen_siswa_ruang` | ~400 × 2 asesmen = 800 | ~8.000 |
| `kartu_pengawas` | ~30 | ~300 |

**Kesimpulan:** Volume data aplikasi ini **sangat kecil** untuk ukuran database modern. Supabase free tier (500MB) lebih dari cukup untuk 5–10 tahun operasional, kecuali `audit_log` yang bisa tumbuh signifikan jika setiap perubahan nilai dicatat lengkap dengan `data_sebelum` dan `data_sesudah` (JSONB besar).

**Rekomendasi untuk `audit_log`:** Batasi `data_sebelum` dan `data_sesudah` hanya pada kolom yang berubah, bukan seluruh baris:

```sql
-- Contoh: hanya catat kolom yang berubah
data_sesudah = '{"uh1": 85}' -- bukan seluruh baris nilai
```

---

## 4. Ringkasan Temuan Baru

| ID | Temuan | Prioritas | Jenis |
|---|---|---|---|
| T1 | `nomor_absen` tidak unik per kelas | 🔴 Kritis | Constraint |
| T2 | Validasi sequential UH hanya di frontend | 🔴 Kritis | Constraint |
| T3 | Sintaks generated column `rapor` salah | 🔴 Kritis | SQL Bug |
| T4 | Trigger snapshot bobot belum ada | 🔴 Kritis | Trigger |
| T5 | `asesmen_jadwal.jam` masih text+CHECK | 🟡 Sedang | ENUM |
| T6 | `backup_log.status` masih text+CHECK | 🟡 Sedang | ENUM |
| T7 | `nomor_ruang` duplikat di dua tabel asesmen | 🟡 Sedang | Redundansi |
| T8 | `nomor_absen` perlu dipisah Dapo vs Real | 🟡 Sedang | Desain |
| T9 | `kepengawasan.assignments` masih JSONB | 🟡 Sedang | Normalisasi |

---

## 5. Indeks Tambahan yang Direkomendasikan

```sql
-- Dari analisis query path
CREATE INDEX idx_siswa_kelas_kelas_real_semester
  ON siswa_kelas (kelas_real_id, semester_id);

CREATE INDEX idx_nilai_siswa_semester_mapel
  ON nilai (siswa_id, semester_id, mata_pelajaran_id);

-- Untuk nomor absen (setelah T8 diterapkan)
CREATE UNIQUE INDEX idx_absen_dapo_unik
  ON siswa_kelas (kelas_dapo_id, nomor_absen_dapo)
  WHERE nomor_absen_dapo IS NOT NULL;

CREATE UNIQUE INDEX idx_absen_real_unik
  ON siswa_kelas (kelas_real_id, nomor_absen_real)
  WHERE nomor_absen_real IS NOT NULL;
```

---

## 6. Rekomendasi Urutan Perbaikan

**Sebelum baris kode pertama:**
1. Perbaiki sintaks generated column `rapor` (T3)
2. Tambahkan trigger `snapshot_bobot` (T4)
3. Pisahkan `nomor_absen` menjadi Dapo dan Real (T8)
4. Tambahkan constraint sequential UH (T2)
5. Tambahkan unique index `nomor_absen` (T1)

**Sebelum fitur asesmen:**
6. Buat tabel `kepengawasan_assignments` (T9)
7. Hapus `nomor_ruang` dari `asesmen_nomor_peserta` (T7)

**Kapanpun (low risk):**
8. Konversi `jam` dan `backup_log.status` ke ENUM (T5, T6)
9. Tambahkan composite index baru (T8 index)

---

*Analisis ini bersifat teknis dan berdasarkan pola query yang diprediksi dari spesifikasi fungsional PRD v2.*
*Temuan dapat bertambah seiring implementasi nyata — disarankan review ulang setelah fase development pertama selesai.*
