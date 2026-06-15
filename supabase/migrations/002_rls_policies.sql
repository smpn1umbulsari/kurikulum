-- ============================================================================
-- MIGRATION 002: Row Level Security (RLS) Policies
-- Task: SEC-02 Fix - Enable RLS on all tables
-- Date: 15 June 2026
-- ============================================================================

-- ============================================================================
-- HELPER: Create a function to check user role from pengguna table
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role::text FROM pengguna WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM pengguna
    WHERE id = auth.uid()
    AND role IN ('superadmin', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM pengguna
    WHERE id = auth.uid()
    AND role = 'superadmin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================================
-- 1. PENGGUNA TABLE
-- ============================================================================
ALTER TABLE pengguna ENABLE ROW LEVEL SECURITY;

-- Admin/superadmin: full access
CREATE POLICY "admin_full_access_pengguna" ON pengguna
    FOR ALL USING (public.is_admin_or_superadmin());

-- Others: read own row only
CREATE POLICY "users_read_own_pengguna" ON pengguna
    FOR SELECT USING (id = auth.uid());


-- ============================================================================
-- 2. GURU TABLE
-- ============================================================================
ALTER TABLE guru ENABLE ROW LEVEL SECURITY;

-- Admin/superadmin: full CRUD
CREATE POLICY "admin_full_access_guru" ON guru
    FOR ALL USING (public.is_admin_or_superadmin());

-- All authenticated: read access (guru list needed for dropdowns/lookups)
CREATE POLICY "authenticated_read_guru" ON guru
    FOR SELECT USING (auth.uid() IS NOT NULL);


-- ============================================================================
-- 3. SISWA TABLE
-- ============================================================================
ALTER TABLE siswa ENABLE ROW LEVEL SECURITY;

-- Admin/superadmin: full CRUD
CREATE POLICY "admin_full_access_siswa" ON siswa
    FOR ALL USING (public.is_admin_or_superadmin());

-- Urusan: read access
CREATE POLICY "urusan_read_siswa" ON siswa
    FOR SELECT USING (public.get_user_role() = 'urusan');

-- Guru: read all students (needed for grade entry)
CREATE POLICY "guru_read_siswa" ON siswa
    FOR SELECT USING (public.get_user_role() = 'guru');

-- Siswa: read own data only
CREATE POLICY "siswa_read_own" ON siswa
    FOR SELECT USING (pengguna_id = auth.uid());


-- ============================================================================
-- 4. NILAI TABLE
-- ============================================================================
ALTER TABLE nilai ENABLE ROW LEVEL SECURITY;

-- Admin/superadmin: full CRUD
CREATE POLICY "admin_full_access_nilai" ON nilai
    FOR ALL USING (public.is_admin_or_superadmin());

-- Urusan: read access
CREATE POLICY "urusan_read_nilai" ON nilai
    FOR SELECT USING (public.get_user_role() = 'urusan');

-- Guru: read/write for students they teach
CREATE POLICY "guru_read_nilai" ON nilai
    FOR SELECT USING (public.get_user_role() = 'guru');

CREATE POLICY "guru_insert_nilai" ON nilai
    FOR INSERT WITH CHECK (public.get_user_role() = 'guru');

CREATE POLICY "guru_update_nilai" ON nilai
    FOR UPDATE USING (public.get_user_role() = 'guru' AND terkunci = false);


-- ============================================================================
-- 5. KEHADIRAN TABLE
-- ============================================================================
ALTER TABLE kehadiran ENABLE ROW LEVEL SECURITY;

-- Admin/superadmin: full CRUD
CREATE POLICY "admin_full_access_kehadiran" ON kehadiran
    FOR ALL USING (public.is_admin_or_superadmin());

-- Guru (wali kelas): read/write
CREATE POLICY "guru_manage_kehadiran" ON kehadiran
    FOR ALL USING (public.get_user_role() IN ('guru', 'urusan'));


-- ============================================================================
-- 6. KEPALA_SEKOLAH TABLE
-- ============================================================================
ALTER TABLE kepala_sekolah ENABLE ROW LEVEL SECURITY;

-- Admin/superadmin: full CRUD
CREATE POLICY "admin_full_access_kepsek" ON kepala_sekolah
    FOR ALL USING (public.is_admin_or_superadmin());

-- All authenticated: read access (needed for rapor rendering)
CREATE POLICY "authenticated_read_kepsek" ON kepala_sekolah
    FOR SELECT USING (auth.uid() IS NOT NULL);


-- ============================================================================
-- 7. AUDIT_LOG TABLE
-- ============================================================================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Superadmin only: read access
CREATE POLICY "superadmin_read_audit_log" ON audit_log
    FOR SELECT USING (public.is_superadmin());

-- All: insert via triggers (service role bypasses RLS)
-- Note: audit_log INSERT is handled by database triggers which use service role


-- ============================================================================
-- 8. LOOKUP/REFERENCE TABLES (read-only for most users)
-- ============================================================================

-- tahun_pelajaran
ALTER TABLE tahun_pelajaran ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_tahun_pelajaran" ON tahun_pelajaran
    FOR ALL USING (public.is_admin_or_superadmin());

CREATE POLICY "authenticated_read_tahun_pelajaran" ON tahun_pelajaran
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- semester
ALTER TABLE semester ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_semester" ON semester
    FOR ALL USING (public.is_admin_or_superadmin());

CREATE POLICY "authenticated_read_semester" ON semester
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- mata_pelajaran
ALTER TABLE mata_pelajaran ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_mata_pelajaran" ON mata_pelajaran
    FOR ALL USING (public.is_admin_or_superadmin());

CREATE POLICY "authenticated_read_mata_pelajaran" ON mata_pelajaran
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- kelas_real
ALTER TABLE kelas_real ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_kelas_real" ON kelas_real
    FOR ALL USING (public.is_admin_or_superadmin());

CREATE POLICY "authenticated_read_kelas_real" ON kelas_real
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- kelas_dapo
ALTER TABLE kelas_dapo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_kelas_dapo" ON kelas_dapo
    FOR ALL USING (public.is_admin_or_superadmin());

CREATE POLICY "authenticated_read_kelas_dapo" ON kelas_dapo
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- siswa_kelas
ALTER TABLE siswa_kelas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_siswa_kelas" ON siswa_kelas
    FOR ALL USING (public.is_admin_or_superadmin());

CREATE POLICY "authenticated_read_siswa_kelas" ON siswa_kelas
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- komponen_nilai
ALTER TABLE komponen_nilai ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_komponen_nilai" ON komponen_nilai
    FOR ALL USING (public.is_admin_or_superadmin());

CREATE POLICY "authenticated_read_komponen_nilai" ON komponen_nilai
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- pengaturan_sekolah
ALTER TABLE pengaturan_sekolah ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_pengaturan" ON pengaturan_sekolah
    FOR ALL USING (public.is_admin_or_superadmin());

CREATE POLICY "authenticated_read_pengaturan" ON pengaturan_sekolah
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- tugas_tambahan
ALTER TABLE tugas_tambahan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_tugas_tambahan" ON tugas_tambahan
    FOR ALL USING (public.is_admin_or_superadmin());

CREATE POLICY "authenticated_read_tugas_tambahan" ON tugas_tambahan
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- pembagian_mengajar_dapo
ALTER TABLE pembagian_mengajar_dapo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_pmd" ON pembagian_mengajar_dapo
    FOR ALL USING (public.is_admin_or_superadmin());

CREATE POLICY "authenticated_read_pmd" ON pembagian_mengajar_dapo
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- pembagian_mengajar_real
ALTER TABLE pembagian_mengajar_real ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_pmr" ON pembagian_mengajar_real
    FOR ALL USING (public.is_admin_or_superadmin());

CREATE POLICY "authenticated_read_pmr" ON pembagian_mengajar_real
    FOR SELECT USING (auth.uid() IS NOT NULL);


-- ============================================================================
-- 9. ASESMEN & RELATED TABLES
-- ============================================================================

-- asesmen
ALTER TABLE asesmen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_urusan_full_access_asesmen" ON asesmen
    FOR ALL USING (public.get_user_role() IN ('superadmin', 'admin', 'urusan'));

CREATE POLICY "guru_read_asesmen" ON asesmen
    FOR SELECT USING (public.get_user_role() = 'guru');

-- asesmen_jadwal
ALTER TABLE asesmen_jadwal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_urusan_full_access_jadwal" ON asesmen_jadwal
    FOR ALL USING (public.get_user_role() IN ('superadmin', 'admin', 'urusan'));

CREATE POLICY "guru_read_jadwal" ON asesmen_jadwal
    FOR SELECT USING (public.get_user_role() = 'guru');

-- asesmen_ruang
ALTER TABLE asesmen_ruang ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_urusan_full_access_ruang" ON asesmen_ruang
    FOR ALL USING (public.get_user_role() IN ('superadmin', 'admin', 'urusan'));

-- asesmen_siswa_ruang
ALTER TABLE asesmen_siswa_ruang ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_urusan_full_access_siswa_ruang" ON asesmen_siswa_ruang
    FOR ALL USING (public.get_user_role() IN ('superadmin', 'admin', 'urusan'));

-- asesmen_nomor_peserta
ALTER TABLE asesmen_nomor_peserta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_urusan_full_access_nomor_peserta" ON asesmen_nomor_peserta
    FOR ALL USING (public.get_user_role() IN ('superadmin', 'admin', 'urusan'));

-- kepengawasan
ALTER TABLE kepengawasan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_urusan_full_access_kepengawasan" ON kepengawasan
    FOR ALL USING (public.get_user_role() IN ('superadmin', 'admin', 'urusan'));

-- kepengawasan_assignments
ALTER TABLE kepengawasan_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_urusan_full_access_kep_assignments" ON kepengawasan_assignments
    FOR ALL USING (public.get_user_role() IN ('superadmin', 'admin', 'urusan'));

-- kartu_pengawas
ALTER TABLE kartu_pengawas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_urusan_full_access_kartu" ON kartu_pengawas
    FOR ALL USING (public.get_user_role() IN ('superadmin', 'admin', 'urusan'));

-- Guru can read their own kartu pengawas
CREATE POLICY "guru_read_own_kartu" ON kartu_pengawas
    FOR SELECT USING (
        guru_id IN (
            SELECT g.id FROM guru g
            WHERE g.pengguna_id = auth.uid()
        )
    );


-- ============================================================================
-- 10. SYSTEM TABLES
-- ============================================================================

-- backup_log
ALTER TABLE backup_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_backup_log" ON backup_log
    FOR ALL USING (public.is_admin_or_superadmin());

-- import_template_log
ALTER TABLE import_template_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_import_log" ON import_template_log
    FOR ALL USING (public.is_admin_or_superadmin());

CREATE POLICY "authenticated_read_import_log" ON import_template_log
    FOR SELECT USING (auth.uid() IS NOT NULL);
