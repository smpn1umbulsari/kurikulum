# Project Milestones: Guru Spenturi v2

---

## 🎯 Milestone 1: Perencanaan & Desain (Step 1-5)
**Target**: Dokumen PRD, Arsitektur Sistem, API Spec, ERD, dan Design System rampung dan disetujui.

| Deliverable | Status | Keterangan |
|-------------|--------|------------|
| `docs/prd.md` | ✅ Selesai | Product Requirements Document |
| `docs/architecture.md` | ✅ Selesai | Arsitektur teknis Next.js + Supabase |
| `docs/api-spec.md` | ✅ Selesai | Spesifikasi RPC dan Server Actions |
| `docs/use-cases.md` | ✅ Selesai | Use case diagram dan skenario |
| `database/erd.mmd` | ✅ Selesai | Entity Relationship Diagram |
| `database/schema.sql` | ✅ Selesai | Skema database lengkap (29 tabel) |
| `ui/wireframe.md` | ✅ Selesai | Wireframe halaman utama |
| `ui/design-system.md` | ✅ Selesai | Design tokens dan komponen UI |
| `tasks/project-plan.md` | ✅ Selesai | Rencana proyek strategis |
| `tasks/milestones.md` | 🔄 In Progress | Target ini (milestone tracker) |
| `tasks/task-list.md` | ⏳ Pending | Daftar tugas terperinci |

**Kriteria Selesai**: Semua dokumen berada di folder yang ditentukan dan bebas konflik. Ready untuk handed off ke Developer.

---

## 🚀 Milestone 2: Fondasi Sistem & Data Master (Sprint 1)
**Target**: Setup Next.js, Supabase Auth, RLS, dan seluruh CRUD Data Master Akademik.

**Durasi**: Minggu 1-4

| Fase | Task | Estimasi |
|------|------|----------|
| **1.1** Setup Project | Initialize Next.js + TypeScript, Tailwind, shadcn/ui, Supabase client | 2 minggu |
| **1.2** Database Setup | Buat 29 tabel, ENUM types, indexes, triggers, constraints | 2 minggu |
| **1.3** RLS Policies | Aktifkan dan tulis policies RLS di 22 tabel | 1 minggu |
| **1.4** Auth & Route | Login page, logout, middleware protection, session provider | 1 minggu |
| **2.1-2.11** Data Master CRUD | Tahun Pelajaran, Guru, Siswa, Mapel, Kelas Dapo, Kelas Real, dll | 2 minggu |

**Kriteria Selesai**: Aplikasi dapat dijalankan di lokal, login berfungsi, dan seluruh data master dapat di-CRUDS.

---

## 📊 Milestone 3: Kurikulum, Dashboard & Penilaian (Sprint 2)
**Target**: Pembagian mengajar, dashboard RPC performa tinggi, input nilai spreadsheet, upload Excel, ekspor rapor PDF.

**Durasi**: Minggu 5-10

| Fase | Task | Estimasi |
|------|------|----------|
| **3.1-3.4** Pembagian Mengajar | CRUD Dapo & Real + sinkronisasi + tugas tambahan | 2 minggu |
| **3.5-3.6** Dashboard RPC | Postgres RPC functions + React hooks + skeleton loader | 1 minggu |
| **4.1-4.3** Input Nilai | Filter, spreadsheet inline (Tab/Enter), sequential validation | 2 minggu |
| **4.3** Upload Excel | Generate template dengan metadata, validasi server-side | 1 minggu |
| **4.4-4.6** Simpan Nilai & Kehadiran | Batch save, rekap nilai, input kehadiran | 1 minggu |
| **4.7** Ekspor Rapor PDF | jsPDF, cek prasyarat, TTD digital/basah | 2 minggu |

**Kriteria Selesai**: Guru dapat input nilai via spreadsheet atau Excel, dan mengekspor rapor PDF kelasnya.

---

## 📝 Milestone 4: Asesmen, Finalisasi & Go-Live (Sprint 3)
**Target**: Manajemen asesmen, backup otomatis, porting Android, UAT, dan deployment production.

**Durasi**: Minggu 11-16

| Fase | Task | Estimasi |
|------|------|----------|
| **5.1-5.8** Asesmen | Setup asesmen, jadwal, matrix pengawas, bagi ruang, bagi pengawas, generate nomor peserta, ekspor dokumen | 4 minggu |
| **6.1** Laporan Validasi | Dashboard QC data (siswa tanpa nilai, dll) | 1 minggu |
| **6.2** Backup & Restore | pg_cron, Supabase Storage, restore dengan konfirmasi | 1 minggu |
| **6.3-6.4** Audit Log & Maintenance | Viewer log, immutable audit, maintenance mode | 1 minggu |
| **6.5** Porting Android | Capacitor setup, static export, APK build | 1 minggu |
| **6.6** UAT & Release | Skenario UAT, bug fixing, performance test, deployment | 1 minggu |

**Kriteria Selesai**: APK Android dapat diinstal, aplikasi production-ready, dan UAT disetujui.

---

## ✅ Definisi Done (Definition of Done)

| Level | Kriteria |
|-------|----------|
| **Per Task** | Code written, self-tested, commit message jelas |
| **Per Sprint** | Semua task tracker ✅, build success, no critical bug |
| **Per Milestone** | Demo ke stakeholder, feedback incorporated |
| **Release** | APK generated, dokumentasi lengkap, monitoring aktif |

---

## 📅 Timeline Overview

```
Minggu  1-4   : Milestone 2 - Fondasi Sistem & Data Master
Minggu  5-10  : Milestone 3 - Kurikulum, Dashboard & Penilaian
Minggu  11-14 : Milestone 4 (Fase 1) - Asesmen
Minggu  15-16 : Milestone 4 (Fase 2) - Finalisasi & Go-Live
```

---

*Document Version: 1.0*
*Last Updated: 2026-06-14*
*Author: AI Project Director*