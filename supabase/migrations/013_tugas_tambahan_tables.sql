-- Migration: Create Tugas Tambahan tables for Sprint 2
-- Date: 15 Juni 2026
-- Purpose: Tables for tugas tambahan (Wali Kelas, Coordinator, Kepala Kurikulum, dll)

-- =============================================================================
-- TUGAS TAMBAHAN TABLES
-- =============================================================================

-- Create enum for jenis tugas tambahan
DO $$ BEGIN
    CREATE TYPE jenis_tugas_enum AS ENUM (
        'wali_kelas', 
        'koordinator_7', 
        'koordinator_8', 
        'koordinator_9',
        'kepala_kurikulum',
        'laboran',
        'perpustakaan',
        '辅导员' -- Wali bahasa
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: tugas_tambahan
-- Main table for additional tasks/assignments
DROP TABLE IF EXISTS tugas_tambahan CASCADE;
CREATE TABLE tugas_tambahan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pengguna_id UUID NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES semester(id) ON DELETE CASCADE,
    kelas_real_id UUID REFERENCES kelas_real(id), -- NULL untuk yang bukan Wali Kelas
    jenis_tugas jenis_tugas_enum NOT NULL,
    jam_tugas DECIMAL(4,2) DEFAULT 0, -- Jam tugas per minggu
    keterangan TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES pengguna(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(semester_id, pengguna_id, jenis_tugas)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tugas_pengguna ON tugas_tambahan(pengguna_id);
CREATE INDEX IF NOT EXISTS idx_tugas_semester ON tugas_tambahan(semester_id);
CREATE INDEX IF NOT EXISTS idx_tugas_kelas ON tugas_tambahan(kelas_real_id) WHERE kelas_real_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tugas_jenis ON tugas_tambahan(jenis_tugas);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_tugas_tambahan_updated_at ON tugas_tambahan;
CREATE TRIGGER update_tugas_tambahan_updated_at
    BEFORE UPDATE ON tugas_tambahan
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- KATEGORI TUGAS TABLE
-- =============================================================================

-- Table: kategori_tugas
-- Table for task categories
CREATE TABLE IF NOT EXISTS kategori_tugas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(100) NOT NULL UNIQUE,
    deskripsi TEXT,
    jam_default DECIMAL(4,2) DEFAULT 0,
    is_wali_kelas BOOLEAN DEFAULT FALSE,
    is_koordinator BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO kategori_tugas (nama, deskripsi, jam_default, is_wali_kelas) VALUES
    ('Wali Kelas 7', 'Wali kelas jenjang 7', 24, TRUE),
    ('Wali Kelas 8', 'Wali kelas jenjang 8', 24, TRUE),
    ('Wali Kelas 9', 'Wali kelas jenjang 9', 24, TRUE)
ON CONFLICT (nama) DO NOTHING;

INSERT INTO kategori_tugas (nama, deskripsi, jam_default, is_koordinator) VALUES
    ('Koordinator 7', 'Koordinator jenjang 7', 8, TRUE),
    ('Koordinator 8', 'Koordinator jenjang 8', 8, TRUE),
    ('Koordinator 9', 'Koordinator jenjang 9', 8, TRUE),
    ('Kepala Kurikulum', 'Kepala bagian kurikulum', 40, FALSE),
    ('Laboran', 'Laboran laboratorium', 20, FALSE),
    ('Perpustakaan', 'Staf perpustakaan', 20, FALSE)
ON CONFLICT (nama) DO NOTHING;

-- =============================================================================
-- KETERSEDIAAN PENGawas TABLE (for Asesmen)
-- =============================================================================

-- Table: ketersediaan_pengawas
-- Table for teacher availability for supervising exams
CREATE TABLE IF NOT EXISTS ketersediaan_pengawas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guru_id UUID NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES semester(id),
    hari VARCHAR(50) NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(guru_id, semester_id, hari, jam_mulai)
);

CREATE INDEX IF NOT EXISTS idx_ketersediaan_guru ON ketersediaan_pengawas(guru_id);
CREATE INDEX IF NOT EXISTS idx_ketersediaan_semester ON ketersediaan_pengawas(semester_id);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE tugas_tambahan ENABLE ROW LEVEL SECURITY;
ALTER TABLE kategori_tugas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ketersediaan_pengawas ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "tugas_all_admin" ON tugas_tambahan
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));

CREATE POLICY "kategori_all_admin" ON kategori_tugas
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));

CREATE POLICY "ketersediaan_all_admin" ON ketersediaan_pengawas
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));

-- Guru can view their own
CREATE POLICY "tugas_read_own" ON tugas_tambahan
    FOR SELECT USING (pengguna_id = auth.uid());

-- Guru can update their own availability
CREATE POLICY "ketersediaan_read_own" ON ketersediaan_pengawas
    FOR SELECT USING (guru_id IN (SELECT id FROM guru WHERE pengguna_id = auth.uid()));

CREATE POLICY "ketersediaan_update_own" ON ketersediaan_pengawas
    FOR UPDATE USING (guru_id IN (SELECT id FROM guru WHERE pengguna_id = auth.uid()));

