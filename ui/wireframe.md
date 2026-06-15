# UI Wireframes: Guru Spenturi v2

Dokumen ini mendokumentasikan tata letak antarmuka pengguna (UI layouts) untuk modul-modul penting aplikasi dalam bentuk diagram teks ASCII.

---

## 1. Halaman Login (Login Page)
Antarmuka terpusat (centered panel) dengan visual minimalis dan berfokus pada aksesibilitas.

```text
+------------------------------------------------------------+
|                                                            |
|                 +------------------------+                 |
|                 |      LOGO SEKOLAH      |                 |
|                 |   SPENTURI REBUILD v2  |                 |
|                 +------------------------+                 |
|                 | Username / Email       |                 |
|                 | [ admin@spenturi.sch ] |                 |
|                 | Password               |                 |
|                 | [ **************** ]   |                 |
|                 |                        |                 |
|                 | [    MASUK SISTEM   ]  |                 |
|                 +------------------------+                 |
|                 | Mode Pemeliharaan: OFF |                 |
|                 +------------------------+                 |
|                                                            |
+------------------------------------------------------------+
```

---

## 2. Halaman Dashboard Utama (Admin / Urusan / Guru)
Menggunakan sidebar navigation di sebelah kiri dan content area dinamis dengan grid.

```text
+------------------------------------------------------------------------------------+
| [Logo] GURU SPENTURI v2             Semester: Ganjil 2026/2027  | User: Guru Mapel |
+------------------------------------------------------------------------------------+
| Navigasi Utama      | Konten Utama: Dashboard Guru                                 |
|                     |                                                              |
| - Dashboard         | +--- STATS CARD ---+  +--- STATS CARD ---+  +--- STATS ---+  |
| - Data Master       | | Total Kelas Real |  | Progres Input    |  | Rapor Siap  |  |
| - Pembagian Mengajar| |    4 Kelas       |  |     87%          |  |   0 Siswa   |  |
| - [Input Nilai]     | +------------------+  +------------------+  +-------------+  |
| - Rekap Nilai       |                                                              |
| - Asesmen           | H3: Daftar Tugas Mengajar                                    |
| - Pengaturan        | +----------------------------------------------------------+ |
|                     | | Kelas Real | Mapel | Progres Input  | Aksi               | |
|                     | +------------+-------+----------------+--------------------+ |
|                     | | 7A         | IPA   | 24/32 Siswa    | [ Input Nilai ]    | |
|                     | | 7B         | IPA   | 32/32 Siswa    | [ Input Nilai ]    | |
|                     | | 8C         | Prak. | 0/30 Siswa     | [ Input Nilai ]    | |
|                     | +----------------------------------------------------------+ |
+------------------------------------------------------------------------------------+
```

---

## 3. Kelola Kelas Real — Antarmuka Dua Panel
Digunakan oleh Admin atau Urusan untuk mendistribusikan siswa titipan (kelas abjad terakhir) ke kelas real tujuan.

```text
+------------------------------------------------------------------------------------+
| H1: Kelola Kelas Real (Penitipan Siswa)                  [ Filter Jenjang: 7 [v] ] |
+------------------------------------------------------------------------------------+
|  PANEL KIRI (Kelas Tujuan)              |  PANEL KANAN (Siswa Titipan Kelas 7F)    |
|  [ Pilih Kelas Real Tujuan: 7A [v] ]    |  Daftar siswa yang belum dititipkan:     |
|                                         |                                          |
|  Daftar Siswa Real di Kelas 7A:         |  * [Drag] 7. Fahri Ramadhan (L)          |
|  1. Ahmad Dani (L)                      |  * [Drag] 8. Giska Olivia (P)            |
|  2. Budi Susanto (L)                    |  * [Drag] 9. Hendra Wijaya (L)           |
|  3. Citra Lestari (P)                   |  * [Drag] 10. Indah Permata (P)          |
|  <---- [Drop Siswa ke Sini]             |                                          |
|                                         |                                          |
|  Total Siswa Real 7A: 32 Siswa          |  Sisa Siswa Belum Dititipkan: 4 Siswa    |
+------------------------------------------------------------------------------------+
| [ BATALKAN PREVIEW ]                                           [ SIMPAN PERUBAHAN ]|
+------------------------------------------------------------------------------------+
```

