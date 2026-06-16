# QA Test Plan - Guru Spenturi v2

**Version:** 2.0  
**Date:** 16 Juni 2026  
**Testers:** QA Team  
**Status:** Ready for Testing

---

## Test Scope

### Features to Test

| Feature                               | Status  | Priority |
| ------------------------------------- | ------- | -------- |
| Sprint 1: Data Master CRUD            | ✅ DONE | P0       |
| Sprint 1: Drag & Drop Guru Reorder    | ✅ DONE | P1       |
| Sprint 1: Alumni Status Siswa         | ✅ DONE | P1       |
| Sprint 2: Pembagian Mengajar          | ✅ DONE | P0       |
| Sprint 2: Tugas Tambahan (Wali Kelas) | ✅ DONE | P0       |
| Sprint 2: Sinkronisasi Dapo ↔ Real    | ✅ DONE | P0       |
| Sprint 3: Dashboard RPC               | ✅ DONE | P1       |
| Sprint 4: Input Nilai (spreadsheet)   | ✅ DONE | P0       |
| Sprint 4: Rapor PDF Export            | ✅ DONE | P0       |
| Sprint 5: Asesmen Setup               | ✅ DONE | P1       |

---

## Test Cases

### 1. Authentication & Authorization

| TC ID    | Test Case                            | Steps                                                                    | Expected Result        | Status |
| -------- | ------------------------------------ | ------------------------------------------------------------------------ | ---------------------- | ------ |
| AUTH-001 | Login with valid credentials         | 1. Navigate to /login<br>2. Enter valid email/password<br>3. Click login | Redirect to /dashboard | ⏳     |
| AUTH-002 | Login with invalid credentials       | 1. Navigate to /login<br>2. Enter invalid credentials<br>3. Click login  | Show error message     | ⏳     |
| AUTH-003 | Access protected route without login | 1. Navigate directly to /dashboard                                       | Redirect to /login     | ⏳     |
| AUTH-004 | Role-based access (Admin)            | 1. Login as admin<br>2. Navigate to /master/guru                         | Can access full CRUD   | ⏳     |
| AUTH-005 | Role-based access (Guru)             | 1. Login as guru<br>2. Navigate to /master/guru                          | Read-only access       | ⏳     |

---

### 2. Data Master - Guru

| TC ID    | Test Case                     | Steps                                                                      | Expected Result                | Status |
| -------- | ----------------------------- | -------------------------------------------------------------------------- | ------------------------------ | ------ |
| GURU-001 | Create new guru               | 1. Go to /master/guru<br>2. Click Tambah Guru<br>3. Fill form<br>4. Submit | Guru created, redirect to list | ⏳     |
| GURU-002 | Edit guru                     | 1. Click edit on guru row<br>2. Modify fields<br>3. Save                   | Changes saved                  | ⏳     |
| GURU-003 | Delete guru                   | 1. Click delete on guru<br>2. Confirm                                      | Guru removed                   | ⏳     |
| GURU-004 | Drag & Drop reorder (Desktop) | 1. Go to /master/guru<br>2. Drag row to new position                       | Order saved                    | ⏳     |
| GURU-005 | Button reorder (Mobile)       | 1. View on mobile<br>2. Click ▲▼ buttons                                   | Order changes                  | ⏳     |
| GURU-006 | Auto-generate kode guru       | 1. Create guru without kode<br>2. Submit                                   | Kode auto-generated (GR-XXX)   | ⏳     |

---

### 3. Data Master - Siswa

| TC ID     | Test Case          | Steps                                                                                      | Expected Result          | Status |
| --------- | ------------------ | ------------------------------------------------------------------------------------------ | ------------------------ | ------ |
| SISWA-001 | Create new siswa   | 1. Go to /master/siswa<br>2. Click Tambah<br>3. Fill form<br>4. Submit                     | Siswa created            | ⏳     |
| SISWA-002 | Import Excel siswa | 1. Go to /master/siswa/import<br>2. Upload valid Excel<br>3. Validate preview<br>4. Submit | Multiple siswa created   | ⏳     |
| SISWA-003 | Convert to alumni  | 1. Select active siswa<br>2. Click Award button<br>3. Select tahun lulus<br>4. Confirm     | Status changed to alumni | ⏳     |
| SISWA-004 | Revert from alumni | 1. Select alumni siswa<br>2. Click RotateCcw button<br>3. Confirm                          | Status reverted to aktif | ⏳     |
| SISWA-005 | Filter alumni      | 1. Go to /master/siswa<br>2. Click Alumni filter                                           | Only alumni shown        | ⏳     |
| SISWA-006 | Export Excel siswa | 1. Go to /master/siswa<br>2. Click Export                                                  | Download Excel file      | ⏳     |

