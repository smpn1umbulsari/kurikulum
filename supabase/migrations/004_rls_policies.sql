-- =============================================================================
-- MIGRATION 004: Row Level Security (RLS) Policies
-- Guru Spenturi v2 - Security Layer
-- Created: 2026-06-14
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE pengguna ENABLE ROW LEVEL SECURITY;
ALTER TABLE guru ENABLE ROW LEVEL SECURITY;
ALTER TABLE siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE kepala_sekolah ENABLE ROW LEVEL SECURITY;
ALTER TABLE mata_pelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE tahun_pelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE semester ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas_dapo ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas_real ENABLE ROW LEVEL SECURITY;
ALTER TABLE siswa_kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tugas_tambahan ENABLE ROW LEVEL SECURITY;
ALTER TABLE komponen_nilai ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembagian_mengajar_dapo ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembagian_mengajar_real ENABLE ROW LEVEL SECURITY;
ALTER TABLE nilai ENABLE ROW LEVEL SECURITY;
ALTER TABLE kehadiran ENABLE ROW LEVEL SECURITY;
ALTER TABLE asesmen ENABLE ROW LEVEL SECURITY;
ALTER TABLE asesmen_jadwal ENABLE ROW LEVEL SECURITY;
ALTER TABLE asesmen_ruang ENABLE ROW LEVEL SECURITY;
ALTER TABLE asesmen_siswa_ruang ENABLE ROW LEVEL SECURITY;
ALTER TABLE asesmen_nomor_peserta ENABLE ROW LEVEL SECURITY;
ALTER TABLE kepengawasan ENABLE ROW LEVEL SECURITY;
ALTER TABLE kepengawasan_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kartu_pengawas ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_template_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengaturan_sekolah ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PENGGUNA (Users) Policies
-- =============================================================================

-- Superadmin & Admin can view all users
CREATE POLICY select_pengguna_policy ON pengguna
    FOR SELECT
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) IN ('superadmin', 'admin')
    );

-- Only superadmin can insert/update/delete users
CREATE POLICY insert_pengguna_policy ON pengguna
    FOR INSERT
    WITH CHECK (
        (SELECT role FROM pengguna WHERE id = auth.uid()) = 'superadmin'
    );

CREATE POLICY update_pengguna_policy ON pengguna
    FOR UPDATE
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) = 'superadmin'
    );

CREATE POLICY delete_pengguna_policy ON pengguna
    FOR DELETE
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) = 'superadmin'
    );

-- Users can view their own profile
CREATE POLICY select_pengguna_own_policy ON pengguna
    FOR SELECT
    USING (id = auth.uid());

-- =============================================================================
-- GURU Policies
-- =============================================================================

-- Admin can manage all guru
CREATE POLICY select_guru_policy ON guru
    FOR SELECT
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) IN ('superadmin', 'admin', 'urusan')
    );

CREATE POLICY insert_guru_policy ON guru
    FOR INSERT
    WITH CHECK (
        (SELECT role FROM pengguna WHERE id = auth.uid()) IN ('superadmin', 'admin')
    );

CREATE POLICY update_guru_policy ON guru
    FOR UPDATE
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) IN ('superadmin', 'admin')
    );

CREATE POLICY delete_guru_policy ON guru
    FOR DELETE
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) = 'superadmin'
    );

-- Guru can view their own data
CREATE POLICY select_guru_own_policy ON guru
    FOR SELECT
    USING (pengguna_id = auth.uid());

-- =============================================================================
-- SISWA Policies
-- =============================================================================

CREATE POLICY select_siswa_policy ON siswa
    FOR SELECT
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) IN ('superadmin', 'admin', 'urusan')
    );

CREATE POLICY insert_siswa_policy ON siswa
    FOR INSERT
    WITH CHECK (
        (SELECT role FROM pengguna WHERE id = auth.uid()) IN ('superadmin', 'admin', 'urusan')
    );

CREATE POLICY update_siswa_policy ON siswa
    FOR UPDATE
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) IN ('superadmin', 'admin', 'urusan')
    );

CREATE POLICY delete_siswa_policy ON siswa
    FOR DELETE
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) IN ('superadmin', 'admin')
    );

-- Siswa can view their own profile
CREATE POLICY select_siswa_own_policy ON siswa
    FOR SELECT
    USING (pengguna_id = auth.uid());

-- =============================================================================
-- SEMESTER Policies
-- =============================================================================

CREATE POLICY select_semester_policy ON semester
    FOR SELECT
    USING (true);

CREATE POLICY manage_semester_policy ON semester
    FOR ALL
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) IN ('superadmin', 'admin')
    );

-- =============================================================================
-- KELAS Policies
-- =============================================================================

