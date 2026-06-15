# Project Task List: Guru Spenturi v2

Daftar tugas terperinci dengan penanggung jawab (assignee) dan status. Update status secara berkala saat progress.

---

## 📋 Sprint 1: Fondasi Sistem & Data Master (Minggu 1-4)

### Fase 1: Setup Project

| Task ID | Deskripsi | Assignee | Status | Prioritas |
|---------|-----------|----------|--------|-----------|
| `T-101` | Initialize Next.js project dengan TypeScript | Developer | ⏳ Todo | High |
| `T-102` | Setup Tailwind CSS | Developer | ⏳ Todo | High |
| `T-103` | Install dan setup shadcn/ui | Developer | ⏳ Todo | High |
| `T-104` | Setup Supabase client (`client.ts`) | Developer | ⏳ Todo | High |
| `T-105` | Setup Supabase server (`server.ts`) | Developer | ⏳ Todo | High |
| `T-106` | Buat folder structure (App Router) | Developer | ⏳ Todo | High |
| `T-107` | Setup environment variables (`.env.local`) | Developer | ⏳ Todo | High |
| `T-108` | Setup Git repository | Developer | ⏳ Todo | Medium |

### Fase 2: Database Setup

| Task ID | Deskripsi | Assignee | Status | Prioritas |
|---------|-----------|----------|--------|-----------|
| `T-110` | Buat ENUM types (`role_enum`, `status_enum`, dll) | Database | ⏳ Todo | High |
| `T-111` | Buat tabel master (pengguna, guru, siswa, mapel, kelas) | Database | ⏳ Todo | High |
| `T-112` | Buat tabel semester-dependent (kelas_dapo, kelas_real, siswa_kelas) | Database | ⏳ Todo | High |
| `T-113` | Buat tabel nilai, komponen_nilai, kehadiran | Database | ⏳ Todo | High |
| `T-114` | Buat tabel asesmen dan related tables | Database | ⏳ Todo | High |
| `T-115` | Buat tabel system logs (audit_log, backup_log, dll) | Database | ⏳ Todo | High |
| `T-116` | Buat semua index untuk performa query | Database | ⏳ Todo | High |
| `T-117` | Buat trigger functions dan triggers | Database | ⏳ Todo | High |
| `T-118` | Buat constraints (chk_bobot_total, chk_nip_gtt, dll) | Database | ⏳ Todo | High |

### Fase 3: RLS Policies

| Task ID | Deskripsi | Assignee | Status | Prioritas |
|---------|-----------|----------|--------|-----------|
| `T-120` | Buat RLS policies untuk tabel master (pengguna, guru, siswa) | Database | ⏳ Todo | High |
| `T-121` | Buat RLS policies untuk tabel semester-dependent | Database | ⏳ Todo | High |
| `T-122` | Buat RLS policies untuk tabel nilai dan kehadiran | Database | ⏳ Todo | High |
| `T-123` | Buat RLS policies untuk tabel asesmen | Database | ⏳ Todo | High |
| `T-124` | Testing dan verifikasi RLS per role | QA | ⏳ Todo | High |

### Fase 4: Auth & Route Protection

| Task ID | Deskripsi | Assignee | Status | Prioritas |
|---------|-----------|----------|--------|-----------|
| `T-130` | Buat halaman login (`app/(auth)/login/page.tsx`) | Developer | ⏳ Todo | High |
| `T-131` | Setup cookie session Supabase Auth | Developer | ⏳ Todo | High |
| `T-132` | Buat `middleware.ts` untuk proteksi route | Developer | ⏳ Todo | High |
| `T-133` | Buat session provider component & useAuth hook | Developer | ⏳ Todo | High |
| `T-134` | Buat halaman maintenance mode | Developer | ⏳ Todo | Medium |
| `T-135` | Seed data user admin pertama | Developer | ⏳ Todo | High |

### Fase 5: CRUD Data Master

| Task ID | Deskripsi | Assignee | Status | Prioritas |
|---------|-----------|----------|--------|-----------|
| `T-140` | Halaman CRUD Tahun Pelajaran | Developer | ⏳ Todo | High |
| `T-141` | Halaman CRUD Semester + Set Aktif | Developer | ⏳ Todo | High |
| `T-142` | Halaman CRUD Guru + drag-drop reordering | Developer | ⏳ Todo | High |
| `T-143` | Halaman CRUD Siswa + import Excel | Developer | ⏳ Todo | High |
| `T-144` | Halaman CRUD Mata Pelajaran | Developer | ⏳ Todo | High |
| `T-145` | Halaman CRUD Kelas Dapodik | Developer | ⏳ Todo | High |
| `T-146` | Halaman CRUD Kelas Real | Developer | ⏳ Todo | High |
| `T-147` | Panel distribusi siswa ke Kelas Dapo (Drag & Drop) | Developer | ⏳ Todo | High |
| `T-148` | Panel distribusi siswa titipan ke Kelas Real | Developer | ⏳ Todo | High |
| `T-149` | Halaman CRUD Kepala Sekolah + upload TTD | Developer | ⏳ Todo | High |
| `T-150` | Form konfigurasi bobot komponen nilai | Developer | ⏳ Todo | High |

