# Test Cases: Fitur Sprint 1 & 2

* **Tanggal**: 14 Juni 2026
* **Tester**: QA Reviewer
* **Scope**: Sprint 1 (Data Master) & Sprint 2 (Penilaian & Rapor)

---

## 🎯 FASE 2 — Data Master

### 2.3 Siswa: Import/Export Excel

| ID | Skenario | Langkah | Input | Ekspektasi | Status |
|:---|:---------|:--------|:------|:-----------|:-------|
| **TC-2.3.1** | Download template Excel | 1. Buka /master/siswa/import<br>2. Klik "Download Template" | - | File `Template_Import_Siswa.xlsx` ter-download | ⏳ |
| **TC-2.3.2** | Import dengan data valid | 1. Download template<br>2. Isi data valid (NIS, Nama, JK, NIK, Tempat Lahir)<br>3. Upload file<br>4. Klik Import | NIS: `12345`<br>Nama: `Test Siswa`<br>NIK: `33010xxx`<br>Tempat Lahir: `Jakarta` | Data tersimpan dengan field yang benar, toast success | ⏳ |
| **TC-2.3.3** | Import dengan NIS duplikat | 1. Import siswa dengan NIS existing<br>2. Upload & Import | NIS: `12345` (existing) | Sistem update data, tidak error | ⏳ |
| **TC-2.3.4** | Import dengan NIS kosong | 1. Kosongkan kolom NIS<br>2. Upload & Import | NIS: `` (kosong) | Error validasi: "NIS wajib diisi" | ⏳ |
| **TC-2.3.5** | Import dengan JK invalid | 1. Isi JK dengan "X"<br>2. Upload & Import | JK: `X` | Warning: "Jenis Kelamin harus L atau P" | ⏳ |
| **TC-2.3.6** | Import file bukan Excel | 1. Upload file .txt | File: `data.txt` | Error: "File harus format Excel" | ⏳ |
| **TC-2.3.7** | Export siswa ke Excel | 1. Klik "Export Excel" | - | File `Data_Siswa_YYYY-MM-DD.xlsx` ter-download | ⏳ |

### 2.9 Kepala Sekolah

| ID | Skenario | Langkah | Input | Ekspektasi | Status |
|:---|:---------|:--------|:------|:-----------|:-------|
| **TC-2.9.1** | Tambah kepala sekolah baru | 1. Buka /master/kepala-sekolah<br>2. Klik "Tambah"<br>3. Isi form<br>4. Klik Simpan | Nama: `Dr. Test`<br>Periode: `2024` | Data tersimpan, toast success | ⏳ |
| **TC-2.9.2** | Set kepala sekolah aktif | 1. Tambah kepsek baru<br>2. Centang "Jadikan aktif"<br>3. Simpan | is_aktif: `true` | Kepsek lain jadi non-aktif | ⏳ |
| **TC-2.9.3** | Upload TTD PNG | 1. Tambah kepsek<br>2. Upload file PNG<br>3. Simpan | File: `ttd.png` | TTD preview terlihat | ⏳ |
| **TC-2.9.4** | Upload TTD non-PNG | 1. Upload file JPG | File: `ttd.jpg` | Error: "File harus format PNG" | ⏳ |
| **TC-2.9.5** | Hapus kepala sekolah | 1. Klik icon trash<br>2. Konfirmasi | - | Data terhapus | ⏳ |

### 2.10 Bobot Nilai

| ID | Skenario | Langkah | Input | Ekspektasi | Status |
|:---|:---------|:--------|:------|:-----------|:-------|
| **TC-2.10.1** | Konfigurasi bobot valid | 1. Pilih mapel<br>2. Atur UH: 10% x 5<br>3. PTS: 20%, Semester: 30%<br>4. Klik Simpan | Total: `100%` | Toast success | ⏳ |
| **TC-2.10.2** | Konfigurasi bobot < 100% | 1. Atur UH: 5% x 5<br>2. PTS: 10%, Semester: 10% | Total: `55%` | Warning: "Total harus 100%" | ⏳ |
| **TC-2.10.3** | Konfigurasi bobot > 100% | 1. Atur UH: 15% x 5<br>2. PTS: 30%, Semester: 30% | Total: `135%` | Warning: "Total harus 100%" | ⏳ |
| **TC-2.10.4** | Reset ke default | 1. Ubah nilai<br>2. Klik "Reset ke Default" | - | Nilai kembali ke 10/10/10/10/10/20/30 | ⏳ |
| **TC-2.10.5** | Visualisasi bar | 1. Ubah nilai bobot | - | Progress bar berubah sesuai proporsi | ⏳ |

---

## 📊 FASE 4 — Penilaian & Rapor

### 4.7 Ekspor Rapor PDF

