# Product Requirements Document (PRD): Guru Spenturi v2

## 1. Ringkasan Produk & Latar Belakang

### 1.1 Deskripsi Produk
**Guru Spenturi v2** adalah aplikasi administrasi kurikulum sekolah yang dibangun kembali dari awal untuk menyelesaikan kendala keamanan, arsitektur, dan performa dari versi pertama. Aplikasi ini mengintegrasikan data master akademik, pembagian tugas mengajar, proses pengisian nilai, pemantauan kelengkapan nilai, pencetakan rapor PDF secara massal, hingga persiapan dokumen asesmen dalam satu dashboard terintegrasi berbasis peran.

### 1.2 Masalah Utama Versi v1 & Mitigasi v2
* **Keamanan**: Versi v1 mengelola autentikasi sepenuhnya di frontend tanpa hashing. Versi v2 mengimplementasikan **Supabase Auth** dengan Row Level Security (RLS) pada semua tabel, serta proteksi otorisasi di sisi server (Next.js middleware & server actions).
* **Arsitektur**: Versi v1 menggunakan schema database dokumen generik. Versi v2 menggunakan **Supabase PostgreSQL** dengan relasi, primary key UUID, foreign keys, constraints, dan index yang optimal.
* **Pengalaman Pengguna**: Versi v1 lambat saat loading data masal. Versi v2 menggunakan satu panggilan database RPC (`get_dashboard_summary`) untuk memuat data dashboard secara instan dan menghemat query. Fitur input nilai didukung oleh Spreadsheet Inline dan Upload Excel berbasis validasi metadata.

---

## 2. Persona & Peran (Role-Based Access Control)

Sistem menggunakan Role-Based Access Control (RBAC) dengan tingkatan peran sebagai berikut:
```text
Superadmin
└── Admin
    └── Urusan (dapat diberi tugas tambahan: Kepala Kurikulum atau Koordinator Jenjang 7/8/9)
        ├── Guru (dapat diberi tugas tambahan: Wali Kelas)
        └── Siswa
```

### Rincian Peran & Tugas Tambahan:
1. **Superadmin**: Akses sistem mutlak untuk pemeliharaan sistem tingkat tinggi.
2. **Admin**: Mengelola pengguna, semester aktif, data master sekolah, tugas tambahan, dan konfigurasi global.
3. **Urusan**: Mengelola kelas, mata pelajaran, pembagian mengajar, rekap, dan asesmen. Dapat merangkap tugas:
   * **Kepala Kurikulum**: Memantau rekap nilai seluruh jenjang sekolah.
   * **Koordinator Jenjang (7/8/9)**: Memantau rekap nilai jenjang yang ditugaskan.
4. **Guru**: Menginput nilai untuk kelas dan mapel yang diajar. Dapat merangkap tugas:
   * **Wali Kelas**: Mengisi catatan, data kehadiran (sakit, izin, alpha), dan mengekspor rapor PDF kelasnya.
5. **Siswa**: Melihat data akademik pribadi (terbatas).

---

## 3. Cakupan Fitur Utama

### 3.1 Setup Semester & Data Master
* **Semester**: Hanya boleh ada satu semester aktif. Mode penilaian dapat diubah antara **PTS** dan **Semester**.
* **Guru**:
  * Kode guru format `GR-XXX` (3 digit, zero-padded, unik dan permanen).
  * Status kepegawaian (`PNS`, `PPPK`, `PPPK PW`, `GTT`). Jika `GTT`, NIP bernilai `-` dan form dinonaktifkan.
  * Pengaturan urutan daftar menggunakan Drag & Drop (desktop) dan ▲▼ (mobile).
* **Siswa**: Terhubung ke satu **kelas Dapo** dan satu **kelas Real**. Mendukung impor massal Excel.
* **Kelas Real vs Kelas Dapo**:
  * **Kelas Real**: Digunakan untuk operasional sekolah sehari-hari, rekap nilai, kehadiran, denah ruang asesmen. Mengakomodasi siswa titipan jika ada ruang fisik terbatas.
  * **Kelas Dapo**: Digunakan sebagai nama kelas resmi pada rapor cetak dan integrasi data Dapodik.
* **Pembagian Mengajar**: Terpisah antara Dapo dan Real. Admin dapat melakukan sinkronisasi dua arah (`Dapo ↔ Real`) dengan dialog penyelesaian konflik (Timpa Semua atau Gabung).
* **Tugas Tambahan**: Wali kelas disaring hanya untuk status kepegawaian PNS, PPPK, atau PPPK PW (GTT tidak boleh menjadi wali kelas).

