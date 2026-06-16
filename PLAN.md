# Rencana Lanjutan Pengerjaan: Guru Spenturi v2

## Status Saat Ini (16 Juni 2026)

### ✅ Sprint 1: COMPLETED

| Komponen          | Status | Keterangan                                     |
| ----------------- | ------ | ---------------------------------------------- |
| Setup Project     | ✅     | Next.js 14 + TypeScript + Tailwind + shadcn/ui |
| Database Schema   | ✅     | 30+ tabel dengan RLS, triggers, constraints    |
| RLS Policies      | ✅     | 22 tabel dengan kebijakan keamanan             |
| Auth Pages        | ✅     | Login, logout, session provider, middleware    |
| Mode Pemeliharaan | ✅     | Maintenance page + toggle                      |
| Supabase Clients  | ✅     | Browser + Server clients                       |
| UI Components     | ✅     | Button, Input, Dialog, Toast, dll              |

### ✅ Sprint 1 - SEMUA ITEM SELESAI

| Item                                        | Task ID | Status     |
| ------------------------------------------- | ------- | ---------- |
| ~~Drag & Drop reordering guru (Desktop)~~   | 2.2.7   | ✅ DONE    |
| ~~Tombol ▲▼ reordering guru (Mobile)~~      | 2.2.8   | ✅ DONE    |
| ~~Fitur alumni status siswa~~               | 2.3.12  | ✅ DONE    |
| ~~Panel dua kolom distribusi siswa (Dapo)~~ | 2.7.1   | ✅ DONE    |
| ~~Panel distribusi siswa titipan (Real)~~   | 2.8.1   | ✅ DONE    |
| ~~Validasi penitipan antar jenjang~~        | 2.8.4   | ✅ DONE    |
| Testing & verifikasi Fase 2                 | 2.11    | ⏳ PENDING |

### ✅ ALL DATABASE BACKEND DONE (15 Juni 2026)

| Migration | Sprint   | Tables                             | RPCs                            | Hooks                |
| --------- | -------- | ---------------------------------- | ------------------------------- | -------------------- |
| 006       | Sprint 1 | siswa (tahun_lulus)                | -                               | useAlumni            |
| 007       | Sprint 2 | pembagian_mengajar, konflik, audit | -                               | usePembagianMengajar |
| 008       | Sprint 2 | -                                  | dashboard, sync, konflik        | useDashboard         |
| 009       | Sprint 4 | nilai, kehadiran, rapor            | -                               | useNilai             |
| 010       | Sprint 4 | -                                  | input nilai, rekap, rapor       | -                    |
| 011       | Sprint 5 | asesmen, jadwal, ruang             | -                               | -                    |
| 012       | Sprint 6 | backup, validation, settings       | toggle_maintenance              | -                    |
| 013       | Sprint 2 | tugas_tambahan, ketersediaan       | assign_wali_kelas, get_eligible | useTugasTambahan     |

**Total: 8 migrations, 30+ tables, 15+ RPC functions, 5 hooks**

**Frontend UI: SKIPPED per request**

---

## Progress Per Fase

### Fase 1 — Fondasi Sistem ✅ COMPLETED

#### 1.1 Setup Project [✅ DONE]

- [x] Next.js + TypeScript
- [x] Tailwind CSS
- [x] shadcn/ui components
- [x] Supabase client setup
- [x] Folder structure (App Router)

#### 1.2 Database Setup [✅ DONE]

- [x] Buat ENUM types
- [x] Buat semua tabel (29 tabel)
- [x] Buat index
- [x] Buat trigger
- [x] Buat constraint
- [x] Partial unique indexes

#### 1.3 RLS Policies [✅ DONE]

- [x] Buat RLS untuk setiap tabel (57 policies)
- [x] Test RLS dengan query langsung

#### 1.4 Auth & Otorisasi [✅ DONE]

- [x] Halaman login (`/login`)
- [x] Fungsionalitas logout
- [x] Cookie session Supabase Auth
- [x] Middleware proteksi route
- [x] Session provider & useAuth hook
- [x] Mode pemeliharaan

#### 1.5 Testing [✅ DONE]

- [x] Test login
- [x] Verifikasi RLS per role
- [x] Seed data admin

---

### Fase 2 — Data Master [⚠️ MOSTLY COMPLETED]

#### 2.1 Tahun Pelajaran & Semester [✅ DONE]

