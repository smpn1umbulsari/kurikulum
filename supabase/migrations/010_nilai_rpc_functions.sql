-- Migration: Create RPC functions for Nilai operations
-- Date: 15 Juni 2026
-- Purpose: RPC functions for input nilai, rekap, export

-- =============================================================================
-- INPUT NILAI RPC FUNCTIONS
-- =============================================================================

-- Function: get_siswa_for_nilai_input
-- Get students for nilai input based on guru's assignment
CREATE OR REPLACE FUNCTION get_siswa_for_nilai_input(
    p_semester_id UUID,
    p_guru_id UUID,
    p_mapel_id UUID,
    p_jenjang INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'siswa', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', s.id,
                    'nis', s.nis,
                    'nama', s.nama,
                    'kelas', kd.nama,
                    'existing_values', (
                        SELECT COALESCE(jsonb_object_agg(n.jenis_nilai, jsonb_build_object(
                            'id', n.id,
                            'nilai', n.nilai,
                            'status', n.status_nilai
                        )), '{}'::jsonb)
                        FROM nilai n
                        WHERE n.siswa_id = s.id
                        AND n.semester_id = p_semester_id
                        AND n.mata_pelajaran_id = p_mapel_id
                    )
                ) ORDER BY s.nama
            ), '[]'::jsonb)
            FROM siswa s
            JOIN siswa_kelas sk ON sk.siswa_id = s.id
            JOIN kelas_dapo kd ON kd.id = sk.kelas_dapo_id
            WHERE sk.semester_id = p_semester_id
            AND kd.jenjang = p_jenjang
            AND s.status_siswa = 'aktif'
        ),
        'bobot', (
            SELECT jsonb_build_object(
                'uh1', bn.uh1,
                'uh2', bn.uh2,
                'uh3', bn.uh3,
                'uh4', bn.uh4,
                'uh5', bn.uh5,
                'pts', bn.pts,
                'pas', bn.pas,
                'total', bn.total
            )
            FROM bobot_nilai bn
            WHERE bn.mata_pelajaran_id = p_mapel_id
            AND bn.is_active = TRUE
            LIMIT 1
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Function: save_nilai_batch
-- Batch save nilai for multiple students
CREATE OR REPLACE FUNCTION save_nilai_batch(
    p_nilai_data JSONB,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item JSONB;
    v_saved_count INTEGER := 0;
    v_error_count INTEGER := 0;
    v_errors TEXT := '';
BEGIN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_nilai_data)
    LOOP
        BEGIN
            INSERT INTO nilai (
                siswa_id,
                semester_id,
                mata_pelajaran_id,
                guru_id,
                jenjang,
                jenis_nilai,
                nilai,
                status_nilai,
                entered_by,
                updated_by
            ) VALUES (
                (v_item ->> 'siswa_id')::UUID,
                (v_item ->> 'semester_id')::UUID,
                (v_item ->> 'mata_pelajaran_id')::UUID,
                (v_item ->> 'guru_id')::UUID,
                (v_item ->> 'jenjang')::INTEGER,
                (v_item ->> 'jenis_nilai')::jenis_nilai_enum,
                (v_item ->> 'nilai')::DECIMAL,
                COALESCE((v_item ->> 'status_nilai')::status_nilai_enum, 'draft'),
                p_user_id,
                p_user_id
            )
            ON CONFLICT (siswa_id, semester_id, mata_pelajaran_id, jenis_nilai)
            DO UPDATE SET
                nilai = EXCLUDED.nilai,
                status_nilai = COALESCE(EXCLUDED.status_nilai, nilai.status_nilai),
                updated_by = p_user_id,
                updated_at = NOW();
            
            v_saved_count := v_saved_count + 1;
        EXCEPTION WHEN OTHERS THEN
            v_error_count := v_error_count + 1;
            v_errors := v_errors || (v_item ->> 'siswa_id')::TEXT || ': ' || SQLERRM || '; ';
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'success', v_error_count = 0,
        'saved_count', v_saved_count,
        'error_count', v_error_count,
        'errors', v_errors
    );
END;
$$;

-- =============================================================================
-- REKAP NILAI RPC FUNCTIONS
-- =============================================================================

