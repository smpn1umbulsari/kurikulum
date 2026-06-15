# 5 Phase PRD — Guru Spenturi v2
## Ringkasan Struktur & Progres

---

## Bagian 1 — Fondasi Produk ✅ Selesai
1. Ringkasan Produk
2. Latar Belakang & Masalah Versi Lama
3. Visi Produk
4. Tujuan Produk
5. Prinsip Produk
   - Keamanan adalah Fondasi
   - Berbasis Peran
   - Satu Data, Banyak Proses
   - Berbasis Semester
   - Validasi Berlapis
   - Output yang Dapat Diandalkan
   - Mobile Friendly
   - Dapat Dipulihkan

---

## Bagian 2 — Persona, Peran & Ruang Lingkup ✅ Selesai
1. Persona & Peran
   - Hierarki peran (Superadmin → Admin → Urusan → Guru → Siswa)
   - Tugas tambahan Urusan: Kepala Kurikulum, Koordinator Kelas 7/8/9
   - Tugas tambahan Guru: Wali Kelas
2. Detail per Peran
   - Superadmin
   - Admin
   - Urusan (+ tugas tambahan koordinator)
   - Guru (+ tugas tambahan wali kelas)
   - Siswa
3. Ruang Lingkup Fungsional (20 modul, prioritas P0/P1)
4. Asumsi Awal

---

## Bagian 3 — Spesifikasi Fungsional: Auth, Dashboard, Data Master, Input Nilai ✅ Selesai
1. Auth, Sesi & Hak Akses
   - Login via Supabase Auth
   - Otorisasi di sisi server
   - RLS dari hari pertama
   - Mode Pemeliharaan
2. Dashboard
   - Solusi performa: satu RPC call, cache state, skeleton loading
   - Dashboard per peran (Superadmin, Admin, Urusan, Guru, Siswa)
   - Koordinator & Wali Kelas sebagai tampilan tambahan di dashboard peran masing-masing
3. Data Master
   - Guru
     - Kode auto-generate format `GR-XXX`
     - UUID sebagai primary key internal
     - Status kepegawaian: PNS, PPPK, PPPK PW, GTT
     - NIP (otomatis `-` jika GTT)
     - Urutan tampilan via drag & drop (desktop) dan tombol ▲▼ (mobile)
   - Siswa
     - Relasi ke kelas Dapo (akademik) dan kelas Real (operasional)
     - Import/export Excel massal
   - Kelas
     - Kelas Dapo: untuk nilai, rapor, wali kelas, pembagian mengajar
     - Kelas Real: hanya untuk penataan daftar siswa di ruang fisik
     - Penitipan siswa antar kelas dalam jenjang yang sama
   - Mata Pelajaran
   - Kepala Sekolah (tanda tangan digital untuk rapor & asesmen)
4. Pembagian Mengajar & Tugas Tambahan
   - Dua tabel independen: pembagian kelas Dapo & kelas Real
   - Tombol sinkronisasi dua arah (Dapo → Real / Real → Dapo)
   - Alur sinkron: tampilkan konflik → pilih Timpa Semua atau Gabung
   - Tugas tambahan bersifat assignment aktif per semester, bisa diubah kapanpun
5. Input Nilai
   - Tampilan mengikuti kelas Real (daftar siswa & mapel)
   - Nilai tersimpan ke kelas Dapo
   - Mode input: tabel spreadsheet inline & upload Excel
   - Komponen nilai: UH1, UH2, UH3, UH4, UH5, PTS, SEMESTER, RAPOR
   - Mode PTS: tampil UH1–UH3, PTS
   - Mode Semester: tampil semua komponen
   - UH sequential per siswa (UH2 butuh UH1, dst.)
   - Nilai terkunci saat mode Semester aktif (kecuali Admin & Urusan)
   - RAPOR dihitung otomatis jika semua komponen lengkap
   - Formula: (rata-rata UH × bobot) + (PTS × bobot) + (SEMESTER × bobot)

---

## Bagian 4 — Spesifikasi Fungsional: Rekap Nilai, Rapor, Asesmen, Backup & Validasi 🔜 Belum Dibuat
1. Rekap Nilai
2. Wali Kelas & Kehadiran
3. Rapor (Export PDF)
4. Asesmen
   - Pembagian ruang otomatis, bisa diedit manual
   - Nomor peserta
   - Pembagian pengawas
5. Validasi Data
   - Realtime (ringan)
   - Saat simpan
   - Laporan validasi admin
6. Backup & Restore
7. Audit Log
8. Mode Pemeliharaan

---

## Bagian 5 — Non-Functional Requirements, Metrik & Risiko 🔜 Belum Dibuat
1. Non-Functional Requirements
   - Performa (termasuk solusi dashboard RPC)
   - Keamanan
   - Skalabilitas
   - Mobile Responsiveness
2. Alur Utama (User Flows)
3. Metrik Keberhasilan
4. Risiko & Mitigasi
5. Prioritas & Roadmap

---

*Terakhir diperbarui: Juni 2026*
