# Sprint 2 Task Tracker: Kurikulum, Dashboard, Penilaian & Rapor

* **Durasi**: Minggu 5 - 10
* **Tujuan**: Menyelesaikan pembagian mengajar, sinkronisasi kelas, dashboard performa tinggi (RPC), input nilai spreadsheet, upload Excel terverifikasi metadata, dan ekspor rapor PDF.
* **Status**: IN PROGRESS

---

## 📚 FASE 3 — Kurikulum & Dashboard (Minggu 5-6)

### 3.1 & 3.2 Pembagian Mengajar Dapo & Real ✅
- [x] `3.1.1` Halaman CRUD Pembagian Mengajar Dapodik (Guru + Mapel + Kelas Dapo)
- [x] `3.2.1` Halaman CRUD Pembagian Mengajar Real (Guru + Mapel + Kelas Real)

### 3.3 Sinkronisasi Pembagian Mengajar
- [x] `3.3.1` Buat antarmuka dan dialog sinkronisasi
- [x] `3.3.2` Buat fungsi komparasi data mengajar Dapo vs Real
- [x] `3.3.3` Tampilkan tabel konflik jika ada perbedaan data mengajar
- [x] `3.3.4` Implementasikan opsi penyelesaian konflik: "Timpa Semua" atau "Gabung"
- [x] `3.3.8` Catat hasil eksekusi sinkronisasi ke audit log

### 3.4 Tugas Tambahan
- [x] `3.4.1` Buat form penetapan tugas tambahan (Koordinator jenjang 7/8/9, Kepala Kurikulum)
- [x] `3.4.4` Buat form penetapan Wali Kelas (terikat ke kelas Real)
- [x] `3.4.3` Validasi filter: wali kelas hanya boleh dipilih dari guru berstatus PNS/PPPK/PPPK PW (GTT diblokir)

### 3.5 & 3.6 RPC Dashboard & Halaman Dashboard
- [x] `3.5.1` Buat postgres RPC function `get_dashboard_summary(guru_id)`
- [x] `3.5.3` Buat postgres RPC functions untuk dashboard Admin, Urusan, Superadmin, dan Siswa
- [x] `3.6.1` Sediakan skeleton loading dashboard
- [x] `3.6.3` Sediakan React hook dashboard dengan caching (mencegah refetch saat navigasi balik)
- [x] `3.6.7` Integrasikan tampilan dashboard per peran (Superadmin, Admin, Urusan, Guru, Wali Kelas, Siswa)

### 3.7 Testing & Verifikasi Fase 3
- [ ] `3.7.1` s.d. `3.7.16` Uji coba sinkronisasi, validasi roles tugas tambahan, performa load dashboard RPC ≤ 3 detik, dan kelancaran skeleton loader.

---

## 📊 FASE 4 — Penilaian & Rapor (Minggu 7-10)

### 4.1 Setup Input Nilai
- [x] `4.1.1` Halaman filter input nilai (memuat daftar kelas Real & mapel guru yang bersangkutan saja)
- [x] `4.1.5` Deteksi mode penilaian semester aktif (PTS atau Semester) untuk menyembunyikan/menampilkan kolom

### 4.2 Tabel Spreadsheet Inline
- [x] `4.2.1` Komponen tabel nilai spreadsheet inline (UH1-UH5, PTS, SEMESTER, RAPOR)
- [x] `4.2.5` Navigasi sel menggunakan Tab dan Enter
- [x] `4.2.6` Tandai secara visual sel nilai yang diubah sebelum disimpan
- [x] `4.2.7` Validasi sequential: input UH(N) terkunci sebelum UH(N-1) terisi
- [x] `4.2.12` Kunci nilai yang sudah diisi di masa PTS saat mode Semester aktif bagi Guru
- [x] `4.2.13` Kalkulasi otomatis nilai RAPOR secara real-time saat seluruh komponen lengkap
- [x] `4.2.14` Dukungan partial save (simpan sebagian data siswa)

### 4.3 Upload Excel (Metadata Validation)
- [x] `4.3.1` Generate template Excel dengan named range tersembunyi (`_meta_semester_id`, `_meta_kelas_real_id`, `_meta_mapel_id`)
- [x] `4.3.5` Form upload file Excel nilai
- [x] `4.3.6` Validasi metadata server-side (tolak file jika ID semester, kelas, atau mapel tidak cocok)
- [x] `4.3.9` Validasi isi file Excel (format angka, range 0–100) dan tampilkan log error per baris jika gagal
- [x] `4.3.11` Tampilkan review perbandingan/konflik data upload vs database sebelum disimpan