---

## 📊 Sprint 2: Kurikulum, Dashboard & Penilaian (Minggu 5-10)

### Fase 6: Pembagian Mengajar

| Task ID | Deskripsi | Assignee | Status | Prioritas |
|---------|-----------|----------|--------|-----------|
| `T-201` | Halaman CRUD Pembagian Mengajar Dapodik | Developer | ⏳ Todo | High |
| `T-202` | Halaman CRUD Pembagian Mengajar Real | Developer | ⏳ Todo | High |
| `T-203` | Antarmuka sinkronisasi Dapo ↔ Real | Developer | ⏳ Todo | High |
| `T-204` | Algoritma komparasi dan resolusi konflik | Developer | ⏳ Todo | High |
| `T-205` | Form penetapan tugas tambahan (Koordinator, Kepala Kurikulum) | Developer | ⏳ Todo | High |
| `T-206` | Form penetapan Wali Kelas | Developer | ⏳ Todo | High |

### Fase 7: Dashboard RPC

| Task ID | Deskripsi | Assignee | Status | Prioritas |
|---------|-----------|----------|--------|-----------|
| `T-210` | Postgres RPC function `get_dashboard_summary` | Database | ⏳ Todo | High |
| `T-211` | Postgres RPC function `get_dashboard_admin` | Database | ⏳ Todo | High |
| `T-212` | Postgres RPC functions dashboard per role lain | Database | ⏳ Todo | High |
| `T-213` | React hook dashboard dengan caching | Developer | ⏳ Todo | High |
| `T-214` | Integrasi tampilan dashboard per peran | Developer | ⏳ Todo | High |
| `T-215` | Skeleton loading dashboard | Developer | ⏳ Todo | Medium |

### Fase 8: Input Nilai

| Task ID | Deskripsi | Assignee | Status | Prioritas |
|---------|-----------|----------|--------|-----------|
| `T-220` | Halaman filter input nilai | Developer | ⏳ Todo | High |
| `T-221` | Komponen spreadsheet inline (UH1-UH5, PTS, SEMESTER) | Developer | ⏳ Todo | High |
| `T-222` | Navigasi sel Tab/Enter + visual changed cells | Developer | ⏳ Todo | High |
| `T-223` | Validasi sequential UH (UH(N) terkunci jika UH(N-1) kosong) | Developer | ⏳ Todo | High |
| `T-224` | Kunci nilai PTS saat mode Semester aktif | Developer | ⏳ Todo | High |
| `T-225` | Kalkulasi otomatis RAPOR real-time | Developer | ⏳ Todo | High |
| `T-226` | Dukungan partial save (simpan sebagian) | Developer | ⏳ Todo | Medium |

### Fase 9: Upload Excel Nilai

| Task ID | Deskripsi | Assignee | Status | Prioritas |
|---------|-----------|----------|--------|-----------|
| `T-230` | Generate template Excel dengan named range metadata | Developer | ⏳ Todo | High |
| `T-231` | Form upload file Excel nilai | Developer | ⏳ Todo | High |
| `T-232` | Validasi metadata server-side | Developer | ⏳ Todo | High |
| `T-233` | Validasi isi Excel (format, range) + log error | Developer | ⏳ Todo | High |
| `T-234` | Tampilkan review perbandingan sebelum simpan | Developer | ⏳ Todo | High |

### Fase 10: Simpan Nilai & Kehadiran

| Task ID | Deskripsi | Assignee | Status | Prioritas |
|---------|-----------|----------|--------|-----------|
| `T-240` | Server action batch save nilai | Developer | ⏳ Todo | High |
| `T-241` | Halaman rekap nilai kelas Real | Developer | ⏳ Todo | High |
| `T-242` | Fitur ekspor rekap ke Excel | Developer | ⏳ Todo | Medium |
| `T-243` | Halaman input rekap kehadiran (S, I, A) | Developer | ⏳ Todo | High |
| `T-244` | Kolom input Catatan Wali Kelas | Developer | ⏳ Todo | High |

### Fase 11: Ekspor Rapor PDF

| Task ID | Deskripsi | Assignee | Status | Prioritas |
|---------|-----------|----------|--------|-----------|
| `T-250` | Setup jsPDF + jspdf-autotable | Developer | ⏳ Todo | High |
| `T-251` | Halaman ekspor rapor PDF | Developer | ⏳ Todo | High |
| `T-252` | Cek prasyarat ekspor (nilai, kehadiran, catatan, kepsek) | Developer | ⏳ Todo | High |
| `T-253` | Tampilkan status kelengkapan + link perbaikan | Developer | ⏳ Todo | High |
| `T-254` | Ekspor per siswa dan massal per kelas | Developer | ⏳ Todo | High |
| `T-255` | Integrasi TTD digital kepala sekolah (PNG) | Developer | ⏳ Todo | High |
| `T-256` | Fitur upload template rapor PDF resmi | Developer | ⏳ Todo | Medium |

