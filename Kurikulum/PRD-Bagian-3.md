# PRD Guru Spenturi v2
## Bagian 3 — Spesifikasi Fungsional: Auth, Dashboard, Data Master, Input Nilai

---

## 9. Auth, Sesi & Hak Akses

### Latar Belakang Perbaikan
Versi lama mengelola autentikasi sepenuhnya di frontend menggunakan koleksi pengguna di database tanpa hashing yang benar. Di v2, autentikasi dibangun di atas **Supabase Auth** sejak hari pertama.

### Kebutuhan Fungsional

**Login & Sesi**
- Pengguna login menggunakan username/email dan password melalui Supabase Auth.
- Sesi dikelola di sisi server — bukan hanya di localStorage atau state frontend.
- Sistem mengarahkan pengguna ke dashboard sesuai perannya setelah login berhasil.
- Pengguna yang belum login tidak dapat mengakses halaman manapun selain halaman login.
- Pengguna dapat logout dan sesi dihapus sepenuhnya dari server maupun klien.

**Hak Akses & Otorisasi**
- Setiap route dan operasi tulis divalidasi di sisi server berdasarkan peran pengguna.
- Pengguna tidak dapat mengakses fitur di luar haknya hanya dengan mengganti URL di browser.
- Row Level Security (RLS) diterapkan pada seluruh tabel di Supabase — akses anon ditutup secara default.
- Tugas tambahan (Koordinator, Kepala Kurikulum, Wali Kelas) dibaca dari data penugasan aktif, bukan dari field role statis.

**Mode Pemeliharaan**
- Admin dapat mengaktifkan mode pemeliharaan.
- Saat aktif, pengguna non-admin yang mencoba login diarahkan ke halaman maintenance.
- Pengguna non-admin yang sedang login otomatis diarahkan ke halaman maintenance saat mode diaktifkan.

### Kriteria Penerimaan
- Kredensial salah tidak dapat masuk dalam kondisi apapun.
- Akses ke route yang tidak sesuai peran mengembalikan error 403, bukan halaman kosong.
- RLS mencegah query langsung ke Supabase dari browser untuk data yang bukan miliknya.
- Logout membersihkan sesi di server dan klien.

---

## 10. Dashboard

### Latar Belakang Perbaikan
Versi lama mengalami lagging karena setiap card melakukan query terpisah secara sequential saat halaman dibuka. Di v2, seluruh data dashboard diambil dalam **satu RPC call** ke Supabase, hasilnya di-cache di state, dan hanya direfresh saat diperlukan.

### Kebutuhan Fungsional

**Performa**
- Seluruh data dashboard diambil melalui satu database function (`get_dashboard_summary`) per peran.
- Hasil disimpan di state — tidak ada query ulang saat pengguna navigasi balik ke dashboard.
- Refresh data dilakukan manual (tombol refresh) atau otomatis setiap 5 menit.
- Skeleton loading ditampilkan saat data sedang dimuat agar tidak terasa blank.
- Tidak ada realtime subscription di dashboard — data ringkasan tidak memerlukan update detik per detik.

**Dashboard per Peran**

| Peran | Informasi yang Ditampilkan |
|---|---|
| Superadmin | Status sistem, pengguna online, ringkasan data seluruh sekolah, log aktivitas terbaru |
| Admin | Total guru, siswa, kelas, mapel aktif; % pembagian mengajar selesai; % nilai terinput; pengguna online |
| Urusan | Status kelengkapan data kurikulum; kelas tanpa wali kelas; mapel tanpa assignment; progres asesmen |
| Urusan + Koordinator | Ditambah: grafik progres input nilai per kelas di jenjang yang ditugaskan |
| Urusan + Kepala Kurikulum | Ditambah: grafik progres input nilai seluruh jenjang |
| Guru | Daftar kelas & mapel yang diajar; progres input nilai per kelas (n/total siswa); reminder nilai belum lengkap |
| Guru + Wali Kelas | Ditambah: status kelengkapan nilai & kehadiran kelas yang diampu; tombol cepat ke halaman rapor |
| Siswa | Informasi akademik pribadi sesuai kebijakan sekolah |

### Kriteria Penerimaan
- Dashboard tampil dalam maksimal 3 detik pada koneksi normal.
- Setiap peran hanya melihat data yang relevan dengan tanggung jawabnya.
- Tidak ada error JavaScript yang menghambat tampilan dashboard di rilis produksi.

---

## 11. Data Master

### 11.1 Guru

