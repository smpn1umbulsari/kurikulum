# Bug Report: Data Import Salah Mapping

- **Tanggal**: 14 Juni 2026
- **Reporter**: QA Reviewer
- **Status**: ✅ FIXED

---

## 🐛 BUG-001: Data Import Salah Mapping Field

### 1. Ringkasan Deskripsi

Import siswa Excel salah memetakan field `nik` dan `tempat_lahir`. Field `nik` menggunakan `nisn` dan `tempat_lahir` menggunakan `nama`.

### 2. Informasi Lingkungan

- **File**: `src/app/(protected)/master/siswa/import/page.tsx`
- **Line**: 246-260 (function `handleImport`)
- **Severity**: 🔴 **CRITICAL** (Data Corruption)

### 3. Kode Bermasalah

```typescript
// Line 246-260
const siswaData = {
  nis: siswa.nis,
  nisn: siswa.nisn || null,
  nama: siswa.nama,
  nik: siswa.nisn || null, // ❌ BUG: seharusnya siswa.nik
  jenis_kelamin: siswa.jenis_kelamin,
  tempat_lahir: siswa.nama || null, // ❌ BUG: seharusnya siswa.tempat_lahir
  tanggal_lahir: null,
  agama: "Islam",
  alamat: "",
  nama_ortu: "",
  status: "aktif",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
```

### 4. Langkah untuk Mereproduksi

1. Buka halaman `/master/siswa/import`
2. Download template Excel
3. Isi data dengan NIK valid dan Tempat Lahir
4. Import file
5. Buka `/master/siswa` dan cek data siswa yang baru diimport
6. Lihat kolom NIK dan Tempat Lahir

### 5. Hasil Aktual

- Kolom NIK berisi data NISN (salah)
- Kolom Tempat Lahir berisi Nama (salah)

### 6. Hasil yang Diharapkan

- Kolom NIK berisi NIK dari file Excel
- Kolom Tempat Lahir berisi Tempat Lahir dari file Excel

### 7. Severity

- [x] 🔴 **CRITICAL** - Data corruption, mempengaruhi integritas data

### 8. Suggested Fix

```typescript
const siswaData = {
  nis: siswa.nis,
  nisn: siswa.nisn || null,
  nama: siswa.nama,
  nik: siswa.nik || null, // ✅ Fixed: gunakan siswa.nik
  jenis_kelamin: siswa.jenis_kelamin,
  tempat_lahir: siswa.tempat_lahir || null, // ✅ Fixed: gunakan siswa.tempat_lahir
  tanggal_lahir: null,
  agama: "Islam",
  alamat: "",
  nama_ortu: "",
  status: "aktif",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
```

### 9. Regression Risk

- **LOW** - Hanya affect import, tidak affect CRUD manual atau export

---

## 📊 Bug Summary

| ID      | Bug                              | Severity    | Status   | Fix Date    |
| :------ | :------------------------------- | :---------- | :------- | :---------- |
| BUG-001 | Salah mapping nik & tempat_lahir | 🔴 CRITICAL | ✅ FIXED | 14 Jun 2026 |

---

## ✅ Verified Working Features

| Feature                      | Status | Notes           |
| :--------------------------- | :----- | :-------------- |
| Download Template            | ✅     | Works correctly |
| File validation (.xlsx/.xls) | ✅     | Works correctly |
| Preview data                 | ✅     | Works correctly |
| NIS duplicate detection      | ✅     | Works correctly |
| Export to Excel              | ✅     | Works correctly |

---

## 📝 Notes

Bug ini affect kualitas data yang diimport. Semua siswa yang diimport dari Excel akan memiliki:

- NIK = NISN (data salah)
- Tempat Lahir = Nama (data salah)

**Action Required**: Developer perlu fix sebelum fitur import bisa digunakan di production.

---

## 📊 Playwright Test Run - 2026-06-15

**Result**: All 24 tests failed due to dev server not running.

| Metric      | Value                                                        |
| :---------- | :----------------------------------------------------------- |
| Total Tests | 24                                                           |
| Passed      | 0                                                            |
| Failed      | 24                                                           |
| Reason      | `net::ERR_CONNECTION_REFUSED at http://localhost:3000/login` |

See `qa/TEST-RESULTS.md` for detailed results and run instructions.