COMMENT ON TABLE tugas_tambahan IS 'Tabel tugas tambahan guru (Wali Kelas, Koordinator, dll)';
COMMENT ON TABLE kategori_tugas IS 'Tabel kategori tugas tambahan';
COMMENT ON TABLE ketersediaan_pengawas IS 'Tabel ketersediaan pengawas ujian';

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function: get_guru_eligible_for_walas
-- Get list of guru eligible for Wali Kelas based on existing assignments
CREATE OR REPLACE FUNCTION get_guru_eligible_for_walas(
    p_semester_id UUID,
    p_jenjang INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', g.id,
            'nama', g.nama,
            'kode_guru', g.kode_guru,
            'current_tugas', COALESCE((
                SELECT jsonb_agg(tt.jenis_tugas)
                FROM tugas_tambahan tt
                WHERE tt.pengguna_id = g.pengguna_id
                AND tt.semester_id = p_semester_id
                AND tt.is_active = TRUE
            ), '[]'::jsonb),
            'is_eligible', NOT EXISTS (
                SELECT 1 FROM tugas_tambahan tt
                WHERE tt.pengguna_id = g.pengguna_id
                AND tt.semester_id = p_semester_id
                AND tt.jenis_tugas = 'wali_kelas'
            )
        ) ORDER BY g.nama
    )
    INTO v_result
    FROM guru g
    WHERE g.status = 'aktif'
    AND g.pengguna_id IS NOT NULL;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- Function: assign_wali_kelas
-- Assign a guru as Wali Kelas
CREATE OR REPLACE FUNCTION assign_wali_kelas(
    p_pengguna_id UUID,
    p_semester_id UUID,
    p_kelas_real_id UUID,
    p_jenjang INTEGER,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_guru_id UUID;
    v_result JSONB;
BEGIN
    -- Get guru_id from pengguna
    SELECT id INTO v_guru_id
    FROM guru
    WHERE pengguna_id = p_pengguna_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'message', 'Guru tidak ditemukan');
    END IF;

    -- Check if already assigned
    IF EXISTS (
        SELECT 1 FROM tugas_tambahan
        WHERE semester_id = p_semester_id
        AND pengguna_id = p_pengguna_id
        AND jenis_tugas = 'wali_kelas'
        AND is_active = TRUE
    ) THEN
        RETURN jsonb_build_object('success', FALSE, 'message', 'Guru sudah menjadi Wali Kelas di semester ini');
    END IF;

    -- Check if class already has walas
    IF EXISTS (
        SELECT 1 FROM tugas_tambahan tt
        JOIN guru g ON g.pengguna_id = tt.pengguna_id
        JOIN kelas_real kr ON kr.id = tt.kelas_real_id
        WHERE tt.semester_id = p_semester_id
        AND tt.kelas_real_id = p_kelas_real_id
        AND tt.jenis_tugas = 'wali_kelas'
        AND tt.is_active = TRUE
    ) THEN
        RETURN jsonb_build_object('success', FALSE, 'message', 'Kelas sudah memiliki Wali Kelas');
    END IF;

    -- Insert assignment
    INSERT INTO tugas_tambahan (
        pengguna_id, semester_id, kelas_real_id, jenis_tugas, jam_tugas, created_by
    ) VALUES (
        p_pengguna_id, p_semester_id, p_kelas_real_id, 'wali_kelas', 24, p_user_id
    );

    RETURN jsonb_build_object('success', TRUE, 'message', 'Wali Kelas berhasil ditambahkan');
END;
$$;

-- Function: get_tugas_tambahan_summary
-- Get summary of tugas tambahan for a semester
CREATE OR REPLACE FUNCTION get_tugas_tambahan_summary(p_semester_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'wali_kelas', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'guru', g.nama,
                    'kelas', kr.nama,
                    'jenjang', kr.jenjang
                )
            )
            FROM tugas_tambahan tt
            JOIN guru g ON g.pengguna_id = tt.pengguna_id
            JOIN kelas_real kr ON kr.id = tt.kelas_real_id
            WHERE tt.semester_id = p_semester_id
            AND tt.jenis_tugas = 'wali_kelas'
            AND tt.is_active = TRUE
        ),
        'koordinator', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'jenis', tt.jenis_tugas,
                    'guru', g.nama
                )
            )
            FROM tugas_tambahan tt
            JOIN guru g ON g.pengguna_id = tt.pengguna_id
            WHERE tt.semester_id = p_semester_id
            AND tt.jenis_tugas IN ('koordinator_7', 'koordinator_8', 'koordinator_9')
            AND tt.is_active = TRUE
        ),
        'kepala_kurikulum', (
            SELECT jsonb_agg(
                jsonb_build_object('guru', g.nama)
            )
            FROM tugas_tambahan tt
            JOIN guru g ON g.pengguna_id = tt.pengguna_id
            WHERE tt.semester_id = p_semester_id
            AND tt.jenis_tugas = 'kepala_kurikulum'
            AND tt.is_active = TRUE
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_guru_eligible_for_walas TO authenticated;
GRANT EXECUTE ON FUNCTION assign_wali_kelas TO authenticated;
GRANT EXECUTE ON FUNCTION get_tugas_tambahan_summary TO authenticated;

COMMENT ON FUNCTION get_guru_eligible_for_walas IS 'Get eligible guru for Wali Kelas';
COMMENT ON FUNCTION assign_wali_kelas IS 'Assign guru as Wali Kelas';
COMMENT ON FUNCTION get_tugas_tambahan_summary IS 'Get summary of tugas tambahan';