---

### 4. Distribusi Siswa

| TC ID    | Test Case                              | Steps                                                                                                    | Expected Result    | Status |
| -------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------ | ------ |
| DIST-001 | Distribusi ke Kelas Dapo               | 1. Go to /master/distribusi-siswa<br>2. Select siswa<br>3. Move to target class<br>4. Preview<br>5. Save | Distribution saved | ⏳     |
| DIST-002 | Distribusi titipan (same jenjang)      | 1. Go to /master/distribusi-siswa-titipan<br>2. Select siswa titipan<br>3. Move to same jenjang class    | Allowed            | ⏳     |
| DIST-003 | Distribusi titipan (different jenjang) | 1. Go to /master/distribusi-siswa-titipan<br>2. Try cross-jenjang                                        | Blocked with error | ⏳     |
| DIST-004 | Warning >2 jenjang in room             | 1. Add >2 different jenjang to room                                                                      | Show warning       | ⏳     |

---

### 5. Pembagian Mengajar

| TC ID    | Test Case                | Steps                                                                                  | Expected Result          | Status |
| -------- | ------------------------ | -------------------------------------------------------------------------------------- | ------------------------ | ------ |
| BAGI-001 | Create pembagian Dapo    | 1. Go to /master/pembagian-mengajar-dapo<br>2. Select guru, mapel, kelas<br>3. Submit  | Created successfully     | ⏳     |
| BAGI-002 | Create pembagian Real    | 1. Go to /master/pembagian-mengajar-real<br>2. Select guru, mapel, kelas<br>3. Submit  | Created successfully     | ⏳     |
| BAGI-003 | Sync Dapo to Real        | 1. Go to /master/sinkronisasi-mengajar<br>2. Click Sync<br>3. Resolve conflicts if any | Real populated from Dapo | ⏳     |
| BAGI-004 | Detect conflicts         | 1. Create conflicting assignments<br>2. Run sync                                       | Conflicts shown          | ⏳     |
| BAGI-005 | Force override conflicts | 1. Run sync with force<br>2. Confirm                                                   | Existing overwritten     | ⏳     |

---

### 6. Tugas Tambahan

| TC ID     | Test Case            | Steps                                                                                           | Expected Result      | Status |
| --------- | -------------------- | ----------------------------------------------------------------------------------------------- | -------------------- | ------ |
| TUGAS-001 | Assign Wali Kelas    | 1. Go to /master/tugas-tambahan<br>2. Select guru<br>3. Select class<br>4. Assign as Wali Kelas | Assignment created   | ⏳     |
| TUGAS-002 | Assign Coordinator   | 1. Go to /master/tugas-tambahan<br>2. Assign guru as Coordinator 7/8/9                          | Assignment created   | ⏳     |
| TUGAS-003 | Remove Wali Kelas    | 1. Select existing walas<br>2. Click remove<br>3. Confirm                                       | Assignment removed   | ⏳     |
| TUGAS-004 | Filter eligible guru | 1. View walas assignment<br>2. Check eligible list                                              | Only non-walas shown | ⏳     |

---

### 7. Input Nilai

| TC ID     | Test Case            | Steps                                                                                       | Expected Result           | Status |
| --------- | -------------------- | ------------------------------------------------------------------------------------------- | ------------------------- | ------ |
| NILAI-001 | Input UH1 - PTS mode | 1. Go to /nilai<br>2. Select PTS mode<br>3. Enter UH1-UH3, PTS<br>4. Save                   | Values saved              | ⏳     |
| NILAI-002 | Input Semester mode  | 1. Go to /nilai<br>2. Select Semester mode<br>3. Enter UH1-5, PTS, PAS, SEMESTER<br>4. Save | All values saved          | ⏳     |
| NILAI-003 | Tab/Enter navigation | 1. In input table<br>2. Use Tab/Enter keys                                                  | Move between cells        | ⏳     |
| NILAI-004 | Arrow key navigation | 1. In input table<br>2. Use arrow keys                                                      | Move between cells        | ⏳     |
| NILAI-005 | Partial save         | 1. Enter some values<br>2. Click Simpan Perubahan<br>3. Exit                                | Only entered values saved | ⏳     |

---

### 8. Dashboard

| TC ID    | Test Case            | Steps                                         | Expected Result             | Status |
| -------- | -------------------- | --------------------------------------------- | --------------------------- | ------ |
| DASH-001 | Superadmin dashboard | 1. Login as superadmin<br>2. Go to /dashboard | Shows all stats, conflicts  | ⏳     |
| DASH-002 | Admin dashboard      | 1. Login as admin<br>2. Go to /dashboard      | Shows admin stats           | ⏳     |
| DASH-003 | Guru dashboard       | 1. Login as guru<br>2. Go to /dashboard       | Shows assigned mapel, kelas | ⏳     |
| DASH-004 | Siswa dashboard      | 1. Login as siswa<br>2. Go to /dashboard      | Shows kelas info            | ⏳     |

