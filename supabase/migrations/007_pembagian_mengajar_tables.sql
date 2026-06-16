-- Migration: Create pembagian_mengajar tables
-- Date: 15 Juni 2026
-- Purpose: Tables for managing teacher assignments (pembagian mengajar)

-- Create enum for jenis mengajar
DO $$ BEGIN
    CREATE TYPE jenis_mengajar_enum AS ENUM ('dapo', 'real');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for status pembagian
DO $$ BEGIN
    CREATE TYPE status_pembagian_enum AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: pembagian_mengajar
-- Main table for teacher assignments
CREATE TABLE IF NOT EXISTS pembagian_mengajar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_id UUID NOT NULL REFERENCES semester(id) ON DELETE CASCADE,
    guru_id UUID NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
    mata_pelajaran_id UUID NOT NULL REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
    jenjang INTEGER NOT NULL CHECK (jenjang IN (7, 8, 9)),
    jenis_mengajar jenis_mengajar_enum NOT NULL,
    kelas_id UUID NOT NULL, -- References either kelas_dapo or kelas_real
    tahun_pelajaran_id UUID NOT NULL REFERENCES tahun_pelajaran(id),
    jam_mengajar DECIMAL(4,2) DEFAULT 0, -- Jumlah jam mengajar per minggu
    status_pembagian status_pembagian_enum DEFAULT 'draft',
    created_by UUID REFERENCES pengguna(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES pengguna(id),
    UNIQUE(semester_id, guru_id, mata_pelajaran_id, jenjang, jenis_mengajar, kelas_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_pembagian_mengajar_guru ON pembagian_mengajar(guru_id);
CREATE INDEX IF NOT EXISTS idx_pembagian_mengajar_semester ON pembagian_mengajar(semester_id);
CREATE INDEX IF NOT EXISTS idx_pembagian_mengajar_mapel ON pembagian_mengajar(mata_pelajaran_id);
CREATE INDEX IF NOT EXISTS idx_pembagian_mengajar_jenjang ON pembagian_mengajar(jenjang);
CREATE INDEX IF NOT EXISTS idx_pembagian_mengajar_jenis ON pembagian_mengajar(jenis_mengajar);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-update updated_at
DROP TRIGGER IF EXISTS update_pembagian_mengajar_updated_at ON pembagian_mengajar;
CREATE TRIGGER update_pembagian_mengajar_updated_at
    BEFORE UPDATE ON pembagian_mengajar
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Table: konflik_pembagian
-- Table to store conflicts during sync
CREATE TABLE IF NOT EXISTS konflik_pembagian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_id UUID NOT NULL REFERENCES semester(id) ON DELETE CASCADE,
    guru_id UUID NOT NULL REFERENCES guru(id),
    mata_pelajaran_id UUID NOT NULL REFERENCES mata_pelajaran(id),
    jenjang INTEGER NOT NULL,
    jenis_mengajar jenis_mengajar_enum NOT NULL,
    kelas_id UUID NOT NULL,
    konflik_type TEXT NOT NULL, -- 'guru_double', 'mapel_double', 'jenjang_mismatch'
    deskripsi TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES pengguna(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_konflik_semester ON konflik_pembagian(semester_id);
CREATE INDEX IF NOT EXISTS idx_konflik_resolved ON konflik_pembagian(resolved) WHERE NOT resolved;

-- Table: audit_log_sync
-- Table to store sync audit logs
CREATE TABLE IF NOT EXISTS audit_log_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_id UUID NOT NULL REFERENCES semester(id),
    action TEXT NOT NULL, -- 'sync_dapo_to_real', 'sync_real_to_dapo', 'force_override'
    total_records INTEGER DEFAULT 0,
    conflicts_found INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    performed_by UUID NOT NULL REFERENCES pengguna(id),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    details JSONB -- Store additional details
);

CREATE INDEX IF NOT EXISTS idx_audit_sync_semester ON audit_log_sync(semester_id);
CREATE INDEX IF NOT EXISTS idx_audit_sync_performed ON audit_log_sync(performed_at DESC);

-- Add RLS policies
ALTER TABLE pembagian_mengajar ENABLE ROW LEVEL SECURITY;
ALTER TABLE konflik_pembagian ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log_sync ENABLE ROW LEVEL SECURITY;

-- Policy for superadmin and admin - full access
CREATE POLICY "pembagian_mengajar_all_superadmin" ON pembagian_mengajar
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));

CREATE POLICY "konflik_all_superadmin" ON konflik_pembagian
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));

CREATE POLICY "audit_log_all_superadmin" ON audit_log_sync
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));

-- Policy for guru - read own assignments
CREATE POLICY "pembagian_mengajar_read_guru" ON pembagian_mengajar
    FOR SELECT USING (
        guru_id IN (
            SELECT id FROM guru WHERE pengguna_id = auth.uid()
        )
    );

COMMENT ON TABLE pembagian_mengajar IS 'Tabel pembagian mengajar guru untuk kelas Dapo dan Real';
COMMENT ON TABLE konflik_pembagian IS 'Tabel penyimpanan konflik saat sinkronisasi pembagian';
COMMENT ON TABLE audit_log_sync IS 'Tabel audit log untuk operasi sinkronisasi';
