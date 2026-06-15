# Product Requirements Document (PRD)
## Guru Spenturi — Rebuild v2

| Atribut | Keterangan |
|---|---|
| Status dokumen | Draft — Bagian 1 dari 5 |
| Tanggal penyusunan | 11 Juni 2026 |
| Produk | Guru Spenturi v2 |
| Platform | Web responsif (Next.js) + Aplikasi Android via Capacitor |
| Backend | Supabase (Auth + Database + Storage) |
| Pengguna utama | Admin, Urusan, Guru, Koordinator, Wali Kelas, Siswa |

---

## 1. Ringkasan Produk

Guru Spenturi v2 adalah aplikasi administrasi kurikulum sekolah yang dibangun ulang dari nol dengan fondasi keamanan, arsitektur, dan pengalaman pengguna yang lebih baik dari versi sebelumnya.

Aplikasi ini menyatukan pengelolaan data akademik, pembagian tugas guru, penilaian, wali kelas, rapor, asesmen, dan administrasi sistem dalam satu dashboard berbasis peran. Seluruh fitur dari versi pertama dipertahankan, dengan perbaikan menyeluruh pada keamanan autentikasi, konsistensi data, pengalaman input nilai, proses cetak rapor, dan dashboard yang lebih informatif.

Aplikasi berjalan sebagai web app berbasis Next.js dengan Supabase sebagai backend, dan dapat dikemas menjadi aplikasi Android melalui Capacitor.

---

## 2. Latar Belakang

### Masalah dari Versi Sebelumnya

Versi pertama Guru Spenturi berhasil menyatukan administrasi kurikulum dalam satu platform, namun mewariskan beberapa masalah mendasar yang tidak bisa diselesaikan hanya dengan perbaikan tambahan:

**Keamanan:**
- Autentikasi dikelola sepenuhnya di frontend menggunakan koleksi pengguna di database, bukan sistem auth yang proper.
- Password disimpan tanpa hashing yang benar.
- Row Level Security (RLS) tidak diterapkan secara konsisten, sehingga data dapat diakses atau diubah di luar aturan aplikasi.
- Otorisasi hanya bergantung pada menu tersembunyi di sisi klien, bukan pemeriksaan di sisi server.

**Arsitektur:**
- Schema database menggunakan struktur dokumen generik yang menyulitkan constraint relasional dan validasi integritas data.
- Duplikasi aset antara folder root dan folder `www` berisiko membuat versi web dan Android tidak sinkron.
- Banyak listener realtime yang tidak di-unsubscribe dengan benar menyebabkan penurunan performa.

**Pengalaman Pengguna:**
- Input nilai hanya mendukung satu mode, tidak fleksibel untuk guru yang terbiasa dengan spreadsheet.
- Proses cetak rapor bergantung penuh pada browser tanpa standarisasi, sehingga layout tidak konsisten antar perangkat.
- Dashboard kurang memberikan gambaran cepat yang berguna bagi masing-masing peran.

### Kesimpulan

Kompleksitas masalah di atas — terutama pada lapisan keamanan dan schema database — membuat perbaikan inkremental tidak efisien. Rebuild dari nol memberikan kesempatan untuk membangun fondasi yang benar sejak awal.

---

## 3. Visi Produk

Menjadi pusat administrasi kurikulum sekolah yang **aman, terintegrasi, dan mudah digunakan** — dari komputer maupun ponsel — dengan data yang konsisten sepanjang siklus semester dan proses cetak dokumen yang dapat diandalkan.

---

## 4. Tujuan Produk

1. **Keamanan terlebih dahulu** — autentikasi yang proper, otorisasi di sisi server, dan RLS yang ketat dari hari pertama.
2. **Satu sumber data** untuk seluruh data akademik utama: guru, siswa, kelas, mapel, semester, nilai, dan rapor.
3. **Mempercepat pembagian mengajar**, tugas tambahan, dan penetapan wali kelas.
4. **Memudahkan guru memasukkan nilai** melalui tabel spreadsheet inline maupun upload file Excel.
5. **Memudahkan koordinator dan wali kelas** memantau kelengkapan nilai secara real-time.
6. **Menghasilkan rapor dalam format PDF** yang konsisten dan siap cetak dari data yang sama.
7. **Menyederhanakan persiapan asesmen** dengan pembagian ruang dan pengawas otomatis yang bisa diedit manual.
8. **Menjaga konsistensi data** melalui validasi berlapis, backup, restore, dan audit log yang terpusat.

---

## 5. Prinsip Produk

### Keamanan adalah Fondasi
Autentikasi, otorisasi, dan pembatasan akses data tidak boleh menjadi fitur tambahan — melainkan bagian dari arsitektur sejak baris pertama kode ditulis. Tidak ada akses anon yang tidak perlu. Tidak ada logika otorisasi yang hanya ada di frontend.

### Berbasis Peran
Menu, data, dan aksi yang tampil harus mencerminkan apa yang memang menjadi tanggung jawab pengguna. Guru tidak perlu melihat menu admin. Admin tidak perlu melihat form input nilai guru.

### Satu Data, Banyak Proses
Data master (guru, siswa, kelas, mapel) diinput sekali dan digunakan kembali untuk pembagian mengajar, input nilai, rekap, rapor, dan asesmen. Tidak ada duplikasi manual.

### Berbasis Semester
Semua data transaksional terikat pada periode akademik aktif. Perpindahan semester harus terkontrol, dapat diaudit, dan tidak berisiko mencampur data antar periode.

### Validasi Berlapis
- **Realtime (ringan):** untuk error yang jelas saat pengguna mengetik, seperti format angka atau field wajib yang kosong.
- **Saat simpan:** sebagai safety net sebelum data masuk ke database.
- **Laporan validasi (admin):** dijalankan manual sebelum momen kritis seperti cetak rapor atau pergantian semester.

### Output yang Dapat Diandalkan
Rapor dan dokumen asesmen hanya dihasilkan dari data yang sudah lengkap dan tervalidasi. Format PDF yang dihasilkan harus konsisten tanpa bergantung pada pengaturan browser pengguna.

### Mobile Friendly
Pekerjaan utama — termasuk input nilai — harus tetap bisa dilakukan dari layar ponsel dengan nyaman.

### Dapat Dipulihkan
Perubahan penting didukung backup, restore, dan audit log. Sistem harus bisa kembali ke kondisi sebelumnya jika terjadi kesalahan.

---

*Dokumen ini adalah Bagian 1 dari 5. Bagian berikutnya: Persona & Peran, Ruang Lingkup, dan Fitur di Luar Cakupan.*
