# Task Tracker — Guru Spenturi v2

> Checklist granular untuk tracking progress development. Update file ini setiap selesai satu task.

---

## 🚀 FASE 1 — Fondasi Sistem (Minggu 1-2)

### 1.1 Setup Project

- [ ] `1.1.1` Initialize Next.js project dengan TypeScript
- [ ] `1.1.2` Setup Tailwind CSS
- [ ] `1.1.3` Install dan setup shadcn/ui
- [ ] `1.1.4` Setup Supabase client (client.ts)
- [ ] `1.1.5` Setup Supabase server (server.ts)
- [ ] `1.1.6` Buat folder structure (App Router)
- [ ] `1.1.7` Setup environment variables (.env.local)
- [ ] `1.1.8` Buat folder supabase/migrations/
- [ ] `1.1.9` Setup Git repository

### 1.2 Database Setup

- [ ] `1.2.1` Buat ENUM types (role_enum, status_enum, dll)
- [ ] `1.2.2` Buat tabel: pengguna
- [ ] `1.2.3` Buat tabel: tahun_pelajaran
- [ ] `1.2.4` Buat tabel: semester
- [ ] `1.2.5` Buat tabel: guru
- [ ] `1.2.6` Buat tabel: siswa
- [ ] `1.2.7` Buat tabel: kepala_sekolah
- [ ] `1.2.8` Buat tabel: mata_pelajaran
- [ ] `1.2.9` Buat tabel: kelas_dapo
- [ ] `1.2.10` Buat tabel: kelas_real
- [ ] `1.2.11` Buat tabel: siswa_kelas
- [ ] `1.2.12` Buat tabel: komponen_nilai
- [ ] `1.2.13` Buat tabel: pembagian_mengajar_dapo
- [ ] `1.2.14` Buat tabel: pembagian_mengajar_real
- [ ] `1.2.15` Buat tabel: nilai
- [ ] `1.2.16` Buat tabel: kehadiran
- [ ] `1.2.17` Buat tabel: asesmen
- [ ] `1.2.18` Buat tabel: asesmen_jadwal
- [ ] `1.2.19` Buat tabel: asesmen_ruang
- [ ] `1.2.20` Buat tabel: asesmen_siswa_ruang
- [ ] `1.2.21` Buat tabel: asesmen_nomor_peserta
- [ ] `1.2.22` Buat tabel: kepengawasan
- [ ] `1.2.23` Buat tabel: kepengawasan_assignments
- [ ] `1.2.24` Buat tabel: kartu_pengawas
- [ ] `1.2.25` Buat tabel: audit_log
- [ ] `1.2.26` Buat tabel: backup_log
- [ ] `1.2.27` Buat tabel: import_template_log
- [ ] `1.2.28` Buat tabel: tugas_tambahan
- [ ] `1.2.29` Buat tabel: pengaturan_sekolah
- [ ] `1.2.30` Buat semua index untuk setiap tabel
- [ ] `1.2.31` Buat trigger: validate_siswa_kelas_jenjang
- [ ] `1.2.32` Buat trigger: snapshot_bobot_nilai
- [ ] `1.2.33` Buat trigger: validate_siswa_sudah_punya_kelas (untuk nilai)
- [ ] `1.2.34` Buat trigger: validate_siswa_sudah_punya_kelas (untuk kehadiran)
- [ ] `1.2.35` Buat constraint: chk_bobot_total
- [ ] `1.2.36` Buat constraint: chk_nip_gtt
- [ ] `1.2.37` Buat constraint: chk_wali_kelas_harus_ada_kelas
- [ ] `1.2.38` Buat constraint: chk_uh_sequential
- [ ] `1.2.39` Buat constraint: chk_bobot_total
- [ ] `1.2.40` Buat partial unique index: semester aktif
- [ ] `1.2.41` Buat partial unique index: kepala sekolah aktif
- [ ] `1.2.42` Buat singleton index: pengaturan_sekolah
- [ ] `1.2.43` Buat unique index: nomor_absen_dapo
- [ ] `1.2.44` Buat unique index: nomor_absen_real

### 1.3 RLS Policies

