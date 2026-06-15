# Analisis Database — Guru Spenturi v2
## Revisi 3 — Analisis Lanjutan
## Perspektif: Database Analyst

---

## Ringkasan Eksekutif

Schema Revisi 3 sudah sangat solid. Semua temuan kritis dari analisis sebelumnya sudah diselesaikan dengan baik. Analisis ini menemukan **8 temuan baru** — tidak ada yang kritis seperti sebelumnya, namun beberapa perlu perhatian sebelum data production masuk.

---

## 1. Temuan Baru

---

### 🔴 A1 — `kartu_pengawas.rows` masih JSONB padahal `kepengawasan_assignments` sudah ada

Setelah `kepengawasan_assignments` dibuat sebagai tabel relasional, kolom `kartu_pengawas.rows` (yang berisi jadwal mengawas per sesi) seharusnya tidak perlu lagi disimpan sebagai JSONB — datanya sudah ada di `kepengawasan_assignments` dan bisa di-generate saat dibutuhkan.

Menyimpan `rows` sebagai JSONB menciptakan **dual source of truth**: data pengawas ada di dua tempat dan bisa tidak sinkron jika salah satu diupdate.

```sql
-- ❌ Duplikasi data
kartu_pengawas.rows = '[{"jadwal": "...", "ruang": 1, "guru": "..."}]'
kepengawasan_assignments (jadwal_id, nomor_ruang, guru_id) -- data yang sama

-- ✅ Hapus kolom rows, generate kartu dari kepengawasan_assignments saat dibutuhkan
ALTER TABLE kartu_pengawas DROP COLUMN rows;

-- Query untuk generate isi kartu pengawas:
SELECT
  aj.hari, aj.tanggal, aj.jam, aj.jam_mulai,
  mp.nama AS mata_pelajaran,
  ka.nomor_ruang
FROM kepengawasan_assignments ka
JOIN kepengawasan k ON k.id = ka.kepengawasan_id
JOIN asesmen_jadwal aj ON aj.id = ka.jadwal_id
JOIN mata_pelajaran mp ON mp.id = aj.mata_pelajaran_id
WHERE ka.guru_id = $1
  AND k.asesmen_id = $2
ORDER BY aj.tanggal, aj.jam;
```

---

### 🔴 A2 — `kepengawasan.teacher_codes` JSONB tidak jelas fungsinya

Kolom `teacher_codes` di `kepengawasan` menyimpan "kode guru mapping" sebagai JSONB. Ini ambigu — apakah ini alias/kode khusus untuk keperluan asesmen, atau duplikasi dari `guru.kode_guru`?

Jika ini hanya alias sementara untuk keperluan asesmen, sebaiknya dipindah ke tabel `guru` sebagai kolom tambahan, atau dihapus jika memang duplikasi dari `guru.kode_guru`.

**Rekomendasi:** Konfirmasi fungsinya. Jika memang hanya referensi ke `guru.kode_guru`, hapus kolom ini dan gunakan `guru.kode_guru` langsung.

---

### 🟡 A3 — `asesmen.jenis_ujian` masih `text` padahal nilainya terbatas

Dari kode lama, `jenis_ujian` hanya punya 4 nilai tetap. Ini kandidat ENUM yang terlewat.

```sql
CREATE TYPE jenis_ujian_enum AS ENUM (
  'Asesmen Sumatif Tengah Semester',
  'Asesmen Sumatif Akhir Semester',
  'Asesmen Sumatif Akhir Tahun',
  'Asesmen Sumatif Akhir Jenjang'
);

ALTER TABLE asesmen
  ALTER COLUMN jenis_ujian TYPE jenis_ujian_enum
  USING jenis_ujian::jenis_ujian_enum;
```

---

### 🟡 A4 — `asesmen_jadwal.hari` masih `text` padahal nilainya terbatas

Kolom `hari` hanya berisi nama hari (Senin–Sabtu). Kandidat ENUM.

```sql
CREATE TYPE hari_enum AS ENUM (
  'Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'
);

ALTER TABLE asesmen_jadwal
  ALTER COLUMN hari TYPE hari_enum
  USING hari::hari_enum;
```

---

### 🟡 A5 — `kepengawasan.matrix_mengawasi` JSONB tidak ada validasi struktur

Kolom `matrix_mengawasi` menyimpan matrix guru × slot sebagai JSONB bebas. Tidak ada validasi bahwa `guru_id` yang ada di dalam JSONB benar-benar ada di tabel `guru`.

