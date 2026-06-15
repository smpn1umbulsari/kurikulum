# API Specification: Guru Spenturi v2

Aplikasi ini menggunakan perpaduan **Supabase Auth** untuk manajemen sesi, **Supabase Database RPC (Remote Procedure Call)** untuk pemrosesan data berat (seperti ringkasan dashboard), dan **Next.js Server Actions** untuk operasi tulis transaksional yang memerlukan otorisasi server-side yang ketat.

---

## 1. Autentikasi & Sesi (Supabase Auth)

### 1.1 Login Pengguna
Menggunakan Supabase Auth Client SDK untuk memverifikasi kredensial dan menanamkan cookie sesi.
* **Method**: `POST` (diabstraksi SDK)
* **Endpoint / Action**: `supabase.auth.signInWithPassword`
* **Request Payload**:
  ```json
  {
    "email": "username@sekolah.sch.id / email_user",
    "password": "user_secret_password"
  }
  ```
* **Response (Success - 200 OK)**:
  Sesi JWT disimpan di cookie `sb-access-token`. Pengguna dialihkan ke halaman dashboard.

---

## 2. Database RPC (Remote Procedure Call)

Untuk menghemat beban query di frontend, data ringkasan dashboard di-fetch melalui satu RPC database postgres.

### 2.1 `get_dashboard_summary`
Digunakan oleh Guru untuk menampilkan daftar kelas yang diajar dan progres input nilainya.
* **RPC Name**: `get_dashboard_summary`
* **Parameters**:
  * `p_guru_id` (`uuid`, required)
* **Response Format**:
  ```json
  {
    "status": "success",
    "data": {
      "total_kelas": 4,
      "tugas_mengajar": [
        {
          "kelas_real_id": "8a3d-...",
          "kelas_real_nama": "7A",
          "mata_pelajaran_id": "4b5e-...",
          "mapel_nama": "IPA",
          "total_siswa": 32,
          "nilai_terinput": 24,
          "progres_persen": 75.0,
          "belum_lengkap": 8
        }
      ],
      "wali_kelas_info": {
        "kelas_real_id": "8a3d-...",
        "kelas_real_nama": "7A",
        "kehadiran_lengkap": false,
        "catatan_lengkap": false
      }
    }
  }
  ```

### 2.2 `get_dashboard_admin`
Mengambil rekap data master dan aktivitas pengguna untuk Admin.
* **RPC Name**: `get_dashboard_admin`
* **Parameters**: None
* **Response Format**:
  ```json
  {
    "total_guru": 45,
    "total_siswa": 960,
    "total_kelas_dapo": 30,
    "total_kelas_real": 27,
    "pembagian_dapo_persen": 98.5,
    "nilai_terinput_persen": 64.2,
    "pengguna_online": 12
  }
  ```

---

## 3. Server Actions (Next.js Layer)

Server Actions dijalankan di backend Next.js dengan validasi otorisasi peran menggunakan token cookie user aktif.

### 3.1 `saveGradesAction`
Menyimpan batch nilai siswa dari tabel spreadsheet inline.
* **Endpoint (Action Signature)**: `saveGrades(gradesData: GradePayload[])`
* **Request Payload**:
  ```typescript
  interface GradePayload {
    semester_id: string;
    siswa_id: string;
    mata_pelajaran_id: string;
    uh1?: number | null;
    uh2?: number | null;
    uh3?: number | null;
    uh4?: number | null;
    uh5?: number | null;
    pts?: number | null;
    nilai_semester?: number | null;
  }
  ```
* **Rules & Validations**:
  * Harus mematuhi `chk_uh_sequential` (misal: uh2 tidak boleh diisi jika uh1 kosong).
  * Nilai harus di antara 0 dan 100.
  * Sesi guru harus terdaftar sebagai pengajar mapel & kelas terkait di `pembagian_mengajar_real`.
  * Mode PTS: hanya kolom uh1-uh3 dan pts yang boleh disimpan.
* **Response**:
  ```json
  {
    "success": true,
    "message": "Berhasil menyimpan 32 data nilai siswa."
  }
  ```

### 3.2 `uploadExcelGradesAction`
Mengunggah file Excel berisi nilai siswa.
* **Endpoint (Action Signature)**: `uploadExcelGrades(file: FormData, kelasRealId: string, mapelId: string)`
* **Validation (Metadata Check)**:
  Sebelum memproses baris Excel, Server Action membuka file dan memeriksa named range tersembunyi:
  * `_meta_semester_id` == `active_semester_id`
  * `_meta_kelas_real_id` == `kelasRealId`
  * `_meta_mapel_id` == `mapelId`
  * Jika ada yang berbeda, return:
    ```json
    {
      "success": false,
      "error_type": "METADATA_MISMATCH",
      "message": "File template tidak sesuai konteks! Pastikan Anda mengunggah template IPA untuk kelas 7A, bukan kelas lainnya."
    }
    ```
* **Response (Success)**:
  ```json
  {
    "success": true,
    "imported_rows": 30,
    "conflicts": [
      {
        "siswa_id": "uuid-siswa-1",
        "nama": "Adit",
        "data_lama": { "uh1": 80, "pts": 75 },
        "data_baru": { "uh1": 85, "pts": 75 }
      }
    ]
  }
  ```

### 3.3 `syncTeachingAssignmentsAction`
Sinkronisasi data mengajar Dapo dengan Real.
* **Endpoint (Action Signature)**: `syncTeachingAssignments(direction: 'dapo_to_real' | 'real_to_dapo', resolveStrategy: 'overwrite' | 'merge')`
* **Response**:
  ```json
  {
    "success": true,
    "synced_records": 120,
    "conflicts_resolved": 4
  }
  ```

### 3.4 `generateAssessmentRoomsAction`
Membagi siswa ke ruang ujian secara otomatis.
* **Endpoint (Action Signature)**: `generateAssessmentRooms(asesmenId: string)`
* **Response**:
  ```json
  {
    "success": true,
    "ruang_generated": 12,
    "siswa_assigned": 360,
    "unassigned_siswa_count": 0
  }
  ```
