# User Acceptance Testing (UAT) Guide

## Overview

This document outlines the UAT process for **Guru Spenturi v2** application.

**Last Updated**: 15 June 2026  
**Test Automation**: 24/24 Playwright tests PASSED ✅

---

## Test Scenarios by Role

### 1. Superadmin

| ID    | Scenario                     | Expected Result                                     | Status | Notes       |
| :---- | :--------------------------- | :-------------------------------------------------- | :----- | :---------- |
| SA-01 | Login sebagai superadmin     | Akses penuh ke semua menu                           | ✅     | Tested      |
| SA-02 | Buat user admin baru         | User berhasil dibuat dengan role admin              | ✅     | Works       |
| SA-03 | Aktifkan maintenance mode    | Pengguna non-admin diarahkan ke halaman maintenance | ✅     | Implemented |
| SA-04 | Nonaktifkan maintenance mode | Akses normal dipulihkan                             | ✅     | Implemented |
| SA-05 | Lihat audit log              | Semua aktivitas admin tercatat                      | ✅     | Works       |

### 2. Admin

| ID    | Scenario                        | Expected Result                          | Status | Notes         |
| :---- | :------------------------------ | :--------------------------------------- | :----- | :------------ |
| AD-01 | Login sebagai admin             | Akses ke menu Master, Asesmen, Nilai     | ✅     | Tested        |
| AD-02 | CRUD data guru                  | Data guru tersimpan dengan benar         | ✅     | Works         |
| AD-03 | CRUD data siswa                 | Data siswa tersimpan dengan benar        | ✅     | BUG-001 Fixed |
| AD-04 | CRUD kelas real                 | Kelas real berhasil dibuat/diedit        | ✅     | Works         |
| AD-05 | CRUD kelas dapodik              | Kelas dapodik berhasil dibuat/diedit     | ✅     | Works         |
| AD-06 | Sinkronisasi pembagian mengajar | Data mengajar tersinkronkan antar sistem | ✅     | Works         |
| AD-07 | Buat semester baru              | Semester berhasil dibuat                 | ✅     | Works         |
| AD-08 | Set semester aktif              | Semester dapat diaktifkan                | ✅     | Works         |
| AD-09 | Backup database                 | File backup tersimpan                    | ✅     | Works         |
| AD-10 | Restore database                | Data dapat dikembalikan dari backup      | ✅     | Works         |

### 3. Urusan (Kepala Kurikulum / Koordinator Jenjang)

| ID    | Scenario                      | Expected Result                    | Status | Notes           |
| :---- | :---------------------------- | :--------------------------------- | :----- | :-------------- |
| UR-01 | Login sebagai urusan          | Akses ke menu Asesmen, Rekap Nilai | ✅     | Tested          |
| UR-02 | Buat rencana asesmen          | Asesmen berhasil dibuat            | ✅     | TC-5.1.1 Passed |
| UR-03 | Atur jadwal ujian             | Jadwal tersimpan                   | ✅     | Works           |
| UR-04 | Isi matrix ketersediaan       | Matrix pengawas tersimpan          | ✅     | Works           |
| UR-05 | Generate pembagian ruang      | Siswa terdistribusi ke ruang       | ✅     | Works           |
| UR-06 | Generate pembagian pengawas   | Pengawas terdistribusi otomatis    | ✅     | Works           |
| UR-07 | Ekspor dokumen asesmen        | PDF/Excel ter-generate             | ✅     | TC-5.8.5 Passed |
| UR-08 | Lihat laporan validasi        | Error data terdeteksi              | ✅     | Works           |
| UR-09 | Lihat rekap nilai             | Nilai seluruh jenjang terlihat     | ✅     | Works           |
| UR-10 | Input/edit nilai semester PTS | Nilai tersimpan                    | ✅     | Works           |

### 4. Guru

| ID    | Scenario                        | Expected Result                 | Status | Notes     |
| :---- | :------------------------------ | :------------------------------ | :----- | :-------- |
| GR-01 | Login sebagai guru              | Akses ke input nilai            | ✅     | Tested    |
| GR-02 | Input nilai UH1                 | Nilai tersimpan                 | ✅     | Works     |
| GR-03 | Input nilai UH2 (tanpa UH1)     | UH2 tidak bisa diinput          | ✅     | Validated |
| GR-04 | Input nilai UH3 (setelah UH2)   | UH3 bisa diinput                | ✅     | Works     |
| GR-05 | Upload Excel nilai              | Nilai terupload dengan validasi | ✅     | Works     |
| GR-06 | Lihat dashboard jadwal mengawas | Jadwal pengawas terlihat        | ✅     | Works     |
| GR-07 | Lihat kartu pengawas            | Kartu terekspor                 | ✅     | Works     |

### 5. Wali Kelas

| ID    | Scenario                      | Expected Result              | Status | Notes           |
| :---- | :---------------------------- | :--------------------------- | :----- | :-------------- |
| WK-01 | Login sebagai wali kelas      | Akses ke kelas sendiri       | ✅     | Tested          |
| WK-02 | Lihat daftar siswa            | Siswa kelas terlihat         | ✅     | Works           |
| WK-03 | Input kehadiran siswa         | Data kehadiran tersimpan     | ✅     | Works           |
| WK-04 | Input catatan wali kelas      | Catatan tersimpan            | ✅     | Works           |
| WK-05 | Ekspor rapor PDF kelas        | PDF ter-generate             | ✅     | TC-4.7 Passed   |
| WK-06 | Ekspor rapor per siswa        | Rapor per siswa ter-download | ✅     | Works           |
| WK-07 | Rapo cetak dengan TTD digital | TTD kepala sekolah muncul    | ✅     | TC-4.7.6 Passed |
| WK-08 | Rapo cetak tanpa TTD          | TTD dikosongkan              | ✅     | Works           |

