# PRD Guru Spenturi v2
## Bagian 4 — Spesifikasi Fungsional: Rekap Nilai, Rapor, Asesmen, Backup & Validasi

---

## 14. Rekap Nilai

### Kebutuhan Fungsional

**Akses:**
- Guru hanya dapat melihat rekap nilai kelas Real dan mapel yang menjadi tanggung jawabnya.
- Wali Kelas dapat melihat rekap nilai seluruh mapel dan kehadiran untuk kelas Real yang diampu.
- Koordinator dapat melihat rekap nilai seluruh kelas Real di jenjang yang ditugaskan.
- Kepala Kurikulum dapat melihat rekap nilai seluruh kelas Real di semua jenjang.
- Admin dan Urusan dapat melihat rekap nilai seluruh kelas Real dan mapel.

**Tampilan Rekap:**
- Rekap ditampilkan dalam bentuk tabel per kelas Real — satu baris per siswa, satu kolom per komponen nilai.
- Status kelengkapan nilai ditampilkan per siswa per mapel: lengkap, sebagian, atau kosong.
- Filter tersedia berdasarkan: jenjang, kelas Real, mapel, guru, dan status kelengkapan.
- Rekap dapat diekspor ke Excel.

**Rekap per Mode:**
- Mode PTS aktif: rekap menampilkan UH1, UH2, UH3, dan PTS.
- Mode Semester aktif: rekap menampilkan seluruh komponen termasuk RAPOR.

### Kriteria Penerimaan
- Rekap mencerminkan data nilai terkini tanpa perlu refresh manual.
- Export Excel menghasilkan file yang rapi dan siap digunakan tanpa modifikasi tambahan.
- Pengguna tidak dapat melihat rekap kelas atau mapel di luar tanggung jawabnya.

---

## 15. Wali Kelas & Kehadiran

### Kebutuhan Fungsional

**Data Kehadiran:**
- Wali Kelas menginput rekap kehadiran siswa per semester: jumlah sakit, izin, dan tanpa keterangan.
- Kehadiran diinput per siswa, bukan per hari — wali kelas merekap total di akhir periode.
- Data kehadiran terikat pada kelas Real dan semester aktif.

**Catatan Wali Kelas:**
- Wali Kelas dapat mengisi catatan deskriptif per siswa yang akan muncul di rapor.
- Catatan bersifat opsional namun sistem memberikan peringatan jika ada siswa tanpa catatan saat rapor akan dicetak.

**Status Kelengkapan:**
- Dashboard wali kelas menampilkan status kelengkapan berdasarkan kelas Real: nilai semua mapel, kehadiran, dan catatan.
- Wali Kelas tidak dapat mengekspor rapor sebelum semua data dinyatakan lengkap oleh sistem.
- Admin dapat meng-override status kelengkapan jika diperlukan.

### Kriteria Penerimaan
- Wali Kelas hanya dapat mengakses data kelas Real yang menjadi tanggung jawabnya.
- Sistem mencegah ekspor rapor jika ada komponen yang belum lengkap, kecuali di-override Admin.
- Seluruh perubahan data kehadiran dan catatan tercatat di audit log.

---

## 16. Rapor (Export PDF)

### Latar Belakang Perbaikan
Versi lama bergantung pada cetak langsung dari browser sehingga layout tidak konsisten antar perangkat. Di v2, rapor diekspor sebagai file PDF dengan layout yang seragam, mengikuti template resmi sekolah, dan tidak bergantung pada pengaturan browser.

### Kebutuhan Fungsional

**Prasyarat Ekspor:**
- Semua nilai mapel siswa harus lengkap (seluruh komponen terisi dan RAPOR sudah terhitung).
- Data kehadiran siswa (sakit, izin, alpha) sudah diinput oleh wali kelas.
- Catatan wali kelas per siswa sudah diisi — sistem memberi peringatan jika ada yang kosong.
- Data kepala sekolah aktif (nama, NIP) sudah tersedia.
- Jika ada prasyarat yang belum terpenuhi, sistem menampilkan daftar item yang perlu dilengkapi beserta tautan langsung ke data tersebut.

**Proses Ekspor:**
- Daftar siswa untuk ekspor rapor diambil dari kelas Real yang diampu wali kelas.
- Wali Kelas dapat mengekspor:
  - **Per siswa** — menghasilkan satu file PDF untuk satu siswa.
  - **Per kelas** — menghasilkan satu file PDF yang memuat seluruh siswa, satu halaman per siswa.
