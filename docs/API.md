# API Documentation: Guru Spenturi v2

## Base URL

```
https://your-domain.vercel.app/api
```

## Authentication

All protected endpoints require Supabase JWT token in Authorization header:

```
Authorization: Bearer <supabase_jwt_token>
```

---

## Master Data APIs

### Guru

| Method | Endpoint                   | Description       |
| :----- | :------------------------- | :---------------- |
| GET    | `/api/master/guru`         | List all guru     |
| POST   | `/api/master/guru`         | Create guru       |
| GET    | `/api/master/guru/[id]`    | Get single guru   |
| PUT    | `/api/master/guru/[id]`    | Update guru       |
| DELETE | `/api/master/guru/[id]`    | Delete guru       |
| PUT    | `/api/master/guru/reorder` | Reorder guru list |

### Siswa

| Method | Endpoint                   | Description       |
| :----- | :------------------------- | :---------------- |
| GET    | `/api/master/siswa`        | List all siswa    |
| POST   | `/api/master/siswa`        | Create siswa      |
| POST   | `/api/master/siswa/import` | Import from Excel |
| GET    | `/api/master/siswa/[id]`   | Get single siswa  |
| PUT    | `/api/master/siswa/[id]`   | Update siswa      |

### Kelas Real

| Method | Endpoint                      | Description         |
| :----- | :---------------------------- | :------------------ |
| GET    | `/api/master/kelas-real`      | List all kelas real |
| POST   | `/api/master/kelas-real`      | Create kelas        |
| GET    | `/api/master/kelas-real/[id]` | Get single kelas    |
| PUT    | `/api/master/kelas-real/[id]` | Update kelas        |

### Kelas Dapo

| Method | Endpoint                      | Description            |
| :----- | :---------------------------- | :--------------------- |
| GET    | `/api/master/kelas-dapo`      | List all kelas dapodik |
| POST   | `/api/master/kelas-dapo`      | Create kelas           |
| GET    | `/api/master/kelas-dapo/[id]` | Get single kelas       |

### Mata Pelajaran

| Method | Endpoint                 | Description    |
| :----- | :----------------------- | :------------- |
| GET    | `/api/master/mapel`      | List all mapel |
| POST   | `/api/master/mapel`      | Create mapel   |
| PUT    | `/api/master/mapel/[id]` | Update mapel   |

### Semester

| Method | Endpoint                             | Description       |
| :----- | :----------------------------------- | :---------------- |
| GET    | `/api/master/semester`               | List all semester |
| POST   | `/api/master/semester`               | Create semester   |
| PUT    | `/api/master/semester/[id]/activate` | Set active        |

### Pembagian Mengajar

| Method | Endpoint                                | Description             |
| :----- | :-------------------------------------- | :---------------------- |
| GET    | `/api/master/pembagian-mengajar/[type]` | Get by type (real/dapo) |
| POST   | `/api/master/pembagian-mengajar`        | Create assignment       |
| POST   | `/api/master/pembagian-mengajar/sync`   | Sync from other type    |
| PUT    | `/api/master/pembagian-mengajar/[id]`   | Update                  |

---

## Asesmen APIs

### Asesmen

| Method | Endpoint            | Description        |
| :----- | :------------------ | :----------------- |
| GET    | `/api/asesmen`      | List all asesmen   |
| POST   | `/api/asesmen`      | Create asesmen     |
| GET    | `/api/asesmen/[id]` | Get single asesmen |
| PUT    | `/api/asesmen/[id]` | Update asesmen     |
| DELETE | `/api/asesmen/[id]` | Delete asesmen     |

### Jadwal Ujian

| Method | Endpoint                              | Description     |
| :----- | :------------------------------------ | :-------------- |
| GET    | `/api/asesmen/[id]/jadwal`            | Get jadwal list |
| POST   | `/api/asesmen/[id]/jadwal`            | Create jadwal   |
| PUT    | `/api/asesmen/[id]/jadwal/[jadwalId]` | Update jadwal   |
| DELETE | `/api/asesmen/[id]/jadwal/[jadwalId]` | Delete jadwal   |