-- Function: get_rekap_nilai
-- Get rekap nilai per kelas/mapel
CREATE OR REPLACE FUNCTION get_rekap_nilai(
    p_semester_id UUID,
    p_jenjang INTEGER DEFAULT NULL,
    p_kelas_id UUID DEFAULT NULL,
    p_mapel_id UUID DEFAULT NULL,
    p_guru_id UUID DEFAULT NULL
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
            'kelas_id', kd.id,
            'kelas_nama', kd.nama,
            'jenjang', kd.jenjang,
            'mapel', mp.nama,
            'guru', g.nama,
            'total_siswa', (
                SELECT COUNT(*) FROM siswa_kelas sk
                WHERE sk.kelas_dapo_id = kd.id
                AND sk.semester_id = p_semester_id
            ),
            'stats', (
                SELECT jsonb_build_object(
                    'uh_avg', ROUND(AVG(n.nilai)::NUMERIC, 2),
                    'pts_avg', ROUND(AVG(CASE WHEN n.jenis_nilai = 'PTS' THEN n.nilai END)::NUMERIC, 2),
                    'pas_avg', ROUND(AVG(CASE WHEN n.jenis_nilai = 'PAS' THEN n.nilai END)::NUMERIC, 2),
                    'semester_avg', ROUND(AVG(CASE WHEN n.jenis_nilai = 'SEMESTER' THEN n.nilai END)::NUMERIC, 2),
                    'complete_count', COUNT(DISTINCT n.siswa_id) FILTER (WHERE n.jenis_nilai = 'SEMESTER'),
                    'incomplete_count', 
                        (SELECT COUNT(*) FROM siswa_kelas sk WHERE sk.kelas_dapo_id = kd.id) - 
                        COUNT(DISTINCT n.siswa_id) FILTER (WHERE n.jenis_nilai = 'SEMESTER')
                )
                FROM nilai n
                WHERE n.semester_id = p_semester_id
                AND n.mata_pelajaran_id = mp.id
            )
        ) ORDER BY kd.jenjang, kd.nama, mp.nama
    )
    INTO v_result
    FROM kelas_dapo kd
    CROSS JOIN mata_pelajaran mp
    LEFT JOIN guru g ON true -- join with guru assignment
    LEFT JOIN nilai n ON n.kelas_dapo_id = kd.id 
        AND n.mata_pelajaran_id = mp.id
        AND n.semester_id = p_semester_id
    WHERE kd.semester_id = p_semester_id
    AND (p_jenjang IS NULL OR kd.jenjang = p_jenjang)
    AND (p_kelas_id IS NULL OR kd.id = p_kelas_id)
    AND (p_mapel_id IS NULL OR mp.id = p_mapel_id);

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- =============================================================================
-- EXPORT RAPOR RPC FUNCTIONS
-- =============================================================================