- Saat ekspor per kelas, Wali Kelas memilih urutan daftar siswa:
  - **Urutan kelas Dapo** — siswa diurutkan berdasarkan susunan kelas Dapo masing-masing.
  - **Urutan kelas Real** — siswa diurutkan berdasarkan susunan kelas Real, termasuk siswa titipan dari kelas lain.
- Nama kelas dan nama wali kelas yang tercetak di rapor diambil dari data kelas Dapo.
- Nomor halaman dan identitas sekolah (nama, logo, alamat) disisipkan otomatis dari data master sekolah.
- Layout rapor mengikuti template resmi sekolah yang di-upload oleh Admin.
- Layout konsisten di semua perangkat — tidak bergantung pada pengaturan printer atau browser.

**Elemen Wajib di Setiap Halaman Rapor:**
- Header sekolah: nama sekolah, logo, dan alamat
- Identitas siswa: nama lengkap, NIS, dan kelas Dapo
- Tabel nilai per mata pelajaran beserta seluruh komponen (UH1–UH5, PTS, SEMESTER, RAPOR)
- Rekap kehadiran: jumlah sakit, izin, dan alpha
- Catatan wali kelas
- Kolom tanda tangan kepala sekolah: tersedia dua mode yang dikonfigurasi Admin:
  - **Digital** — gambar tanda tangan kepala sekolah disisipkan otomatis ke PDF dari data yang di-upload Admin.
  - **Basah** — ruang kosong untuk tanda tangan manual (cap basah), dilengkapi nama dan NIP kepala sekolah.
- Kolom tanda tangan wali kelas: ruang kosong untuk tanda tangan manual, dilengkapi nama wali kelas.

**Penamaan File:**
- Per siswa: `RAPOR_[NamaSiswa]_[KelasReal]_[Semester].pdf`
- Per kelas: `RAPOR_[KelasReal]_[Semester].pdf`

**Template Rapor:**
- Admin dapat meng-upload template resmi sekolah sebagai acuan layout.
- Sistem menyesuaikan posisi elemen dinamis (nilai, nama siswa, kehadiran, dll.) dengan posisi yang sudah ditentukan dalam template.
- Jika template belum di-upload, sistem menggunakan layout default standar.

**Konfigurasi Tanda Tangan Kepala Sekolah:**
- Admin memilih mode tanda tangan kepala sekolah: **Digital** atau **Basah**.
- Jika Digital: Admin meng-upload gambar tanda tangan (format PNG transparan). Gambar disisipkan otomatis ke posisi tanda tangan di setiap halaman rapor.
- Jika Basah: posisi tanda tangan dikosongkan untuk ditandatangani manual setelah dicetak.
- Mode dapat diubah kapanpun oleh Admin — perubahan berlaku pada ekspor berikutnya.

### Kriteria Penerimaan
- PDF yang dihasilkan identik secara visual dengan template resmi sekolah di semua perangkat.
- Ekspor per kelas selesai dalam waktu yang wajar (≤ 60 detik untuk satu kelas).
- Ruang tanda tangan muncul di posisi yang konsisten di setiap halaman.
- Ekspor tidak dapat dilakukan jika prasyarat belum terpenuhi, kecuali di-override Admin.
- Nama file mengikuti konvensi yang konsisten tanpa karakter ilegal.

---

## 17. Asesmen

### Kebutuhan Fungsional

**Nomor Peserta:**
- Admin atau Urusan dapat meng-generate nomor peserta asesmen untuk seluruh siswa.
- Nomor peserta terikat pada semester dan jenis asesmen aktif.
- Saat generate, Admin memilih acuan kelas: **kelas Dapo** atau **kelas Real** — pilihan ini menentukan nomor absen dan kode abjad kelas yang digunakan.

**Format Nomor Peserta:**
```
[Jenjang][KodeAbjad] - [KodeNUS] - [NomorAbsen] - [JenisKelamin]

Contoh: 71 - 130 - 025 - 1
│ │       │     │         └── Jenis kelamin: 1 = Laki-laki, 2 = Perempuan
│ │       │     └──────────── Nomor absen (3 digit, zero-padded, misal 025)
│ │       └────────────────── Kode NUS (dikonfigurasi Admin per asesmen)
│ └────────────────────────── Kode abjad kelas (A=1, B=2, C=3, dst. berurutan alfabet)
└──────────────────────────── Jenjang (7, 8, atau 9)
```