**Kebutuhan:**
- Admin dapat menambah, melihat, mengubah, menghapus, mencari, dan memvalidasi data guru.
- Data guru memuat: kode guru (display), nama lengkap, nomor urut tampilan, status kepegawaian, NIP, mata pelajaran utama, dan atribut pendukung.
- Kode guru di-generate otomatis oleh sistem dengan format `GR-XXX` (3 digit, zero-padded) saat data guru baru ditambahkan. Admin tidak perlu menginput kode secara manual.
- Kode guru bersifat unik dan permanen — tidak berubah meskipun data guru diedit, dan tidak di-reuse meskipun guru dinonaktifkan.
- UUID digunakan sebagai primary key internal di database — tidak pernah di-expose sebagai kode tampilan.
- Urutan tampilan guru di daftar dapat ditata ulang oleh Admin melalui drag & drop di desktop dan tombol ▲▼ di mobile. Sistem mendeteksi perangkat secara otomatis dan menampilkan mode yang sesuai.
- Guru baru yang belum diatur posisinya muncul di paling bawah daftar secara default.
- Sistem mendeteksi duplikasi nama sebelum data disimpan sebagai peringatan.
- Data guru yang sudah terhubung ke pembagian mengajar tidak dapat dihapus langsung — harus dinonaktifkan.

**Status Kepegawaian & NIP:**
- Status kepegawaian terdiri dari empat pilihan: `PNS`, `PPPK`, `PPPK PW`, `GTT`.
- Jika status = `GTT`, field NIP otomatis diset `-` dan dinonaktifkan di form — Admin tidak perlu mengisi.
- Jika status diubah dari `GTT` ke status lain, field NIP aktif kembali dan wajib diisi sebelum data dapat disimpan.

**Schema:**
```
guru
├── id              : uuid (PK, auto-generated)
├── kode_guru       : text (display code, format GR-XXX, unique, permanent)
├── urutan          : integer (nullable — null berarti belum diatur, tampil paling bawah)
├── nama            : text
├── status_pegawai  : enum (PNS, PPPK, PPPK PW, GTT)
├── nip             : text (auto "-" jika GTT, wajib diisi jika selain GTT)
├── mapel_utama     : FK → mata_pelajaran
├── status          : enum (aktif, nonaktif)
└── ...
```

### 11.2 Siswa

**Kebutuhan:**
- Admin dapat menambah, melihat, mengubah, menghapus, mencari, dan memvalidasi data siswa.
- Setiap siswa terhubung ke satu **kelas Dapo** (untuk semua keperluan akademik) dan satu **kelas Real** (untuk penataan daftar siswa di ruang fisik).
- Sistem mendukung impor massal via file Excel dan ekspor data siswa ke Excel.
- Format template Excel impor disediakan oleh sistem dan dapat diunduh.
- Siswa yang lulus dapat dipindahkan ke status alumni tanpa menghapus riwayat akademiknya.
- Validasi impor menampilkan baris mana yang bermasalah beserta alasannya sebelum data disimpan.

### 11.3 Kelas

Aplikasi mengelola dua jenis kelas yang memiliki fungsi berbeda:

**Kelas Real (Operasional)**
- Kelas yang digunakan untuk seluruh kegiatan operasional sehari-hari.
- Berlaku untuk keterbatasan ruang: siswa dari kelas abjad terakhir (misal 7F) dititipkan ke kelas Real lain (misal 7A–7E) karena tidak tersedia ruang fisik.
- Penitipan hanya berlaku antar kelas dalam **jenjang yang sama**.
- Satu siswa memiliki tepat satu kelas Real per semester — siswa yang sudah dititipkan ke satu kelas Real tidak bisa dititipkan ke kelas Real lain.
- Kelas Dapo asal siswa tetap melekat pada dirinya meskipun sudah dititipkan ke kelas Real lain.
- Kelas Real yang sudah memiliki data nilai atau kehadiran tidak dapat dihapus langsung.
- Sistem menampilkan peringatan jika ada kelas Real tanpa wali kelas yang ditetapkan.

**Kelola Kelas Real — Antarmuka Dua Panel:**
- Admin atau Urusan mengelola penitipan siswa melalui antarmuka dua panel:
  - **Panel kiri** — pilihan jenjang dan kelas tujuan (A hingga satu sebelum abjad terakhir). Menampilkan daftar siswa yang sudah ada di kelas Real tersebut.
  - **Panel kanan** — menampilkan siswa dari kelas abjad terakhir (otomatis) yang **belum dititipkan** ke kelas Real manapun. Siswa yang sudah dititipkan hilang dari panel kanan.
