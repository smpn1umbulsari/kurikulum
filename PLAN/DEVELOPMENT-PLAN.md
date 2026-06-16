# Development Plan — Guru Spenturi v2

## Perencanaan Implementasi dari Perspektif Developer & Analyst

---

## Ringkasan Eksekutif

Proyek **Guru Spenturi v2** adalah rebuild aplikasi administrasi kurikulum SMP dari nol menggunakan Next.js + Supabase. Projekt ini memiliki **20 modul** dengan **30+ tabel database** dan harus dikerjakan oleh **solo developer**.

Dokumen ini memberikan panduan implementasi yang terstruktur berdasarkan:

- Prioritas fungsional (P0/P1/P2)
- Dependensi antar modul
- Urutan development yang aman (database schema harus siap sebelum fitur diimplementasikan)
- Best practices keamanan (RLS harus ada di setiap tabel sebelum digunakan)

---

## 1. Status Dokumentasi Saat Ini

| Dokumen                | Status      | Keterangan                                    |
| ---------------------- | ----------- | --------------------------------------------- |
| PRD Bagian 1-5         | ✅ Selesai  | Fondasi, Persona, Spesifikasi Fungsional, NFR |
| 5-Phase.md             | ✅ Selesai  | Roadmap 6 fase development                    |
| DATABASE-SCHEMA.md     | ✅ Revisi 4 | Schema database final                         |
| DATABASE-ANALYSIS.md   | ✅ Selesai  | Temuan kritis & sedang                        |
| DATABASE-ANALYSIS-2.md | ✅ Selesai  | Temuan lanjutan (revisi 3)                    |
| DATABASE-REVIEW.md     | ✅ Selesai  | Review DBA & Architect                        |
| ERD-Diagram.mermaid    | ✅ Selesai  | Visualisasi relasi                            |

**Kesimpulan:** Dokumentasi sudah sangat lengkap. Siap untuk implementasi.

---

## 2. Prinsip Teknis yang WAJIB Dipatuhi

Sebelum memulai coding, pahami dan patuhi prinsip-prinsip ini:

### 2.1 Keamanan — Bukan Fitur Tambahan

```
❌ VERSI LAMA (SALAH):
- Password disimpan tanpa hashing
- RLS tidak diterapkan
- Otorisasi hanya di frontend
- localStorage untuk data penting

✅ VERSI BARU (BENAR):
- Auth dikelola Supabase Auth
- RLS diterapkan di SEMUA tabel
- Otorisasi di server (middleware/API)
- localStorage hanya untuk preferensi UI
```

### 2.2 Aturan Golden

1. **RLS harus ada di setiap tabel sebelum tabel tersebut digunakan di frontend**
2. Tidak ada logika otorisasi yang hanya ada di komponen React — selalu ada pemeriksaan di server
3. localStorage tidak digunakan untuk menyimpan data penting
4. Setiap fitur baru harus melewati pengujian RLS sebelum di-deploy
5. Schema database tidak diubah tanpa migration yang terdokumentasi
6. Semua query database menggunakan prepared statement / parameterized query

### 2.3 Database First

Urutan yang benar:

```
1. Buat schema database + index + constraint + trigger
2. Buat RLS policy untuk setiap tabel
3. Test RLS dengan query langsung ke Supabase
4. Baru implementasikan fitur frontend
```

---

## 3. Database Preparation Checklist

Sebelum menulis baris kode frontend, pastikan semua perbaikan database sudah diterapkan:

### 3.1 Tabel Utama (dari DATABASE-SCHEMA.md Revisi 4)