- Tanda `-` termasuk dalam nomor peserta yang tercetak di dokumen.
- Kode NUS dikonfigurasi oleh Admin di menu Asesmen.
- Kode abjad kelas mengikuti urutan alfabet secara otomatis — A selalu 1, B selalu 2, dst. tanpa melihat ada tidaknya kelas di antaranya.
- Nomor absen mengikuti acuan kelas yang dipilih Admin (Dapo atau Real) saat generate.

**Pembagian Ruang:**

Pembagian ruang dikonfigurasi dalam dua level: **Pengaturan Global** dan **Pengaturan Per Jenjang**.

---

*Pengaturan Global (berlaku untuk semua jenjang):*

Admin mengatur:
1. **Jumlah ruang ujian** — total ruang yang tersedia (1–99).
2. **Mode pembagian siswa per ruang** — berlaku sebagai default untuk semua jenjang:
   - **Setengah kelas** — setiap kelas dibagi menjadi 2 ruang. Jika jumlah siswa ganjil, ruang pertama mendapat siswa lebih banyak (misal 31 siswa → ruang 1 = 16, ruang 2 = 15).
   - **20 siswa per ruang** — siswa diisi per ruang hingga 20. Jika sisa siswa dari satu kelas tidak memenuhi 20, ruang berikutnya diisi dengan siswa dari kelas berikutnya (campuran antar kelas).
   - **Manual** — kapasitas per ruang diinput manual oleh Admin melalui pop-up pengaturan.
3. **Acuan kelas** — pilih kelas Real atau kelas Dapo sebagai sumber data siswa.

Tombol **Set** menerapkan pengaturan global ke semua jenjang dan mereset status apply masing-masing jenjang.

---

*Pengaturan Per Jenjang (Kelas 7, 8, dan 9 masing-masing terpisah):*

Setiap jenjang memiliki form pengaturan sendiri dengan:

1. **Toggle aktif/nonaktif** — jika nonaktif, seluruh form jenjang tersebut di-disable dan jenjang tidak mengikuti asesmen.
2. **Urutan pengisian ruang** — A→Z atau Z→A berdasarkan urutan kelas.
3. **Ruang yang digunakan** — dua bagian opsional untuk mengakomodasi ruang yang tidak berurutan:
   - Bagian 1: Ruang awal – Ruang akhir (wajib diisi)
   - Bagian 2: Ruang awal – Ruang akhir (opsional, untuk ruang tambahan tidak berurutan)
   - Contoh: kelas 7 menggunakan ruang 1–4 dan ruang 9–12.
4. **Setting manual** (hanya muncul jika mode = manual) — pop-up berisi tabel input kapasitas per ruang yang tersedia di Bagian 1 dan Bagian 2 jenjang tersebut.

Tombol **Set** per jenjang menerapkan pengaturan jenjang tersebut dan men-generate pembagian siswa ke ruang secara otomatis.

---

*Aturan tambahan:*
- Satu ruang dapat digunakan oleh maksimal **dua jenjang** secara bersamaan (misal kelas 7 & 8, atau 7 & 9, atau 8 & 9).
- Jika satu ruang digunakan lebih dari dua jenjang, sistem menampilkan peringatan konflik.
- Siswa dari kelas titipan (kelas Real) tetap tercatat dalam ruang sesuai kelas Real mereka.
- Hasil pembagian otomatis dapat diedit manual oleh Admin atau Urusan setelah di-generate.
- Sistem mendeteksi dan menampilkan peringatan jika ada siswa yang belum masuk ke ruang manapun.

**Kepengawasan:**

Modul kepengawasan terdiri dari 4 tab yang saling berkaitan:

---

*Tab 1 — Jadwal Ujian:*
- Admin atau Urusan menginput jadwal ujian per sesi dengan atribut: hari, tanggal, jam (Jam ke-1 / Jam ke-2), jam mulai, durasi (menit), dan mata pelajaran.
- Jenis ujian dipilih dari 4 opsi: Asesmen Sumatif Tengah Semester, Akhir Semester, Akhir Tahun, atau Akhir Jenjang.
- Range tanggal ujian (tanggal mulai & selesai) digunakan sebagai filter pilihan tanggal saat mengisi baris jadwal.
- Maksimal 12 baris jadwal per asesmen.
- Jadwal dapat diekspor ke PDF.
- Tanggal tanda tangan dokumen dapat dikonfigurasi terpisah dari tanggal ujian.