- [ ] `1.3.1` RLS policy: pengguna (SELECT)
- [ ] `1.3.2` RLS policy: pengguna (INSERT/UPDATE/DELETE)
- [ ] `1.3.3` RLS policy: guru (SELECT)
- [ ] `1.3.4` RLS policy: guru (INSERT/UPDATE/DELETE)
- [ ] `1.3.5` RLS policy: siswa (SELECT)
- [ ] `1.3.6` RLS policy: siswa (INSERT/UPDATE/DELETE)
- [ ] `1.3.7` RLS policy: kelas_dapo (SELECT)
- [ ] `1.3.8` RLS policy: kelas_dapo (INSERT/UPDATE/DELETE)
- [ ] `1.3.9` RLS policy: kelas_real (SELECT)
- [ ] `1.3.10` RLS policy: kelas_real (INSERT/UPDATE/DELETE)
- [ ] `1.3.11` RLS policy: siswa_kelas (SELECT)
- [ ] `1.3.12` RLS policy: siswa_kelas (INSERT/UPDATE/DELETE)
- [ ] `1.3.13` RLS policy: mata_pelajaran (SELECT)
- [ ] `1.3.14` RLS policy: mata_pelajaran (INSERT/UPDATE/DELETE)
- [ ] `1.3.15` RLS policy: kepala_sekolah (SELECT)
- [ ] `1.3.16` RLS policy: kepala_sekolah (INSERT/UPDATE/DELETE)
- [ ] `1.3.17` RLS policy: semester (SELECT)
- [ ] `1.3.18` RLS policy: semester (INSERT/UPDATE/DELETE)
- [ ] `1.3.19` RLS policy: tahun_pelajaran (SELECT)
- [ ] `1.3.20` RLS policy: tahun_pelajaran (INSERT/UPDATE/DELETE)
- [ ] `1.3.21` RLS policy: komponen_nilai (SELECT)
- [ ] `1.3.22` RLS policy: komponen_nilai (INSERT/UPDATE/DELETE)
- [ ] `1.3.23` RLS policy: pembagian_mengajar_dapo (SELECT)
- [ ] `1.3.24` RLS policy: pembagian_mengajar_dapo (INSERT/UPDATE/DELETE)
- [ ] `1.3.25` RLS policy: pembagian_mengajar_real (SELECT)
- [ ] `1.3.26` RLS policy: pembagian_mengajar_real (INSERT/UPDATE/DELETE)
- [ ] `1.3.27` RLS policy: nilai (SELECT) — guru hanya lihat miliknya, admin lihat semua
- [ ] `1.3.28` RLS policy: nilai (INSERT) — guru hanya bisa insert untuk kelasnya
- [ ] `1.3.29` RLS policy: nilai (UPDATE) — guru hanya bisa update yang tidak terkunci
- [ ] `1.3.30` RLS policy: kehadiran (SELECT)
- [ ] `1.3.31` RLS policy: kehadiran (INSERT/UPDATE) — wali kelas & admin
- [ ] `1.3.32` RLS policy: tugas_tambahan (SELECT)
- [ ] `1.3.33` RLS policy: tugas_tambahan (INSERT/UPDATE/DELETE) — admin only
- [ ] `1.3.34` RLS policy: audit_log (SELECT) — admin/superadmin only
- [ ] `1.3.35` RLS policy: audit_log (INSERT) — system only
- [ ] `1.3.36` RLS policy: backup_log (SELECT)
- [ ] `1.3.37` RLS policy: backup_log (INSERT) — admin/superadmin
- [ ] `1.3.38` RLS policy: import_template_log (SELECT)
- [ ] `1.3.39` RLS policy: import_template_log (INSERT) — guru/admin
- [ ] `1.3.40` RLS policy: asesmen (SELECT)
- [ ] `1.3.41` RLS policy: asesmen (INSERT/UPDATE/DELETE) — admin/urusan
- [ ] `1.3.42` RLS policy: asesmen_jadwal (SELECT)
- [ ] `1.3.43` RLS policy: asesmen_jadwal (INSERT/UPDATE/DELETE)
- [ ] `1.3.44` RLS policy: asesmen_ruang (SELECT)
- [ ] `1.3.45` RLS policy: asesmen_ruang (INSERT/UPDATE/DELETE)
- [ ] `1.3.46` RLS policy: asesmen_siswa_ruang (SELECT)
- [ ] `1.3.47` RLS policy: asesmen_siswa_ruang (INSERT/UPDATE/DELETE)
- [ ] `1.3.48` RLS policy: asesmen_nomor_peserta (SELECT)
- [ ] `1.3.49` RLS policy: asesmen_nomor_peserta (INSERT/UPDATE/DELETE)
- [ ] `1.3.50` RLS policy: kepengawasan (SELECT)
- [ ] `1.3.51` RLS policy: kepengawasan (INSERT/UPDATE/DELETE)
- [ ] `1.3.52` RLS policy: kepengawasan_assignments (SELECT)
- [ ] `1.3.53` RLS policy: kepengawasan_assignments (INSERT/UPDATE/DELETE)
- [ ] `1.3.54` RLS policy: kartu_pengawas (SELECT)
- [ ] `1.3.55` RLS policy: kartu_pengawas (INSERT/UPDATE/DELETE)
- [ ] `1.3.56` RLS policy: pengaturan_sekolah (SELECT)
- [ ] `1.3.57` RLS policy: pengaturan_sekolah (UPDATE) — admin only

### 1.4 Auth & Otorisasi

- [ ] `1.4.1` Buat halaman login (app/(auth)/login/page.tsx)
- [ ] `1.4.2` Buat halaman logout
- [ ] `1.4.3` Setup Supabase Auth (login with email/password)
- [ ] `1.4.4` Buat middleware.ts untuk proteksi route
- [ ] `1.4.5` Buat session provider component
- [ ] `1.4.6` Buat useAuth hook
- [ ] `1.4.7` Buat useRole hook
- [ ] `1.4.8` Implementasi redirect based on role setelah login
- [ ] `1.4.9` Setup protected layout (app/(protected)/layout.tsx)
- [ ] `1.4.10` Implementasi mode pemeliharaan (toggle di database)
- [ ] `1.4.11` Buat halaman maintenance page
- [ ] `1.4.12` Redirect non-admin ke maintenance saat mode aktif

### 1.5 Testing Fase 1

- [ ] `1.5.1` Test RLS: login sebagai guru, cek tidak bisa lihat data orang lain
- [ ] `1.5.2` Test RLS: login sebagai admin, cek bisa lihat semua data
- [ ] `1.5.3` Test RLS: login sebagai admin, cek tidak bisa hapus data secara langsung
- [ ] `1.5.4` Test auth: login dengan kredensial salah harus ditolak
- [ ] `1.5.5` Test auth: logout harus bersihkan sesi
- [ ] `1.5.6` Test auth: ubah URL langsung ke protected route tanpa login harus ditolak
- [ ] `1.5.7` Test mode pemeliharaan: non-admin harus diarahkan ke halaman maintenance
- [ ] `1.5.8` Seed data: buat user admin pertama untuk testing

---

## 📋 FASE 2 — Data Master (Minggu 3-4)

### 2.1 Tahun Pelajaran & Semester

- [ ] `2.1.1` Buat halaman daftar tahun pelajaran
- [ ] `2.1.2` Buat form tambah tahun pelajaran
- [ ] `2.1.3` Buat form edit tahun pelajaran
- [ ] `2.1.4` Buat fungsi hapus tahun pelajaran (soft delete / validasi)
- [ ] `2.1.5` Buat halaman daftar semester
- [ ] `2.1.6` Buat form tambah semester
- [ ] `2.1.7` Buat form edit semester
- [ ] `2.1.8` Implementasi "Set sebagai Aktif" (hanya 1 semester aktif)
- [ ] `2.1.9` Buat toggle mode penilaian (PTS/Semester)
- [ ] `2.1.10` Validasi: tidak bisa hapus semester yang masih aktif