### Matrix Pengawas

| Method | Endpoint                   | Description     |
| :----- | :------------------------- | :-------------- |
| GET    | `/api/asesmen/[id]/matrix` | Get matrix data |
| PUT    | `/api/asesmen/[id]/matrix` | Save matrix     |

### Pembagian Ruang

| Method | Endpoint                           | Description            |
| :----- | :--------------------------------- | :--------------------- |
| GET    | `/api/asesmen/[id]/ruang`          | Get pengaturan & siswa |
| PUT    | `/api/asesmen/[id]/ruang`          | Save pengaturan        |
| POST   | `/api/asesmen/[id]/ruang/generate` | Auto-generate          |
| POST   | `/api/asesmen/[id]/ruang/reset`    | Reset pembagian        |

### Pembagian Pengawas

| Method | Endpoint                              | Description        |
| :----- | :------------------------------------ | :----------------- |
| GET    | `/api/asesmen/[id]/pengawas`          | Get pembagian      |
| PUT    | `/api/asesmen/[id]/pengawas`          | Save pembagian     |
| POST   | `/api/asesmen/[id]/pengawas/generate` | Auto-generate      |
| POST   | `/api/asesmen/[id]/pengawas/validate` | Validate conflicts |

### Nomor Peserta

| Method | Endpoint                                   | Description    |
| :----- | :----------------------------------------- | :------------- |
| GET    | `/api/asesmen/[id]/nomor-peserta`          | Get all nomor  |
| POST   | `/api/asesmen/[id]/nomor-peserta/generate` | Generate nomor |

---

## Nilai APIs

### Nilai

| Method | Endpoint                     | Description             |
| :----- | :--------------------------- | :---------------------- |
| GET    | `/api/nilai`                 | List nilai with filters |
| POST   | `/api/nilai`                 | Create/Update nilai     |
| POST   | `/api/nilai/upload`          | Upload from Excel       |
| GET    | `/api/nilai/rekap/[kelasId]` | Get rekap for kelas     |

---

## Admin APIs

### Validasi Data

| Method | Endpoint                             | Description        |
| :----- | :----------------------------------- | :----------------- |
| GET    | `/api/master/validasi-data`          | Get cached results |
| POST   | `/api/master/validasi-data/validate` | Run validation     |

### Backup

| Method | Endpoint                           | Description         |
| :----- | :--------------------------------- | :------------------ |
| GET    | `/api/master/backup`               | List backups        |
| POST   | `/api/master/backup`               | Create backup       |
| GET    | `/api/master/backup/[id]/download` | Download backup     |
| POST   | `/api/master/backup/[id]/restore`  | Restore from backup |
| DELETE | `/api/master/backup/[id]`          | Delete backup       |
| PUT    | `/api/master/backup/schedule`      | Update schedule     |

### Audit Log

| Method | Endpoint                | Description            |
| :----- | :---------------------- | :--------------------- |
| GET    | `/api/master/audit-log` | List logs with filters |

### Maintenance Mode

| Method | Endpoint                  | Description   |
| :----- | :------------------------ | :------------ |
| GET    | `/api/master/maintenance` | Get config    |
| PUT    | `/api/master/maintenance` | Update config |
| GET    | `/api/maintenance/status` | Check status  |

---

## Response Format

### Success Response

```json
{
  "data": { ... },
  "message": "Success"
}
```

### Error Response

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Pagination Response

```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "total_pages": 5
}
```

---

## Status Codes

| Code | Description           |
| :--- | :-------------------- |
| 200  | Success               |
| 201  | Created               |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 500  | Internal Server Error |

---

## Rate Limiting

API calls are limited to:

- **100 requests/minute** for authenticated users
- **20 requests/minute** for anonymous users

---

## WebSocket (Real-time)

Subscribe to Supabase realtime for live updates:

```javascript
supabase
  .channel("table-db-changes")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "nilai" },
    handleChange,
  )
  .subscribe();
```