| Tabel                    | Status  | Catatan                                 |
| ------------------------ | ------- | --------------------------------------- |
| pengguna                 | ✅ Siap | dengan RLS                              |
| tugas_tambahan           | ✅ Siap | dengan constraint                       |
| tahun_pelajaran          | ✅ Siap |                                         |
| semester                 | ✅ Siap | dengan partial unique index             |
| guru                     | ✅ Siap | dengan constraint NIP/GTT               |
| siswa                    | ✅ Siap |                                         |
| kepala_sekolah           | ✅ Siap | dengan partial unique index             |
| mata_pelajaran           | ✅ Siap |                                         |
| kelas_dapo               | ✅ Siap |                                         |
| kelas_real               | ✅ Siap |                                         |
| siswa_kelas              | ✅ Siap | dengan trigger validasi jenjang         |
| komponen_nilai           | ✅ Siap | dengan constraint bobot                 |
| pembagian_mengajar_dapo  | ✅ Siap |                                         |
| pembagian_mengajar_real  | ✅ Siap |                                         |
| nilai                    | ✅ Siap | dengan generated column rapor + trigger |
| kehadiran                | ✅ Siap |                                         |
| asesmen                  | ✅ Siap |                                         |
| asesmen_jadwal           | ✅ Siap |                                         |
| asesmen_ruang            | ✅ Siap |                                         |
| asesmen_siswa_ruang      | ✅ Siap |                                         |
| asesmen_nomor_peserta    | ✅ Siap |                                         |
| kepengawasan             | ✅ Siap |                                         |
| kepengawasan_assignments | ✅ Siap |                                         |
| kartu_pengawas           | ✅ Siap |                                         |
| audit_log                | ✅ Siap | dengan REVOKE                           |
| backup_log               | ✅ Siap |                                         |
| import_template_log      | ✅ Siap | dengan index                            |
| pengaturan_sekolah       | ✅ Siap | singleton                               |

### 3.2 Hal yang Masih Perlu Diselesaikan (Temuan ANALYSIS-2.md)

| ID  | Item                                           | Prioritas | Status          |
| --- | ---------------------------------------------- | --------- | --------------- |
| A1  | Hapus `kartu_pengawas.rows` (duplikasi data)   | 🔴 Kritis | ⚠️ Perlu dicek  |
| A2  | Klarifikasi `kepengawasan.teacher_codes`       | 🔴 Kritis | ⚠️ Perlu dicek  |
| A6  | Definisikan RLS policy eksplisit untuk `nilai` | 🟡 Sedang | ⚠️ Perlu dibuat |
| A7  | Trigger validasi siswa punya kelas (sudah ada) | 🟡 Sedang | ✅ Sudah ada    |
| A8  | Index & TTL `import_template_log`              | 🟡 Sedang | ✅ Sudah ada    |

### 3.3 RLS Policy yang Perlu Dibuat

Dari DATABASE-ANALYSIS-2.md (A6), berikut RLS policy yang harus ada untuk tabel `nilai`:

```sql
-- Enable RLS
ALTER TABLE nilai ENABLE ROW LEVEL SECURITY;

-- Policy untuk SELECT
CREATE POLICY nilai_select ON nilai
FOR SELECT TO authenticated
USING (
  -- Guru hanya bisa lihat nilai milik kelasnya
  EXISTS (
    SELECT 1 FROM pembagian_mengajar_real pmr
    JOIN siswa_kelas sk ON sk.kelas_real_id = pmr.kelas_real_id
      AND sk.semester_id = pmr.semester_id
    JOIN guru g ON g.pengguna_id = auth.uid()
    WHERE pmr.guru_id = g.id
      AND sk.siswa_id = nilai.siswa_id
      AND pmr.mata_pelajaran_id = nilai.mata_pelajaran_id
      AND pmr.semester_id = nilai.semester_id
  )
  OR
  -- Admin/Urusan bisa lihat semua
  EXISTS (
    SELECT 1 FROM pengguna WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin', 'urusan')
  )
);

-- Policy untuk INSERT/UPDATE (guru hanya bisa update nilai yang tidak terkunci)
CREATE POLICY nilai_insert ON nilai
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pembagian_mengajar_real pmr
    JOIN siswa_kelas sk ON sk.kelas_real_id = pmr.kelas_real_id
    JOIN guru g ON g.pengguna_id = auth.uid()
    WHERE pmr.guru_id = g.id
      AND sk.siswa_id = nilai.siswa_id
      AND pmr.mata_pelajaran_id = nilai.mata_pelajaran_id
      AND pmr.semester_id = nilai.semester_id
  )
  OR
  EXISTS (
    SELECT 1 FROM pengguna WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin', 'urusan')
  )
);
```

---

## 4. Roadmap Development (6 Fase)

### Fase 1 — Fondasi Sistem (Minggu 1-2)

**Tujuan:** Setup project dan autentikasi yang aman