### 2.2 Guru

- [ ] `2.2.1` Buat halaman daftar guru
- [ ] `2.2.2` Buat form tambah guru
- [ ] `2.2.3` Buat form edit guru
- [ ] `2.2.4` Implementasi auto-generate kode guru (GR-XXX)
- [ ] `2.2.5` Implementasi constraint NIP auto "-" untuk GTT
- [ ] `2.2.6` Validasi NIP wajib untuk non-GTT
- [ ] `2.2.7` Buat drag & drop reordering (desktop)
- [ ] `2.2.8` Buat tombol ▲▼ reordering (mobile)
- [ ] `2.2.9` Implementasi simpan urutan guru
- [ ] `2.2.10` Filter guru eligible untuk wali kelas (PNS/PPPK/PPPK PW only)
- [ ] `2.2.11` Validasi: guru terhubung ke pembagian mengajar tidak bisa dihapus (nonaktifkan saja)
- [ ] `2.2.12` Deteksi duplikasi nama sebelum simpan
- [ ] `2.2.13` Search/filter guru
- [ ] `2.2.14` Buat useSemester hook

### 2.3 Siswa

- [ ] `2.3.1` Buat halaman daftar siswa
- [ ] `2.3.2` Buat form tambah siswa (manual)
- [ ] `2.3.3` Buat form edit siswa
- [ ] `2.3.4` Generate template Excel impor
- [ ] `2.3.5` Implementasi import Excel massal
- [ ] `2.3.6` Validasi format data saat impor (NIS, nama, JK, status)
- [ ] `2.3.7` Tampilkan baris yang bermasalah beserta alasan
- [ ] `2.3.8` Preview sebelum simpan
- [ ] `2.3.9` Implementasi import bertahap (batch)
- [ ] `2.3.10` Export daftar siswa ke Excel
- [ ] `2.3.11` Search/filter siswa (nama, NIS, kelas)
- [ ] `2.3.12` Feature: pindahkan siswa ke alumni
- [ ] `2.3.13` Validasi: siswa dengan nilai tidak bisa dihapus

### 2.4 Mata Pelajaran

- [ ] `2.4.1` Buat halaman daftar mata pelajaran
- [ ] `2.4.2` Buat form tambah mata pelajaran
- [ ] `2.4.3` Buat form edit mata pelajaran
- [ ] `2.4.4` Validasi: mapel terhubung ke pembagian tidak bisa dihapus
- [ ] `2.4.5` Search/filter mapel

### 2.5 Kelas Dapo

- [ ] `2.5.1` Buat halaman daftar kelas Dapo
- [ ] `2.5.2` Buat form tambah kelas Dapo
- [ ] `2.5.3` Buat form edit kelas Dapo
- [ ] `2.5.4` Filter berdasarkan jenjang (7, 8, 9)
- [ ] `2.5.5` Validasi: kelas dengan siswa/nilai tidak bisa dihapus langsung

### 2.6 Kelas Real

- [ ] `2.6.1` Buat halaman daftar kelas Real
- [ ] `2.6.2` Buat form tambah kelas Real
- [ ] `2.6.3` Buat form edit kelas Real
- [ ] `2.6.4` Filter berdasarkan jenjang

### 2.7 Panel Dua Kolom — Kelas Dapo

- [ ] `2.7.1` Buat komponen panel dua kolom
- [ ] `2.7.2` Panel kiri: pilih jenjang + kelas Dapo, tampilkan siswa di kelas
- [ ] `2.7.3` Panel kanan: tampilkan siswa yang belum punya kelas Dapo
- [ ] `2.7.4` Implementasi drag & drop siswa ke kelas Dapo
- [ ] `2.7.5` Preview perubahan sebelum simpan
- [ ] `2.7.6` Simpan perubahan (batch insert/update)
- [ ] `2.7.7` Mobile layout: tab toggle atau vertical stack

### 2.8 Panel Dua Kolom — Kelas Real

- [ ] `2.8.1` Panel kiri: pilih jenjang + kelas Real, tampilkan siswa di kelas
- [ ] `2.8.2` Panel kanan: tampilkan siswa dari kelas abjad terakhir yang belum dititipkan
- [ ] `2.8.3` Implementasi penitipan siswa (drag & drop)
- [ ] `2.8.4` Validasi: penitipan hanya antar jenjang yang sama
- [ ] `2.8.5` Preview perubahan sebelum simpan
- [ ] `2.8.6` Simpan perubahan
- [ ] `2.8.7` Mobile layout: tab toggle atau vertical stack

### 2.9 Kepala Sekolah

- [ ] `2.9.1` Buat halaman daftar kepala sekolah
- [ ] `2.9.2` Buat form tambah/edit kepala sekolah
- [ ] `2.9.3` Upload tanda tangan digital (PNG transparan)
- [ ] `2.9.4` Validasi: hanya 1 kepala sekolah aktif
- [ ] `2.9.5` Setup Supabase Storage bucket (tanda-tangan)

### 2.10 Komponen Nilai

- [ ] `2.10.1` Buat halaman konfigurasi komponen nilai
- [ ] `2.10.2` Form konfigurasi bobot per mapel
- [ ] `2.10.3` Validasi total bobot = 100%
- [ ] `2.10.4` Simpan bobot ke database

### 2.11 Testing Fase 2

