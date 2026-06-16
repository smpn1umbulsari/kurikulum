# PRD Guru Spenturi v2
## Bagian 5 — Non-Functional Requirements, Alur Utama, Metrik, Risiko & Prioritas

---

## 21. Non-Functional Requirements

### 21.1 Performa

- Dashboard tampil dalam maksimal 3 detik pada koneksi normal menggunakan satu RPC call ke Supabase.
- Input nilai tersimpan dalam maksimal 2 detik per transaksi pada koneksi normal.
- Ekspor PDF rapor per kelas selesai dalam maksimal 60 detik untuk satu kelas penuh.
- Generate pembagian ruang asesmen selesai dalam maksimal 5 detik untuk seluruh jenjang aktif.
- Halaman tidak boleh blank lebih dari 1 detik tanpa skeleton loading atau indikator progres.
- Tidak ada realtime subscription di halaman dashboard — data di-fetch sekali dan di-cache di state.
- Seluruh query database menggunakan index yang tepat — tidak ada full table scan di operasi yang sering dijalankan.

### 21.2 Keamanan

- Autentikasi dikelola sepenuhnya oleh Supabase Auth — tidak ada password yang disimpan manual di tabel aplikasi.
- Row Level Security (RLS) diterapkan pada seluruh tabel — akses anon ditutup secara default.
- Setiap route dan operasi tulis divalidasi di sisi server (Next.js Server Actions atau API Routes) berdasarkan peran pengguna.
- Pengguna tidak dapat mengakses data di luar haknya hanya dengan memanipulasi URL atau request langsung ke Supabase dari browser.
- Token sesi tidak disimpan di localStorage — menggunakan cookie HttpOnly yang dikelola Supabase Auth.
- Seluruh komunikasi menggunakan HTTPS — tidak ada endpoint HTTP tanpa enkripsi.
- Upload file (tanda tangan, template rapor, Excel) divalidasi tipe dan ukurannya di sisi server sebelum disimpan.

### 21.3 Ketersediaan & Reliabilitas

- Aplikasi dapat diakses dari browser desktop maupun mobile tanpa instalasi tambahan.
- Aplikasi Android (via Capacitor) menggunakan codebase yang sama dengan versi web — tidak ada duplikasi logika.
- Operasi penting (simpan nilai, simpan kehadiran, generate PDF) memiliki penanganan error yang jelas — pengguna selalu mendapat feedback jika operasi gagal.
- Nilai tersimpan tanpa kegagalan teknis pada ≥ 99% transaksi.
- Tidak ada data loss akibat kondisi race condition pada penyimpanan nilai secara bersamaan oleh beberapa guru.

### 21.4 Mobile Responsiveness

- Seluruh fitur utama dapat digunakan dari layar ponsel (≥ 375px lebar).
- Input nilai via tabel spreadsheet inline dapat digunakan di mobile dengan navigasi yang nyaman.
- Reordering urutan guru menggunakan tombol ▲▼ di mobile — bukan drag & drop yang bentrok dengan scroll.
- Antarmuka dua panel (kelola kelas) menyesuaikan layout di mobile: panel ditampilkan secara vertikal atau dengan tab toggle, bukan berdampingan.
- Tombol dan elemen interaktif memiliki ukuran tap target minimal 44×44px.

### 21.5 Skalabilitas

- Schema database dirancang relasional dengan foreign key yang tepat — tidak menggunakan struktur dokumen generik.
- Data transaksional (nilai, kehadiran, penugasan) terikat pada semester aktif sehingga tidak mencampur data antar periode.
- Sistem dapat menangani pertumbuhan data historis tanpa degradasi performa yang signifikan.
- Fungsi dashboard (`get_dashboard_summary`) dapat diperluas untuk peran atau metrik baru tanpa mengubah arsitektur frontend.

### 21.6 Maintainability

- Codebase menggunakan Next.js App Router dengan struktur folder yang konsisten dan dapat diprediksi.
- Logika bisnis penting (perhitungan RAPOR, generate nomor peserta, algoritma pembagian ruang) dipisahkan dari komponen UI dan dapat diuji secara independen.
- Tidak ada logika otorisasi yang tersebar di komponen frontend — semua terpusat di middleware atau server action.
- Variabel konfigurasi (format kode guru, batas nilai, opsi jenis ujian) tidak di-hardcode di dalam komponen.

---

## 22. Alur Utama (User Flows)

### 22.1 Alur Setup Awal Semester (Admin)

```
1. Login sebagai Admin
2. Buat semester baru → set sebagai aktif
3. Input / import data master: guru, siswa, kepala sekolah
4. Buat kelas Dapo per jenjang
5. Kelola kelas Real → distribusi siswa via panel dua kolom
6. Tetapkan wali kelas per kelas Real
7. Konfigurasi mata pelajaran & komponen nilai + bobot
8. Input pembagian mengajar (Dapo & Real) → sinkronisasi jika perlu
9. Tetapkan tugas tambahan Urusan (Koordinator, Kepala Kurikulum)
10. Aktifkan mode PTS → semester siap digunakan guru
```