*Tab 2 — Jadwal Mengawasi (Matrix Ketersediaan):*
- Admin atau Urusan menandai ketersediaan setiap guru per slot waktu ujian menggunakan matrix guru × slot.
- Penandaan dapat dilakukan per sel (satu guru satu slot), per baris (satu slot semua guru), atau semua sekaligus.
- Matrix ini menjadi dasar untuk generate pembagian pengawas di Tab 3.

*Tab 3 — Pembagian Ruang Pengawas:*
- Pengaturan pembagian pengawas:
  - **Jumlah ruang** — mengacu pada jumlah ruang yang sudah dikonfigurasi di modul Pembagian Ruang Siswa.
  - **Jumlah pengawas per ruang** — 1 atau 2 pengawas.
  - **Urutan pembagian** — Urut atau Acak.
- Generate otomatis dengan dua algoritma:
  - **Urut** — pengawas dipilih berurutan dari daftar yang tersedia, guru tidak mengawas ruang yang sama dua kali berturut-turut.
  - **Acak (balanced)** — pengawas dipilih secara acak dengan distribusi diratakan, guru dengan jumlah tugas paling sedikit diprioritaskan.
- Jika pengawas per ruang = 2, aturan rotasi ruang dinonaktifkan agar distribusi lebih fleksibel.
- Hasil generate dapat diedit manual oleh Admin atau Urusan per slot per ruang.
- Sistem mendeteksi konflik: satu guru dijadwalkan di dua ruang dalam slot yang sama.
- Data kepengawasan disimpan langsung ke Supabase sebagai sumber kebenaran tunggal — tidak bergantung pada localStorage browser.

*Tab 4 — Kartu Pengawas:*
- Sistem meng-generate kartu pengawas per guru berisi: hari, tanggal, jam, mata pelajaran, dan ruang yang ditugaskan.
- Admin dapat mencetak kartu per guru (pilih dari dropdown) atau semua guru sekaligus dalam satu PDF.
- Admin dapat mempublikasikan kartu pengawas ke dashboard guru sehingga setiap guru dapat melihat jadwal mengawasnya sendiri tanpa perlu dicetak.
- Admin dapat menarik publikasi kartu pengawas dari dashboard guru kapanpun.
- Tanda tangan kepala sekolah pada kartu pengawas mengikuti konfigurasi global (digital atau basah).

**Ekspor Dokumen Asesmen:**

Tersedia 6 jenis ekspor dokumen yang dapat dihasilkan setelah pembagian ruang selesai di-generate:

| Dokumen | Format | Keterangan |
|---|---|---|
| Tempel Kaca | PDF | Nomor ruang besar + daftar siswa, ditempel di pintu ruang ujian |
| Data Map | PDF | Peta posisi duduk siswa di dalam ruang |
| Denah Peserta | PDF | Denah keseluruhan peserta per ruang |
| Daftar Peserta | Excel | Daftar seluruh peserta asesmen dengan data lengkap |
| Label 1:2:1 | PDF | Label per siswa dengan format 1:2:1 |
| Kartu Peserta | PDF | Kartu peserta ujian per siswa |

- Semua dokumen PDF menggunakan data pembagian ruang yang sudah di-generate.
- Tanda tangan kepala sekolah disisipkan otomatis sesuai konfigurasi (digital atau basah).
- Sistem menampilkan peringatan jika pembagian ruang belum di-generate saat tombol ekspor ditekan.

**Peringatan & Validasi Pembagian Ruang:**
- Sistem menampilkan peringatan jika satu ruang digunakan oleh lebih dari dua jenjang.
- Sistem mendeteksi dan menampilkan daftar siswa yang tidak masuk ke ruang manapun (unassigned) — biasanya terjadi jika data kelas Real siswa kosong.
- Dokumen tidak dapat diekspor sebelum semua siswa aktif terdaftar di ruang ujian.