```
Fase 1
├── 1.1 Setup Project
│   ├── Next.js + TypeScript
│   ├── Tailwind CSS
│   ├── shadcn/ui components
│   ├── Supabase client setup
│   └── Folder structure (App Router)
│
├── 1.2 Database Setup
│   ├── Buat ENUM types
│   ├── Buat semua tabel
│   ├── Buat index
│   ├── Buat trigger
│   ├── Buat constraint
│   └── Buat RLS policy (SETIAP tabel)
│
├── 1.3 Auth & Otorisasi
│   ├── Supabase Auth (login/logout)
│   ├── Middleware otorisasi per role
│   ├── Protected routes
│   ├── Redirect based on role
│   └── Mode pemeliharaan
│
└── 1.4 Testing
    ├── Test RLS setiap tabel
    ├── Test otorisasi
    └── Test auth flow
```

**Deliverables:**

- Project Next.js siap digunakan
- Database schema lengkap dengan RLS
- Sistem login/logout berfungsi
- Akses ditolak untuk route yang tidak berwenang

**Prioritas:** P0 — Fondasi keamanan tidak bisa ditunda

---

### Fase 2 — Data Master (Minggu 3-4)

**Tujuan:** CRUD semua data master sekolah

```
Fase 2
├── 2.1 Tahun Pelajaran & Semester
│   ├── CRUD tahun pelajaran
│   ├── CRUD semester
│   ├── Set semester aktif
│   └── Mode penilaian (PTS/Semester)
│
├── 2.2 Guru
│   ├── CRUD guru
│   ├── Kode auto-generate (GR-XXX)
│   ├── Urutan drag & drop (desktop)
│   ├── Urutan tombol ▲▼ (mobile)
│   ├── Constraint NIP/GTT
│   └── Filter guru untuk wali kelas
│
├── 2.3 Siswa
│   ├── CRUD siswa
│   ├── Import Excel massal
│   ├── Export Excel
│   └── Validasi impor
│
├── 2.4 Kelas Dapo & Real
│   ├── CRUD kelas Dapo
│   ├── CRUD kelas Real
│   ├── Panel dua kolom (drag & drop)
│   ├── Penitipan siswa
│   └── Validasi jenjang
│
├── 2.5 Mata Pelajaran
│   └── CRUD mata pelajaran
│
└── 2.6 Kepala Sekolah
    ├── CRUD kepala sekolah
    └── Upload tanda tangan digital
```

**Deliverables:**

- Semua CRUD data master berfungsi
- Import/export Excel berfungsi
- Panel dua kolom berfungsi
- Constraint database diterapkan

**Prioritas:** P0 — Data master adalah fondasi semua fitur lain

---

### Fase 3 — Kurikulum & Dashboard (Minggu 5-6)

**Tujuan:** Pembagian mengajar dan dashboard per role

```
Fase 3
├── 3.1 Pembagian Mengajar
│   ├── CRUD pembagian Dapo
│   ├── CRUD pembagian Real
│   ├── Sinkronisasi (Dapo → Real / Real → Dapo)
│   ├── Tampilkan konflik
│   ├── Opsi Timpa Semua / Gabung
│   └── Audit log sinkronisasi
│
├── 3.2 Tugas Tambahan
│   ├── CRUD tugas tambahan
│   ├── Coordinator (7/8/9)
│   ├── Kepala Kurikulum
│   ├── Wali Kelas
│   └── Filter guru eligible
│
└── 3.3 Dashboard
    ├── RPC function (get_dashboard_summary)
    ├── Dashboard Superadmin
    ├── Dashboard Admin
    ├── Dashboard Urusan
    ├── Dashboard Guru
    ├── Dashboard Wali Kelas
    ├── Dashboard Siswa
    ├── Skeleton loading
    └── Cache di state
```

**Deliverables:**

- Pembagian mengajar berfungsi dengan sinkronisasi
- Tugas tambahan dapat ditetapkan
- Dashboard tampil dalam ≤3 detik
- Setiap role melihat data yang relevan

**Prioritas:** P0 — Kurikulum adalah inti aplikasi

---

### Fase 4 — Penilaian & Rapor (Minggu 7-10)

**Tujuan:** Input nilai, rekap, kehadiran, dan ekspor rapor