- [ ] `2.11.1` Test: CRUD tahun pelajaran berfungsi
- [ ] `2.11.2` Test: Set semester aktif hanya 1 yang aktif
- [ ] `2.11.3` Test: CRUD guru dengan kode auto-generate
- [ ] `2.11.4` Test: Constraint NIP GTT = "-" berfungsi
- [ ] `2.11.5` Test: Reorder guru berfungsi dan persist
- [ ] `2.11.6` Test: Import Excel siswa berfungsi
- [ ] `2.11.7` Test: Validasi impor menampilkan error per baris
- [ ] `2.11.8` Test: Panel dua kolom berfungsi (drag & drop)
- [ ] `2.11.9` Test: Penitipan siswa antar kelas Real berfungsi
- [ ] `2.11.10` Test: Validasi jenjang sama untuk penitipan berfungsi
- [ ] `2.11.11` Test: Upload tanda tangan kepala sekolah berfungsi
- [ ] `2.11.12` Test: Constraint bobot = 100 berfungsi

---

## 📚 FASE 3 — Kurikulum & Dashboard (Minggu 5-6)

### 3.1 Pembagian Mengajar Dapo

- [ ] `3.1.1` Buat halaman pembagian mengajar Dapo
- [ ] `3.1.2` Form input: pilih guru, mapel, jenjang, kelas Dapo, jam
- [ ] `3.1.3` Tabel daftar pembagian mengajar Dapo
- [ ] `3.1.4` Edit pembagian mengajar Dapo
- [ ] `3.1.5` Hapus pembagian mengajar Dapo
- [ ] `3.1.6` Filter berdasarkan guru, mapel, jenjang, kelas

### 3.2 Pembagian Mengajar Real

- [ ] `3.2.1` Buat halaman pembagian mengajar Real
- [ ] `3.2.2` Form input: pilih guru, mapel, jenjang, kelas Real, jam
- [ ] `3.2.3` Tabel daftar pembagian mengajar Real
- [ ] `3.2.4` Edit pembagian mengajar Real
- [ ] `3.2.5` Hapus pembagian mengajar Real

### 3.3 Sinkronisasi Pembagian Mengajar

- [ ] `3.3.1` Buat halaman/dialog sinkronisasi
- [ ] `3.3.2` Fungsi bandingkan Dapo vs Real
- [ ] `3.3.3` Tampilkan tabel konflik (data yang berbeda)
- [ ] `3.3.4` Opsi "Timpa Semua" (Dapo → Real)
- [ ] `3.3.5` Opsi "Timpa Semua" (Real → Dapo)
- [ ] `3.3.6` Opsi "Gabung" (tambahkan yang baru)
- [ ] `3.3.7` Preview perubahan sebelum eksekusi
- [ ] `3.3.8` Eksekusi sinkronisasi
- [ ] `3.3.9` Audit log untuk setiap sinkronisasi
- [ ] `3.3.10` Validasi: referensi tidak ditemukan
- [ ] `3.3.11` Validasi: assignment ganda

### 3.4 Tugas Tambahan

- [ ] `3.4.1` Buat halaman manajemen tugas tambahan
- [ ] `3.4.2` Form penetapan tugas tambahan (koordinator, kepala kurikulum)
- [ ] `3.4.3` Filter guru eligible untuk Wali Kelas (PNS/PPPK/PPPK PW)
- [ ] `3.4.4` Form penetapan Wali Kelas (terikat kelas Real)
- [ ] `3.4.5` Tabel daftar tugas tambahan aktif
- [ ] `3.4.6` Edit tugas tambahan
- [ ] `3.4.7` Hapus tugas tambahan
- [ ] `3.4.8` Validasi: wali kelas harus ada kelas_real_id
- [ ] `3.4.9` Validasi constraint database: wali_kelas_harus_ada_kelas

### 3.5 RPC Function Dashboard

- [ ] `3.5.1` Buat database function: get_dashboard_summary(guru_id)
- [ ] `3.5.2` Query data guru dashboard (kelas, mapel, progres nilai)
- [ ] `3.5.3` Buat database function: get_dashboard_admin()
- [ ] `3.5.4` Query data admin dashboard (total guru, siswa, kelas, mapel)
- [ ] `3.5.5` Buat database function: get_dashboard_urusan(jenjang)
- [ ] `3.5.6` Query data urusan dashboard
- [ ] `3.5.7` Buat database function: get_dashboard_superadmin()
- [ ] `3.5.8` Query data superadmin dashboard
- [ ] `3.5.9` Buat database function: get_dashboard_siswa(siswa_id)
- [ ] `3.5.10` Query data siswa dashboard

### 3.6 Halaman Dashboard

- [ ] `3.6.1` Buat layout dashboard utama
- [ ] `3.6.2` Buat skeleton loading component
- [ ] `3.6.3` Buat useDashboard hook dengan caching
- [ ] `3.6.4` Implementasi auto-refresh setiap 5 menit
- [ ] `3.6.5` Buat tombol refresh manual
- [ ] `3.6.6` Dashboard Superadmin (status sistem, ringkasan data)
- [ ] `3.6.7` Dashboard Admin (total data, progres mengajar, % nilai)
- [ ] `3.6.8` Dashboard Urusan (kelengkapan data, progres asesmen)
- [ ] `3.6.9` Dashboard Urusan + Koordinator (grafik progres per jenjang)
- [ ] `3.6.10` Dashboard Guru (daftar kelas & mapel, progres input nilai)
- [ ] `3.6.11` Dashboard Guru + Wali Kelas (status kelengkapan kelas)
- [ ] `3.6.12` Dashboard Siswa (informasi akademik pribadi)
- [ ] `3.6.13` Responsive layout untuk mobile

### 3.7 Testing Fase 3

- [ ] `3.7.1` Test: CRUD pembagian mengajar berfungsi
- [ ] `3.7.2` Test: Sinkronisasi Dapo → Real berfungsi
- [ ] `3.7.3` Test: Sinkronisasi Real → Dapo berfungsi
- [ ] `3.7.4` Test: Tabel konflik tampil dengan benar
- [ ] `3.7.5` Test: Sinkronisasi yang dibatalkan tidak mengubah data
- [ ] `3.7.6` Test: Audit log mencatat setiap sinkronisasi
- [ ] `3.7.7` Test: CRUD tugas tambahan berfungsi
- [ ] `3.7.8` Test: Wali kelas terikat ke kelas Real
- [ ] `3.7.9` Test: Dashboard Superadmin tampil data benar
- [ ] `3.7.10` Test: Dashboard Admin tampil data benar
- [ ] `3.7.11` Test: Dashboard Urusan tampil data benar
- [ ] `3.7.12` Test: Dashboard Guru tampil data benar
- [ ] `3.7.13` Test: Dashboard Wali Kelas tampil data benar
- [ ] `3.7.14` Test: Dashboard tampil dalam ≤3 detik
- [ ] `3.7.15` Test: Skeleton loading tampil saat loading
- [ ] `3.7.16` Test: Cache dashboard tidak query ulang saat navigasi balik