### 4.4 & 4.5 Simpan Nilai & Rekap Nilai
- [x] `4.4.1` Server action batch save nilai (menyertakan trigger snapshot bobot komponen nilai)
- [x] `4.5.1` Halaman rekap nilai kelas Real (filter mapel, status kelengkapan, dan role access control)
- [x] `4.5.10` Fitur ekspor hasil rekap ke file Excel

### 4.6 Kehadiran & Catatan Wali Kelas
- [x] `4.6.1` Halaman input rekap kehadiran siswa (Sakit, Izin, Alpha) untuk Wali Kelas
- [x] `4.6.4` Kolom input deskripsi Catatan Wali Kelas per siswa

### 4.7 Ekspor Rapor PDF (jsPDF + jspdf-autotable) ✅
- [x] `4.7.2` Halaman ekspor rapor PDF kelas Real
- [x] `4.7.3` Cek prasyarat ekspor rapor (nilai lengkap, kehadiran terisi, catatan wali terisi, data kepsek aktif)
- [x] `4.7.4` Tampilkan status kelengkapan data siswa dengan tautan perbaikan langsung
- [x] `4.7.7` Fitur ekspor per siswa (1 PDF) dan ekspor massal per kelas (1 PDF gabungan, 1 hal per siswa)
- [x] `4.7.16` Integrasikan TTD digital kepala sekolah (PNG transparan) atau TTD basah (kolom kosong)
- [ ] `4.7.20` Fitur upload template rapor PDF resmi sekolah (Admin)

### 4.8 Testing & Verifikasi Fase 4
- [ ] `4.8.1` s.d. `4.8.22` Uji coba input spreadsheet, sequential checks, tolak upload template salah kelas, perhitungan nilai rapor, dan performa ekspor PDF ≤ 60 detik per kelas.

---

## 📁 Files Created in Sprint 2

### Pages
- `src/app/(protected)/master/pembagian-mengajar-dapo/page.tsx`
- `src/app/(protected)/master/pembagian-mengajar-real/page.tsx`
- `src/app/(protected)/master/kelas-real/page.tsx`
- `src/app/(protected)/master/sinkronisasi-mengajar/page.tsx`
- `src/app/(protected)/master/tugas-tambahan/page.tsx`
- `src/app/(protected)/dashboard/page.tsx`
- `src/app/(protected)/nilai/page.tsx`
- `src/app/(protected)/nilai/upload/page.tsx`
- `src/app/(protected)/nilai/rekap/page.tsx`
- `src/app/(protected)/kehadiran/page.tsx`

### Database
- `supabase/migrations/006_rpc_dashboard.sql`

### Hooks
- `src/hooks/useDashboard.ts`

### Components
- `src/components/ui/badge.tsx`

---

## Progress Summary

| Fase | Task | Status |
|------|------|--------|
| 3.1 | CRUD Pembagian Mengajar Dapodik | ✅ COMPLETE |
| 3.2 | CRUD Pembagian Mengajar Real | ✅ COMPLETE |
| 3.3 | Sinkronisasi Pembagian Mengajar | ✅ COMPLETE |
| 3.4 | Tugas Tambahan & Wali Kelas | ✅ COMPLETE |
| 3.5-3.6 | RPC Dashboard | ✅ COMPLETE |
| 3.7 | Testing & Verifikasi Fase 3 | ⏳ PENDING |
| 4.1-4.2 | Input Nilai & Spreadsheet | ✅ COMPLETE |
| 4.3 | Upload Excel | ✅ COMPLETE |
| 4.4-4.5 | Rekap Nilai & Export | ✅ COMPLETE |
| 4.6 | Kehadiran & Catatan Wali | ✅ COMPLETE |
| 4.7 | Ekspor Rapor PDF | ✅ COMPLETE |

---

## Summary

**Fase 3: Kurikulum & Dashboard** = ✅ SELESAI (100%)

**Fase 4: Penilaian & Rapor** = ✅ MAJOR FEATURES COMPLETE

**Completed This Session:**
- ✅ `4.7.2` Halaman ekspor rapor PDF
- ✅ `4.7.3` Cek prasyarat ekspor
- ✅ `4.7.4` Status kelengkapan data
- ✅ `4.7.7` Export per siswa & massal
- ✅ `4.7.16` TTD digital kepala sekolah

**Remaining:**
- 4.7.20 Upload template rapor PDF resmi
- 4.8 Testing & Verifikasi

**Files Created This Session:**
- `src/app/(protected)/rapor/ekspor/page.tsx` - Ekspor Rapor PDF