Risiko: matrix bisa berisi `guru_id` yang sudah dihapus atau tidak valid, menyebabkan silent data corruption saat generate pembagian.

**Rekomendasi jangka pendek:** Tambahkan validasi di application layer sebelum menyimpan matrix.

**Rekomendasi jangka panjang:** Buat tabel `kepengawasan_ketersediaan` sebagai alternatif relasional:

```sql
CREATE TABLE kepengawasan_ketersediaan (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kepengawasan_id   uuid NOT NULL REFERENCES kepengawasan(id) ON DELETE CASCADE,
  guru_id           uuid NOT NULL REFERENCES guru(id),
  jadwal_id         uuid NOT NULL REFERENCES asesmen_jadwal(id),
  tersedia          boolean NOT NULL DEFAULT false,
  created_at        timestamptz DEFAULT now(),

  UNIQUE (kepengawasan_id, guru_id, jadwal_id)
);
```

---

### 🟡 A6 — `nilai` tidak memiliki RLS policy yang terdefinisi eksplisit

Schema menyebutkan "RLS diterapkan pada seluruh tabel" namun tidak ada satu pun contoh RLS policy yang didefinisikan. Untuk tabel `nilai` yang sangat sensitif, RLS policy harus eksplisit:

```sql
-- Enable RLS
ALTER TABLE nilai ENABLE ROW LEVEL SECURITY;

-- Guru hanya bisa SELECT nilai milik kelasnya (via pembagian_mengajar_real)
CREATE POLICY nilai_select_guru ON nilai
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pembagian_mengajar_real pmr
    JOIN siswa_kelas sk ON sk.kelas_real_id = pmr.kelas_real_id
      AND sk.semester_id = pmr.semester_id
    JOIN pengguna p ON p.id = auth.uid()
    JOIN guru g ON g.pengguna_id = p.id
    WHERE pmr.guru_id = g.id
      AND sk.siswa_id = nilai.siswa_id
      AND pmr.mata_pelajaran_id = nilai.mata_pelajaran_id
      AND pmr.semester_id = nilai.semester_id
  )
  OR EXISTS (
    SELECT 1 FROM pengguna WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin', 'urusan')
  )
);

-- Guru hanya bisa UPDATE nilai yang tidak terkunci
CREATE POLICY nilai_update_guru ON nilai
FOR UPDATE TO authenticated
USING (
  terkunci = false
  AND EXISTS (
    SELECT 1 FROM pembagian_mengajar_real pmr
    JOIN siswa_kelas sk ON sk.kelas_real_id = pmr.kelas_real_id
    JOIN pengguna p ON p.id = auth.uid()
    JOIN guru g ON g.pengguna_id = p.id
    WHERE pmr.guru_id = g.id
      AND sk.siswa_id = nilai.siswa_id
      AND pmr.mata_pelajaran_id = nilai.mata_pelajaran_id
      AND pmr.semester_id = nilai.semester_id
  )
);

-- Admin dan Urusan bisa UPDATE semua nilai termasuk yang terkunci
CREATE POLICY nilai_update_admin ON nilai
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pengguna WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin', 'urusan')
  )
);
```

---

### 🟡 A7 — `siswa_kelas.kelas_dapo_id` dan `kelas_real_id` nullable tanpa validasi bisnis

Saat ini kedua FK ini nullable — artinya siswa bisa ada di `siswa_kelas` tanpa kelas apapun. Ini wajar saat import awal, tapi perlu ada mekanisme yang mencegah nilai atau kehadiran diinput untuk siswa yang belum punya kelas.

**Rekomendasi:** Tambahkan validasi di trigger atau RLS bahwa `nilai` dan `kehadiran` hanya bisa di-INSERT jika siswa sudah punya `kelas_real_id` dan `kelas_dapo_id` di semester yang sama.

```sql
CREATE OR REPLACE FUNCTION validate_siswa_sudah_punya_kelas()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM siswa_kelas
    WHERE siswa_id = NEW.siswa_id
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

CREATE TRIGGER trg_validate_siswa_punya_kelas_kehadiran
BEFORE INSERT ON kehadiran
FOR EACH ROW EXECUTE FUNCTION validate_siswa_sudah_punya_kelas();
```

---

### 🟡 A8 — `import_template_log` tidak ada index dan tidak ada TTL enforcement