### Kriteria Penerimaan
- Seluruh siswa aktif terdaftar sebagai peserta asesmen tanpa ada yang terlewat.
- Sistem mendeteksi konflik pengawas sebelum dokumen diekspor.
- Perubahan manual pada pembagian ruang dan pengawas tersimpan dan tidak ditimpa ulang oleh sistem.

---

## 18. Validasi Data

### Kebutuhan Fungsional

**Validasi Realtime (Ringan):**
- Dijalankan saat pengguna mengetik atau mengisi form.
- Mencakup: format angka salah, nilai di luar range 0–100, field wajib kosong, format teks tidak sesuai.
- Tidak agresif — hanya muncul untuk error yang jelas dan tidak mengganggu alur pengisian.

**Validasi Saat Simpan:**
- Dijalankan sebelum data masuk ke database sebagai safety net terakhir.
- Mencakup seluruh aturan bisnis yang berlaku untuk data yang disimpan.
- Jika validasi gagal, data tidak tersimpan dan pengguna mendapat pesan error yang spesifik.

**Laporan Validasi (Admin & Urusan):**
- Dijalankan manual oleh Admin atau Urusan sebelum momen kritis: cetak rapor atau pergantian semester.
- Mendeteksi masalah lintas data yang tidak bisa ditangkap validasi per-field, antara lain:
  - Siswa yang terdaftar di kelas tapi tidak memiliki nilai di satu atau lebih mapel.
  - Kelas tanpa wali kelas yang ditetapkan.
  - Guru yang memiliki assignment mengajar tapi belum menginput nilai apapun.
  - Komponen nilai yang belum lengkap menjelang ekspor rapor.
  - Data kepala sekolah yang belum dikonfigurasi.
- Laporan menampilkan daftar masalah beserta tautan langsung ke data yang perlu diperbaiki.

### Kriteria Penerimaan
- Validasi realtime tidak memblokir pengguna saat masih mengetik.
- Validasi saat simpan tidak pernah meloloskan data yang melanggar aturan bisnis.
- Laporan validasi menampilkan seluruh masalah dalam satu halaman tanpa perlu dijalankan berulang.

---

## 19. Backup & Restore

### Kebutuhan Fungsional

**Backup:**
- Admin dapat membuat backup manual seluruh data aplikasi kapanpun.
- Sistem menjalankan backup otomatis pada jadwal yang dikonfigurasi Admin (misalnya harian atau mingguan).
- Setiap backup diberi label waktu dan keterangan opsional dari Admin.
- Daftar backup tersedia dan dapat diunduh oleh Admin dan Superadmin.

**Restore:**
- Admin atau Superadmin dapat memulihkan data dari backup yang dipilih.
- Sistem menampilkan peringatan eksplisit bahwa restore akan menimpa data saat ini sebelum proses dijalankan.
- Proses restore memerlukan konfirmasi dua langkah untuk mencegah eksekusi tidak sengaja.
- Status proses restore ditampilkan secara realtime.

### Kriteria Penerimaan
- Backup dapat diselesaikan tanpa mengganggu aktivitas pengguna yang sedang berjalan.
- Restore berhasil memulihkan data ke kondisi yang sama dengan saat backup dibuat.
- Seluruh operasi backup dan restore tercatat di audit log.

---

## 20. Audit Log

### Kebutuhan Fungsional

- Sistem mencatat seluruh operasi penting secara otomatis: tambah, ubah, hapus, login, logout, ekspor, sinkronisasi, backup, restore, dan perubahan mode (PTS/Semester).
- Setiap entri log memuat: waktu, pengguna, jenis aksi, data sebelum, dan data sesudah (jika relevan).
- Admin dan Superadmin dapat melihat, memfilter, dan mencari log berdasarkan waktu, pengguna, atau jenis aksi.
- Log tidak dapat dihapus atau diubah oleh siapapun — termasuk Superadmin.
- Log dapat diekspor ke Excel untuk keperluan audit eksternal.

### Kriteria Penerimaan
- Setiap operasi yang tercakup selalu menghasilkan entri log tanpa pengecualian.
- Log tidak dapat dimodifikasi melalui antarmuka apapun.
- Filter dan pencarian log menghasilkan hasil yang akurat dan cepat.

---

*Dokumen ini adalah Bagian 4 dari 5. Bagian berikutnya: Non-Functional Requirements, Alur Utama, Metrik, Risiko & Prioritas.*
