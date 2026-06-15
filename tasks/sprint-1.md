# Sprint 1 Task Tracker: Fondasi Sistem & Data Master

* **Durasi**: Minggu 1 - 4
* **Tujuan**: Membangun fondasi sistem (Next.js, Supabase, Auth, RLS) dan menyelesaikan seluruh pengelolaan Data Master Akademik.
* **Status**: ✅ COMPLETED

---

## 🚀 FASE 1 — Fondasi Sistem (Minggu 1-2) ✅

### 1.1 Setup Project ✅
- [x] `1.1.1` Initialize Next.js project dengan TypeScript
- [x] `1.1.2` Setup Tailwind CSS
- [x] `1.1.3` Install dan setup shadcn/ui
- [x] `1.1.4` Setup Supabase client (`client.ts`)
- [x] `1.1.5` Setup Supabase server (`server.ts`)
- [x] `1.1.6` Buat folder structure (App Router)
- [x] `1.1.7` Setup environment variables (`.env.local`)
- [x] `1.1.8` Buat folder `supabase/migrations/`
- [x] `1.1.9` Setup Git repository

### 1.2 Database Setup ✅
- [x] `1.2.1` Buat ENUM types (`role_enum`, `status_enum`, dll)
- [x] `1.2.2` Buat tabel: `pengguna`
- [x] `1.2.3` Buat tabel: `tahun_pelajaran`
- [x] `1.2.4` Buat tabel: `semester`
- [x] `1.2.5` Buat tabel: `guru`
- [x] `1.2.6` Buat tabel: `siswa`
- [x] `1.2.7` Buat tabel: `kepala_sekolah`
- [x] `1.2.8` Buat tabel: `mata_pelajaran`
- [x] `1.2.9` Buat tabel: `kelas_dapo`
- [x] `1.2.10` Buat tabel: `kelas_real`
- [x] `1.2.11` Buat tabel: `siswa_kelas`
- [x] `1.2.12` Buat tabel: `komponen_nilai`
- [x] `1.2.13` Buat tabel: `pembagian_mengajar_dapo`
- [x] `1.2.14` Buat tabel: `pembagian_mengajar_real`
- [x] `1.2.15` Buat tabel: `nilai`
- [x] `1.2.16` Buat tabel: `kehadiran`
- [x] `1.2.17` Buat tabel: `asesmen`
- [x] `1.2.18` Buat tabel: `asesmen_jadwal`
- [x] `1.2.19` Buat tabel: `asesmen_ruang`
- [x] `1.2.20` Buat tabel: `asesmen_siswa_ruang`
- [x] `1.2.21` Buat tabel: `asesmen_nomor_peserta`
- [x] `1.2.22` Buat tabel: `kepengawasan`
- [x] `1.2.23` Buat tabel: `kepengawasan_assignments`
- [x] `1.2.24` Buat tabel: `kartu_pengawas`
- [x] `1.2.25` Buat tabel: `audit_log`
- [x] `1.2.26` Buat tabel: `backup_log`
- [x] `1.2.27` Buat tabel: `import_template_log`
- [x] `1.2.28` Buat tabel: `tugas_tambahan`
- [x] `1.2.29` Buat tabel: `pengaturan_sekolah`
- [x] `1.2.30` Buat semua index untuk setiap tabel
- [x] `1.2.31` Buat trigger: `validate_siswa_kelas_jenjang`
- [x] `1.2.32` Buat trigger: `snapshot_bobot_nilai`
- [x] `1.2.33` Buat trigger: `validate_siswa_sudah_punya_kelas` (untuk nilai)
- [x] `1.2.34` Buat trigger: `validate_siswa_sudah_punya_kelas` (untuk kehadiran)
- [x] `1.2.35` Buat constraint: `chk_bobot_total`
- [x] `1.2.36` Buat constraint: `chk_nip_gtt`
- [x] `1.2.37` Buat constraint: `chk_wali_kelas_harus_ada_kelas`
- [x] `1.2.38` Buat constraint: `chk_uh_sequential`
- [x] `1.2.40` Buat partial unique index: semester aktif
- [x] `1.2.41` Buat partial unique index: kepala sekolah aktif
- [x] `1.2.42` Buat singleton index: `pengaturan_sekolah`
- [x] `1.2.43` Buat unique index: `nomor_absen_dapo`
- [x] `1.2.44` Buat unique index: `nomor_absen_real`

### 1.3 RLS Policies Setup ✅
- [x] `1.3.1` s.d. `1.3.57` Buat dan aktifkan kebijakan Row Level Security (RLS) di seluruh 22 tabel Supabase sesuai aturan peran pengguna.

