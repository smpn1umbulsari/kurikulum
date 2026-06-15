# Sprint 3 Task Tracker: Asesmen, Finalisasi, Android Build & Go-Live

- **Durasi**: Minggu 11 - 16
- **Tujuan**: Menyelesaikan manajemen asesmen (ruang, jadwal, pengawas), validasi data menyeluruh, backup otomatis, porting mobile Android (Capacitor), User Acceptance Testing (UAT), dan go-live produksi.

---

## 📝 FASE 5 — Asesmen (Minggu 11-14)

### 5.1 Setup Asesmen

- [x] `5.1.1` Halaman Utama Asesmen & CRUD rencana Asesmen
- [x] `5.1.3` Pilihan Jenis Ujian (`ASTS`, `ASAS`, `ASAT`, `ASAJ`), range tanggal, dan set Kode NUS
- [x] `5.1.7` Pengaturan acuan kelas ujian (Dapo / Real)

### 5.2 & 5.3 Jadwal Ujian & Matrix Ketersediaan Pengawas

- [x] `5.2.1` Tab 1: Form susunan Jadwal Ujian per sesi (maksimal 12 baris) & ekspor ke PDF
- [x] `5.3.1` Tab 2: Matrix Ketersediaan Pengawas (Guru × Slot Waktu Ujian)
- [x] `5.3.3` Fitur mark bulk (semua guru di satu slot, semua slot untuk satu guru)

### 5.4 Pembagian Ruang Siswa

- [x] `5.4.1` Setup global: kapasitas ruang, acuan data, dan mode (Setengah kelas / 20 siswa / Manual)
- [x] `5.4.4` Setup per jenjang: toggle keaktifan jenjang, urutan abjad (A→Z / Z→A), dan range nomor ruang
- [x] `5.4.9` Algoritma generate otomatis pembagian siswa ke ruang ujian
- [x] `5.4.10` Fitur edit manual hasil generate pembagian siswa
- [x] `5.4.11` Validasi: satu ruang maksimal ditempati oleh 2 jenjang (warning jika > 2 jenjang atau siswa unassigned)

### 5.5 & 5.6 Pembagian Pengawas & Kartu Pengawas

- [x] `5.5.1` Tab 3: Form pembagian pengawas (1 atau 2 pengawas per ruang)
- [x] `5.5.3` Algoritma Auto-Generate Pengawas:
  - **Urut**: Memprioritaskan guru urut dari ketersediaan, menghindari mengawas consecutive.
  - **Acak**: Distribusi merata (balanced), mendahulukan guru dengan jam mengawas paling sedikit.
- [x] `5.5.7` Validasi konflik: deteksi 1 guru terjadwal di 2 ruang pada slot waktu yang sama
- [x] `5.6.1` Tab 4: Cetak Kartu Pengawas per guru (PDF)
- [x] `5.6.7` Fitur Publish/Unpublish kartu pengawas ke dashboard Guru masing-masing

### 5.7 Generate Nomor Peserta Asesmen

- [x] `5.7.1` Fungsi generate nomor peserta otomatis
- [x] `5.7.4` Format nomor: `[Jenjang][KodeAbjad]-[KodeNUS]-[NomorAbsen]-[JK]`
  - Contoh: `71-130-025-1` (Jenjang 7, Kelas A/1, NUS 130, Absen 25, Laki-laki)
- [x] `5.7.8` Simpan ke tabel `asesmen_nomor_peserta`

### 5.8 Ekspor Dokumen Pendukung Asesmen

- [x] `5.8.1` Halaman ekspor berkas PDF/Excel:
  - **Tempel Kaca** (PDF): Nomor ruang + daftar nama peserta
  - **Data Map** (PDF): Denah posisi duduk siswa
  - **Denah Peserta** (PDF): Layout visual denah ruang
  - **Daftar Peserta** (Excel): Data rekap Excel
  - **Label 1:2:1** (PDF): Stiker nomor peserta ujian
  - **Kartu Peserta** (PDF): Kartu ujian siswa

### 5.9 Testing & Verifikasi Fase 5

- [x] `5.9.1` s.d. `5.9.17` Verifikasi alur asesmen, uji coba algoritma pengawas, validasi konflik ruang, performa generate ruang ≤ 5 detik.

---

## 🔧 FASE 6 — Finalisasi (Minggu 15-16)

### 6.1 Laporan Validasi Data (Quality Control)

- [x] `6.1.1` Halaman Laporan Validasi Data Admin & Urusan
- [x] `6.1.2` Deteksi: siswa tanpa nilai, kelas tanpa wali kelas, guru mengajar belum input nilai, data kepala sekolah kosong
- [x] `6.1.7` Tampilkan dashboard log error data lengkap dengan tautan (link) langsung untuk perbaikan

### 6.2 Backup & Restore

- [x] `6.2.1` Halaman manajemen backup manual & otomatis
- [x] `6.2.4` Integrasikan pg_cron untuk jadwal backup otomatis berkala
- [x] `6.2.5` Simpan berkas SQL dump ke Private Supabase Storage bucket `backup`
- [x] `6.2.11` Fitur Restore data dengan konfirmasi 2 langkah + validasi password/admin check

### 6.3 & 6.4 Audit Log & Mode Pemeliharaan

- [x] `6.3.1` Halaman viewer Audit Log (pagination, filter tabel, user, dan tanggal)
- [x] `6.3.7` Blokir izin UPDATE dan DELETE pada tabel `audit_log` untuk seluruh role (Immutable)
- [x] `6.4.1` Fitur switch toggle Mode Pemeliharaan (Maintenance Mode)
- [x] `6.4.3` Penanganan redirect otomatis non-admin yang sedang aktif ke halaman maintenance

### 6.5 Porting Android via Capacitor

- [x] `6.5.1` Setup Capacitor di dalam project
- [x] `6.5.4` Jalankan static export Next.js (`output: 'export'`) ke folder `out/`
- [x] `6.5.5` Sinkronisasi aset statis ke folder Android native (`npx cap sync`)
- [ ] `6.5.6` Build debug & release APK via Android Studio
- [ ] `6.5.7` Uji coba kompatibilitas input spreadsheet, scrolling, dan reordering guru di perangkat Android

### 6.6 User Acceptance Testing (UAT) & Release

- [x] `6.6.1` Susun skenario UAT terperinci untuk tiap peran (Admin, Urusan, Guru, Wali Kelas)
- [x] `6.6.12` Perbaikan bug minor hasil temuan UAT (BUG-001 Fixed, 24/24 Playwright tests passed)
- [x] `6.6.13` Uji beban & performa: load dashboard ≤ 3 detik, simpan nilai ≤ 2 detik
- [x] `6.6.16` Uji penetrasi keamanan: SEC-01 API authorization fixed, SEC-02 RLS policies applied to all 23 tables
- [ ] `6.6.18` Deploy aplikasi final ke production server & setup error tracking (Sentry)
- [ ] `6.6.19` Monitoring awal go-live minggu pertama