```
Fase 4
├── 4.1 Input Nilai
│   ├── Mode PTS (UH1-3, PTS)
│   ├── Mode Semester (UH1-5, PTS, SEMESTER, RAPOR)
│   ├── UH sequential validation
│   ├── Tabel spreadsheet inline
│   ├── Navigasi Tab/Enter
│   ├── Partial save
│   ├── Upload Excel
│   ├── Generate template dengan metadata
│   ├── Validasi metadata upload
│   └── Konflik upload handling
│
├── 4.2 Rekap Nilai
│   ├── Tabel rekap per kelas
│   ├── Filter (jenjang, kelas, mapel, guru, status)
│   ├── Status kelengkapan
│   └── Export Excel
│
├── 4.3 Wali Kelas & Kehadiran
│   ├── Input kehadiran (sakit, izin, alpha)
│   ├── Catatan wali kelas
│   ├── Status kelengkapan
│   └── Validasi sebelum rapor
│
└── 4.4 Rapor PDF
    ├── Cek prasyarat
    ├── Export per siswa
    ├── Export per kelas
    ├── Urutan Dapo / Real
    ├── Template sekolah
    ├── Tanda tangan digital / basah
    ├── Header sekolah
    └── Footer tanda tangan
```

**Deliverables:**

- Input nilai berfungsi (tabel + Excel)
- Nilai terkunci saat mode Semester
- RAPOR dihitung otomatis
- Rekap nilai dapat diekspor
- Rapor PDF sesuai template

**Prioritas:** P0 — Ini adalah fungsi utama aplikasi

---

### Fase 5 — Asesmen (Minggu 11-14)

**Tujuan:** Persiapan dan pelaksanaan asesmen

```
Fase 5
├── 5.1 Setup Asesmen
│   ├── CRUD asesmen
│   ├── Jenis ujian (ASTS/ASAS/ASAT/ASAJ)
│   └── Range tanggal
│
├── 5.2 Jadwal Ujian
│   ├── CRUD jadwal
│   ├── Tab 1: Jadwal Ujian
│   ├── Tab 2: Jadwal Mengawasi (matrix)
│   ├── Tab 3: Pembagian Ruang Pengawas
│   └── Tab 4: Kartu Pengawas
│
├── 5.3 Nomor Peserta
│   ├── Generate nomor peserta
│   ├── Format: [Jenjang][KodeAbjad]-[KodeNUS]-[NomorAbsen]-[JK]
│   └── Pilihan acuan kelas (Dapo/Real)
│
├── 5.4 Pembagian Ruang Siswa
│   ├── Pengaturan global
│   ├── Pengaturan per jenjang
│   ├── Generate otomatis
│   ├── Edit manual
│   └── Validasi (jenjang, unassigned)
│
├── 5.5 Kepengawasan
│   ├── Matrix ketersediaan
│   ├── Generate pembagian
│   ├── Edit manual
│   ├── Publish kartu
│   └── Detek konflik
│
└── 5.6 Ekspor Dokumen
    ├── Tempel Kaca (PDF)
    ├── Data Map (PDF)
    ├── Denah Peserta (PDF)
    ├── Daftar Peserta (Excel)
    ├── Label 1:2:1 (PDF)
    └── Kartu Peserta (PDF)
```

**Deliverables:**

- Asesmen dapat dikonfigurasi
- Pembagian ruang otomatis + manual
- Nomor peserta ter-generate
- Dokumen siap ekspor

**Prioritas:** P1 — Bisa menyusul setelah MVP

---

### Fase 6 — Finalisasi (Minggu 15-16)

**Tujuan:** Sistem pendukung dan deployment

```
Fase 6
├── 6.1 Validasi Data
│   ├── Validasi realtime (ringan)
│   ├── Validasi saat simpan
│   └── Laporan validasi admin
│
├── 6.2 Backup & Restore
│   ├── Backup manual
│   ├── Backup terjadwal
│   ├── Restore dengan konfirmasi
│   └── Backup log
│
├── 6.3 Audit Log
│   ├── Logging otomatis
│   ├── Filter & pencarian
│   └── Export Excel
│
├── 6.4 Mode Pemeliharaan
│   ├── Toggle maintenance mode
│   ├── Redirect non-admin
│   └── Landing page
│
├── 6.5 Android (Capacitor)
│   ├── Setup Capacitor
│   ├── Build APK
│   └── Testing mobile
│
└── 6.6 UAT & Bug Fixing
    ├── User Acceptance Testing
    ├── Bug fixing
    └── Deployment
```

**Deliverables:**

- Sistem validasi lengkap
- Backup/restore berfungsi
- Audit log tercatat
- Aplikasi Android siap
- Siap production

**Prioritas:** P0-P1 — Sistem pendukung harus ada sebelum go-live