Tabel ini bisa tumbuh besar karena setiap kali guru download template, satu baris ditambahkan. Tidak ada mekanisme pembersihan otomatis.

```sql
-- Tambahkan index untuk lookup validasi saat upload
CREATE INDEX idx_import_template_log_lookup
  ON import_template_log (semester_id, kelas_real_id, mata_pelajaran_id, generated_at DESC);

-- Untuk pembersihan otomatis, tambahkan pg_cron job (Supabase mendukung ini)
-- atau buat scheduled function yang hapus log > 30 hari
```

---

## 2. Konfirmasi Hal yang Sudah Benar

Untuk transparansi, berikut hal-hal yang sudah benar dan tidak perlu diubah:

| Aspek | Status |
|---|---|
| UUID sebagai PK | ✅ Benar |
| ENUM untuk nilai tetap | ✅ Sudah diterapkan (11 ENUM) |
| Snapshot bobot di `nilai` | ✅ Benar — mencegah perubahan bobot merusak historis |
| Generated column `rapor` | ✅ Sintaks sudah diperbaiki |
| Constraint sequential UH | ✅ Ada di database level |
| Trigger validasi jenjang | ✅ Ada |
| Partial unique index semester aktif | ✅ Ada |
| Partial unique index kepala sekolah | ✅ Ada |
| Singleton `pengaturan_sekolah` | ✅ Ada |
| `asesmen_siswa_ruang` relasional | ✅ Sudah dipindah dari JSONB |
| `kepengawasan_assignments` relasional | ✅ Sudah dipindah dari JSONB |
| `nomor_absen` dipisah Dapo/Real | ✅ Benar |
| `nomor_ruang` tidak duplikat | ✅ Sudah dihapus dari `asesmen_nomor_peserta` |
| `audit_log` immutable | ✅ REVOKE sudah ada |
| Index pada kolom FK utama | ✅ Sudah lengkap |

---

## 3. Ringkasan Temuan Baru

| ID | Temuan | Prioritas | Jenis |
|---|---|---|---|
| A1 | `kartu_pengawas.rows` duplikasi data dengan `kepengawasan_assignments` | 🔴 Kritis | Redundansi |
| A2 | `kepengawasan.teacher_codes` tidak jelas fungsinya | 🔴 Kritis | Klarifikasi |
| A3 | `asesmen.jenis_ujian` masih `text` | 🟡 Sedang | ENUM |
| A4 | `asesmen_jadwal.hari` masih `text` | 🟡 Sedang | ENUM |
| A5 | `kepengawasan.matrix_mengawasi` JSONB tanpa validasi referensial | 🟡 Sedang | Integritas |
| A6 | RLS policy `nilai` belum didefinisikan eksplisit | 🟡 Sedang | Keamanan |
| A7 | Nilai & kehadiran bisa diinput untuk siswa tanpa kelas | 🟡 Sedang | Validasi |
| A8 | `import_template_log` tidak ada index & TTL | 🟡 Sedang | Performa |

---

## 4. Rekomendasi Urutan Perbaikan

**Segera sebelum implementasi:**
1. Konfirmasi fungsi `teacher_codes` (A2) — hapus jika duplikasi
2. Hapus `kartu_pengawas.rows` (A1) — generate dari `kepengawasan_assignments`
3. Tambahkan trigger validasi siswa punya kelas sebelum insert nilai (A7)

**Sebelum fitur asesmen:**
4. Tambahkan ENUM `jenis_ujian_enum` dan `hari_enum` (A3, A4)
5. Pertimbangkan tabel `kepengawasan_ketersediaan` (A5)

**Sebelum go-live:**
6. Definisikan RLS policy eksplisit untuk tabel `nilai` (A6)
7. Tambahkan index dan pembersihan otomatis `import_template_log` (A8)

---

## 5. Catatan Akhir

Schema ini sudah melewati **3 iterasi review** dan kualitasnya sudah sangat baik untuk ukuran aplikasi sekolah. Temuan yang tersisa sudah jauh lebih minor dibanding temuan di Revisi 1 dan 2.

Setelah A1 dan A7 diselesaikan, schema ini sudah siap untuk implementasi fase pertama (Auth, Data Master, Dashboard).

---

*Analisis Lanjutan — Juni 2026.*
*Referensi: DATABASE-SCHEMA.md Revisi 3, DATABASE-REVIEW.md, DATABASE-ANALYSIS.md*