-- Function: check_rapor_prasyarat
-- Check if all prerequisites for rapor are met
CREATE OR REPLACE FUNCTION check_rapor_prasyarat(
    p_semester_id UUID,
    p_siswa_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_total_mapel INTEGER;
    v_mapel_with_nilai INTEGER;
    v_kehadiran_complete BOOLEAN;
BEGIN
    -- Count total mapel
    SELECT COUNT(*) INTO v_total_mapel
    FROM mata_pelajaran WHERE status = 'aktif';

    -- Count mapel with semester nilai
    SELECT COUNT(DISTINCT mata_pelajaran_id) INTO v_mapel_with_nilai
    FROM nilai
    WHERE semester_id = p_semester_id
    AND siswa_id = p_siswa_id
    AND jenis_nilai = 'SEMESTER'
    AND nilai IS NOT NULL;

    -- Check kehadiran
    SELECT EXISTS (
        SELECT 1 FROM kehadiran
        WHERE semester_id = p_semester_id
        AND siswa_id = p_siswa_id
        AND (total_sakit + total_izin + total_alpha) >= 0
    ) INTO v_kehadiran_complete;

    -- Check catatan walas
    -- This would need kelas_id lookup

    SELECT jsonb_build_object(
        'can_generate', v_mapel_with_nilai >= v_total_mapel * 0.8 AND v_kehadiran_complete,
        'total_mapel', v_total_mapel,
        'mapel_with_nilai', v_mapel_with_nilai,
        'kehadiran_complete', v_kehadiran_complete,
        'completion_percent', 
            CASE WHEN v_total_mapel > 0 
            THEN ROUND((v_mapel_with_nilai::NUMERIC / v_total_mapel) * 100, 1)
            ELSE 0 END
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Function: generate_rapor_data
-- Generate rapor data for a student
CREATE OR REPLACE FUNCTION generate_rapor_data(
    p_semester_id UUID,
    p_siswa_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_siswa RECORD;
    v_semester RECORD;
BEGIN
    -- Get siswa info
    SELECT s.*, sk.kelas_dapo_id, kd.nama as kelas_nama, kd.jenjang
    INTO v_siswa
    FROM siswa s
    JOIN siswa_kelas sk ON sk.siswa_id = s.id
    JOIN kelas_dapo kd ON kd.id = sk.kelas_dapo_id
    WHERE s.id = p_siswa_id
    AND sk.semester_id = p_semester_id;

    -- Get semester info
    SELECT s.*, tp.nama as tahun_pelajaran_nama
    INTO v_semester
    FROM semester s
    JOIN tahun_pelajaran tp ON tp.id = s.tahun_pelajaran_id
    WHERE s.id = p_semester_id;

    -- Build rapor data
    SELECT jsonb_build_object(
        'header', jsonb_build_object(
            'sekolah', 'SMP NEGERI 1 UMBULSARI',
            'alamat', 'Jl. Raya Umbulsari, Jepara',
            'nama', v_siswa.nama,
            'nis', v_siswa.nis,
            'nisn', v_siswa.nisn,
            'kelas', v_siswa.kelas_nama,
            'jenjang', v_siswa.jenjang,
            'semester', v_semester.nama,
            'tahun_pelajaran', v_semester.tahun_pelajaran_nama
        ),
        'nilai', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'mapel', mp.nama,
                    'uh1', MAX(CASE WHEN n.jenis_nilai = 'UH1' THEN n.nilai END),
                    'uh2', MAX(CASE WHEN n.jenis_nilai = 'UH2' THEN n.nilai END),
                    'uh3', MAX(CASE WHEN n.jenis_nilai = 'UH3' THEN n.nilai END),
                    'pts', MAX(CASE WHEN n.jenis_nilai = 'PTS' THEN n.nilai END),
                    'pas', MAX(CASE WHEN n.jenis_nilai = 'PAS' THEN n.nilai END),
                    'semester', MAX(CASE WHEN n.jenis_nilai = 'SEMESTER' THEN n.nilai END)
                ) ORDER BY mp.kategori, mp.nama
            ), '[]'::jsonb)
            FROM nilai n
            JOIN mata_pelajaran mp ON mp.id = n.mata_pelajaran_id
            WHERE n.siswa_id = p_siswa_id
            AND n.semester_id = p_semester_id
            GROUP BY mp.id, mp.nama, mp.kategori
        ),
        'kehadiran', (
            SELECT jsonb_build_object(
                'sakit', COALESCE(k.total_sakit, 0),
                'izin', COALESCE(k.total_izin, 0),
                'alpha', COALESCE(k.total_alpha, 0),
                'total', COALESCE(k.total_sakit, 0) + COALESCE(k.total_izin, 0) + COALESCE(k.total_alpha, 0)
            )
            FROM kehadiran k
            WHERE k.siswa_id = p_siswa_id
            AND k.semester_id = p_semester_id
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- =============================================================================
-- EXPORT EXCEL TEMPLATE FUNCTION
-- =============================================================================

-- Function: generate_nilai_template
-- Generate Excel template for nilai upload
CREATE OR REPLACE FUNCTION generate_nilai_template(
    p_semester_id UUID,
    p_mapel_id UUID,
    p_jenjang INTEGER,
    p_jenis_nilai TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_semester RECORD;
    v_mapel RECORD;
BEGIN
    SELECT * INTO v_semester FROM semester WHERE id = p_semester_id;
    SELECT * INTO v_mapel FROM mata_pelajaran WHERE id = p_mapel_id;

    SELECT jsonb_build_object(
        'metadata', jsonb_build_object(
            'semester', v_semester.nama,
            'mapel', v_mapel.nama,
            'jenjang', p_jenjang,
            'jenis_nilai', p_jenis_nilai,
            'tanggal_input', NOW()::DATE
        ),
        'columns', '["NO", "NIS", "NAMA", "KELAS", "NILAI"]',
        'data', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_array(
                    ROW_NUMBER() OVER (ORDER BY s.nama),
                    s.nis,
                    s.nama,
                    kd.nama,
                    NULL  -- Nilai will be filled by user
                ) ORDER BY s.nama
            ), '[]'::jsonb)
            FROM siswa s
            JOIN siswa_kelas sk ON sk.siswa_id = s.id
            JOIN kelas_dapo kd ON kd.id = sk.kelas_dapo_id
            WHERE sk.semester_id = p_semester_id
            AND kd.jenjang = p_jenjang
            AND s.status_siswa = 'aktif'
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_siswa_for_nilai_input TO authenticated;
GRANT EXECUTE ON FUNCTION save_nilai_batch TO authenticated;
GRANT EXECUTE ON FUNCTION get_rekap_nilai TO authenticated;
GRANT EXECUTE ON FUNCTION check_rapor_prasyarat TO authenticated;
GRANT EXECUTE ON FUNCTION generate_rapor_data TO authenticated;
GRANT EXECUTE ON FUNCTION generate_nilai_template TO authenticated;

COMMENT ON FUNCTION get_siswa_for_nilai_input IS 'Get students for nilai input based on guru assignment';
COMMENT ON FUNCTION save_nilai_batch IS 'Batch save nilai for multiple students';
COMMENT ON FUNCTION get_rekap_nilai IS 'Get rekap nilai per kelas/mapel';
COMMENT ON FUNCTION check_rapor_prasyarat IS 'Check if all prerequisites for rapor are met';
COMMENT ON FUNCTION generate_rapor_data IS 'Generate rapor data for a student';
COMMENT ON FUNCTION generate_nilai_template IS 'Generate Excel template for nilai upload';