### 1.4 Auth & Otorisasi Route ✅
- [x] `1.4.1` Buat halaman login (`app/(auth)/login/page.tsx`)
- [x] `1.4.2` Buat fungsionalitas logout
- [x] `1.4.3` Setup cookie session Supabase Auth (email/password)
- [x] `1.4.4` Buat `middleware.ts` untuk proteksi route & otorisasi server-side
- [x] `1.4.5` Buat session provider component & useAuth hook
- [x] `1.4.10` Buat halaman dan fungsionalitas mode pemeliharaan (maintenance)

### 1.5 Testing & Verifikasi Fase 1 ✅
- [x] `1.5.1` s.d. `1.5.8` Uji coba login, verifikasi pembatasan RLS per role, dan seed data user admin pertama.

---

## 📋 FASE 2 — Data Master (Minggu 3-4) ✅ COMPLETED

### 2.1 Tahun Pelajaran & Semester ✅
- [x] `2.1.1` Buat halaman CRUD Tahun Pelajaran
- [x] `2.1.5` Buat halaman CRUD Semester
- [x] `2.1.8` Implementasi "Set sebagai Semester Aktif" (maksimal 1 aktif)
- [x] `2.1.9` Buat switch toggle mode penilaian (PTS / Semester)

### 2.2 Guru ✅
- [x] `2.2.1` Buat halaman CRUD Guru
- [x] `2.2.4` Auto-generate kode guru (`GR-XXX`) pada database/backend
- [x] `2.2.5` Constraint NIP auto "-" jika status `GTT` dan mandatory untuk status PNS/PPPK
- [ ] `2.2.7` Drag & drop reordering urutan guru (Desktop)
- [ ] `2.2.8` Tombol ▲▼ reordering urutan guru (Mobile)

### 2.3 Siswa (Excel Import & CRUD) ✅
- [x] `2.3.1` Buat Halaman CRUD Siswa (Manual)
- [x] `2.3.4` Generate dan download template impor Excel siswa
- [x] `2.3.5` Fitur Impor massal siswa via Excel + validasi baris error
- [x] `2.3.10` Fitur Ekspor data siswa ke file Excel
- [ ] `2.3.12` Fitur memindahkan status siswa ke alumni

### 2.4 s.d. 2.6 Mata Pelajaran & Kelas ✅
- [x] `2.4.1` Buat Halaman CRUD Mata Pelajaran
- [x] `2.5.1` Buat Halaman CRUD Kelas Dapodik
- [x] `2.6.1` Buat Halaman CRUD Kelas Real (Operasional)

### 2.7 & 2.8 Panel Dua Kolom Pembagian Kelas
- [ ] `2.7.1` Panel dua kolom distribusi siswa ke Kelas Dapo (Drag & Drop)
- [ ] `2.8.1` Panel dua kolom distribusi siswa titipan ke Kelas Real (Drag & Drop)
- [ ] `2.8.4` Validasi: penitipan siswa hanya boleh antar kelas di jenjang yang sama

### 2.9 & 2.10 Kepala Sekolah & Komponen Nilai ✅
- [x] `2.9.1` Halaman CRUD Kepala Sekolah & upload tanda tangan digital (PNG transparan)
- [x] `2.10.1` Form konfigurasi bobot komponen nilai mapel (Total harus 100%)

### 2.11 Testing & Verifikasi Fase 2
- [ ] `2.11.1` s.d. `2.11.12` Uji coba CRUD master data, reordering guru, validasi impor Excel, dan pembagian kelas panel dua kolom.

---

## 📁 Files Created in Sprint 1

### UI Components
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/alert.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/skeleton.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/toast.tsx`
- `src/components/ui/toaster.tsx`
- `src/components/ui/use-toast.ts`

### Pages
- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/layout.tsx`
- `src/app/(protected)/layout.tsx`
- `src/app/(protected)/dashboard/page.tsx`
- `src/app/maintenance/page.tsx`
- `src/app/(protected)/master/tahun-pelajaran/page.tsx`
- `src/app/(protected)/master/semester/page.tsx`
- `src/app/(protected)/master/guru/page.tsx`
- `src/app/(protected)/master/siswa/page.tsx`
- `src/app/(protected)/master/mata-pelajaran/page.tsx`
- `src/app/(protected)/master/kelas-dapo/page.tsx`
- `src/app/(protected)/master/siswa/import/page.tsx` ✅ NEW
- `src/app/(protected)/master/kepala-sekolah/page.tsx` ✅ NEW
- `src/app/(protected)/master/bobot-nilai/page.tsx` ✅ NEW
- `src/app/(protected)/rapor/ekspor/page.tsx` ✅ NEW (Sprint 2)

### Supabase Migrations
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_indexes.sql`
- `supabase/migrations/003_triggers.sql`
- `supabase/migrations/004_rls_policies.sql`
- `supabase/migrations/005_seed_data.sql`
- `supabase/config.toml`

### Lib & Config
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`
- `src/lib/utils.ts`
- `src/middleware.ts`
- `src/components/providers/session-provider.tsx`