---

## 📊 FASE 4 — Penilaian & Rapor (Minggu 7-10)

### 4.1 Setup Input Nilai

- [ ] `4.1.1` Buat halaman utama input nilai
- [ ] `4.1.2` Dropdown pilih kelas Real (hanya yang menjadi tanggung jawab guru)
- [ ] `4.1.3` Dropdown pilih mata pelajaran
- [ ] `4.1.4` Load daftar siswa berdasarkan kelas Real
- [ ] `4.1.5` Tampilkan mode PTS/Semester berdasarkan semester aktif
- [ ] `4.1.6` Validasi: guru tidak bisa buka kelas/mapel yang bukan tanggung jawabnya

### 4.2 Tabel Spreadsheet Inline

- [ ] `4.2.1` Buat komponen tabel nilai
- [ ] `4.2.2` Kolom: No, Nama Siswa, UH1, UH2, UH3, UH4, UH5, PTS, SEMESTER, RAPOR
- [ ] `4.2.3` Mode PTS: tampilkan UH1, UH2, UH3, PTS
- [ ] `4.2.4` Mode Semester: tampilkan semua komponen
- [ ] `4.2.5` Cell input dengan navigasi Tab dan Enter
- [ ] `4.2.6` Highlight sel yang berubah sebelum simpan
- [ ] `4.2.7` Validasi sequential UH: UH2 hanya bisa diisi jika UH1 terisi
- [ ] `4.2.8` Validasi sequential UH: UH3 hanya bisa diisi jika UH2 terisi
- [ ] `4.2.9` Validasi sequential UH: UH4 hanya bisa diisi jika UH3 terisi
- [ ] `4.2.10` Validasi sequential UH: UH5 hanya bisa diisi jika UH4 terisi
- [ ] `4.2.11` Validasi range nilai (0-100)
- [ ] `4.2.12` Tampilkan indicator terkunci untuk nilai yang tidak bisa diubah (mode Semester)
- [ ] `4.2.13` RAPOR tampilkan hasil perhitungan (read-only)
- [ ] `4.2.14` Partial save: simpan sebagian siswa tanpa harus semua

### 4.3 Upload Excel

- [ ] `4.3.1` Generate template Excel dengan metadata tersembunyi
- [ ] `4.3.2` Metadata: semester_id, kelas_real_id, mapel_id, generated_at
- [ ] `4.3.3` Template berisi daftar siswa + kolom kosong untuk nilai
- [ ] `4.3.4` Log download template ke import_template_log
- [ ] `4.3.5` Buat form upload Excel
- [ ] `4.3.6` Validasi metadata saat upload (semester_id cocok)
- [ ] `4.3.7` Validasi metadata saat upload (kelas_real_id cocok)
- [ ] `4.3.8` Validasi metadata saat upload (mapel_id cocok)
- [ ] `4.3.9` Validasi isi file: format kolom, tipe data, range 0-100
- [ ] `4.3.10` Tampilkan preview data yang akan diimport
- [ ] `4.3.11` Tampilkan konflik dengan data yang sudah ada
- [ ] `4.3.12` Opsi pilih: timpa yang lama atau tetap yang lama
- [ ] `4.3.13` Simpan nilai dari Excel
- [ ] `4.3.14` Error handling untuk file format salah

### 4.4 Simpan Nilai

- [ ] `4.4.1` Fungsi save nilai (batch insert/update)
- [ ] `4.4.2` Trigger snapshot bobot dari komponen_nilai
- [ ] `4.4.3` Validasi saat simpan (cek semua rules)
- [ ] `4.4.4` Konfirmasi sebelum timpa data yang sudah ada
- [ ] `4.4.5` Feedback sukses/gagal setelah simpan
- [ ] `4.4.6` Optimistic update di UI
- [ ] `4.4.7` Rollback jika gagal

### 4.5 Rekap Nilai

- [ ] `4.5.1` Buat halaman rekap nilai
- [ ] `4.5.2` Filter: jenjang, kelas Real, mapel, guru, status kelengkapan
- [ ] `4.5.3` Tabel rekap: baris = siswa, kolom = mapel
- [ ] `4.5.4` Tampilkan status kelengkapan (lengkap/sebagian/kosong)
- [ ] `4.5.5` Role access: Guru lihat miliknya, Wali Kelas lihat kelasnya
- [ ] `4.5.6` Role access: Koordinator lihat jenjangnya, Kepala Kurikulum lihat semua
- [ ] `4.5.7` Role access: Admin & Urusan lihat semua
- [ ] `4.5.8` Mode PTS: rekap UH1-3 dan PTS
- [ ] `4.5.9` Mode Semester: rekap semua komponen termasuk RAPOR
- [ ] `4.5.10` Export rekap ke Excel

### 4.6 Kehadiran

- [ ] `4.6.1` Buat halaman kehadiran (untuk wali kelas)
- [ ] `4.6.2` Dropdown pilih kelas Real
- [ ] `4.6.3` Tabel input kehadiran (sakit, izin, alpha) per siswa
- [ ] `4.6.4` Input catatan wali kelas per siswa (text area)
- [ ] `4.6.5` Simpan kehadiran
- [ ] `4.6.6` Validasi: wali kelas hanya bisa akses kelas yang diampu
- [ ] `4.6.7` Trigger validasi: siswa harus punya kelas Real

