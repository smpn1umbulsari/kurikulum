# Use Cases: Guru Spenturi v2

Dokumen ini mendokumentasikan interaksi antara aktor (Admin, Guru, Wali Kelas, Urusan) dengan sistem untuk fitur-fitur utama aplikasi.

---

## UC-01: Setup Awal Semester
* **Aktor**: Admin
* **Deskripsi**: Mempersiapkan periode akademik baru, memasukkan data master, dan mengkonfigurasi pembagian mengajar sebelum semester dimulai.
* **Kondisi Awal (Pre-condition)**: Sistem dalam status aktif dan Admin telah masuk ke sistem.
* **Alur Utama (Main Flow)**:
  1. Admin membuka menu **Periode Akademik** dan membuat semester baru (misal: "Semester Ganjil 2026/2027").
  2. Admin menetapkan semester tersebut sebagai **Aktif** (sistem otomatis menonaktifkan semester sebelumnya).
  3. Admin mengimpor data master **Guru** dan **Siswa** melalui file Excel.
  4. Admin membuat **Kelas Dapo** dan **Kelas Real** untuk jenjang 7, 8, dan 9.
  5. Admin mendistribusikan siswa ke kelas masing-masing menggunakan antarmuka panel dua kolom.
  6. Admin menetapkan tugas tambahan **Wali Kelas** (terikat ke kelas Real) dan **Urusan** (Kepala Kurikulum / Koordinator).
  7. Admin mengkonfigurasi bobot komponen nilai per mata pelajaran.
  8. Admin membagi tugas mengajar (Dapo & Real) dan mensinkronisasikan jika diperlukan.
  9. Admin mengaktifkan **Mode PTS**.
* **Kondisi Akhir (Post-condition)**: Semester aktif siap digunakan oleh Guru untuk menginput nilai.

---

## UC-02: Input Nilai
* **Aktor**: Guru
* **Deskripsi**: Mengisi nilai siswa pada kelas Real dan mata pelajaran yang diajarkan menggunakan mode tabel spreadsheet inline atau upload file Excel.
* **Kondisi Awal (Pre-condition)**: Guru telah masuk ke sistem dan memiliki tugas mengajar aktif di semester berjalan.
* **Alur Utama (Mode Spreadsheet Inline)**:
  1. Guru membuka dashboard dan memilih kelas Real + mapel dari daftar tugas mengajar.
  2. Sistem menampilkan tabel spreadsheet berisi daftar siswa kelas tersebut.
  3. Guru memasukkan nilai pada sel input (UH1-UH5, PTS, SEMESTER) sesuai dengan mode penilaian aktif (PTS / Semester).
  4. Sistem memvalidasi input secara realtime (range 0–100 dan aturan sequential UH).
  5. Guru mengeklik **Simpan**.
  6. Sistem menghitung otomatis nilai **RAPOR** (jika seluruh komponen telah terisi) dan menyimpan data ke database.
* **Alur Alternatif (Mode Upload Excel)**:
  1. Guru mengunduh template Excel untuk kelas & mapel terkait.
  2. Guru mengisi nilai di file Excel tersebut secara offline.
  3. Guru mengunggah kembali file Excel tersebut ke sistem.
  4. Sistem mengekstrak metadata tersembunyi (`semester_id`, `kelas_real_id`, `mapel_id`) dan memverifikasi kesesuaiannya dengan konteks aktif.
  5. Jika metadata tidak cocok, sistem membatalkan proses dan menampilkan pesan error.
  6. Jika cocok, sistem memvalidasi isi sel nilai, menampilkan daftar konflik jika ada, dan menyimpannya setelah mendapat konfirmasi Guru.
* **Kondisi Akhir (Post-condition)**: Nilai siswa tersimpan di database dan siap direkap.

---

