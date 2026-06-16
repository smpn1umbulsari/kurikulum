-- Migration: Create Nilai tables for Sprint 4 - Penilaian
-- Date: 15 Juni 2026
-- Purpose: Tables for input nilai, rekap nilai, kehadiran, rapor

-- =============================================================================
-- NILAI TABLES
-- =============================================================================

-- Create enum for jenis nilai
DO $$ BEGIN
    CREATE TYPE jenis_nilai_enum AS ENUM ('UH1', 'UH2', 'UH3', 'UH4', 'UH5', 'PTS', 'PAS', 'SEMESTER', 'RAPOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for status nilai
DO $$ BEGIN
    CREATE TYPE status_nilai_enum AS ENUM ('draft', 'submitted', 'approved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: nilai
-- Main table for student grades
DROP TABLE IF EXISTS nilai CASCADE;
DROP TABLE IF EXISTS kehadiran CASCADE;

CREATE TABLE nilai (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    siswa_id UUID NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES semester(id) ON DELETE CASCADE,
    mata_pelajaran_id UUID NOT NULL REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
    guru_id UUID NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
    jenjang INTEGER NOT NULL CHECK (jenjang IN (7, 8, 9)),
    jenis_nilai jenis_nilai_enum NOT NULL,
    nilai DECIMAL(5,2),
    deskripsi TEXT,
    status_nilai status_nilai_enum DEFAULT 'draft',
    entered_by UUID REFERENCES pengguna(id),
    entered_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES pengguna(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(siswa_id, semester_id, mata_pelajaran_id, jenis_nilai)
);

-- Indexes for nilai
CREATE INDEX IF NOT EXISTS idx_nilai_siswa ON nilai(siswa_id);
CREATE INDEX IF NOT EXISTS idx_nilai_semester ON nilai(semester_id);
CREATE INDEX IF NOT EXISTS idx_nilai_mapel ON nilai(mata_pelajaran_id);
CREATE INDEX IF NOT EXISTS idx_nilai_guru ON nilai(guru_id);
CREATE INDEX IF NOT EXISTS idx_nilai_jenis ON nilai(jenis_nilai);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_nilai_updated_at ON nilai;
CREATE TRIGGER update_nilai_updated_at
    BEFORE UPDATE ON nilai
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- KEHADIRAN TABLE
-- =============================================================================

-- Table: kehadiran
-- Table for student attendance
CREATE TABLE kehadiran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    siswa_id UUID NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES semester(id) ON DELETE CASCADE,
    total_sakit INTEGER DEFAULT 0,
    total_izin INTEGER DEFAULT 0,
    total_alpha INTEGER DEFAULT 0,
    catatan TEXT,
    entered_by UUID REFERENCES pengguna(id),
    entered_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES pengguna(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(siswa_id, semester_id)
);

CREATE INDEX IF NOT EXISTS idx_kehadiran_siswa ON kehadiran(siswa_id);
CREATE INDEX IF NOT EXISTS idx_kehadiran_semester ON kehadiran(semester_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_kehadiran_updated_at ON kehadiran;
CREATE TRIGGER update_kehadiran_updated_at
    BEFORE UPDATE ON kehadiran
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- CATATAN WALAS TABLE
-- =============================================================================

-- Table: catatan_walas
-- Table for wali kelas notes
CREATE TABLE IF NOT EXISTS catatan_walas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_id UUID NOT NULL REFERENCES semester(id) ON DELETE CASCADE,
    kelas_id UUID NOT NULL, -- References kelas_real
    siswa_id UUID NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    catatan TEXT NOT NULL,
    jenis_catatan TEXT DEFAULT 'umum', -- 'akademik', 'non_akademik', 'karakter'
    created_by UUID REFERENCES pengguna(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES pengguna(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(semester_id, kelas_id, siswa_id, jenis_catatan)
);

CREATE INDEX IF NOT EXISTS idx_catatan_kelas ON catatan_walas(kelas_id);
CREATE INDEX IF NOT EXISTS idx_catatan_siswa ON catatan_walas(siswa_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_catatan_walas_updated_at ON catatan_walas;
CREATE TRIGGER update_catatan_walas_updated_at
    BEFORE UPDATE ON catatan_walas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RAPOR STATUS TABLE
-- =============================================================================

-- Table: rapor_status
-- Table for tracking rapor generation status
CREATE TABLE IF NOT EXISTS rapor_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_id UUID NOT NULL REFERENCES semester(id) ON DELETE CASCADE,
    siswa_id UUID NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    status_prasyarat BOOLEAN DEFAULT FALSE,
    status_nilai BOOLEAN DEFAULT FALSE,
    status_kehadiran BOOLEAN DEFAULT FALSE,
    status_catatan BOOLEAN DEFAULT FALSE,
    status_ditandatangani BOOLEAN DEFAULT FALSE,
    status_cetak BOOLEAN DEFAULT FALSE,
    last_checked_at TIMESTAMPTZ,
    generated_at TIMESTAMPTZ,
    generated_by UUID REFERENCES pengguna(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(semester_id, siswa_id)
);

CREATE INDEX IF NOT EXISTS idx_rapor_status_semester ON rapor_status(semester_id);
CREATE INDEX IF NOT EXISTS idx_rapor_status_siswa ON rapor_status(siswa_id);

-- =============================================================================
-- BOBOT NILAI TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS bobot_nilai (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mata_pelajaran_id UUID NOT NULL REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
    uh1 INTEGER DEFAULT 10,
    uh2 INTEGER DEFAULT 10,
    uh3 INTEGER DEFAULT 10,
    uh4 INTEGER DEFAULT 10,
    uh5 INTEGER DEFAULT 10,
    pts INTEGER DEFAULT 20,
    pas INTEGER DEFAULT 30,
    total INTEGER DEFAULT 100
);

-- Add columns to existing bobot_nilai if not exists
ALTER TABLE bobot_nilai ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES semester(id);
ALTER TABLE bobot_nilai ADD COLUMN IF NOT EXISTS jenjang INTEGER CHECK (jenjang IN (7, 8, 9));
ALTER TABLE bobot_nilai ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_bobot_semester ON bobot_nilai(semester_id) WHERE semester_id IS NOT NULL;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE nilai ENABLE ROW LEVEL SECURITY;
ALTER TABLE kehadiran ENABLE ROW LEVEL SECURITY;
ALTER TABLE catatan_walas ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapor_status ENABLE ROW LEVEL SECURITY;

-- Policy: Admin and Superadmin full access
CREATE POLICY "nilai_all_admin" ON nilai
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));

CREATE POLICY "kehadiran_all_admin" ON kehadiran
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));

CREATE POLICY "catatan_all_admin" ON catatan_walas
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));