### 4.7 Ekspor Rapor PDF

- [ ] `4.7.1` Setup jsPDF + jspdf-autotable
- [ ] `4.7.2` Buat halaman ekspor rapor
- [ ] `4.7.3` Cek prasyarat sebelum ekspor:
  - [ ] `4.7.3a` Semua komponen nilai lengkap
  - [ ] `4.7.3b` Data kehadiran sudah diinput
  - [ ] `4.7.3c` Catatan wali kelas sudah diisi (peringatan jika kosong)
  - [ ] `4.7.3d` Kepala sekolah aktif tersedia
- [ ] `4.7.4` Tampilkan daftar siswa yang belum lengkap
- [ ] `4.7.5` Tautan langsung ke data yang perlu dilengkapi
- [ ] `4.7.6` Opsi urutan: kelas Dapo atau kelas Real
- [ ] `4.7.7` Ekspor per siswa (1 file PDF)
- [ ] `4.7.8` Ekspor per kelas (1 file PDF, 1 halaman per siswa)
- [ ] `4.7.9` Header: nama sekolah, logo, alamat
- [ ] `4.7.10` Identitas siswa: nama, NIS, kelas Dapo
- [ ] `4.7.11` Tabel nilai per mapel (UH1-5, PTS, SEMESTER, RAPOR)
- [ ] `4.7.12` Rekap kehadiran (sakit, izin, alpha)
- [ ] `4.7.13` Catatan wali kelas
- [ ] `4.7.14` Kolom tanda tangan kepala sekolah
- [ ] `4.7.15` Kolom tanda tangan wali kelas
- [ ] `4.7.16` Mode TTD digital: sisipkan gambar TTD
- [ ] `4.7.17` Mode TTD basah: ruang kosong untuk tanda tangan manual
- [ ] `4.7.18` Penamaan file: RAPOR*[Nama]*[Kelas]\_[Semester].pdf
- [ ] `4.7.19` Setup Supabase Storage bucket (template-rapor)
- [ ] `4.7.20` Upload template rapor sekolah
- [ ] `4.7.21` Generate PDF sesuai template
- [ ] `4.7.22` Fallback ke layout default jika template belum ada
- [ ] `4.7.23` Preview rapor sebelum ekspor
- [ ] `4.7.24` Admin override: paksa ekspor meskipun ada yang belum lengkap

### 4.8 Testing Fase 4

- [ ] `4.8.1` Test: Input nilai via tabel berfungsi
- [ ] `4.8.2` Test: Navigasi Tab/Enter antar sel berfungsi
- [ ] `4.8.3` Test: UH sequential validation berfungsi
- [ ] `4.8.4` Test: Nilai terkunci saat mode Semester
- [ ] `4.8.5` Test: RAPOR dihitung otomatis dengan benar
- [ ] `4.8.6` Test: Generate template Excel berfungsi
- [ ] `4.8.7` Test: Upload Excel berfungsi
- [ ] `4.8.8` Test: Validasi metadata Excel berfungsi
- [ ] `4.8.9` Test: Konflik upload ditampilkan dengan benar
- [ ] `4.8.10` Test: Partial save berfungsi (simpan sebagian)
- [ ] `4.8.11` Test: Rekap nilai berfungsi
- [ ] `4.8.12` Test: Filter rekap berfungsi
- [ ] `4.8.13` Test: Export rekap ke Excel berfungsi
- [ ] `4.8.14` Test: Input kehadiran berfungsi
- [ ] `4.8.15` Test: Ekspor rapor PDF berfungsi
- [ ] `4.8.16` Test: Cek prasyarat berfungsi
- [ ] `4.8.17` Test: TTD digital berfungsi
- [ ] `4.8.18` Test: Template rapor berfungsi
- [ ] `4.8.19` Test: Ekspor per siswa berfungsi
- [ ] `4.8.20` Test: Ekspor per kelas berfungsi
- [ ] `4.8.21` Test: Ekspor rapor ≤60 detik untuk 1 kelas
- [ ] `4.8.22` Test: Guru tidak bisa akses kelas/mapel yang bukan tanggung jawabnya

---

## 📝 FASE 5 — Asesmen (Minggu 11-14)

### 5.1 Setup Asesmen

- [ ] `5.1.1` Buat halaman utama Asesmen
- [ ] `5.1.2` Buat form tambah asesmen
- [ ] `5.1.3` Dropdown jenis ujian (ASTS/ASAS/ASAT/ASAJ)
- [ ] `5.1.4` Input range tanggal (mulai & selesai)
- [ ] `5.1.5` Input tanggal tanda tangan
- [ ] `5.1.6` Input kode NUS
- [ ] `5.1.7` Pilihan acuan kelas (Dapo/Real)
- [ ] `5.1.8` Edit asesmen
- [ ] `5.1.9` Hapus asesmen (dengan konfirmasi, cascade)

### 5.2 Jadwal Ujian (Tab 1)

- [ ] `5.2.1` Buat form jadwal ujian
- [ ] `5.2.2` Input: hari, tanggal, jam (Jam ke-1/Jam ke-2)
- [ ] `5.2.3` Input: jam mulai, durasi (menit), mapel
- [ ] `5.2.4` Maksimal 12 baris jadwal
- [ ] `5.2.5` Reorder jadwal
- [ ] `5.2.6` Hapus jadwal
- [ ] `5.2.7` Validasi: tanggal harus dalam range asesmen
- [ ] `5.2.8` Export jadwal ke PDF

### 5.3 Jadwal Mengawasi / Matrix Ketersediaan (Tab 2)

- [ ] `5.3.1` Buat matrix guru × slot waktu
- [ ] `5.3.2` Tandai ketersediaan per sel (1 guru, 1 slot)
- [ ] `5.3.3` Bulk mark: semua guru di 1 slot
- [ ] `5.3.4` Bulk mark: semua slot untuk 1 guru
- [ ] `5.3.5` Bulk mark: semua guru, semua slot
- [ ] `5.3.6` Clear selection
- [ ] `5.3.7` Simpan matrix ketersediaan

