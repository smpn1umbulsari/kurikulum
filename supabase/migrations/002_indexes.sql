-- =============================================================================
-- MIGRATION 002: Database Indexes
-- Guru Spenturi v2 - Performance Optimization
-- Created: 2026-06-14
-- =============================================================================

-- Sg. 1 - User & Auth
CREATE INDEX idx_pengguna_role ON pengguna (role);

-- Sg. 2 - Tasks & Additional Assignments
CREATE INDEX idx_tugas_tambahan_pengguna_semester ON tugas_tambahan (pengguna_id, semester_id);

-- Sg. 3 - Master Data
CREATE UNIQUE INDEX idx_semester_satu_aktif ON semester (status) WHERE status = 'aktif';
CREATE INDEX idx_guru_urutan ON guru (urutan NULLS LAST);
CREATE INDEX idx_guru_status ON guru (status);
CREATE INDEX idx_siswa_status ON siswa (status);
CREATE INDEX idx_siswa_nama ON siswa (nama);
CREATE UNIQUE INDEX idx_kepala_sekolah_satu_aktif ON kepala_sekolah (status) WHERE status = 'aktif';
CREATE INDEX idx_mata_pelajaran_status ON mata_pelajaran (status);
CREATE INDEX idx_kelas_dapo_semester_jenjang ON kelas_dapo (semester_id, jenjang);
CREATE INDEX idx_kelas_real_semester_jenjang ON kelas_real (semester_id, jenjang);

-- Sg. 4 - Student Class Assignments
CREATE UNIQUE INDEX idx_absen_dapo_unik ON siswa_kelas (kelas_dapo_id, nomor_absen_dapo) WHERE nomor_absen_dapo IS NOT NULL;
CREATE UNIQUE INDEX idx_absen_real_unik ON siswa_kelas (kelas_real_id, nomor_absen_real) WHERE nomor_absen_real IS NOT NULL;
CREATE INDEX idx_siswa_kelas_kelas_real_semester ON siswa_kelas (kelas_real_id, semester_id);
CREATE INDEX idx_siswa_kelas_kelas_dapo ON siswa_kelas (kelas_dapo_id);
CREATE INDEX idx_siswa_kelas_semester ON siswa_kelas (semester_id);

-- Sg. 5 - Teaching Assignments
CREATE INDEX idx_pmd_guru_semester ON pembagian_mengajar_dapo (guru_id, semester_id);
CREATE INDEX idx_pmd_kelas_dapo ON pembagian_mengajar_dapo (kelas_dapo_id);
CREATE INDEX idx_pmr_guru_semester ON pembagian_mengajar_real (guru_id, semester_id);
CREATE INDEX idx_pmr_kelas_real ON pembagian_mengajar_real (kelas_real_id);

-- Sg. 6 - Grades & Attendance
CREATE INDEX idx_nilai_semester_siswa ON nilai (semester_id, siswa_id);
CREATE INDEX idx_nilai_semester_mapel ON nilai (semester_id, mata_pelajaran_id);
CREATE INDEX idx_nilai_siswa_semester_mapel ON nilai (siswa_id, semester_id, mata_pelajaran_id);
CREATE INDEX idx_nilai_terkunci ON nilai (terkunci) WHERE terkunci = true;
CREATE INDEX idx_kehadiran_semester ON kehadiran (semester_id);

-- Sg. 7 - Assessment
CREATE INDEX idx_asesmen_semester ON asesmen (semester_id);
CREATE INDEX idx_asesmen_jadwal_asesmen ON asesmen_jadwal (asesmen_id);
CREATE INDEX idx_asesmen_siswa_ruang ON asesmen_siswa_ruang (asesmen_id, nomor_ruang);
CREATE INDEX idx_nomor_peserta_asesmen ON asesmen_nomor_peserta (asesmen_id);
CREATE INDEX idx_kepengawasan_assignments_guru ON kepengawasan_assignments (guru_id);
CREATE INDEX idx_kepengawasan_assignments_jadwal ON kepengawasan_assignments (jadwal_id, nomor_ruang);
CREATE INDEX idx_kartu_pengawas_guru ON kartu_pengawas (guru_id);

-- Sg. 8 - System Logs & Settings
CREATE INDEX idx_audit_log_pengguna ON audit_log (pengguna_id, created_at DESC);
CREATE INDEX idx_audit_log_tabel ON audit_log (tabel, created_at DESC);
CREATE INDEX idx_audit_log_waktu ON audit_log (created_at DESC);
CREATE INDEX idx_import_template_log_lookup ON import_template_log (semester_id, kelas_real_id, mata_pelajaran_id, generated_at DESC);
CREATE UNIQUE INDEX idx_pengaturan_sekolah_singleton ON pengaturan_sekolah ((true));

-- =============================================================================
-- END OF MIGRATION 002
-- =============================================================================