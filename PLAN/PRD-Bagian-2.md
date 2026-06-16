# PRD Guru Spenturi v2
## Bagian 2 — Persona & Peran, Ruang Lingkup, Asumsi Awal

---

## 6. Persona & Peran

Aplikasi menggunakan sistem akses berbasis peran (Role-Based Access Control). Setiap peran memiliki menu, data, dan aksi yang berbeda. Pemeriksaan peran dilakukan di sisi server — bukan hanya di frontend.

### Hierarki Peran

```
Superadmin
└── Admin
    └── Urusan
        │   ├── + Kepala Kurikulum     (tugas tambahan — akses pantau semua jenjang)
        │   ├── + Koordinator Kelas 7  (tugas tambahan — akses pantau jenjang 7)
        │   ├── + Koordinator Kelas 8  (tugas tambahan — akses pantau jenjang 8)
        │   └── + Koordinator Kelas 9  (tugas tambahan — akses pantau jenjang 9)
        ├── Guru
        │   └── + Wali Kelas           (tugas tambahan yang melekat pada akun Guru)
        └── Siswa
```

Koordinator bukan lagi peran tersendiri, melainkan **tugas tambahan** yang dilekatkan pada akun Urusan saat Admin menetapkan penugasan kurikulum. Satu akun Urusan dapat memiliki lebih dari satu tugas tambahan, misalnya sekaligus Koordinator Kelas 7 dan Kelas 8. Akses tambahan aktif secara otomatis berdasarkan penugasan yang dikonfigurasi Admin.

---

### Detail Per Peran

#### Superadmin
- Akses penuh ke seluruh sistem tanpa batasan.
- Bertanggung jawab atas pemeliharaan sistem tingkat tertinggi.
- Dapat mengakses dan mengubah data apapun, termasuk data pengguna lain.
- Hanya boleh ada satu atau sangat sedikit akun dengan peran ini.

**Kebutuhan utama:** Kontrol penuh, visibilitas sistem, dan kemampuan intervensi darurat.

---

#### Admin
- Mengelola pengguna, semester, data master sekolah, kurikulum, nilai, laporan, backup, dan kesehatan data.
- Dapat mengaktifkan mode pemeliharaan sehingga pengguna non-admin diarahkan ke halaman maintenance.
- Dapat mendelegasikan sebagian pekerjaan kurikulum ke peran Urusan.
- Menetapkan tugas tambahan untuk akun Urusan (Kepala Kurikulum, Koordinator per jenjang) dan Guru (Wali Kelas).

**Kebutuhan utama:** Satu tempat untuk mengelola semua aspek operasional sekolah dalam satu semester.

---

#### Urusan
- Mengelola pekerjaan kurikulum yang didelegasikan Admin: kelas, mapel, pembagian mengajar, rekap, kalender, dan asesmen.
- Tidak memiliki akses ke manajemen pengguna atau pengaturan sistem.
- Dapat memiliki tugas tambahan yang memperluas aksesnya:

  - **Kepala Kurikulum** — memantau rekap nilai dan kelengkapan data seluruh jenjang.
  - **Koordinator Kelas 7 / 8 / 9** — memantau rekap nilai dan kelengkapan data pada jenjang yang ditugaskan.

**Kebutuhan utama:** Efisiensi dalam menyusun dan memvalidasi data kurikulum, serta visibilitas progres nilai per jenjang jika diberi tugas koordinator.

---

#### Guru
- Melihat ringkasan tugas mengajar pada dashboard pribadi.
- Menginput nilai hanya untuk kelas dan mata pelajaran yang menjadi tanggung jawabnya.
- Tidak dapat melihat nilai guru lain.
- Dapat memiliki tugas tambahan sebagai Wali Kelas.

**Kebutuhan utama:** Antarmuka input nilai yang cepat, mudah, dan tidak membingungkan.

---

#### Wali Kelas *(tugas tambahan pada akun Guru)*
- Memantau kehadiran dan kelengkapan nilai untuk kelas yang diampu.
- Melengkapi data kehadiran dan catatan wali kelas.
- Mengekspor rapor dalam format PDF setelah semua data dinyatakan lengkap.

**Kebutuhan utama:** Kepastian bahwa semua data sudah lengkap dan valid sebelum rapor diekspor.

---

#### Siswa
- Mengakses dashboard atau informasi yang dibuka untuk akun siswa berdasarkan kebijakan sekolah.
- Cakupan fitur siswa saat ini terbatas dan akan diperluas di fase berikutnya.

**Kebutuhan utama:** Akses informasi akademik pribadi yang relevan dan aman.

---

## 7. Ruang Lingkup Fungsional (Ringkasan)

Berikut adalah daftar modul yang tercakup dalam rebuild v2. Detail spesifikasi masing-masing modul dibahas di Bagian 3 dan Bagian 4.

| Modul | Peran yang Terlibat | Prioritas |
|---|---|---|
| Auth, Sesi & Hak Akses | Semua | P0 |
| Dashboard | Semua | P0 |
| Administrasi Pengguna | Superadmin, Admin | P0 |
| Semester & Tahun Pelajaran | Admin | P0 |
| Data Master — Guru | Admin | P0 |
| Data Master — Siswa | Admin | P0 |
| Data Master — Kelas | Admin, Urusan | P0 |
| Data Master — Mata Pelajaran | Admin, Urusan | P0 |
| Data Master — Kepala Sekolah | Admin | P0 |
| Pembagian Mengajar & Tugas Tambahan | Admin, Urusan | P0 |
| Kelas Real | Admin, Urusan | P1 |
| Input Nilai | Guru | P0 |
| Rekap Nilai | Urusan (+ tugas koordinator), Wali Kelas, Admin | P0 |
| Wali Kelas & Kehadiran | Guru (+ tugas wali kelas) | P0 |
| Rapor (Export PDF) | Guru (+ tugas wali kelas) | P0 |
| Asesmen | Urusan, Admin | P1 |
| Validasi Data | Admin, Urusan | P0 |
| Backup & Restore | Admin, Superadmin | P0 |
| Audit Log | Admin, Superadmin | P1 |
| Mode Pemeliharaan | Admin, Superadmin | P1 |

---

## 8. Asumsi Awal

Beberapa asumsi berikut menjadi dasar penyusunan PRD ini dan perlu dikonfirmasi sebelum implementasi:

1. Sekolah menggunakan jenjang 7, 8, dan 9 (SMP); konfigurasi jenjang lain belum menjadi kebutuhan utama.
2. Satu akun Urusan dapat memiliki lebih dari satu tugas tambahan koordinator dalam semester yang sama.
3. Satu akun Guru dapat merangkap sebagai Wali Kelas dalam semester yang sama.
4. Formula nilai akhir dan bobot komponen dikonfigurasi oleh Admin per semester. Sistem hanya menyimpan dan menampilkan nilai angka — penilaian ketuntasan diserahkan sepenuhnya kepada guru.
5. Batas akses siswa terhadap nilai dan rapor ditentukan oleh Admin per kebijakan sekolah.
6. Kapasitas pengguna serentak dan volume data siswa perlu ditetapkan sebelum pengujian beban dilakukan.
7. Sekolah memiliki infrastruktur internet yang memadai untuk mengakses aplikasi berbasis web.

---

*Dokumen ini adalah Bagian 2 dari 5. Bagian berikutnya: Spesifikasi Fungsional — Auth, Dashboard, Data Master, dan Input Nilai.*
