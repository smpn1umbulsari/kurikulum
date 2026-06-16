# Prompt Lanjutan — PRD Guru Spenturi v2

Salin prompt di bawah ini dan paste di sesi baru, kemudian upload semua file PRD (Bagian 1–4 dan 5-Phase.md) sekaligus.

---

## PROMPT

Saya sedang menyusun PRD (Product Requirements Document) untuk aplikasi **Guru Spenturi v2** — sebuah aplikasi administrasi kurikulum SMP yang sedang di-rebuild dari nol. Saya sudah menyelesaikan Bagian 1 hingga Bagian 4, dan sekarang ingin melanjutkan ke **Bagian 5**.

Tolong baca semua file PRD yang saya upload sebelum melanjutkan. Berikut konteks penting yang perlu kamu pahami:

---

### Tentang Aplikasi
- Aplikasi web responsif + Android (Next.js + Supabase + Tailwind + shadcn/ui + Capacitor)
- Untuk administrasi kurikulum SMP: guru, siswa, kelas, nilai, rapor, asesmen
- Dikerjakan solo developer, rebuild dari nol karena masalah keamanan, arsitektur, dan UX

---

### Keputusan Penting yang Sudah Disepakati

**Peran & Hierarki:**
- 6 peran: Superadmin, Admin, Urusan, Guru, Siswa
- Koordinator bukan peran tersendiri — menjadi tugas tambahan pada akun Urusan (Kepala Kurikulum, Koordinator Kelas 7/8/9)
- Wali Kelas adalah tugas tambahan pada akun Guru
- Wali kelas hanya bisa dari guru berstatus PNS, PPPK, atau PPPK PW — bukan GTT, Kepsek, atau Wakepsek
- Tugas tambahan bersifat assignment aktif per semester, bisa diubah kapanpun

**Kelas:**
- Ada dua jenis kelas: Kelas Real (operasional sehari-hari) dan Kelas Dapo (administrasi resmi/Dapodik)
- Kelas Real digunakan untuk: daftar siswa, rekap nilai, kehadiran, asesmen, daftar cetak rapor
- Kelas Dapo digunakan untuk: nama kelas & wali kelas di rapor tercetak, pelaporan Dapodik
- Siswa dari kelas abjad terakhir (misal 7F) dititipkan ke kelas Real lain (7A–7E) karena keterbatasan ruang
- Satu siswa hanya bisa dititip ke satu kelas Real — relasi one-to-one
- Kelas Dapo tetap melekat pada siswa meskipun dititipkan ke kelas Real lain
- Pengelolaan kelas menggunakan antarmuka dua panel dengan drag & drop (preview hingga tombol Simpan ditekan)

**Data Guru:**
- Kode guru auto-generate format GR-XXX, UUID sebagai primary key internal
- Status kepegawaian: PNS, PPPK, PPPK PW, GTT
- NIP otomatis "-" jika GTT
- Urutan tampilan via drag & drop (desktop) dan tombol ▲▼ (mobile)

**Nilai:**
- Komponen tetap: UH1, UH2, UH3, UH4, UH5, PTS, SEMESTER, RAPOR
- Mode PTS (diaktifkan Admin): tampil UH1, UH2, UH3, PTS
- Mode Semester (diaktifkan Admin): tampil semua komponen
- UH sequential per siswa (UH2 butuh UH1 terisi, dst.)
- Nilai terkunci saat mode Semester aktif — kecuali Admin & Urusan bisa ubah
- RAPOR dihitung otomatis: (rata-rata UH × bobot) + (PTS × bobot) + (SEMESTER × bobot)
- Bobot dikonfigurasi Admin, RAPOR hanya dihitung jika semua komponen lengkap
- Tidak ada indikator KKM/KKTP — penilaian ketuntasan urusan guru masing-masing
- Input nilai: tampilan mengikuti kelas Real, nilai tersimpan ke kelas Dapo
- Dua mode input: tabel spreadsheet inline + upload Excel

**Pembagian Mengajar:**
- Dua tabel independen: pembagian kelas Dapo & kelas Real
- Tombol sinkronisasi dua arah dengan alur: tampilkan konflik → pilih Timpa Semua atau Gabung

**Rapor:**
- Export PDF (bukan cetak langsung dari browser)
- Ekspor per siswa (1 file) atau per kelas (1 file semua siswa)
- Saat ekspor per kelas: pilih urutan berdasarkan kelas Dapo atau kelas Real
- Elemen wajib: header sekolah, identitas siswa (nama, NIS, kelas Dapo), tabel nilai, kehadiran (sakit/izin/alpha), catatan wali kelas, kolom tanda tangan
- Tanda tangan kepala sekolah: dua pilihan (digital/basah), dikonfigurasi Admin
- Tanda tangan wali kelas: ruang kosong basah
- Layout mengikuti template resmi sekolah yang di-upload Admin
- Ada layout default sebagai fallback jika template belum di-upload

**Dashboard:**
- Satu RPC call ke Supabase (bukan query per card)
- Cache di state, refresh manual atau setiap 5 menit
- Skeleton loading, tidak ada realtime subscription

**Validasi:**
- Realtime (ringan): format & field wajib saat mengetik
- Saat simpan: safety net sebelum masuk database
- Laporan validasi: dijalankan manual Admin/Urusan sebelum momen kritis

---

### Status Dokumen
- ✅ Bagian 1 — Fondasi Produk (Visi, Misi, Prinsip)
- ✅ Bagian 2 — Persona, Peran & Ruang Lingkup
- ✅ Bagian 3 — Spesifikasi Fungsional: Auth, Dashboard, Data Master, Input Nilai
- ✅ Bagian 4 — Spesifikasi Fungsional: Rekap Nilai, Rapor, Asesmen, Backup & Validasi
- 🔜 Bagian 5 — Non-Functional Requirements, Alur Utama, Metrik, Risiko & Prioritas

---

### Yang Perlu Dilanjutkan

Lanjutkan ke **Bagian 5** dengan struktur:
1. Non-Functional Requirements (performa, keamanan, skalabilitas, mobile)
2. Alur Utama (User Flows) untuk peran kunci
3. Metrik Keberhasilan
4. Risiko & Mitigasi
5. Prioritas & Roadmap

Sebelum menulis, konfirmasi dulu apakah kamu sudah membaca dan memahami semua file PRD yang di-upload. Jika ada hal yang perlu didiskusikan sebelum menulis Bagian 5, tanyakan terlebih dahulu.