| ID | Skenario | Langkah | Input | Ekspektasi | Status |
|:---|:---------|:--------|:------|:-----------|:-------|
| **TC-4.7.1** | Export tanpa kepsek aktif | 1. Pastikan tidak ada kepsek aktif<br>2. Buka /rapor/ekspor<br>3. Pilih kelas<br>4. Klik Export | - | Warning: "Data kepala sekolah aktif belum ada" | ⏳ |
| **TC-4.7.2** | Export semua siswa | 1. Pilih kelas<br>2. Pilih "Semua Siswa"<br>3. Klik Export | mode: `all` | PDF ter-download, 1 hal per siswa | ⏳ |
| **TC-4.7.3** | Export siswa terpilih | 1. Pilih mode "Pilih Sendiri"<br>2. Centang 2 siswa<br>3. Export | mode: `selected` | PDF hanya 2 siswa | ⏳ |
| **TC-4.7.4** | Cek kelengkapan data | 1. Pilih kelas<br>2. Lihat tabel kelengkapan | - | Status hijau untuk lengkap, kuning untuk belum | ⏳ |
| **TC-4.7.5** | Export dengan data belum lengkap | 1. Ada siswa belum ada nilai<br>2. Export | - | Konfirmasi: "X siswa belum lengkap. Lanjutkan?" | ⏳ |
| **TC-4.7.6** | TTD di PDF | 1. Export dengan kepsek aktif + TTD | - | TTD visible di footer PDF | ⏳ |

---

## 📝 FASE 5 — Asesmen

### 5.1 CRUD Rencana Asesmen & Setup
| ID | Skenario | Langkah | Input | Ekspektasi | Status |
|:---|:---------|:--------|:------|:-----------|:-------|
| **TC-5.1.1** | Tambah Rencana Asesmen baru | 1. Buka /master/asesmen<br>2. Klik "Tambah"<br>3. Isi form<br>4. Klik Simpan | Semester: `2023/2024 Genap`<br>Jenis: `ASAS`<br>Tanggal: `2026-06-15 s.d. 2026-06-20`<br>Kode NUS: `130`<br>Acuan Kelas: `Real` | Data tersimpan, toast success, muncul di list asesmen | ⏳ |
| **TC-5.1.2** | Edit Rencana Asesmen | 1. Klik Edit pada list asesmen<br>2. Ubah data<br>3. Klik Simpan | Kode NUS: `140` | Data terupdate di database | ⏳ |
| **TC-5.1.3** | Hapus Rencana Asesmen | 1. Klik Hapus pada list asesmen<br>2. Konfirmasi dialog | - | Data dihapus dari database & list | ⏳ |

### 5.2 & 5.3 Jadwal Ujian & Matrix Pengawas
| ID | Skenario | Langkah | Input | Ekspektasi | Status |
|:---|:---------|:--------|:------|:-----------|:-------|
| **TC-5.2.1** | Susun Jadwal Ujian | 1. Buka /master/asesmen/[id]<br>2. Klik Tab Jadwal Ujian<br>3. Tambahkan baris jadwal (hari, jam mulai/selesai, mapel)<br>4. Klik Simpan | Hari: `Senin`<br>Mapel: `Matematika` | Jadwal tersimpan di DB | ⏳ |
| **TC-5.2.2** | Ekspor Jadwal ke PDF | 1. Di Tab Jadwal, klik "Cetak Jadwal Ujian" | - | File PDF jadwal ter-download | ⏳ |
| **TC-5.3.1** | Atur Ketersediaan Pengawas | 1. Klik Tab Matrix Pengawas<br>2. Centang/uncentang slot waktu guru | Guru A: `Senin Sesi 1` | Perubahan otomatis tersimpan/update ke DB | ⏳ |
| **TC-5.3.2** | Bulk Ketersediaan Pengawas | 1. Klik "Pilih Semua" pada satu guru atau satu sesi | - | Seluruh checkbox di baris/kolom tersebut tercentang | ⏳ |

### 5.4 Pembagian Ruang Siswa
| ID | Skenario | Langkah | Input | Ekspektasi | Status |
|:---|:---------|:--------|:------|:-----------|:-------|
| **TC-5.4.1** | Auto-generate Pembagian Ruang | 1. Buka Tab Pembagian Ruang<br>2. Set kapasitas default (20)<br>3. Klik "Generate Otomatis" | Kapasitas: `20`<br>Urutan: `A-Z` | Siswa dibagi rata ke ruang-ruang ujian, tidak ada unassigned jika muat | ⏳ |
| **TC-5.4.2** | Edit Manual Pembagian Ruang | 1. Pilih siswa di tabel<br>2. Ubah nomor ruang atau nomor urut duduk secara manual | Ruang: `2`, Urut: `5` | Tersimpan otomatis / via save button | ⏳ |
| **TC-5.4.3** | Deteksi Warning Pembagian Ruang | 1. Atur satu ruang berisi siswa dari 3 jenjang berbeda | Jenjang: `7, 8, 9` di Ruang 1 | Muncul badge warning "Lebih dari 2 Jenjang" | ⏳ |