---

## 5. Prioritas Modul (dari PRD)

### P0 — Wajib Ada Sebelum Digunakan (MVP)

| No  | Modul                                           | Fase | Dependensi             |
| --- | ----------------------------------------------- | ---- | ---------------------- |
| 1   | Auth, sesi & RLS                                | 1    | -                      |
| 2   | Manajemen pengguna & peran                      | 1    | Auth                   |
| 3   | Semester & tahun pelajaran                      | 2    | Auth                   |
| 4   | Data master (guru, siswa, kelas, mapel, kepsek) | 2    | -                      |
| 5   | Kelola kelas (panel dua kolom)                  | 2    | Data master            |
| 6   | Pembagian mengajar + sinkronisasi               | 3    | Data master            |
| 7   | Tugas tambahan                                  | 3    | Data master            |
| 8   | Mode PTS & Semester                             | 3    | Semester               |
| 9   | Input nilai (tabel + Excel)                     | 4    | Pembagian mengajar     |
| 10  | Rekap nilai                                     | 4    | Input nilai            |
| 11  | Kehadiran & catatan wali kelas                  | 4    | Data master            |
| 12  | Ekspor rapor PDF                                | 4    | Input nilai, Kehadiran |
| 13  | Validasi data                                   | 6    | Semua fitur            |
| 14  | Backup & restore                                | 6    | -                      |
| 15  | Dashboard per role                              | 3    | Semua data             |

### P1 — Penting, Dapat Menyusul Setelah MVP

| No  | Modul                                 | Fase |
| --- | ------------------------------------- | ---- |
| 16  | Asesmen                               | 5    |
| 17  | Audit log                             | 6    |
| 18  | Mode pemeliharaan                     | 6    |
| 19  | Kelas Real (distribusi siswa titipan) | 2    |
| 20  | Publish kartu pengawas                | 5    |
| 21  | Android via Capacitor                 | 6    |

### P2 — Peningkatan Lanjutan

| No  | Modul                  |
| --- | ---------------------- |
| 22  | Analitik progres nilai |
| 23  | Notifikasi in-app      |
| 24  | Preview rapor          |
| 25  | Optimasi lanjutan      |

---

## 6. Struktur Folder Project (Next.js App Router)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── logout/
│   ├── (protected)/
│   │   ├── layout.tsx          # Protected layout with auth check
│   │   ├── dashboard/
│   │   ├── data-master/
│   │   │   ├── guru/
│   │   │   ├── siswa/
│   │   │   ├── kelas/
│   │   │   ├── mata-pelajaran/
│   │   │   └── kepala-sekolah/
│   │   ├── semester/
│   │   ├── kurikulum/
│   │   │   ├── pembagian-mengajar/
│   │   │   └── tugas-tambahan/
│   │   ├── nilai/
│   │   │   ├── input/
│   │   │   └── rekap/
│   │   ├── wali-kelas/
│   │   │   ├── kehadiran/
│   │   │   └── rapor/
│   │   ├── asesmen/
│   │   │   ├── jadwal/
│   │   │   ├── ruang/
│   │   │   ├── kepengawasan/
│   │   │   └── dokumen/
│   │   ├── sistem/
│   │   │   ├── pengguna/
│   │   │   ├── backup/
│   │   │   ├── audit-log/
│   │   │   └── validasi/
│   │   └── settings/
│   ├── api/
│   │   └── [...supabase]/     # Supabase edge functions
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── session-provider.tsx
│   ├── dashboard/
│   │   ├── dashboard-cards.tsx
│   │   └── dashboard-skeleton.tsx
│   ├── data-master/
│   │   ├── guru-table.tsx
│   │   ├── siswa-import.tsx
│   │   └── kelas-panel.tsx     # Panel dua kolom
│   ├── nilai/
│   │   ├── nilai-table.tsx     # Spreadsheet inline
│   │   └── nilai-upload.tsx
│   ├── rapor/
│   │   └── rapor-pdf.tsx
│   └── common/
│       ├── data-table.tsx
│       ├── export-button.tsx
│       └── confirmation-dialog.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── auth/
│   │   └── rls.ts             # RLS helper functions
│   ├── db/
│   │   ├── queries.ts         # Raw SQL queries
│   │   └── rpc.ts             # RPC function calls
│   └── utils/
│       ├── excel.ts            # Excel import/export
│       ├── pdf.ts              # PDF generation
│       └── validation.ts
├── hooks/
│   ├── use-auth.ts
│   ├── use-role.ts
│   ├── use-semester.ts
│   └── use-dashboard.ts
├── types/
│   ├── database.ts            # Generated from Supabase
│   ├── roles.ts
│   └── api.ts
└── middleware.ts              # Auth & role checking
```

---

## 7. File Konfigurasi Penting

### 7.1 Supabase Migration Structure

```
supabase/
├── migrations/
│   ├── 001_init_schema.sql
│   ├── 002_enums.sql
│   ├── 003_tables.sql
│   ├── 004_indexes.sql
│   ├── 005_triggers.sql
│   ├── 006_constraints.sql
│   ├── 007_rls_policies.sql
│   └── 008_seed_data.sql
└── functions/
    └── get_dashboard_summary/