---

## 4. Mode Input Nilai: Spreadsheet Inline
Tabel input interaktif mirip Excel yang mendukung navigasi Tab/Enter serta penguncian nilai.

```text
+------------------------------------------------------------------------------------+
| H1: Input Nilai Mapel: IPA | Kelas: 7A (Real)             Mode Penilaian: SEMESTER |
| [ Unduh Template Excel ]                          [ Unggah Berkas Excel (.xlsx) ]  |
+------------------------------------------------------------------------------------+
| No | Nama Siswa | UH1  | UH2  | UH3  | UH4  | UH5  | PTS  | SEMESTER | RAPOR (Auto)|
|----+------------+------+------+------+------+------+------+----------+-------------|
| 1  | Adit       | [80] | [85] | [90] | [82] | [88] |  78  |   [82]   |    82.40    |
| 2  | Budi       |  75  |  78  |  80  | [74] | [ ]  |  70  |   [ ]    |    (Belum)  |
| 3  | Citra      |  90  |  92  |  95  |  90  |  92  |  88  |   90     |    91.20    |
| 4  | Dani       | [ ]  | [ ]  | [ ]  | [ ]  | [ ]  | [ ]  |   [ ]    |    (Belum)  |
+------------------------------------------------------------------------------------+
| Keterangan: [ ] = Kolom Aktif | 80 = Nilai Terkunci | [80] = Nilai Baru (Belum Save) |
+------------------------------------------------------------------------------------+
| [ BATAL PERUBAHAN ]                                            [ SIMPAN NILAI ]    |
+------------------------------------------------------------------------------------+
```

---

## 5. Persiapan Asesmen: Pembagian Ruang
Halaman konfigurasi penataan ruang ujian global dan per-jenjang.

```text
+------------------------------------------------------------------------------------+
| H1: Persiapan Asesmen Sumatif Akhir Semester (ASAS)                                |
| Tab: [ Jadwal Ujian ] | [ Ketersediaan Pengawas ] | [ RUANG SISWA ] | [ Pengawas ] |
+------------------------------------------------------------------------------------+
| > PENGATURAN GLOBAL:                                                               |
|   Jumlah Ruang: [ 12 ]   Mode Pembagian: (o) Setengah Kelas  ( ) 20/Ruang  ( ) Manual |
|   Acuan Data:     (o) Kelas Real      ( ) Kelas Dapodik              [ SET GLOBAL ]|
+------------------------------------------------------------------------------------+
| Urusan Ruang Per Jenjang:                                                          |
|                                                                                    |
| [+] JENJANG 7 (Aktif [x])                                                           |
|     Urutan: (o) A -> Z  ( ) Z -> A                                                 |
|     Alokasi Ruang: Bagian 1 [ Ruang 1 ] - [ Ruang 4 ]  Bagian 2 [ ] - [ ]          |
|     [ GENERATE RUANG KELAS 7 ]                                                     |
|                                                                                    |
| [+] JENJANG 8 (Aktif [x])                                                           |
|     Urutan: (o) A -> Z  ( ) Z -> A                                                 |
|     Alokasi Ruang: Bagian 1 [ Ruang 5 ] - [ Ruang 8 ]  Bagian 2 [ ] - [ ]          |
|     [ GENERATE RUANG KELAS 8 ]                                                     |
+------------------------------------------------------------------------------------+
| STATUS GENERATE RUANG:                                                             |
| * Ruang Terbagi: Ruang 1 - Ruang 8                                                 |
| * Konflik Terdeteksi: 0 Konflik                                                    |
| * Siswa Belum Punya Ruang: 0 Siswa (Sukses)                                        |
+------------------------------------------------------------------------------------+
```