### 5.5 & 5.6 Pembagian & Kartu Pengawas
| ID | Skenario | Langkah | Input | Ekspektasi | Status |
|:---|:---------|:--------|:------|:-----------|:-------|
| **TC-5.5.1** | Auto-Generate Pengawas (Urut) | 1. Buka Tab Form Pengawas<br>2. Klik "Auto Alokasi"<br>3. Pilih opsi "Urut (Hindari Beruntun)"<br>4. Klik Simpan | Mode: `urut` | Pengawas dialokasikan, tidak ada guru mengawas berturut-turut jika guru cukup | ⏳ |
| **TC-5.5.2** | Auto-Generate Pengawas (Acak) | 1. Klik "Auto Alokasi"<br>2. Pilih "Acak (Distribusi Rata)" | Mode: `acak` | Beban mengawas terdistribusi merata di antara guru yang bersedia | ⏳ |
| **TC-5.5.3** | Deteksi Konflik Pengawas | 1. Jadwalkan Guru A di Ruang 1 dan Ruang 2 pada sesi yang sama | Guru A di Sesi 1 R1 & R2 | Baris/cell berwarna merah (alert konflik jadwal ganda) | ⏳ |
| **TC-5.6.1** | Cetak Kartu Pengawas | 1. Buka Tab Kartu Pengawas<br>2. Klik "Unduh Semua Kartu (PDF)" | - | File PDF kartu pengawas ter-download | ⏳ |
| **TC-5.6.2** | Publish Kartu Pengawas | 1. Klik toggle "Publish Kartu Pengawas" | Status: `Terpublikasi` | Kartu pengawas muncul di dashboard masing-masing guru | ⏳ |

### 5.7 & 5.8 Nomor Peserta & Ekspor Dokumen
| ID | Skenario | Langkah | Input | Ekspektasi | Status |
|:---|:---------|:--------|:------|:-----------|:-------|
| **TC-5.7.1** | Generate Nomor Peserta | 1. Buka Tab Dokumen & Nomor Peserta<br>2. Klik "Generate Nomor Peserta" | Format: `[Jenjang][KelasOrder]-[NUS]-[Absen]-[JK]` | Siswa mendapat nomor peserta unik, misal `71-130-001-1`, tersimpan di DB | ⏳ |
| **TC-5.8.1** | Unduh PDF Tempel Kaca | 1. Klik "Unduh PDF Tempel Kaca" | - | PDF berisi daftar peserta per ruang ter-download | ⏳ |
| **TC-5.8.2** | Unduh PDF Denah Ruang | 1. Klik "Unduh PDF Denah Ruang" | - | PDF berisi denah layout tempat duduk per ruang ter-download | ⏳ |
| **TC-5.8.3** | Unduh PDF Label Meja | 1. Klik "Unduh PDF Label Meja" | - | PDF sticker label meja ter-download | ⏳ |
| **TC-5.8.4** | Unduh PDF Kartu Peserta | 1. Klik "Unduh PDF Kartu Ujian" | - | PDF berisi kartu ujian lengkap dengan jadwal ter-download | ⏳ |
| **TC-5.8.5** | Unduh Excel/CSV Rekap Peserta | 1. Klik "Unduh Excel" | - | File CSV rekap nomor peserta ter-download dengan format UTF-8 BOM | ⏳ |

---

## 📋 Summary

| Category | Total TC | Passed | Failed | Pending |
|:---------|:--------:|:------:|:------:|:-------:|
| Siswa Import/Export | 7 | 0 | 0 | 7 |
| Kepala Sekolah | 5 | 0 | 0 | 5 |
| Bobot Nilai | 5 | 0 | 0 | 5 |
| Ekspor Rapor | 6 | 0 | 0 | 6 |
| Asesmen CRUD & Setup | 3 | 0 | 0 | 3 |
| Jadwal & Matrix Pengawas | 4 | 0 | 0 | 4 |
| Pembagian Ruang Siswa | 3 | 0 | 0 | 3 |
| Pembagian & Kartu Pengawas | 5 | 0 | 0 | 5 |
| Nomor Peserta & Dokumen | 6 | 0 | 0 | 6 |
| **TOTAL** | **44** | **0** | **0** | **44** |

---

## ⚠️ Pre-Condition Testing

Sebelum testing, pastikan:
1. ✅ Database Supabase sudah di-setup dengan schema terbaru
2. ✅ User admin sudah dibuat
3. ✅ Semester aktif sudah diset
4. ✅ Data master (guru, siswa, mapel) sudah ada

---

## 🔧 Tools Needed

- [ ] Browser: Chrome/Firefox
- [ ] Postman (untuk API testing)
- [ ] Excel Viewer
- [ ] PDF Reader