### 22.2 Alur Input Nilai (Guru)

```
1. Login sebagai Guru
2. Buka dashboard → lihat daftar kelas Real & mapel yang diajar
3. Pilih kelas Real & mapel
4. Pilih mode input: tabel spreadsheet atau upload Excel
   a. Tabel: edit langsung, navigasi Tab/Enter, simpan sebagian
   b. Upload: unduh template → isi di Excel → upload → review konflik → simpan
5. Sistem validasi realtime (format, range 0–100)
6. Simpan → validasi saat simpan → data tersimpan ke kelas Dapo
7. Ulangi untuk kelas & mapel lain
```

### 22.3 Alur Cetak Rapor (Wali Kelas)

```
1. Login sebagai Guru (dengan tugas tambahan Wali Kelas)
2. Buka dashboard → cek status kelengkapan kelas Real
3. Lengkapi kehadiran siswa (sakit, izin, alpha) per siswa
4. Isi catatan wali kelas per siswa
5. Pastikan semua nilai mapel lengkap (koordinasi dengan guru mapel jika ada yang kosong)
6. Saat semua lengkap → buka halaman ekspor rapor
7. Pilih urutan: kelas Dapo atau kelas Real
8. Pilih ekspor per siswa atau per kelas
9. Sistem generate PDF → unduh
10. Cetak & tanda tangan manual (cap basah wali kelas & kepala sekolah jika mode basah)
```

### 22.4 Alur Persiapan Asesmen (Urusan / Admin)

```
1. Login sebagai Urusan atau Admin
2. Buka modul Asesmen → Tab Jadwal Ujian
3. Set jenis ujian, range tanggal, dan input baris jadwal per sesi
4. Buka Tab Jadwal Mengawasi → tandai ketersediaan guru per slot
5. Buka modul Pembagian Ruang:
   a. Set pengaturan global (jumlah ruang, mode, acuan kelas)
   b. Set pengaturan per jenjang (toggle aktif, urutan, range ruang)
   c. Klik Set → sistem generate pembagian siswa ke ruang
   d. Review & edit manual jika perlu
6. Generate nomor peserta (pilih acuan kelas)
7. Kembali ke Kepengawasan → Tab Pembagian Ruang Pengawas
   a. Set jumlah pengawas per ruang & urutan
   b. Generate → review → edit manual jika perlu
8. Tab Kartu Pengawas → publish ke dashboard guru
9. Ekspor dokumen: Tempel Kaca, Data Map, Denah, Daftar Peserta, Label, Kartu Peserta
```

### 22.5 Alur Pergantian Semester (Admin)

```
1. Jalankan laporan validasi → pastikan tidak ada masalah data kritis
2. Backup data semester aktif
3. Buat semester baru
4. Set semester baru sebagai aktif
5. Data master (guru, siswa) dipertahankan → tugas tambahan & pembagian mengajar tidak otomatis berlanjut
6. Ulangi setup awal semester untuk periode baru
```

---

## 23. Metrik Keberhasilan

| Metrik | Target |
|---|---|
| Waktu tampil dashboard | ≤ 3 detik |
| Keberhasilan simpan nilai | ≥ 99% transaksi |
| Waktu ekspor PDF rapor per kelas | ≤ 60 detik |
| Waktu generate pembagian ruang | ≤ 5 detik |
| Error RLS (akses data tidak sah) | 0 kejadian di produksi |
| Data loss akibat race condition | 0 kejadian |
| Fitur utama dapat digunakan di mobile | 100% fitur P0 |
| Guru dapat input nilai tanpa pelatihan teknis | Target adopsi ≥ 90% di minggu pertama semester |
| Waktu setup awal semester oleh Admin | ≤ 1 hari kerja |

---

## 24. Risiko & Mitigasi

| Risiko | Dampak | Kemungkinan | Mitigasi |
|---|---|---|---|
| RLS tidak lengkap saat awal development | Tinggi | Sedang | Audit RLS setiap tabel sebelum deploy ke produksi; gunakan Supabase RLS tester |
| Data nilai hilang akibat partial save yang gagal | Tinggi | Rendah | Gunakan transaksi database; tampilkan konfirmasi sebelum overwrite data yang sudah ada |
| Layout rapor PDF tidak sesuai template sekolah | Sedang | Sedang | Uji generate PDF dengan data nyata sebelum akhir semester pertama; sediakan layout default sebagai fallback |
| Guru kesulitan menggunakan input tabel di mobile | Sedang | Sedang | Uji usability di perangkat nyata; sediakan fallback upload Excel sebagai alternatif |
| Konflik data saat sinkronisasi pembagian mengajar | Sedang | Sedang | Tampilkan diff yang jelas sebelum konfirmasi; log semua perubahan di audit log |
| localStorage menjadi sumber data (seperti versi lama) | Tinggi | Rendah | Tidak menggunakan localStorage untuk data penting; semua state penting tersimpan di Supabase |
| Performa menurun saat banyak pengguna serentak | Sedang | Rendah | Gunakan RPC untuk query berat; tambahkan index pada kolom yang sering difilter |
| Template rapor sekolah sulit dipetakan ke sistem | Sedang | Sedang | Diskusikan template dengan sekolah sebelum implementasi modul rapor; sediakan mode preview sebelum ekspor massal |
| Kapasitas Supabase free tier tidak mencukupi | Sedang | Sedang | Monitor penggunaan sejak awal; rencanakan upgrade plan sebelum semester pertama berakhir |