CREATE POLICY select_kelas_dapo_policy ON kelas_dapo
    FOR SELECT
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) IN ('superadmin', 'admin', 'urusan', 'guru')
    );

CREATE POLICY manage_kelas_dapo_policy ON kelas_dapo
    FOR ALL
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) IN ('superadmin', 'admin', 'urusan')
    );

CREATE POLICY select_kelas_real_policy ON kelas_real
    FOR SELECT
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) IN ('superadmin', 'admin', 'urusan', 'guru')
    );

CREATE POLICY manage_kelas_real_policy ON kelas_real
    FOR ALL
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) IN ('superadmin', 'admin', 'urusan')
    );

-- =============================================================================
-- SISWA_KELAS Policies
-- =============================================================================

CREATE POLICY select_siswa_kelas_policy ON siswa_kelas
    FOR SELECT
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) IN ('superadmin', 'admin', 'urusan', 'guru')
    );

CREATE POLICY manage_siswa_kelas_policy ON siswa_kelas
    FOR ALL
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) IN ('superadmin', 'admin', 'urusan')
    );

-- =============================================================================
-- NILAI Policies
-- =============================================================================

-- Admin & Urusan can view all grades
CREATE POLICY select_nilai_admin_policy ON nilai
    FOR SELECT
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) IN ('superadmin', 'admin', 'urusan')
    );

-- Guru can only view grades for their assigned classes and subjects
CREATE POLICY select_nilai_guru_policy ON nilai
    FOR SELECT
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) = 'guru'
        AND mata_pelajaran_id IN (
            SELECT pmr.mata_pelajaran_id 
            FROM pembagian_mengajar_real pmr
            JOIN guru g ON pmr.guru_id = g.id
            WHERE g.pengguna_id = auth.uid() 
            AND pmr.semester_id = nilai.semester_id
        )
    );

-- Guru can insert/update grades (unless locked)
CREATE POLICY insert_nilai_guru_policy ON nilai
    FOR INSERT
    WITH CHECK (
        (SELECT role FROM pengguna WHERE id = auth.uid()) = 'guru'
        AND mata_pelajaran_id IN (
            SELECT pmr.mata_pelajaran_id 
            FROM pembagian_mengajar_real pmr
            JOIN guru g ON pmr.guru_id = g.id
            WHERE g.pengguna_id = auth.uid() 
            AND pmr.semester_id = nilai.semester_id
        )
    );

CREATE POLICY update_nilai_guru_policy ON nilai
    FOR UPDATE
    USING (
        terkunci = false
        AND (
            (SELECT role FROM pengguna WHERE id = auth.uid()) IN ('superadmin', 'admin', 'urusan')
            OR (
                (SELECT role FROM pengguna WHERE id = auth.uid()) = 'guru'
                AND mata_pelajaran_id IN (
                    SELECT pmr.mata_papaian_id 
                    FROM pembagian_mengajar_real pmr
                    JOIN guru g ON pmr.guru_id = g.id
                    WHERE g.pengguna_id = auth.uid() 
                    AND pmr.semester_id = nilai.semester_id
                )
            )
        )
    );

-- Admin can delete grades
CREATE POLICY delete_nilai_policy ON nilai
    FOR DELETE
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) IN ('superadmin', 'admin')
    );

-- =============================================================================
-- KEHADIRAN Policies
-- =============================================================================

CREATE POLICY select_kehadiran_policy ON kehadiran
    FOR SELECT
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) IN ('superadmin', 'admin', 'urusan', 'guru')
    );

CREATE POLICY manage_kehadiran_policy ON kehadiran
    FOR ALL
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) IN ('superadmin', 'admin', 'urus')
    );

-- =============================================================================
-- SYSTEM TABLES (Read-only for most, managed by system)
-- =============================================================================

-- Audit log is immutable
CREATE POLICY select_audit_log_policy ON audit_log
    FOR SELECT
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) = 'superadmin'
    );

-- Only service role can insert audit logs
-- (handled by database triggers)

REVOKE UPDATE, DELETE ON audit_log FROM public;

-- Backup log management
CREATE POLICY select_backup_log_policy ON backup_log
    FOR SELECT
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) IN ('superadmin', 'admin')
    );

CREATE POLICY manage_backup_log_policy ON backup_log
    FOR ALL
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) = 'superadmin'
    );

-- Pengaturan sekolah (singleton)
CREATE POLICY select_pengaturan_sekolah_policy ON pengaturan_sekolah
    FOR SELECT
    USING (true);

CREATE POLICY manage_pengaturan_sekolah_policy ON pengaturan_sekolah
    FOR ALL
    USING (
        (SELECT role FROM pengguna WHERE id = auth.uid()) IN ('superadmin', 'admin')
    );

-- =============================================================================
-- END OF MIGRATION 004
-- =============================================================================