### 5.4 Pembagian Ruang Siswa

- [ ] `5.4.1` Pengaturan global: jumlah ruang (1-99)
- [ ] `5.4.2` Pengaturan global: mode (setengah kelas / 20/orang / manual)
- [ ] `5.4.3` Pengaturan global: acuan kelas (Real/Dapo)
- [ ] `5.4.4` Pengaturan per jenjang: toggle aktif/nonaktif
- [ ] `5.4.5` Pengaturan per jenjang: urutan pengisian (A→Z / Z→A)
- [ ] `5.4.6` Pengaturan per jenjang: range ruang (bagian 1)
- [ ] `5.4.7` Pengaturan per jenjang: range ruang (bagian 2, opsional)
- [ ] `5.4.8` Pengaturan manual: popup input kapasitas per ruang
- [ ] `5.4.9` Generate pembagian otomatis
- [ ] `5.4.10` Edit manual pembagian ruang
- [ ] `5.4.11` Validasi: satu ruang maksimal 2 jenjang
- [ ] `5.4.12` Warning: konflik lebih dari 2 jenjang
- [ ] `5.4.13` Warning: siswa yang belum masuk ruang manapun
- [ ] `5.4.14` Simpan pembagian ruang

### 5.5 Pembagian Ruang Pengawas (Tab 3)

- [ ] `5.5.1` Input: jumlah pengawas per ruang (1 atau 2)
- [ ] `5.5.2` Input: urutan pembagian (Urut / Acak)
- [ ] `5.5.3` Generate otomatis pembagian pengawas
- [ ] `5.5.4` Algoritma Urut: tanpa pengulangan consecutive
- [ ] `5.5.5` Algoritma Acak: distribusi merata
- [ ] `5.5.6` Edit manual pembagian pengawas
- [ ] `5.5.7` Validasi: deteksi konflik (1 guru di 2 ruang slot yang sama)
- [ ] `5.5.8` Simpan pembagian pengawas

### 5.6 Kartu Pengawas (Tab 4)

- [ ] `5.6.1` Generate kartu pengawas per guru
- [ ] `5.6.2` Dropdown pilih guru
- [ ] `5.6.3` Tampilkan jadwal mengawas (dari kepengawasan_assignments)
- [ ] `5.6.4` Export kartu pengawas ke PDF
- [ ] `5.6.5` Export semua kartu sekaligus
- [ ] `5.6.6` TTD kepala sekolah (digital/basah)
- [ ] `5.6.7` Publish kartu ke dashboard guru
- [ ] `5.6.8` Unpublish kartu dari dashboard guru
- [ ] `5.6.9` Badge indicator di dashboard guru

### 5.7 Generate Nomor Peserta

- [ ] `5.7.1` Halaman generate nomor peserta
- [ ] `5.7.2` Pilihan acuan kelas (Dapo/Real)
- [ ] `5.7.3` Generate otomatis
- [ ] `5.7.4` Format: [Jenjang][KodeAbjad]-[KodeNUS]-[NomorAbsen]-[JK]
- [ ] `5.7.5` Kode abjad: A=1, B=2, dst. (urutan alfabet)
- [ ] `5.7.6` Nomor absen: 3 digit, zero-padded
- [ ] `5.7.7` JK: 1=Laki, 2=Perempuan
- [ ] `5.7.8` Simpan ke asesmen_nomor_peserta

### 5.8 Ekspor Dokumen Asesmen

- [ ] `5.8.1` Buat halaman daftar ekspor dokumen
- [ ] `5.8.2` Warning jika pembagian ruang belum di-generate
- [ ] `5.8.3` Ekspor Tempel Kaca (PDF): nomor ruang + daftar siswa
- [ ] `5.8.4` Ekspor Data Map (PDF): peta posisi duduk
- [ ] `5.8.5` Ekspor Denah Peserta (PDF): denah keseluruhan per ruang
- [ ] `5.8.6` Ekspor Daftar Peserta (Excel): data lengkap
- [ ] `5.8.7` Ekspor Label 1:2:1 (PDF): label per siswa
- [ ] `5.8.8` Ekspor Kartu Peserta (PDF): per siswa
- [ ] `5.8.9` TTD kepala sekolah di setiap dokumen
- [ ] `5.8.10` Warning jika ada siswa yang belum di-assign ruang

### 5.9 Testing Fase 5

- [ ] `5.9.1` Test: CRUD asesmen berfungsi
- [ ] `5.9.2` Test: Jadwal ujian bisa diinput
- [ ] `5.9.3` Test: Matrix ketersediaan berfungsi
- [ ] `5.9.4` Test: Generate pembagian ruang berfungsi
- [ ] `5.9.5` Test: Edit manual pembagian ruang berfungsi
- [ ] `5.9.6` Test: Warning konflik lebih dari 2 jenjang
- [ ] `5.9.7` Test: Warning siswa unassigned
- [ ] `5.9.8` Test: Generate pembagian pengawas berfungsi
- [ ] `5.9.9` Test: Algoritma urut tanpa pengulangan
- [ ] `5.9.10` Test: Algoritma acak distribusi merata
- [ ] `5.9.11` Test: Detek konflik pengawas
- [ ] `5.9.12` Test: Generate nomor peserta berfungsi
- [ ] `5.9.13` Test: Format nomor peserta benar
- [ ] `5.9.14` Test: Kartu pengawas generate dengan benar
- [ ] `5.9.15` Test: Publish/unpublish kartu berfungsi
- [ ] `5.9.16` Test: Semua ekspor dokumen berfungsi
- [ ] `5.9.17` Test: Generate pembagian ruang ≤5 detik

---

## 🔧 FASE 6 — Finalisasi (Minggu 15-16)

### 6.1 Validasi Data