- [x] CRUD tahun pelajaran
- [x] CRUD semester
- [x] Set semester aktif
- [x] Mode penilaian (PTS/Semester)

#### 2.2 Guru [✅ DONE]

- [x] CRUD guru
- [x] Kode auto-generate (GR-XXX)
- [x] Constraint NIP/GTT
- [x] Drag & drop reordering (Desktop) - @dnd-kit
- [x] Tombol ▲▼ reordering (Mobile)

#### 2.3 Siswa [✅ DONE]

- [x] CRUD siswa
- [x] Import Excel massal
- [x] Export Excel
- [x] Validasi impor
- [x] Fitur alumni status
  - [x] Database migration (tahun_lulus)
  - [x] Type definitions (SiswaWithRelations)
  - [x] AlumniDialog component
  - [x] useAlumni hook
  - [x] Alumni filter di halaman
  - [x] Award/RotateCcw buttons

#### 2.4 Kelas Dapo [✅ DONE]

- [x] CRUD kelas Dapo

#### 2.5 Kelas Real [✅ DONE]

- [x] CRUD kelas Real

#### 2.6 Mata Pelajaran [✅ DONE]

- [x] CRUD mata pelajaran

#### 2.7 Panel Dua Kolom - Dapo [✅ DONE]

- [x] Panel distribusi siswa ke Kelas Dapo
- [x] TwoColumnPanel reusable component
- [x] Preview perubahan

#### 2.8 Panel Dua Kolom - Real [✅ DONE]

- [x] Panel distribusi siswa titipan
- [x] Validasi jenjang sama
- [x] Warning >2 jenjang dalam 1 ruang
- [x] Preview perubahan

#### 2.9 Kepala Sekolah [✅ DONE]

- [x] CRUD kepala sekolah
- [x] Upload tanda tangan digital (PNG)

#### 2.10 Komponen Nilai [✅ DONE]

- [x] Konfigurasi bobot per mapel
- [x] Validasi total 100%

#### 2.11 Testing & Verifikasi [❌ TODO]

- [ ] Uji CRUD master data
- [ ] Uji reordering guru
- [ ] Uji impor Excel
- [ ] Uji panel dua kolom

---

### Fase 3 — Kurikulum & Dashboard [✅ UI COMPLETED]

#### 3.1 Pembagian Mengajar [✅ DONE]

- [x] Database tables (007_pembagian_mengajar_tables.sql)
- [x] RPC functions — detect_konflik, sync_dapo_to_real, get_nilai_status (008_rpc_functions.sql)
- [x] usePembagianMengajar hook (fetchAll, fetchByGuru, create, update, remove, detectConflicts, syncDapoToReal, batchUpsert)
- [x] UI: CRUD pembagian Dapo (`/master/pembagian-mengajar-dapo`)
- [x] UI: CRUD pembagian Real (`/master/pembagian-mengajar-real`)
- [x] UI: Sinkronisasi (Dapo ↔ Real) (`/master/sinkronisasi-mengajar`)
- [x] UI: Tampilkan konflik
- [x] UI: Opsi Timpa Semua / Gabung
- [x] UI: Audit log sinkronisasi

#### 3.2 Tugas Tambahan [✅ DONE]

- [x] Database tables + RLS (013_tugas_tambahan_tables.sql)
- [x] Kategori tugas default (Wali Kelas 7/8/9, Koordinator 7/8/9, Kepala Kurikulum, Laboran, Perpustakaan)
- [x] RPC functions — get_guru_eligible_for_walas, assign_wali_kelas, get_tugas_tambahan_summary
- [x] useTugasTambahan hook (getGuruEligible, assignWaliKelas, getSummary, getAllTugas, createTugas, updateTugas, deleteTugas)
- [x] UI: CRUD tugas tambahan (`/master/tugas-tambahan`)
- [x] UI: Coordinator (7/8/9)
- [x] UI: Kepala Kurikulum
- [x] UI: Wali Kelas
- [x] UI: Filter guru eligible

#### 3.3 Dashboard RPC [✅ DONE]

- [x] RPC function (get_dashboard_summary) — role-specific: superadmin, admin, guru, siswa
- [x] useDashboard hook (fetchDashboard, refresh)
- [x] Dashboard page (SuperadminDashboard, AdminDashboard, GuruDashboard, SiswaDashboard)
- [x] UI: Enhance Dashboard Urusan
- [ ] UI: Dashboard Wali Kelas
- [ ] UI: Skeleton loading
- [ ] UI: Cache di state