---

### 9. Rapor PDF

| TC ID     | Test Case        | Steps                                                                            | Expected Result          | Status |
| --------- | ---------------- | -------------------------------------------------------------------------------- | ------------------------ | ------ |
| RAPOR-001 | Export per siswa | 1. Go to /rapor/ekspor<br>2. Select siswa<br>3. Check prasyarat<br>4. Export PDF | PDF downloaded           | ⏳     |
| RAPOR-002 | Export per kelas | 1. Go to /rapor/ekspor<br>2. Select kelas<br>3. Export all                       | Multiple PDFs downloaded | ⏳     |
| RAPOR-003 | Check prasyarat  | 1. Select siswa with incomplete data<br>2. Check prasyarat                       | Shows missing items      | ⏳     |

---

### 10. Asesmen

| TC ID    | Test Case           | Steps                                                                          | Expected Result       | Status |
| -------- | ------------------- | ------------------------------------------------------------------------------ | --------------------- | ------ |
| ASES-001 | Create Asesmen      | 1. Go to /master/asesmen<br>2. Click Tambah<br>3. Fill form<br>4. Submit       | Asesmen created       | ⏳     |
| ASES-002 | Setup Jadwal        | 1. Go to /master/asesmen/[id]/jadwal<br>2. Add exam schedule<br>3. Save        | Schedule created      | ⏳     |
| ASES-003 | Matrix Kepengawasan | 1. Go to /master/asesmen/[id]/matrix<br>2. View matrix<br>3. Mark availability | Availability saved    | ⏳     |
| ASES-004 | Assign Ruang        | 1. Go to /master/asesmen/[id]/ruang<br>2. Assign students to rooms<br>3. Save  | Room assignment saved | ⏳     |
| ASES-005 | Generate No Peserta | 1. Go to /master/asesmen/[id]/peserta<br>2. Click Generate<br>3. Verify format | Numbers generated     | ⏳     |
| ASES-006 | Export Dokumen      | 1. Go to /master/asesmen/[id]/dokumen<br>2. Select document type<br>3. Export  | PDF/Excel downloaded  | ⏳     |

---

## Test Data Requirements

### Required Test Data:

1. **Users:**
   - 1 superadmin
   - 2 admin
   - 5 guru (with users)
   - 10 siswa (with users)

2. **Master Data:**
   - 2 tahun pelajaran
   - 4 semester (2 aktif)
   - 3 jenjang (7, 8, 9)
   - 6 kelas Dapo
   - 6 kelas Real
   - 15 mata pelajaran
   - 1 kepala sekolah

3. **Test Scenarios:**
   - Siswa with nilai for all types
   - Siswa with partial nilai
   - Guru with pembagian mengajar
   - Guru with tugas tambahan

---

## Bug Report Template

```markdown
## Bug Report

| Field           | Value                          |
| --------------- | ------------------------------ |
| **Bug ID**      | BUG-XXX                        |
| **Title**       | [Clear description]            |
| **Severity**    | Critical / High / Medium / Low |
| **Priority**    | P0 / P1 / P2                   |
| **Feature**     | [Feature name]                 |
| **Test Case**   | [TC-ID]                        |
| **Environment** | [Browser, OS]                  |

### Steps to Reproduce:

1.
2.
3.

### Expected Result:

### Actual Result:

### Screenshots:

### Log/Error Message:
```

---

## Test Results Summary

| Feature             | Passed | Failed | Blocked | Total  |
| ------------------- | ------ | ------ | ------- | ------ |
| Authentication      | 0      | 0      | 0       | 5      |
| Data Master - Guru  | 0      | 0      | 0       | 6      |
| Data Master - Siswa | 0      | 0      | 0       | 6      |
| Distribusi Siswa    | 0      | 0      | 0       | 4      |
| Pembagian Mengajar  | 0      | 0      | 0       | 5      |
| Tugas Tambahan      | 0      | 0      | 0       | 4      |
| Input Nilai         | 0      | 0      | 0       | 5      |
| Dashboard           | 0      | 0      | 0       | 4      |
| Rapor PDF           | 0      | 0      | 0       | 3      |
| Asesmen             | 0      | 0      | 0       | 6      |
| **TOTAL**           | **0**  | **0**  | **0**   | **48** |

---

_QA Test Plan v2.0_  
_Created: 16 Juni 2026_