- Admin men-drag siswa dari panel kanan ke panel kiri untuk menitipkan ke kelas Real tujuan.
- Seluruh perubahan bersifat preview hingga tombol **Simpan** ditekan.
- Siswa yang sudah dititipkan ke kelas Real dapat dipindahkan kembali ke panel kanan (batal titip) selama belum disimpan.

**Kelas Dapo (Dapodik)**
- Kelas resmi yang dilaporkan ke Dapodik — digunakan hanya untuk keperluan administrasi resmi.
- Nama kelas dan wali kelas dari Dapo digunakan saat rapor dicetak.
- Admin atau Urusan dapat menambah, mengubah, dan mengelola kelas Dapo.
- Setiap kelas Dapo terikat pada semester aktif dan memiliki atribut: nama kelas, jenjang, dan wali kelas.

**Kelola Kelas Dapo — Antarmuka Dua Panel:**
- Admin atau Urusan mengelola assignment siswa ke kelas Dapo melalui antarmuka dua panel:
  - **Panel kiri** — pilihan jenjang dan kelas Dapo. Menampilkan daftar siswa yang sudah terdaftar di kelas Dapo tersebut.
  - **Panel kanan** — menampilkan siswa yang belum memiliki kelas Dapo.
- Admin men-drag siswa dari panel kanan ke panel kiri untuk mendaftarkan ke kelas Dapo.
- Seluruh perubahan bersifat preview hingga tombol **Simpan** ditekan.

**Relasi Kelas & Penggunaannya:**

| Keperluan | Menggunakan |
|---|---|
| Daftar peserta didik | Kelas Real |
| Rekap nilai | Kelas Real |
| Kehadiran | Kelas Real |
| Asesmen (pembagian ruang) | Kelas Real |
| Daftar cetak rapor / blangko | Kelas Real |
| Tampilan operasional guru & wali kelas | Kelas Real |
| Nama kelas & wali kelas di rapor tercetak | Kelas Dapo |
| Pelaporan ke Dapodik | Kelas Dapo |

### 11.4 Mata Pelajaran

**Kebutuhan:**
- Admin atau Urusan dapat mengelola kode, nama, kelompok, dan atribut mata pelajaran.
- Sistem mendukung aturan mapel khusus, termasuk pemetaan berdasarkan agama jika diperlukan.
- Mapel yang sudah terhubung ke pembagian mengajar tidak dapat dihapus langsung.

### 11.5 Kepala Sekolah

**Kebutuhan:**
- Admin dapat mengelola data kepala sekolah aktif: nama, NIP, dan tanda tangan digital.
- Tanda tangan digunakan secara otomatis pada dokumen rapor dan berkas asesmen yang diekspor.
- Hanya satu data kepala sekolah yang aktif dalam satu waktu.

### Kriteria Penerimaan (Data Master)
- Seluruh operasi CRUD tercatat di audit log.
- Impor massal menampilkan ringkasan: berhasil, gagal, dan alasan kegagalan per baris.
- Data yang terhubung ke modul lain tidak dapat dihapus tanpa konfirmasi eksplisit.
- Kode guru di-generate otomatis tanpa duplikasi dalam kondisi apapun, termasuk saat impor massal.
- Penataan urutan guru tersimpan dan tercermin konsisten di seluruh bagian aplikasi yang menampilkan daftar guru.

---

## 12. Pembagian Mengajar & Tugas Tambahan

### Kebutuhan

**Pembagian Mengajar:**

Terdapat dua tabel pembagian mengajar yang dikelola secara independen namun dapat disinkronkan:

*Pembagian Kelas Dapo* — digunakan sebagai dasar input nilai, rekap, dan rapor.
- Admin atau Urusan memasangkan guru, mata pelajaran, jenjang, kelas Dapo, dan jumlah jam pelajaran.
- Sistem hanya menampilkan assignment Dapo yang relevan kepada guru saat input nilai.

*Pembagian Kelas Real* — digunakan untuk operasional ruang fisik dan persiapan asesmen.
- Admin atau Urusan memasangkan guru, mata pelajaran, jenjang, kelas Real, dan jumlah jam pelajaran.
- Bersifat independen dari pembagian Dapo setelah sinkronisasi awal.