---

## 25. Prioritas & Roadmap

### P0 — Wajib Ada Sebelum Digunakan (MVP)

Fitur-fitur berikut harus selesai sebelum aplikasi dapat digunakan untuk satu semester penuh:

1. Auth, sesi & RLS
2. Manajemen pengguna & peran
3. Semester & tahun pelajaran
4. Data master: guru (+ kode GR-XXX, status, urutan), siswa, kelas Dapo & Real, mapel, kepala sekolah
5. Kelola kelas (panel dua kolom — Dapo & Real)
6. Pembagian mengajar (Dapo & Real) + sinkronisasi
7. Tugas tambahan (Koordinator, Kepala Kurikulum, Wali Kelas)
8. Mode PTS & Semester
9. Input nilai (tabel spreadsheet + upload Excel)
10. Rekap nilai
11. Kehadiran & catatan wali kelas
12. Ekspor rapor PDF
13. Validasi data (realtime + saat simpan + laporan admin)
14. Backup & restore
15. Dashboard per peran (RPC single call)

### P1 — Penting, Dapat Menyusul Setelah MVP

16. Asesmen: nomor peserta, pembagian ruang siswa, kepengawasan, kartu pengawas, ekspor dokumen
17. Audit log lengkap
18. Mode pemeliharaan
19. Kelas Real (panel dua kolom — distribusi siswa titipan)
20. Publish kartu pengawas ke dashboard guru
21. Aplikasi Android via Capacitor

### P2 — Peningkatan Lanjutan

22. Analitik progres nilai lintas kelas (untuk Kepala Kurikulum)
23. Notifikasi in-app untuk reminder kelengkapan nilai
24. Preview rapor sebelum ekspor massal
25. Optimasi performa lanjutan berdasarkan data penggunaan nyata

---

## 26. Catatan Implementasi

### Urutan Development yang Disarankan

Berdasarkan dependensi antar modul, urutan pengerjaan yang paling efisien untuk solo developer:

```
Fase 1 — Fondasi (minggu 1–2)
  → Setup Next.js + Supabase + Tailwind + shadcn/ui
  → Auth + RLS + middleware otorisasi
  → Schema database lengkap dengan relasi & index

Fase 2 — Data Master (minggu 3–4)
  → Guru, siswa, kelas Dapo & Real, mapel, kepala sekolah
  → Kelola kelas panel dua kolom
  → Semester & tahun pelajaran

Fase 3 — Kurikulum (minggu 5–6)
  → Pembagian mengajar + sinkronisasi
  → Tugas tambahan
  → Dashboard per peran (RPC)

Fase 4 — Nilai & Rapor (minggu 7–10)
  → Mode PTS & Semester
  → Input nilai (tabel + upload Excel)
  → Rekap nilai
  → Kehadiran & catatan wali kelas
  → Ekspor rapor PDF

Fase 5 — Asesmen (minggu 11–14)
  → Pembagian ruang siswa
  → Nomor peserta
  → Kepengawasan (jadwal, matrix, pembagian, kartu)
  → Ekspor dokumen asesmen

Fase 6 — Finalisasi (minggu 15–16)
  → Validasi data (laporan admin)
  → Backup & restore
  → Audit log
  → Mode pemeliharaan
  → Android via Capacitor
  → UAT & perbaikan bug
```

### Prinsip Teknis yang Tidak Boleh Dikompromikan

1. RLS harus ada di setiap tabel sebelum tabel tersebut digunakan di frontend.
2. Tidak ada logika otorisasi yang hanya ada di komponen React — selalu ada pemeriksaan di server.
3. localStorage tidak digunakan untuk menyimpan data penting — hanya untuk preferensi UI (tema, tab aktif).
4. Setiap fitur baru harus melewati pengujian RLS sebelum di-deploy.
5. Schema database tidak diubah tanpa migration yang terdokumentasi.

---

*Dokumen ini adalah Bagian 5 dari 5 — PRD Guru Spenturi v2 selesai.*
*Seluruh keputusan dalam dokumen ini berdasarkan sesi brainstorming dan diskusi yang terdokumentasi pada Juni 2026.*