### 3.2 Modul Penilaian & Rapor
* **Komponen Nilai**: Terdiri dari `UH1, UH2, UH3, UH4, UH5, PTS, SEMESTER, RAPOR`.
  * **Mode PTS**: Menampilkan dan mengizinkan input untuk `UH1, UH2, UH3, PTS`.
  * **Mode Semester**: Mengunci nilai yang diinput saat mode PTS untuk Guru. Hanya Admin dan Urusan yang dapat mengubah nilai terkunci.
  * **Sequential UH**: Input `UH(N)` hanya terbuka jika `UH(N-1)` sudah terisi.
  * **RAPOR (Generated)**: Dihitung secara otomatis setelah semua komponen terisi menggunakan bobot konfigurasi. Rumus:
    $$\text{RAPOR} = (\text{Rata-rata UH1-UH5} \times \text{Bobot UH}) + (\text{PTS} \times \text{Bobot PTS}) + (\text{SEMESTER} \times \text{Bobot SEMESTER})$$
* **Input Nilai**: Dua mode input: **Spreadsheet Inline** (edit langsung sel via Tab/Enter) dan **Upload Excel** (verifikasi metadata `semester_id`, `kelas_real_id`, dan `mapel_id` guna mencegah salah upload).
* **Ekspor Rapor (PDF)**:
  * Prasyarat: Seluruh nilai mapel lengkap, kehadiran diisi, catatan wali kelas diisi, dan kepala sekolah aktif tersedia.
  * Wali Kelas dapat mengunduh rapor per siswa atau satu kelas penuh (PDF digabungkan).
  * Opsi TTD Kepala Sekolah: **Digital** (PNG transparan) atau **Basah** (dikosongkan untuk tanda tangan manual).

### 3.3 Modul Asesmen
* **Nomor Peserta**: Format `[Jenjang][KodeAbjad] - [KodeNUS] - [NomorAbsen] - [JenisKelamin]`. Kode abjad kelas mengikuti urutan alfabet (A=1, B=2, dst.).
* **Pembagian Ruang Siswa**:
  * Pengaturan global: Jumlah ruang, mode pembagian (Setengah kelas / 20 siswa / manual), dan acuan kelas.
  * Pengaturan per jenjang: Urutan pengisian (A→Z atau Z→A) dan range ruang ujian.
  * Maksimal 2 jenjang dapat menempati 1 ruang ujian. Peringatan dimunculkan jika lebih dari 2 jenjang.
* **Kepengawasan**:
  * **Tab 1: Jadwal Ujian**: Jadwal per sesi (max 12 baris).
  * **Tab 2: Matrix Ketersediaan**: Peta kehadiran guru per slot ujian.
  * **Tab 3: Pembagian Pengawas**: Algoritma Urut (menghindari consecutive mengawas) dan Acak (distribusi seimbang).
  * **Tab 4: Kartu Pengawas**: Cetak kartu jadwal mengawas guru, opsi publish ke dashboard guru.
* **Ekspor Dokumen**: Tempel Kaca, Data Map, Denah Peserta, Daftar Peserta (Excel), Label 1:2:1, dan Kartu Peserta.

### 3.4 Validasi Data & Backup
* **Laporan Validasi**: Menampilkan inkonsistensi data (siswa tanpa nilai, kelas tanpa wali kelas, data kepala sekolah kosong) dengan tautan langsung ke halaman perbaikan.
* **Backup & Restore**: Backup database manual atau terjadwal ke Supabase Storage. Restore memerlukan konfirmasi 2 langkah yang aman.

---

## 4. Kebutuhan Non-Fungsional (NFR)

* **Performa**: Waktu muat dashboard ≤ 3 detik; Penyimpanan nilai ≤ 2 detik; Ekspor PDF rapor kelas ≤ 60 detik.
* **Keamanan**: RLS diaktifkan di seluruh tabel Supabase; otorisasi server-side; cookie HttpOnly.
* **Mobile Responsiveness**: UI ramah mobile (width ≥ 375px), tombol tap target minimal 44x44px, tombol ▲▼ untuk reordering data di layar sentuh.
* **Skalabilitas**: Pemisahan data transaksional per semester aktif untuk mencegah penumpukan data historis yang memperlambat sistem.