**Sinkronisasi Pembagian Mengajar:**
- Admin dapat mensinkronkan data antara pembagian Dapo dan Real melalui tombol sinkron dengan memilih arah: *Dapo → Real* atau *Real → Dapo*.
- Sebelum eksekusi, sistem menampilkan tabel konflik yang merinci perbedaan antara kedua pembagian.
- Admin memilih salah satu opsi penyelesaian konflik:
  - **Timpa Semua** — data di tujuan diganti sepenuhnya dengan data sumber.
  - **Gabung** — data baru dari sumber ditambahkan, data yang sudah ada di tujuan dibiarkan.
- Seluruh perubahan hasil sinkronisasi dicatat di audit log.
- Validasi mendeteksi: referensi guru/kelas/mapel yang tidak ditemukan, dan assignment ganda yang tidak sah.
- Rekap tugas mengajar per guru tersedia dan dapat diekspor.

**Tugas Tambahan:**
- Tugas tambahan bersifat assignment aktif per semester — dapat diubah kapanpun oleh Admin dan tidak terikat permanen ke akun manapun.
- Admin dapat menetapkan tugas tambahan pada akun Urusan: Kepala Kurikulum, Koordinator Kelas 7, Koordinator Kelas 8, atau Koordinator Kelas 9.
- Admin dapat menetapkan tugas tambahan Wali Kelas pada akun Guru — wali kelas terikat pada kelas Real, dan otomatis tercermin di kelas Dapo untuk keperluan cetak rapor.
- Guru yang dapat dipilih sebagai Wali Kelas harus memenuhi syarat: status kepegawaian PNS, PPPK, atau PPPK PW — bukan GTT, bukan Kepala Sekolah, dan bukan Wakil Kepala Sekolah. Sistem memfilter otomatis saat Admin memilih wali kelas.
- Satu akun Urusan dapat memiliki lebih dari satu tugas tambahan koordinator sekaligus.
- Tugas tambahan terikat pada semester aktif — tidak otomatis berlanjut ke semester berikutnya.
- Rekap tugas tambahan per urusan dan per guru tersedia untuk Admin.

### Kriteria Penerimaan
- Guru hanya melihat kelas Real dan mapel di kelas Real yang menjadi tanggung jawabnya saat input nilai — daftar nama siswa dan pembagian mapel mengikuti kelas Real, namun nilai tetap tersimpan dan direlasikan ke kelas Dapo.
- Tabel konflik sinkronisasi menampilkan seluruh perbedaan sebelum perubahan apapun disimpan.
- Sinkronisasi yang dibatalkan tidak mengubah data apapun.
- Tugas tambahan aktif secara otomatis setelah Admin menetapkan penugasan.
- Perubahan penugasan dan hasil sinkronisasi tercatat di audit log.

---

## 13. Input Nilai

### Latar Belakang Perbaikan
Versi lama hanya mendukung satu mode input yang kurang fleksibel. Di v2, guru dapat memilih antara input langsung via tabel spreadsheet atau upload file Excel — sesuai preferensi masing-masing.

### Kebutuhan Fungsional

**Akses:**
- Guru hanya dapat membuka kelas Real dan mapel yang menjadi tanggung jawabnya berdasarkan pembagian kelas Real.
- Sistem memuat daftar siswa berdasarkan kelas Real — urutan siswa dan pembagian mapel mengikuti susunan kelas Real.
- Nilai yang diinput tetap tersimpan dan direlasikan ke kelas Dapo masing-masing siswa.

**Mode Input Tabel (Spreadsheet Inline):**
- Nilai ditampilkan dalam tabel yang bisa diedit langsung seperti spreadsheet.
- Navigasi antar sel menggunakan Tab dan Enter.
- Perubahan nilai ditandai secara visual sebelum disimpan.
- Guru dapat menyimpan sebagian nilai tanpa harus mengisi semua siswa terlebih dahulu.

**Mode Upload Excel:**
- Guru dapat mengunduh template Excel yang sudah berisi daftar siswa dan komponen nilai.
- Template yang di-generate sudah tertanam metadata di named range tersembunyi di bagian awal sheet:
  - `_meta_semester_id` — UUID semester saat template di-generate
  - `_meta_kelas_real_id` — UUID kelas Real yang dipilih
  - `_meta_mapel_id` — UUID mata pelajaran yang dipilih
  - `_meta_generated_at` — timestamp generate template