---

### Fase 4 — Penilaian & Rapor [✅ COMPLETED]

#### 4.0 Backend (DONE)

- [x] Database tables — nilai, kehadiran, catatan_walas, rapor_status + RLS (009_nilai_tables.sql)
- [x] RPC functions — get_siswa_for_nilai_input, save_nilai_batch, get_rekap_nilai, check_rapor_prasyarat, generate_rapor_data, generate_nilai_template (010_nilai_rpc_functions.sql)
- [x] useNilai hook (getSiswaForInput, saveNilaiBatch, getRekapNilai, checkRaporPrasyarat, generateRaporData, generateNilaiTemplate)
- [x] Type definitions (database-extended.ts)

#### 4.1 Input Nilai (UI) [✅ DONE]

- [x] Mode PTS (UH1-3, PTS)
- [x] Mode Semester (UH1-5, PTS, SEMESTER, RAPOR)
- [x] UH sequential validation
- [x] Tabel spreadsheet inline (Aesthetics matching Stitch Screen 1-3)
- [x] Navigasi Tab/Enter/Arrow Keys
- [x] Partial save (Simpan Perubahan) with local mock support for dev mode
- [x] Upload Excel (`/nilai/upload`)
- [x] Generate template dengan metadata (XLSX with hidden Metadata sheet)
- [x] Validasi metadata upload (semester_id, kelas_id, mapel_id)
- [x] Konflik upload handling (preview & confirmation)

#### 4.2 Rekap Nilai (UI) [✅ DONE]

- [x] Tabel rekap per kelas (`/nilai/rekap`)
- [x] Filter (jenjang, kelas, mapel, guru, status)
- [x] Status kelengkapan (lengkap/kurang/kosong)
- [x] Export Excel

#### 4.3 Wali Kelas & Kehadiran (UI) [✅ DONE]

- [x] Input kehadiran (sakit, izin, alpha) (`/kehadiran`)
- [x] Catatan wali kelas per siswa
- [x] Batch save
- [x] Filter kelas wali

#### 4.4 Rapor PDF (UI) [✅ DONE]

- [x] Cek prasyarat
- [x] Export per siswa
- [x] Export per kelas
- [x] Urutan Dapo / Real
- [x] Template sekolah
- [x] Tanda tangan digital / basah
- [x] Header sekolah
- [x] Footer tanda tangan

---

### Fase 5 — Asesmen [✅ COMPLETED]

#### 5.0 Backend (DONE)

- [x] Database tables + RLS — asesmen, jadwal_ujian, jadwal_mengawasi, nomor_peserta, ruang_ujian, pembagian_ruang, kepengawasan (011_asesmen_tables.sql)
- [x] Enum types — jenis_asesmen_enum (ASTS/ASAS/ASAT/ASAJ), status_asesmen_enum
- [x] Indexes pada semua tabel asesmen
- [x] Ketersediaan pengawas table + RLS (013_tugas_tambahan_tables.sql)

#### 5.1 Setup Asesmen (UI) [✅ DONE]

- [x] CRUD asesmen (`/master/asesmen`)
- [x] Jenis ujian (ASTS/ASAS/ASAT/ASAJ)
- [x] Range tanggal
- [x] Kode NUS
- [x] Acuan kelas (Dapo/Real)

#### 5.2 Jadwal Ujian (UI) [✅ DONE]

- [x] CRUD jadwal (`/master/asesmen/[id]/jadwal`)
- [x] Tab 1: Jadwal Ujian
- [x] Tab 2: Jadwal Mengawasi (matrix)
- [x] Tab 3: Pembagian Ruang Pengawas
- [x] Tab 4: Kartu Pengawas

#### 5.3 Nomor Peserta (UI) [✅ DONE]

- [x] Generate nomor peserta
- [x] Format: [Jenjang][KodeAbjad]-[KodeNUS]-[NomorAbsen]-[JK]
- [x] Pilihan acuan kelas (Dapo/Real)

#### 5.4 Pembagian Ruang Siswa (UI) [✅ DONE]