## UC-03: Cetak Rapor PDF
* **Aktor**: Wali Kelas (Guru dengan tugas tambahan Wali Kelas)
* **Deskripsi**: Memeriksa kelengkapan nilai siswa sekelas, menginput kehadiran & catatan, kemudian mengekspor rapor dalam bentuk PDF.
* **Kondisi Awal (Pre-condition)**: Wali Kelas telah masuk ke sistem dan seluruh guru mata pelajaran telah menginput nilai lengkap untuk kelasnya.
* **Alur Utama**:
  1. Wali Kelas masuk ke modul **Wali Kelas** dan melihat status kelengkapan kelasnya.
  2. Wali Kelas merekap jumlah kehadiran (Sakit, Izin, Alpha) untuk seluruh siswa sekelas.
  3. Wali Kelas menulis catatan perkembangan siswa pada kolom **Catatan Wali Kelas**.
  4. Wali Kelas membuka menu **Ekspor Rapor**.
  5. Sistem menjalankan pemeriksaan prasyarat: nilai mapel lengkap, kehadiran lengkap, catatan wali kelas terisi, dan kepala sekolah aktif tersedia.
  6. Jika lolos validasi, Wali Kelas memilih format ekspor (Per Siswa atau Per Kelas) dan urutan siswa (Urutan Dapo atau Urutan Real).
  7. Wali Kelas mengunduh dokumen rapor PDF yang sudah dibubuhi tanda tangan kepala sekolah (jika mode digital aktif).
* **Alur Alternatif (Gagal Validasi)**:
  * 5a. Jika data belum lengkap, sistem menampilkan daftar item yang masih kosong beserta tautan langsung untuk memperbaikinya. Tombol unduh dinonaktifkan kecuali di-override oleh Admin.
* **Kondisi Akhir (Post-condition)**: Dokumen rapor PDF terunduh dan siap dicetak/dibagikan.

---

## UC-04: Persiapan Asesmen & Pembagian Ruang
* **Aktor**: Urusan / Admin
* **Deskripsi**: Membuat jadwal ujian, mengatur ketersediaan pengawas, membagi siswa ke ruang ujian, dan mencetak berkas-berkas asesmen.
* **Kondisi Awal (Pre-condition)**: Urusan telah masuk ke sistem dan data siswa di semester aktif telah dikonfigurasi.
* **Alur Utama**:
  1. Urusan membuat rencana **Asesmen** baru dan menetapkan rentang tanggal ujian.
  2. Pada Tab **Jadwal Ujian**, Urusan menyusun sesi ujian dan mata pelajaran (maksimal 12 slot).
  3. Pada Tab **Jadwal Mengawasi**, Urusan menandai matrix ketersediaan guru yang siap menjaga ujian.
  4. Urusan membuka modul **Pembagian Ruang**:
     * Urusan menentukan jumlah ruang dan kapasitas (Setengah kelas / 20 orang / Manual).
     * Urusan memilih rentang ruang yang digunakan per jenjang.
     * Urusan mengeklik **Generate**.
  5. Sistem membagi siswa ke ruang ujian secara otomatis dan memunculkan peringatan jika ada konflik (misal: > 2 jenjang dalam 1 ruang, atau siswa unassigned).
  6. Urusan men-generate nomor peserta asesmen.
  7. Urusan membuka Tab **Pembagian Pengawas**, memilih jumlah pengawas per ruang dan algoritma pembagian (Urut/Acak), lalu mengeklik **Generate**.
  8. Urusan mengunduh berkas-berkas pendukung asesmen (Tempel Kaca, Data Map, Denah Peserta, dll.).
* **Kondisi Akhir (Post-condition)**: Pembagian ruang siswa dan pengawas tersimpan di database, dokumen cetak terunduh.

---

## UC-05: Backup & Restore
* **Aktor**: Admin / Superadmin
* **Deskripsi**: Membuat cadangan data sistem secara berkala dan memulihkan data jika terjadi kerusakan atau kesalahan operasional.
* **Kondisi Awal (Pre-condition)**: Admin telah masuk ke sistem.
* **Alur Utama (Backup)**:
  1. Admin membuka halaman **Backup & Restore**.
  2. Admin memasukkan keterangan singkat mengenai backup (misal: "Sebelum sinkronisasi mengajar").
  3. Admin mengeklik **Buat Backup**.
  4. Sistem membekukan sesi tulis sementara, membuat file SQL dump database, menyimpannya ke Supabase Storage Private Bucket `backup`, mencatat log di `backup_log`, dan mengaktifkan kembali sesi tulis.
* **Alur Utama (Restore)**:
  1. Admin memilih berkas cadangan dari daftar log backup yang tersedia.
  2. Admin mengeklik **Restore**.
  3. Sistem menampilkan peringatan keras bahwa data saat ini akan ditimpa.
  4. Admin memasukkan password konfirmasi/konfirmasi dua langkah.
  5. Sistem melakukan pemulihan skema dan data database, memproses status secara real-time, dan mencatat aktivitas tersebut di `audit_log`.
* **Kondisi Akhir (Post-condition)**: Data database berhasil dicadangkan atau dikembalikan ke kondisi cadangan.
