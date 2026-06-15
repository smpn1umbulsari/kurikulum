# Project Plan: Guru Spenturi v2

## 1. Deskripsi Proyek

**Guru Spenturi v2** adalah aplikasi administrasi kurikulum sekolah SMP yang dibangun ulang dari awal untuk menyelesaikan kendala keamanan, arsitektur, dan performa dari versi pertama. Aplikasi ini mengintegrasikan:

- **Data Master Akademik**: Guru, Siswa, Mata Pelajaran, Kelas (Dapo & Real)
- **Pembagian Tugas Mengajar**: Sinkronisasi Dapo ↔ Real dengan deteksi konflik
- **Input Nilai**: Spreadsheet inline & Upload Excel dengan validasi metadata
- **Dashboard RPC**: Performa tinggi dengan single database call
- **Ekspor Rapor PDF**: Massal dengan TTD digital/basah kepala sekolah
- **Manajemen Asesmen**: Jadwal, ruang, pembagian pengawas, dokumen pendukung
- **Mobile Android**: Porting via Capacitor

### Latar Belakang Masalah v1
| Masalah | Solusi v2 |
|---------|-----------|
| Autentikasi frontend tanpa hashing | Supabase Auth + cookie HttpOnly |
| Schema database dokumen generik | PostgreSQL relasional dengan UUID PK, FK, constraints |
| Loading lambat untuk data masal | RPC `get_dashboard_summary` single call |

---

## 2. Struktur Tim Agen & Alokasi

| Agen | Tanggung Jawab | Artefak Output |
|------|----------------|----------------|
| **Business Analyst** | Review dan validasi PRD | `docs/use-cases.md` |
| **System Architect** | Arsitektur teknis, API spec, security plan | `docs/architecture.md`, `docs/api-spec.md` |
| **Database Architect** | ERD, schema SQL, migration plan | `database/erd.mmd`, `database/schema.sql` |
| **UI/UX Designer** | Wireframe, design system, page layout | `ui/wireframe.md`, `ui/design-system.md` |
| **Fullstack Developer** | Implementasi kode production-ready | Source code di `src/` |
| **QA Reviewer** | Test case, bug report, regression report | `qa/test-case.md`, `qa/bug-report.md` |

---

## 3. Stack Teknologi

| Layer | Teknologi |
|-------|-----------|
| **Frontend Framework** | Next.js 14+ (App Router, TypeScript) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Backend/Database** | Supabase PostgreSQL + Auth + Storage |
| **Server Actions** | Next.js Server Actions (otorisasi server-side) |
| **Mobile** | Capacitor (Android APK) |
| **PDF Generation** | jsPDF + jspdf-autotable |
| **Excel Processing** | xlsx (SheetJS) |

---

## 4. Manajemen Risiko & Batasan Scope

### Batasan Rilis Saat Ini (v2.0)
- ❌ **TIDAK** termasuk modul keuangan/budget
- ❌ **TIDAK** termasuk modul perpustakaan
- ❌ **TIDAK** termasuk notifikasi push mobile (dipertimbangkan di v2.1)
- ❌ **TIDAK** termasuk multi-sekolah (single tenant)

### Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|-------|----------|
| Keterlambatan input nilai guru | Rapor terlambat | Dashboard progres real-time + reminder |
| Konflik sinkronisasi Dapo-Real masif | Data tidak konsisten | Dialog resolusi konflik + audit log |
| Kapasitas ruang ujian tidak cukup | Siswa tidak terassign | Validasi max 2 jenjang per ruang + warning |
| Template Excel salah upload | Nilai masuk kelas lain | Validasi metadata server-side |

---

## 5. Prioritas Fitur (MoSCoW)

### Must Have (Wajib)
1. Setup project + Auth + RLS
2. CRUD Data Master (Guru, Siswa, Mapel, Kelas)
3. Input Nilai Spreadsheet Inline
4. Ekspor Rapor PDF
5. Dashboard RPC per role

### Should Have (Sangat Dianjurkan)
1. Upload Excel Nilai dengan validasi
2. Sinkronisasi Pembagian Mengajar
3. Manajemen Asesmen (ruang, pengawas)
4. Backup & Restore Database

### Could Have (Nicer to Have)
1. Porting Android via Capacitor
2. Mode pemeliharaan dengan banner
3. Audit log viewer

---

## 6. Struktur Folder Artefak

```
/
├── .agents/           # Konfigurasi agen AI
├── database/          # Schema SQL & ERD
├── docs/              # PRD, Architecture, API Spec
├── ui/                # Wireframe & Design System
├── tasks/             # Sprint plans & task tracker
└── src/               # Source code (Next.js)
```

---

*Document Version: 1.0*
*Last Updated: 2026-06-14*
*Author: AI Project Director*