- [x] Pengaturan global (`/master/asesmen/[id]/ruang`)
- [x] Pengaturan per jenjang
- [x] Generate otomatis
- [x] Edit manual
- [x] Validasi (jenjang, unassigned)

#### 5.5 Kepengawasan (UI) [✅ DONE]

- [x] Matrix ketersediaan (`/master/asesmen/[id]/matrix`)
- [x] Generate pembagian
- [x] Edit manual (`/master/asesmen/[id]/pengawas`)
- [x] Publish kartu
- [x] Detek konflik

#### 5.6 Ekspor Dokumen (UI) [✅ DONE]

- [x] Tempel Kaca (PDF)
- [x] Data Map (PDF)
- [x] Denah Peserta (PDF)
- [x] Daftar Peserta (Excel)
- [x] Label 1:2:1 (PDF)
- [x] Kartu Peserta (PDF) (`/master/asesmen/[id]/dokumen`)

---

### Fase 6 — Finalisasi [✅ COMPLETED]

#### 6.0 Backend (DONE)

- [x] Database tables + RLS — backup_log, restore_log, validation_rule, validation_result, system_settings, notification (012_finalisasi_tables.sql)
- [x] Default system settings (maintenance_mode, school info, backup schedule)
- [x] RPC functions — get_system_setting, set_system_setting, toggle_maintenance_mode
- [x] Notification system (auto-notify on maintenance toggle)

#### 6.1 Validasi Data (UI) [✅ DONE]

- [x] Validasi realtime (ringan) (`/master/validasi-data`)
- [x] Validasi saat simpan
- [x] Laporan validasi admin
- [x] Fix suggestions

#### 6.2 Backup & Restore (UI) [✅ DONE]

- [x] Backup manual (`/master/backup`)
- [x] Backup terjadwal
- [x] Restore dengan konfirmasi
- [x] Backup log

#### 6.3 Audit Log (UI) [✅ DONE]

- [x] Logging otomatis (`/master/audit-log`)
- [x] Filter & pencarian
- [x] Export Excel
- [x] Pagination

#### 6.4 Mode Pemeliharaan (UI) [✅ DONE]

- [x] Toggle maintenance mode (`/master/maintenance`)
- [x] Redirect non-admin
- [x] Landing page

#### 6.5 Android (Capacitor) [✅ DONE]

- [x] Setup Capacitor (capacitor.config.ts exists)
- [x] README-ANDROID.md guide
- [ ] Build APK (manual step)
- [ ] Testing mobile (manual step)

#### 6.6 UAT & Bug Fixing

- [ ] User Acceptance Testing
- [ ] Bug fixing
- [ ] Deployment

---

## Langkah Selanjutnya (Immediate Actions)

### Sisa Pekerjaan

#### ✅ Priority 1: UI Fase 3 — Pembagian Mengajar & Tugas Tambahan DONE

- [x] UI: CRUD pembagian Dapo
- [x] UI: CRUD pembagian Real
- [x] UI: Sinkronisasi Dapo ↔ Real
- [x] UI: CRUD tugas tambahan

#### ✅ Priority 2: UI Fase 4 — Input Nilai DONE

- [x] UI: Upload Excel nilai
- [x] UI: Generate template dengan metadata
- [x] UI: Rekap nilai per kelas
- [x] UI: Input kehadiran (S/I/A)
- [x] UI: Catatan wali kelas

#### ✅ Priority 3: UI Fase 5 — Asesmen DONE

- [x] UI: CRUD asesmen
- [x] UI: Jadwal ujian
- [x] UI: Pembagian ruang
- [x] UI: Kepengawasan

#### ✅ Priority 4: UI Fase 6 — Finalisasi DONE

- [x] UI: Validasi data
- [x] UI: Backup & Restore
- [x] UI: Audit Log
- [x] UI: Mode Pemeliharaan

#### Remaining: Testing & Android Build

- [ ] User Acceptance Testing (UAT)
- [ ] Bug fixing
- [ ] Build APK (manual via README-ANDROID.md)
- [ ] Deployment

---

## Files yang Sudah Dibuat

### Supabase Migrations