---

## 📝 Sprint 3: Asesmen, Finalisasi & Go-Live (Minggu 11-16)

### Fase 12: Manajemen Asesmen

| Task ID | Deskripsi | Assignee | Status | Prioritas |
|---------|-----------|----------|--------|-----------|
| `T-301` | Halaman utama Asesmen + CRUD rencana | Developer | ⏳ Todo | High |
| `T-302` | Tab 1: Form jadwal ujian per sesi | Developer | ⏳ Todo | High |
| `T-303` | Tab 2: Matrix ketersediaan pengawas | Developer | ⏳ Todo | High |
| `T-304` | Setup pembagian ruang siswa | Developer | ⏳ Todo | High |
| `T-305` | Algoritma generate otomatis pembagian ruang | Developer | ⏳ Todo | High |
| `T-306` | Tab 3: Form pembagian pengawas | Developer | ⏳ Todo | High |
| `T-307` | Algoritma auto-generate pengawas (Urut & Acak) | Developer | ⏳ Todo | High |
| `T-308` | Validasi konflik jadwal pengawas | Developer | ⏳ Todo | High |
| `T-309` | Tab 4: Cetak Kartu Pengawas PDF | Developer | ⏳ Todo | High |
| `T-310` | Generate nomor peserta otomatis | Developer | ⏳ Todo | High |
| `T-311` | Ekspor dokumen pendukung (Tempel Kaca, Denah, dll) | Developer | ⏳ Todo | Medium |

### Fase 13: Finalisasi

| Task ID | Deskripsi | Assignee | Status | Prioritas |
|---------|-----------|----------|--------|-----------|
| `T-320` | Halaman Laporan Validasi Data (QC) | Developer | ⏳ Todo | High |
| `T-321` | Halaman manajemen backup manual | Developer | ⏳ Todo | High |
| `T-322` | Setup pg_cron backup otomatis | Database | ⏳ Todo | High |
| `T-323` | Fitur restore dengan konfirmasi 2 langkah | Developer | ⏳ Todo | High |
| `T-324` | Halaman viewer Audit Log | Developer | ⏳ Todo | Medium |
| `T-325` | Fitur maintenance mode toggle | Developer | ⏳ Todo | Medium |

### Fase 14: Mobile & Release

| Task ID | Deskripsi | Assignee | Status | Prioritas |
|---------|-----------|----------|--------|-----------|
| `T-330` | Setup Capacitor di project | Developer | ⏳ Todo | High |
| `T-331` | Static export Next.js (`output: 'export'`) | Developer | ⏳ Todo | High |
| `T-332` | Sync Capacitor + build APK | Developer | ⏳ Todo | High |
| `T-333` | Uji coba kompatibilitas Android | QA | ⏳ Todo | High |
| `T-334` | Susun skenario UAT per peran | QA | ⏳ Todo | High |
| `T-335` | Perbaikan bug hasil UAT | Developer | ⏳ Todo | High |
| `T-336` | Uji beban & performa | QA | ⏳ Todo | High |
| `T-337` | Uji penetrasi keamanan | QA | ⏳ Todo | Medium |
| `T-338` | Deploy ke production + setup Sentry | Developer | ⏳ Todo | High |
| `T-339` | Monitoring go-live minggu pertama | QA | ⏳ Todo | Medium |

---

## 📈 Legenda Status

| Simbol | Status | Keterangan |
|--------|--------|------------|
| ⏳ | Todo | Belum dimulai |
| 🔄 | In Progress | Sedang dikerjakan |
| 🔍 | Review | Menunggu review |
| ✅ | Done | Selesai |
| ❌ | Blocked | Diblokir (dependensi) |

---

## 🔗 Dependensi Task

```
T-101 s/d T-108 (Setup Project)
    ↓
T-110 s/d T-118 (Database Setup)
    ↓
T-120 s/d T-124 (RLS Policies)
    ↓
T-130 s/d T-135 (Auth & Route)
    ↓
T-140 s/d T-150 (CRUD Data Master)
    ↓
T-201 s/d T-206 (Pembagian Mengajar)
    ↓
T-210 s/d T-215 (Dashboard RPC)
    ↓
T-220 s/d T-226 (Input Nilai)
    ↓
T-230 s/d T-234 (Upload Excel)
    ↓
T-240 s/d T-256 (Nilai, Kehadiran, Rapor)
```

---

*Document Version: 1.0*
*Last Updated: 2026-06-14*
*Author: AI Project Director*