- Guru mengisi nilai di Excel lalu mengupload kembali.
- Saat upload, sistem memvalidasi metadata sebelum memproses isi file:
  - `_meta_semester_id` harus cocok dengan semester aktif saat ini.
  - `_meta_kelas_real_id` harus cocok dengan kelas Real yang sedang dibuka.
  - `_meta_mapel_id` harus cocok dengan mata pelajaran yang sedang dibuka.
  - Jika salah satu tidak cocok, file ditolak dengan pesan error yang menyebutkan metadata mana yang tidak sesuai.
- Template hanya bisa digunakan untuk konteks yang sama persis saat di-generate — template IPA kelas 7A tidak bisa diupload ke IPA kelas 7B atau Matematika kelas 7A.
- Nilai terikat pada siswa, kelas, dan mapel — bukan pada guru. Jika guru diganti, nilai yang sudah ada tetap tersimpan dan tidak hilang.
- Setelah validasi metadata lolos, sistem memvalidasi isi file: format kolom, tipe data, dan range nilai (0–100).
- Konflik antara data upload dan data yang sudah ada ditampilkan sebelum disimpan — guru memilih mana yang dipakai.

**Validasi Nilai:**
- Realtime (ringan): format angka salah, nilai di luar range 0–100, field wajib kosong.
- Saat simpan: validasi keseluruhan sebelum data masuk ke database.

**Komponen Nilai:**

Setiap mapel memiliki komponen nilai tetap: `UH1, UH2, UH3, UH4, UH5, PTS, SEMESTER, RAPOR`.

*Mode PTS (diaktifkan Admin):*
- Komponen yang tampil dan dapat diisi: `UH1, UH2, UH3, PTS`.
- UH bersifat sequential per siswa — UH2 hanya bisa diisi jika UH1 siswa tersebut sudah terisi, UH3 butuh UH2, dst.
- PTS diinput manual oleh guru.

*Mode Semester (diaktifkan Admin):*
- Komponen yang tampil: `UH1, UH2, UH3, UH4, UH5, PTS, SEMESTER, RAPOR`.
- Nilai yang sudah diinput saat mode PTS **tidak dapat diubah** oleh guru, koordinator, atau wali kelas.
- Nilai yang belum diinput saat mode PTS (misal UH2, UH3 masih kosong) tetap dapat diisi oleh guru.
- Aturan sequential UH tetap berlaku per siswa — UH4 butuh UH3, UH5 butuh UH4.
- SEMESTER diinput manual oleh guru.
- Hanya **Admin dan Urusan** yang dapat mengubah nilai apapun saat mode Semester aktif, termasuk nilai yang sudah terkunci untuk guru.

*Nilai RAPOR (otomatis):*
- RAPOR dihitung otomatis oleh sistem menggunakan formula:
  ```
  RAPOR = (rata-rata UH1–UH5 × bobot UH) + (PTS × bobot PTS) + (SEMESTER × bobot SEMESTER)
  ```
- Bobot masing-masing komponen dikonfigurasi oleh Admin per mapel atau per semester.
- RAPOR hanya dihitung jika **semua komponen sudah terisi** — tidak ada perhitungan parsial.
- Nilai RAPOR tidak dapat diinput atau diubah manual oleh siapapun.

*Ringkasan hak akses per mode:*

| Komponen | Mode PTS — Guru | Mode Semester — Guru | Mode Semester — Admin/Urusan |
|---|---|---|---|
| UH1–UH3 (sudah diisi di PTS) | Bisa diisi | **Terkunci** | Bisa diubah |
| UH1–UH3 (belum diisi di PTS) | Bisa diisi | Bisa diisi | Bisa diisi |
| UH4–UH5 | Tidak tampil | Bisa diisi | Bisa diisi |
| PTS | Bisa diisi | **Terkunci** | Bisa diubah |
| SEMESTER | Tidak tampil | Bisa diisi | Bisa diisi |
| RAPOR | Tidak tampil | Otomatis | Otomatis |

- Sistem tidak menampilkan indikator ketuntasan — penilaian lulus/tidak lulus adalah kebijakan masing-masing guru.

### Kriteria Penerimaan
- Guru tidak dapat mengakses nilai kelas atau mapel yang bukan tanggung jawabnya.
- Upload Excel dengan format salah ditolak dengan pesan error yang jelas per baris.
- Nilai tersimpan tanpa kegagalan teknis pada ≥ 99% transaksi.
- Penyimpanan sebagian (partial save) tidak menghapus nilai yang sudah ada sebelumnya.

---

*Dokumen ini adalah Bagian 3 dari 5. Bagian berikutnya: Spesifikasi Fungsional — Rekap Nilai, Rapor, Asesmen, Backup & Validasi.*