CREATE POLICY "rapor_all_admin" ON rapor_status
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));

-- Policy: Guru can manage their own nilai
CREATE POLICY "nilai_manage_guru" ON nilai
    FOR ALL USING (
        guru_id IN (SELECT id FROM guru WHERE pengguna_id = auth.uid())
        OR auth.jwt() ->> 'role' IN ('superadmin', 'admin')
    );

-- Policy: Guru can view all nilai for their classes
CREATE POLICY "nilai_read_guru" ON nilai
    FOR SELECT USING (
        guru_id IN (SELECT id FROM guru WHERE pengguna_id = auth.uid())
        OR auth.jwt() ->> 'role' IN ('superadmin', 'admin', 'urus')
    );

-- Policy: Siswa can view their own nilai
CREATE POLICY "nilai_read_siswa" ON nilai
    FOR SELECT USING (
        siswa_id IN (SELECT id FROM siswa WHERE pengguna_id = auth.uid())
        OR auth.jwt() ->> 'role' IN ('superadmin', 'admin', 'urus', 'guru')
    );

COMMENT ON TABLE nilai IS 'Tabel nilai siswa per mata pelajaran';
COMMENT ON TABLE kehadiran IS 'Tabel kehadiran siswa';
COMMENT ON TABLE catatan_walas IS 'Tabel catatan wali kelas';
COMMENT ON TABLE rapor_status IS 'Tabel status tracking rapor';