```
supabase/migrations/
├── 001_initial_schema.sql      (30+ tabel)
├── 002_indexes.sql
├── 002_rls_policies.sql
├── 003_triggers.sql
├── 004_rls_policies.sql
├── 005_seed_data.sql
├── 006_add_tahun_lulus_siswa.sql
├── 006_rpc_dashboard.sql
├── 007_pembagian_mengajar_tables.sql
├── 008_rpc_functions.sql
├── 009_nilai_tables.sql
├── 010_nilai_rpc_functions.sql
├── 011_asesmen_tables.sql
├── 012_finalisasi_tables.sql
└── 013_tugas_tambahan_tables.sql
```

### Hooks (Backend Logic)

```
src/hooks/
├── useAlumni.ts
├── useDashboard.ts
├── useDistribusiSiswa.ts
├── useGuruReorder.ts
├── useNilai.ts
├── usePembagianMengajar.ts
└── useTugasTambahan.ts
```

### Type Definitions

```
src/types/
├── database.ts
└── database-extended.ts
```

### Data Master Components

```
src/components/data-master/
├── alumni-dialog.tsx
├── sortable-guru-row.tsx
├── sortable-siswa-row.tsx
└── two-column-panel.tsx
```

### Pages

```
src/app/(protected)/master/
├── distribusi-siswa/page.tsx
├── distribusi-siswa-titipan/page.tsx
├── guru/page.tsx
├── siswa/page.tsx
├── (+ 16 halaman master lainnya)
```

### Lib & Config

```
src/
├── middleware.ts
├── lib/supabase/client.ts
├── lib/supabase/server.ts
├── lib/supabase/middleware.ts
├── lib/utils.ts
└── components/providers/session-provider.tsx
```

---

## Estimasi Timeline Update

```
Minggu 1-4   │████████████│ Sprint 1: Fondasi & Data Master [✅ COMPLETED]
Minggu 5-6    │████████    │ Sprint 2a: Pembagian Mengajar + Dashboard [✅ COMPLETED]
Minggu 7-10   │████████████│ Sprint 2b: Input Nilai + Rapor PDF [✅ COMPLETED]
Minggu 11-14  │████████████│ Sprint 3: Asesmen [✅ COMPLETED]
Minggu 15-16  │████████    │ Sprint 4: Finalisasi + Android [✅ COMPLETED]
```

**✨ SEMUA FASE UTAMA SELESAI - Tinggal UAT & Bug Fixing**

---

## Catatan Penting untuk Developer

### Aturan Golden

1. **RLS harus ada di setiap tabel sebelum tabel tersebut digunakan di frontend** ✅ Sudah diterapkan
2. Tidak ada logika otorisasi yang hanya ada di komponen React — selalu ada pemeriksaan di server ✅
3. localStorage tidak digunakan untuk menyimpan data penting ✅
4. Setiap fitur baru harus melewati pengujian RLS sebelum di-deploy
5. Schema database tidak diubah tanpa migration yang terdokumentasi ✅
6. Semua query database menggunakan prepared statement / parameterized query ✅

### Checklist Backend - SEMUA SELESAI ✅

- [x] Sprint 1 testing & verification
- [x] Semua migrasi database (006-013) selesai
- [x] Semua RPC functions selesai (15+ functions)
- [x] Semua hooks selesai (7 hooks)
- [x] Type definitions lengkap (database-extended.ts)
- [x] Panel dua kolom distribusi siswa (Dapo & Real)
- [x] Fix dashboard TypeScript error (useDashboard API mismatch)
- [x] UI Fase 3 - Pembagian Mengajar & Tugas Tambahan
- [x] UI Fase 4 - Input Nilai & Upload Excel
- [x] UI Fase 4 - Rekap Nilai & Kehadiran
- [x] UI Fase 5 - Asesmen (Jadwal, Ruang, Pengawas, Dokumen)
- [x] UI Fase 6 - Finalisasi (Validasi, Backup, Audit Log, Maintenance)
- [x] Android Setup (Capacitor config)
- [ ] UAT & Bug Fixing

---

## Sisa Pekerjaan

### Testing & Bug Fixing

- [ ] Uji CRUD master data
- [ ] Uji reordering guru
- [ ] Uji impor Excel
- [ ] Uji panel dua kolom
- [ ] User Acceptance Testing
- [ ] Bug fixing berdasarkan feedback

### Android Build (Manual)

- [ ] Build APK (`npm run build && npx cap sync android && cd android && ./gradlew assembleDebug`)
- [ ] Testing mobile

---

_Dokumen ini diupdate secara berkala_
_Update terakhir: 16 Juni 2026 16:55 WIB_