```

### 7.2 Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 7.3 Key Dependencies

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "@supabase/supabase-js": "^2.x",
    "@supabase/ssr": "^0.x",
    "tailwindcss": "^3.x",
    "shadcn-ui": "latest",
    "@tanstack/react-table": "^8.x",
    "exceljs": "^4.x",
    "jspdf": "^2.x",
    "jspdf-autotable": "^3.x",
    "lucide-react": "^0.x",
    "class-variance-authority": "^0.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  }
}
```

---

## 8. Testing Strategy

### 8.1 Unit Testing

- Fungsi kalkulasi RAPOR
- Fungsi validasi sequential UH
- Fungsi generate kode guru
- Fungsi sinkronisasi pembagian mengajar
- Fungsi generate nomor peserta

### 8.2 Integration Testing

- RLS policy setiap tabel
- Otorisasi setiap route
- Alur import Excel
- Alur upload nilai

### 8.3 E2E Testing (Playwright)

- Login sebagai setiap role
- Input nilai dan verifikasi di database
- Ekspor rapor dan verifikasi PDF
- Sinkronisasi pembagian mengajar

### 8.4 RLS Testing Checklist

```
SETIAP tabel harus ditest:
□ SELECT — apakah bisa melihat data sendiri?
□ SELECT — apakah tidak bisa melihat data orang lain?
□ INSERT — apakah bisa insert data sendiri?
□ INSERT — apakah tidak bisa insert data orang lain?
□ UPDATE — apakah bisa update data sendiri?
□ UPDATE — apakah tidak bisa update data orang lain?
□ DELETE — apakah tidak bisa delete data langsung?
```

---

## 9. Metrik Keberhasilan (dari PRD)

| Metrik                                        | Target                                         |
| --------------------------------------------- | ---------------------------------------------- |
| Waktu tampil dashboard                        | ≤ 3 detik                                      |
| Keberhasilan simpan nilai                     | ≥ 99% transaksi                                |
| Waktu ekspor PDF rapor per kelas              | ≤ 60 detik                                     |
| Waktu generate pembagian ruang                | ≤ 5 detik                                      |
| Error RLS (akses data tidak sah)              | 0 kejadian di produksi                         |
| Data loss akibat race condition               | 0 kejadian                                     |
| Fitur utama dapat digunakan di mobile         | 100% fitur P0                                  |
| Guru dapat input nilai tanpa pelatihan teknis | Target adopsi ≥ 90% di minggu pertama semester |
| Waktu setup awal semester oleh Admin          | ≤ 1 hari kerja                                 |

---

## 10. Risk Register & Mitigasi

| Risiko                                            | Dampak | Kemungkinan | Mitigasi                                       |
| ------------------------------------------------- | ------ | ----------- | ---------------------------------------------- |
| RLS tidak lengkap saat awal development           | Tinggi | Sedang      | Audit RLS setiap tabel sebelum deploy          |
| Data nilai hilang akibat partial save yang gagal  | Tinggi | Rendah      | Gunakan transaksi database                     |
| Layout rapor PDF tidak sesuai template sekolah    | Sedang | Sedang      | Uji dengan data nyata; sediakan layout default |
| Guru kesulitan menggunakan input tabel di mobile  | Sedang | Sedang      | Sediakan fallback upload Excel                 |
| Konflik data saat sinkronisasi pembagian mengajar | Sedang | Sedang      | Tampilkan diff yang jelas                      |
| localStorage menjadi sumber data                  | Tinggi | Rendah      | Tidak gunakan localStorage untuk data penting  |
| Performa menurun saat banyak pengguna serentak    | Sedang | Rendah      | Gunakan RPC; tambahkan index                   |
| Kapasitas Supabase free tier tidak mencukupi      | Sedang | Sedang      | Monitor penggunaan; rencanakan upgrade         |

