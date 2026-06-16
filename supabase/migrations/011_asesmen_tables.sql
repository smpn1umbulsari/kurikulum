-- Migration: Create Asesmen tables for Sprint 5
-- Date: 15 Juni 2026
-- Purpose: Tables for asesmen setup, jadwal ujian, nomor peserta, pembagian ruang

-- =============================================================================
-- ASESMEN TABLES
-- =============================================================================

-- Create enum for jenis asesmen
DO $$ BEGIN
    CREATE TYPE jenis_asesmen_enum AS ENUM ('ASTS', 'ASAS', 'ASAT', 'ASAJ');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for status asesmen
DO $$ BEGIN
    CREATE TYPE status_asesmen_enum AS ENUM ('draft', 'published', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: asesmen
-- Main table for asesmen/ujian
DROP TABLE IF EXISTS kartu_pengawas CASCADE;
DROP TABLE IF EXISTS kepengawasan_assignments CASCADE;
DROP TABLE IF EXISTS kepengawasan CASCADE;
DROP TABLE IF EXISTS asesmen_siswa_ruang CASCADE;
DROP TABLE IF EXISTS asesmen_nomor_peserta CASCADE;
DROP TABLE IF EXISTS asesmen_ruang CASCADE;
DROP TABLE IF EXISTS asesmen_jadwal CASCADE;
DROP TABLE IF EXISTS asesmen CASCADE;
DROP TABLE IF EXISTS jadwal_ujian CASCADE;
DROP TABLE IF EXISTS jadwal_mengawasi CASCADE;
DROP TABLE IF EXISTS nomor_peserta CASCADE;
DROP TABLE IF EXISTS ruang_ujian CASCADE;
DROP TABLE IF EXISTS pembagian_ruang CASCADE;

CREATE TABLE asesmen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(255) NOT NULL,
    jenis_asesmen jenis_asesmen_enum NOT NULL,
    semester_id UUID NOT NULL REFERENCES semester(id) ON DELETE CASCADE,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    status status_asesmen_enum DEFAULT 'draft',
    created_by UUID REFERENCES pengguna(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(semester_id, jenis_asesmen)
);

CREATE INDEX IF NOT EXISTS idx_asesmen_semester ON asesmen(semester_id);
CREATE INDEX IF NOT EXISTS idx_asesmen_jenis ON asesmen(jenis_asesmen);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_asesmen_updated_at ON asesmen;
CREATE TRIGGER update_asesmen_updated_at
    BEFORE UPDATE ON asesmen
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- JADWAL UJIAN TABLE
-- =============================================================================

-- Table: jadwal_ujian
-- Table for exam schedule
CREATE TABLE IF NOT EXISTS jadwal_ujian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asesmen_id UUID NOT NULL REFERENCES asesmen(id) ON DELETE CASCADE,
    mata_pelajaran_id UUID NOT NULL REFERENCES mata_pelajaran(id),
    jenjang INTEGER NOT NULL CHECK (jenjang IN (7, 8, 9)),
    hari VARCHAR(50) NOT NULL,
    tanggal DATE NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    created_by UUID REFERENCES pengguna(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jadwal_asesmen ON jadwal_ujian(asesmen_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_tanggal ON jadwal_ujian(tanggal);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_jadwal_ujian_updated_at ON jadwal_ujian;
CREATE TRIGGER update_jadwal_ujian_updated_at
    BEFORE UPDATE ON jadwal_ujian
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- JADWAL MENGAWASI TABLE
-- =============================================================================

-- Table: jadwal_mengawasi
-- Table for supervising schedule (matrix pengawas)
CREATE TABLE IF NOT EXISTS jadwal_mengawasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asesmen_id UUID NOT NULL REFERENCES asesmen(id) ON DELETE CASCADE,
    guru_id UUID NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
    hari VARCHAR(50) NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mengawasi_asesmen ON jadwal_mengawasi(asesmen_id);
CREATE INDEX IF NOT EXISTS idx_mengawasi_guru ON jadwal_mengawasi(guru_id);

-- =============================================================================
-- NOMOR PESERTA TABLE
-- =============================================================================

-- Table: ruang_ujian
-- Table for exam rooms
CREATE TABLE IF NOT EXISTS ruang_ujian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(50) NOT NULL,
    kapasitas INTEGER DEFAULT 36,
    jenjang INTEGER CHECK (jenjang IN (7, 8, 9)),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ruang_jenjang ON ruang_ujian(jenjang);

-- Table: nomor_peserta
-- Table for student exam numbers
CREATE TABLE IF NOT EXISTS nomor_peserta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asesmen_id UUID NOT NULL REFERENCES asesmen(id) ON DELETE CASCADE,
    siswa_id UUID NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    nomor_peserta VARCHAR(50) NOT NULL,
    jenjang INTEGER NOT NULL,
    tahun_pelajaran_id UUID NOT NULL REFERENCES tahun_pelajaran(id),
    ruang_id UUID REFERENCES ruang_ujian(id),
    nomor_absen INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(asesmen_id, siswa_id)
);

CREATE INDEX IF NOT EXISTS idx_nopes_asesmen ON nomor_peserta(asesmen_id);
CREATE INDEX IF NOT EXISTS idx_nopes_siswa ON nomor_peserta(siswa_id);
CREATE INDEX IF NOT EXISTS idx_nopes_ruang ON nomor_peserta(ruang_id);

-- =============================================================================
-- PEMBAGIAN RUANG SISWA TABLE
-- =============================================================================

-- Table: pembagian_ruang
-- Table for student room assignments
CREATE TABLE IF NOT EXISTS pembagian_ruang (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asesmen_id UUID NOT NULL REFERENCES asesmen(id) ON DELETE CASCADE,
    jenjang INTEGER NOT NULL,
    ruang_id UUID NOT NULL REFERENCES ruang_ujian(id),
    siswa_id UUID NOT NULL REFERENCES siswa(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(asesmen_id, siswa_id)
);

CREATE INDEX IF NOT EXISTS idx_pembagian_asesmen ON pembagian_ruang(asesmen_id);
CREATE INDEX IF NOT EXISTS idx_pembagian_ruang ON pembagian_ruang(ruang_id);

-- =============================================================================
-- KEPENGAWASAN TABLE
-- =============================================================================

-- Table: kepengawasan
-- Table for supervisor assignments
CREATE TABLE IF NOT EXISTS kepengawasan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asesmen_id UUID NOT NULL REFERENCES asesmen(id) ON DELETE CASCADE,
    jadwal_ujian_id UUID NOT NULL REFERENCES jadwal_ujian(id) ON DELETE CASCADE,
    guru_id UUID NOT NULL REFERENCES guru(id),
    ruang_id UUID NOT NULL REFERENCES ruang_ujian(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(asesmen_id, jadwal_ujian_id, guru_id)
);

CREATE INDEX IF NOT EXISTS idx_kepengawasan_asesmen ON kepengawasan(asesmen_id);
CREATE INDEX IF NOT EXISTS idx_kepengawasan_guru ON kepengawasan(guru_id);
CREATE INDEX IF NOT EXISTS idx_kepengawasan_ruang ON kepengawasan(ruang_id);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE asesmen ENABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal_ujian ENABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal_mengawasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE nomor_peserta ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruang_ujian ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembagian_ruang ENABLE ROW LEVEL SECURITY;
ALTER TABLE kepengawasan ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "asesmen_all_admin" ON asesmen
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));

CREATE POLICY "jadwal_all_admin" ON jadwal_ujian
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));

CREATE POLICY "jadwal_mengawasi_all_admin" ON jadwal_mengawasi
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));

CREATE POLICY "nopes_all_admin" ON nomor_peserta
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));

CREATE POLICY "ruang_all_admin" ON ruang_ujian
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));

CREATE POLICY "pembagian_ruang_all_admin" ON pembagian_ruang
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));

CREATE POLICY "kepengawasan_all_admin" ON kepengawasan
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));

-- Guru can view
CREATE POLICY "asesmen_read_guru" ON asesmen
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('superadmin', 'admin', 'guru')
    );

COMMENT ON TABLE asesmen IS 'Tabel Asesmen/Ujian (ASTS/ASAS/ASAT/ASAJ)';
COMMENT ON TABLE jadwal_ujian IS 'Tabel jadwal ujian';
COMMENT ON TABLE jadwal_mengawasi IS 'Tabel ketersediaan pengawas';
COMMENT ON TABLE nomor_peserta IS 'Tabel nomor peserta ujian';
COMMENT ON TABLE ruang_ujian IS 'Tabel ruang ujian';
COMMENT ON TABLE pembagian_ruang IS 'Tabel pembagian ruang siswa';
COMMENT ON TABLE kepengawasan IS 'Tabel pembagian pengawas ujian';