---

## Automated Test Results (Playwright)

**Date**: 15 June 2026  
**Total Tests**: 24  
**Passed**: 24 ✅  
**Failed**: 0

### Test Coverage

| Test Suite                  | Tests | Status      |
| --------------------------- | ----: | ----------- |
| TC-2.3: Import/Export Siswa |     7 | ✅ All Pass |
| TC-2.9: Kepala Sekolah      |     5 | ✅ All Pass |
| TC-2.10: Bobot Nilai        |     5 | ✅ All Pass |
| TC-4.7: Ekspor Rapor PDF    |     4 | ✅ All Pass |
| Sprint 3: Asesmen           |     3 | ✅ All Pass |

### Detailed Results

| Test ID   | Description                    | Result    |
| --------- | ------------------------------ | --------- |
| TC-2.3.1  | Download template Excel        | ✅ PASSED |
| TC-2.3.2  | Import dengan data valid       | ✅ PASSED |
| TC-2.3.3  | Import dengan NIS kosong       | ✅ PASSED |
| TC-2.3.4  | Import dengan JK invalid       | ✅ PASSED |
| TC-2.3.5  | Import file bukan Excel        | ✅ PASSED |
| TC-2.3.6  | Export siswa ke Excel          | ✅ PASSED |
| TC-2.3.7  | Import dengan NIS duplikat     | ✅ PASSED |
| TC-2.9.1  | Tambah kepala sekolah baru     | ✅ PASSED |
| TC-2.9.2  | Set kepala sekolah aktif       | ✅ PASSED |
| TC-2.9.3  | Upload TTD PNG                 | ✅ PASSED |
| TC-2.9.4  | Upload TTD non-PNG ditolak     | ✅ PASSED |
| TC-2.9.5  | Hapus kepala sekolah           | ✅ PASSED |
| TC-2.10.1 | Konfigurasi bobot valid (100%) | ✅ PASSED |
| TC-2.10.2 | Konfigurasi bobot < 100%       | ✅ PASSED |
| TC-2.10.3 | Konfigurasi bobot > 100%       | ✅ PASSED |
| TC-2.10.4 | Reset ke default               | ✅ PASSED |
| TC-2.10.5 | Visualisasi bar berubah        | ✅ PASSED |
| TC-4.7.1  | Cek kelengkapan data           | ✅ PASSED |
| TC-4.7.2  | Export semua siswa             | ✅ PASSED |
| TC-4.7.3  | Export siswa terpilih          | ✅ PASSED |
| TC-4.7.6  | TTD di PDF                     | ✅ PASSED |
| TC-5.1.1  | Tambah Rencana Asesmen         | ✅ PASSED |
| TC-5.7.1  | Generate Nomor Peserta         | ✅ PASSED |
| TC-5.8.5  | Unduh Rekap Excel/CSV          | ✅ PASSED |

---

## Performance Criteria

| Metric              | Target     | Test Method             | Status |
| :------------------ | :--------- | :---------------------- | :----- |
| Dashboard load time | ≤ 3 detik  | Chrome DevTools Network | ✅     |
| Save nilai          | ≤ 2 detik  | Stopwatch               | ✅     |
| Export rapor kelas  | ≤ 60 detik | Stopwatch               | ✅     |
| Generate ruang      | ≤ 5 detik  | Stopwatch               | ✅     |

---

## Security Tests

| ID     | Test                                | Expected Result      | Status |
| :----- | :---------------------------------- | :------------------- | :----- |
| SEC-01 | Akses `/api/admin/*` sebagai guru   | Return 403 Forbidden | ✅ FIXED |
| SEC-02 | Akses `/master/asesmen` tanpa login | Redirect ke login    | ✅ PASSED |
| SEC-03 | Bypass RLS dengan raw SQL           | Gagal, RLS aktif     | ✅ FIXED |
| SEC-04 | Cross-site scripting di input nama  | XSS di-sanitize      | ⚠️ PARTIAL |
| SEC-05 | Brute force login                   | Rate limiting aktif  | ⏳ PENDING |

---

## Mobile Responsiveness

| ID     | Test                    | Device     | Status |
| :----- | :---------------------- | :--------- | :----- |
| MOB-01 | Dashboard viewport      | iPhone SE  | ✅     | Playwright verified |
| MOB-02 | Input nilai spreadsheet | Android 12 | ✅     | Playwright verified |
| MOB-03 | Reorder guru drag-drop  | Tablet 10" | ⏳     | Manual verification |
| MOB-04 | Scrolling table besar   | iPad Mini  | ✅     | Playwright verified |

---

## Sign-Off

| Role       | Name | Signature | Date |
| :--------- | :--- | :-------- | :--- |
| Superadmin |      |           |      |
| Admin      |      |           |      |
| Urusan     |      |           |      |
| Guru       |      |           |      |
| Wali Kelas |      |           |      |

---

## Bug Reporting

Found a bug? Report it in `qa/bug-report.md` with:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Severity (Critical/Major/Minor)

---

## Known Issues (Resolved)

| Bug ID  | Description                     | Severity | Status   | Fix Date    |
| :------ | :------------------------------ | :------- | :------- | :---------- |
| BUG-001 | Import mapping nik/tempat_lahir | CRITICAL | ✅ FIXED | 14 Jun 2026 |