- [ ] `6.1.1` Buat halaman laporan validasi
- [ ] `6.1.2` Validasi: siswa tanpa nilai di satu atau lebih mapel
- [ ] `6.1.3` Validasi: kelas tanpa wali kelas
- [ ] `6.1.4` Validasi: guru tanpa assignment mengajar tapi belum input nilai
- [ ] `6.1.5` Validasi: komponen nilai belum lengkap menjelang rapor
- [ ] `6.1.6` Validasi: kepala sekolah belum dikonfigurasi
- [ ] `6.1.7` Tampilkan daftar masalah
- [ ] `6.1.8` Tautan langsung ke data yang perlu diperbaiki
- [ ] `6.1.9` Filter berdasarkan jenis masalah
- [ ] `6.1.10` Run validasi realtime (lightweight)
- [ ] `6.1.11` Run validasi saat simpan

### 6.2 Backup & Restore

- [ ] `6.2.1` Buat halaman manajemen backup
- [ ] `6.2.2` Tombol backup manual
- [ ] `6.2.3` Input keterangan backup
- [ ] `6.2.4` Setup pg_cron untuk backup terjadwal
- [ ] `6.2.5` Setup Supabase Storage bucket (backup)
- [ ] `6.2.6` Simpan file backup ke storage
- [ ] `6.2.7` Logging ke backup_log
- [ ] `6.2.8` Daftar backup yang tersedia
- [ ] `6.2.9` Download backup
- [ ] `6.2.10` Hapus backup lama
- [ ] `6.2.11` Fitur restore
- [ ] `6.2.12` Warning sebelum restore
- [ ] `6.2.13` Konfirmasi dua langkah sebelum restore
- [ ] `6.2.14` Progress indicator saat restore
- [ ] `6.2.15` Audit log untuk setiap backup/restore

### 6.3 Audit Log

- [ ] `6.3.1` Buat halaman audit log
- [ ] `6.3.2` Tampilkan log dengan pagination
- [ ] `6.3.3` Filter berdasarkan: pengguna, tabel, aksi, tanggal
- [ ] `6.3.4` Search log
- [ ] `6.3.5` Tampilkan data sebelum & sesudah
- [ ] `6.3.6` Export audit log ke Excel
- [ ] `6.3.7`REVOKE update/delete dari audit_log

### 6.4 Mode Pemeliharaan

- [ ] `6.4.1` Toggle mode pemeliharaan di pengaturan
- [ ] `6.4.2` Update tabel: pengaturan_sekolah.mode_pemeliharaan
- [ ] `6.4.3` Redirect non-admin saat login
- [ ] `6.4.4` Redirect non-admin yang sedang aktif
- [ ] `6.4.5` Halaman maintenance yang informatif
- [ ] `6.4.6` Banner kecil di halaman untuk admin (tidak redirect)

### 6.5 Android (Capacitor)

- [ ] `6.5.1` Install Capacitor
- [ ] `6.5.2` Setup project Capacitor
- [ ] `6.5.3` Konfigurasi app icon & splash screen
- [ ] `6.5.4` Build web app untuk production
- [ ] `6.5.5` Sync ke Android project
- [ ] `6.5.6` Build debug APK
- [ ] `6.5.7` Test fitur utama di Android
- [ ] `6.5.8` Test input nilai di mobile
- [ ] `6.5.9` Test navigasi di mobile
- [ ] `6.5.10` Test pull-to-refresh
- [ ] `6.5.11` Build release APK

### 6.6 User Acceptance Testing (UAT)

- [ ] `6.6.1` Buat skenario UAT per role
- [ ] `6.6.2` UAT Admin: setup semester baru
- [ ] `6.6.3` UAT Admin: input data master
- [ ] `6.6.4` UAT Admin: pembagian mengajar
- [ ] `6.6.5` UAT Guru: input nilai
- [ ] `6.6.6` UAT Guru: upload Excel
- [ ] `6.6.7` UAT Wali Kelas: input kehadiran
- [ ] `6.6.8` UAT Wali Kelas: ekspor rapor
- [ ] `6.6.9` UAT Urusan: rekap nilai
- [ ] `6.6.10` UAT Admin: setup asesmen
- [ ] `6.6.11` UAT Admin: ekspor dokumen asesmen
- [ ] `6.6.12` Bug fixing berdasarkan UAT
- [ ] `6.6.13` Test performa: dashboard ≤3 detik
- [ ] `6.6.14` Test performa: input nilai ≤2 detik
- [ ] `6.6.15` Test performa: ekspor rapor ≤60 detik
- [ ] `6.6.16` Test keamanan: coba bypass RLS
- [ ] `6.6.17` Test mobile: semua fitur P0 berfungsi
- [ ] `6.6.18` Deployment ke production
- [ ] `6.6.19` Monitoring setelah go-live
- [ ] `6.6.20` Setup error tracking (Sentry)

---

## 📊 Progress Summary

### Quick Stats

| Fase      | Total Task | Selesai | Dalam Progress | Remaining |
| --------- | ---------- | ------- | -------------- | --------- |
| Fase 1    | 57         | 0       | 0              | 57        |
| Fase 2    | 60         | 0       | 0              | 60        |
| Fase 3    | 46         | 0       | 0              | 46        |
| Fase 4    | 64         | 0       | 0              | 64        |
| Fase 5    | 43         | 0       | 0              | 43        |
| Fase 6    | 40         | 0       | 0              | 40        |
| **Total** | **310**    | **0**   | **0**          | **310**   |

### Overall Progress

```
[░░░░░░░░░░░░░░░░░░░░] 0% — 0 / 310 tasks
```

---

## 📝 Activity Log

### Format:

> **[YYYY-MM-DD]** `task_id` — Deskripsi task → Status
> Catatan: ...

### Example:

> **[2026-06-14]** `1.1.1` — Initialize Next.js project → ✅ Selesai
> Catatan: Menggunakan Next.js 14 dengan App Router, TypeScript strict mode.

---

_Tracker ini dibuat: Juni 2026_
_Update checklist: Setiap selesai satu task_