---

## 11. Checklist Sebelum Go-Live

### Database

- [ ] Semua tabel sudah dibuat dengan RLS
- [ ] Semua index sudah dibuat
- [ ] Semua trigger sudah aktif
- [ ] Semua constraint sudah valid
- [ ] Seed data sudah diinput (minimal 1 admin)

### Auth & Security

- [ ] Login/logout berfungsi
- [ ] RLS policy sudah ditest untuk setiap tabel
- [ ] Middleware menolak akses tidak sah
- [ ] Mode pemeliharaan berfungsi

### Data Master

- [ ] CRUD guru berfungsi (kode auto-generate)
- [ ] CRUD siswa berfungsi (import/export)
- [ ] CRUD kelas berfungsi (panel dua kolom)
- [ ] CRUD mapel berfungsi
- [ ] CRUD kepala sekolah berfungsi

### Kurikulum

- [ ] CRUD semester berfungsi
- [ ] Pembagian mengajar berfungsi
- [ ] Sinkronisasi berfungsi
- [ ] Tugas tambahan berfungsi

### Penilaian

- [ ] Input nilai berfungsi (tabel + Excel)
- [ ] Mode PTS/Semester berfungsi
- [ ] Nilai terkunci dengan benar
- [ ] RAPOR dihitung otomatis

### Rapor

- [ ] Ekspor rapor per siswa berfungsi
- [ ] Ekspor rapor per kelas berfungsi
- [ ] Template bisa diupload
- [ ] Tanda tangan digital berfungsi

### Sistem

- [ ] Backup berfungsi
- [ ] Restore berfungsi
- [ ] Audit log tercatat
- [ ] Validasi data berfungsi

### Mobile

- [ ] Android APK berhasil dibuild
- [ ] Fitur utama berfungsi di mobile

---

## 12. Timeline Ringkasan

```
Minggu 1-2  │████████████│ Fondasi (Auth + Database)
Minggu 3-4  │████████████│ Data Master
Minggu 5-6  │████████████│ Kurikulum + Dashboard
Minggu 7-10 │████████████│ Penilaian + Rapor
Minggu 11-14│████████████│ Asesmen
Minggu 15-16│████████████│ Finalisasi + Android
```

**Total:** ~16 minggu (4 bulan) untuk solo developer

---

## 13. Catatan Penting untuk Developer

### 13.1 Sebelum Memulai Setiap Modul

1. Baca ulang spesifikasi di PRD
2. Cek dependensi sudah terpenuhi
3. Buat/migrate schema database jika perlu
4. Buat RLS policy untuk setiap tabel baru
5. Test RLS sebelum coding frontend
6. Implementasi fitur
7. Test E2E
8. Dokumentasi kode

### 13.2 Jangan Lakukan Ini

```
❌ Jangan coding frontend sebelum database siap
❌ Jangan skip RLS testing
❌ Jangan simpan data penting di localStorage
❌ Jangan hardcode konfigurasi
❌ Jangan skip error handling
❌ Jangan deploy tanpa testing RLS
```

### 13.3 Tool yang Direkomendasikan

- **Database:** DBeaver / pgAdmin untuk visualisasi
- **API Testing:** Postman / Insomnia
- **RLS Testing:** Supabase Dashboard + SQL Editor
- **Version Control:** Git (WAJIB)
- **Error Tracking:** Sentry
- **PDF Generation:** jsPDF + jspdf-autotable
- **Excel:** ExcelJS
- **Testing:** Playwright

---

## 14. next_steps.md (File yang Direkomendasikan)

Disarankan untuk membuat file `next_steps.md` di root project untuk tracking progress harian:

```markdown
# Next Steps — Guru Spenturi v2

## Hari Ini

- [ ] ...

## Besok

- [ ] ...

## Minggu Ini

- [ ] ...

##_BLOCKER_

- [ ] ...

## Catatan

- [ ] ...
```

---

_Dokumen ini dibuat berdasarkan analisis seluruh file dokumentasi proyek Guru Spenturi v2._
_Update terakhir: Juni 2026_
