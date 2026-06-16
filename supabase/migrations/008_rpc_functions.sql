-- Migration: Create RPC functions for Dashboard and Pembagian Mengajar
-- Date: 15 Juni 2026
-- Purpose: RPC functions for dashboard summary and conflict detection

-- =============================================================================
-- DASHBOARD RPC FUNCTIONS
-- =============================================================================

-- Function: get_dashboard_summary
-- Returns dashboard summary for a user based on their role
CREATE OR REPLACE FUNCTION get_dashboard_summary(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role TEXT;
    v_result JSONB;
    v_semester_id UUID;
BEGIN
    -- Get user role
    SELECT role INTO v_role
    FROM pengguna
    WHERE id = p_user_id;

    -- Get active semester
    SELECT id INTO v_semester_id
    FROM semester
    WHERE status = 'aktif'
    LIMIT 1;

    -- Build result based on role
    CASE v_role
        WHEN 'superadmin' THEN
            SELECT jsonb_build_object(
                'total_guru', (SELECT COUNT(*) FROM guru WHERE status = 'aktif'),
                'total_siswa', (SELECT COUNT(*) FROM siswa WHERE status_siswa = 'aktif'),
                'total_siswa_alumni', (SELECT COUNT(*) FROM siswa WHERE status_siswa = 'alumni'),
                'total_mapel', (SELECT COUNT(*) FROM mata_pelajaran WHERE status = 'aktif'),
                'total_kelas_dapo', (SELECT COUNT(*) FROM kelas_dapo WHERE semester_id = v_semester_id),
                'total_kelas_real', (SELECT COUNT(*) FROM kelas_real WHERE semester_id = v_semester_id),
                'pembagian_mengajar_pending', (
                    SELECT COUNT(*) FROM pembagian_mengajar pm
                    WHERE pm.semester_id = v_semester_id
                    AND pm.status_pembagian = 'draft'
                ),
                'konflik_pending', (
                    SELECT COUNT(*) FROM konflik_pembagian
                    WHERE semester_id = v_semester_id
                    AND NOT resolved
                ),
                'semester_aktif', (
                    SELECT jsonb_build_object(
                        'id', s.id,
                        'nama', s.nama,
                        'tahun_pelajaran', tp.nama
                    )
                    FROM semester s
                    JOIN tahun_pelajaran tp ON tp.id = s.tahun_pelajaran_id
                    WHERE s.status = 'aktif'
                ),
                'recent_activity', (
                    SELECT COALESCE(jsonb_agg(
                        jsonb_build_object(
                            'action', action,
                            'table', table_name,
                            'timestamp', created_at
                        ) ORDER BY created_at DESC
                    ), '[]'::jsonb)
                    FROM audit_log
                    WHERE created_at > NOW() - INTERVAL '7 days'
                    LIMIT 10
                )
            ) INTO v_result;

        WHEN 'admin' THEN
            SELECT jsonb_build_object(
                'total_guru', (SELECT COUNT(*) FROM guru WHERE status = 'aktif'),
                'total_siswa', (SELECT COUNT(*) FROM siswa WHERE status_siswa = 'aktif'),
                'total_mapel', (SELECT COUNT(*) FROM mata_pelajaran WHERE status = 'aktif'),
                'total_kelas', (
                    SELECT COUNT(*) FROM kelas_dapo WHERE semester_id = v_semester_id
                ),
                'pembagian_mengajar_pending', (
                    SELECT COUNT(*) FROM pembagian_mengajar pm
                    WHERE pm.semester_id = v_semester_id
                    AND pm.status_pembagian = 'draft'
                ),
                'semester_aktif', (
                    SELECT jsonb_build_object(
                        'id', s.id,
                        'nama', s.nama
                    )
                    FROM semester s
                    WHERE s.status = 'aktif'
                )
            ) INTO v_result;

        WHEN 'guru' THEN
            SELECT jsonb_build_object(
                'guru_info', (
                    SELECT jsonb_build_object(
                        'id', g.id,
                        'nama', g.nama,
                        'kode_guru', g.kode_guru
                    )
                    FROM guru g
                    WHERE g.pengguna_id = p_user_id
                ),
                'total_mapel_diampu', (
                    SELECT COUNT(DISTINCT mata_pelajaran_id)
                    FROM pembagian_mengajar pm
                    JOIN guru g ON g.id = pm.guru_id
                    WHERE g.pengguna_id = p_user_id
                    AND pm.semester_id = v_semester_id
                ),
                'total_kelas_diampu', (
                    SELECT COUNT(DISTINCT kelas_id)
                    FROM pembagian_mengajar pm
                    JOIN guru g ON g.id = pm.guru_id
                    WHERE g.pengguna_id = p_user_id
                    AND pm.semester_id = v_semester_id
                ),
                'total_jam_mengajar', (
                    SELECT COALESCE(SUM(jam_mengajar), 0)
                    FROM pembagian_mengajar pm
                    JOIN guru g ON g.id = pm.guru_id
                    WHERE g.pengguna_id = p_user_id
                    AND pm.semester_id = v_semester_id
                ),
                'jadwal_mengajar', (
                    SELECT COALESCE(jsonb_agg(
                        jsonb_build_object(
                            'mapel', mp.nama,
                            'jenjang', pm.jenjang,
                            'jenis', pm.jenis_mengajar,
                            'jam', pm.jam_mengajar
                        ) ORDER BY mp.nama
                    ), '[]'::jsonb)
                    FROM pembagian_mengajar pm
                    JOIN guru g ON g.id = pm.guru_id
                    JOIN mata_pelajaran mp ON mp.id = pm.mata_pelajaran_id
                    WHERE g.pengguna_id = p_user_id
                    AND pm.semester_id = v_semester_id
                )
            ) INTO v_result;

        WHEN 'siswa' THEN
            SELECT jsonb_build_object(
                'siswa_info', (
                    SELECT jsonb_build_object(
                        'id', s.id,
                        'nama', s.nama,
                        'nis', s.nis
                    )
                    FROM siswa s
                    WHERE s.pengguna_id = p_user_id
                ),
                'kelas_info', (
                    SELECT jsonb_build_object(
                        'kelas_dapo', kd.nama,
                        'kelas_real', kr.nama
                    )
                    FROM siswa_kelas sk
                    LEFT JOIN kelas_dapo kd ON kd.id = sk.kelas_dapo_id
                    LEFT JOIN kelas_real kr ON kr.id = sk.kelas_real_id
                    WHERE sk.siswa_id = (SELECT id FROM siswa WHERE pengguna_id = p_user_id)
                    AND sk.semester_id = v_semester_id
                )
            ) INTO v_result;

        ELSE
            v_result := jsonb_build_object('error', 'Unknown role');
    END CASE;

    RETURN v_result;
END;
$$;

-- =============================================================================
-- KONFLICT DETECTION RPC FUNCTIONS
-- =============================================================================

-- Function: detect_pembagian_konflik
-- Detects conflicts in pembagian mengajar
CREATE OR REPLACE FUNCTION detect_pembagian_konflik(p_semester_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_konflik JSONB := '[]'::jsonb;
    v_rec RECORD;
BEGIN
    -- Detect guru double assignment
    FOR v_rec IN
        SELECT 
            guru_id,
            COUNT(DISTINCT CONCAT(mata_pelajaran_id, '-', jenjang, '-', jenis_mengajar)) as mapel_count,
            COUNT(*) as total_records,
            ARRAY_AGG(DISTINCT jenjang) as jenjangs
        FROM pembagian_mengajar
        WHERE semester_id = p_semester_id
        GROUP BY guru_id
        HAVING COUNT(DISTINCT CONCAT(mata_pelajaran_id, '-', jenjang, '-', jenis_mengajar)) < COUNT(*)
    LOOP
        v_konflik := v_konflik || jsonb_build_array(jsonb_build_object(
            'type', 'guru_double',
            'guru_id', v_rec.guru_id,
            'jenjang', v_rec.jenjangs,
            'count', v_rec.total_records
        ));
    END LOOP;

    -- Detect mapel double assignment (same jenjang, different guru)
    FOR v_rec IN
        SELECT 
            mata_pelajaran_id,
            jenjang,
            jenis_mengajar,
            COUNT(DISTINCT guru_id) as guru_count,
            ARRAY_AGG(DISTINCT kelas_id) as kelas_ids
        FROM pembagian_mengajar
        WHERE semester_id = p_semester_id
        GROUP BY mata_pelajaran_id, jenjang, jenis_mengajar
        HAVING COUNT(DISTINCT guru_id) > 1
    LOOP
        v_konflik := v_konflik || jsonb_build_array(jsonb_build_object(
            'type', 'mapel_double',
            'mata_pelajaran_id', v_rec.mata_pelajaran_id,
            'jenjang', v_rec.jenjang,
            'guru_count', v_rec.guru_count
        ));
    END LOOP;

    RETURN v_konflik;
END;
$$;

-- Function: sync_pembagian_dapo_to_real
-- Syncs pembagian from dapo to real based on jenjang match
CREATE OR REPLACE FUNCTION sync_pembagian_dapo_to_real(
    p_semester_id UUID,
    p_user_id UUID,
    p_force_override BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sync_count INTEGER := 0;
    v_conflict_count INTEGER := 0;
    v_kelas_real_id UUID;
    v_rec RECORD;
    v_result JSONB;
BEGIN
    -- Clear existing conflicts for this semester
    DELETE FROM konflik_pembagian 
    WHERE semester_id = p_semester_id 
    AND jenis_mengajar = 'real';

    -- Loop through dapo assignments and sync to real
    FOR v_rec IN
        SELECT 
            pm.guru_id,
            pm.mata_pelajaran_id,
            pm.jenjang,
            kr.id as kelas_real_id
        FROM pembagian_mengajar pm
        JOIN kelas_dapo kd ON kd.id = pm.kelas_id
        JOIN kelas_real kr ON kr.semester_id = pm.semester_id 
            AND kr.jenjang = kd.jenjang
            AND kr.nama = kd.nama
        WHERE pm.semester_id = p_semester_id
        AND pm.jenis_mengajar = 'dapo'
    LOOP
        -- Check if real assignment already exists
        IF EXISTS (
            SELECT 1 FROM pembagian_mengajar 
            WHERE semester_id = p_semester_id
            AND guru_id = v_rec.guru_id
            AND mata_pelajaran_id = v_rec.mata_pelajaran_id
            AND jenjang = v_rec.jenjang
            AND jenis_mengajar = 'real'
        ) THEN
            IF NOT p_force_override THEN
                -- Record conflict
                INSERT INTO konflik_pembagian (
                    semester_id, guru_id, mata_pelajaran_id, jenjang,
                    jenis_mengajar, kelas_id, konflik_type, deskripsi
                ) VALUES (
                    p_semester_id, v_rec.guru_id, v_rec.mata_pelajaran_id,
                    v_rec.jenjang, 'real', v_rec.kelas_real_id,
                    'real_exists', 'Real assignment already exists'
                );
                v_conflict_count := v_conflict_count + 1;
                CONTINUE;
            END IF;
        END IF;

        -- Insert or update real assignment
        INSERT INTO pembagian_mengajar (
            semester_id, guru_id, mata_pelajaran_id, jenjang,
            jenis_mengajar, kelas_id, tahun_pelajaran_id,
            created_by, status_pembagian
        )
        SELECT 
            p_semester_id, v_rec.guru_id, v_rec.mata_pelajaran_id, v_rec.jenjang,
            'real', v_rec.kelas_real_id, 
            (SELECT tahun_pelajaran_id FROM semester WHERE id = p_semester_id),
            p_user_id, 'draft'
        ON CONFLICT (semester_id, guru_id, mata_pelajaran_id, jenjang, jenis_mengajar, kelas_id)
        DO UPDATE SET updated_by = p_user_id, updated_at = NOW();
        
        v_sync_count := v_sync_count + 1;
    END LOOP;

    -- Log the sync operation
    INSERT INTO audit_log_sync (
        semester_id, action, total_records, conflicts_found,
        records_updated, performed_by, details
    ) VALUES (
        p_semester_id, 'sync_dapo_to_real', 
        (SELECT COUNT(*) FROM pembagian_mengajar WHERE semester_id = p_semester_id AND jenis_mengajar = 'dapo'),
        v_conflict_count, v_sync_count, p_user_id,
        jsonb_build_object('force_override', p_force_override)
    );

    v_result := jsonb_build_object(
        'success', TRUE,
        'sync_count', v_sync_count,
        'conflict_count', v_conflict_count,
        'message', 
            CASE 
                WHEN v_conflict_count > 0 THEN 'Sync completed with conflicts'
                ELSE 'Sync completed successfully'
            END
    );

    RETURN v_result;
END;
$$;

-- =============================================================================
-- REKAP NILAI HELPER FUNCTIONS
-- =============================================================================

-- Function: get_nilai_status_per_kelas
-- Returns status of nilai completion per class
CREATE OR REPLACE FUNCTION get_nilai_status_per_kelas(
    p_semester_id UUID,
    p_jenjang INTEGER DEFAULT NULL
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
            'wali_kelas', (
                SELECT g.nama FROM tugas_tambahan tt
                JOIN guru g ON g.pengguna_id = tt.pengguna_id
                WHERE tt.kelas_real_id = kr.id
                AND tt.jenis = 'wali_kelas'
                LIMIT 1
            ),
            'total_siswa', (
                SELECT COUNT(*) FROM siswa_kelas sk
                WHERE sk.kelas_dapo_id = kd.id
            ),
            'kelengkapan', (
                SELECT 
                    ROUND(
                        COUNT(CASE WHEN n.nilai IS NOT NULL THEN 1 END)::NUMERIC / 
                        NULLIF(COUNT(n.id), 0) * 100, 1
                    )
                FROM siswa_kelas sk
                CROSS JOIN LATERAL (
                    SELECT id FROM mata_pelajaran WHERE status = 'aktif'
                ) mp
                LEFT JOIN nilai n ON n.siswa_id = sk.siswa_id 
                    AND n.mata_pelajaran_id = mp.id
                    AND n.semester_id = p_semester_id
                WHERE sk.kelas_dapo_id = kd.id
            )
        ) ORDER BY kd.jenjang, kd.nama
    )
    INTO v_result
    FROM kelas_dapo kd
    LEFT JOIN kelas_real kr ON kr.nama = kd.nama AND kr.semester_id = kd.semester_id
    WHERE kd.semester_id = p_semester_id
    AND (p_jenjang IS NULL OR kd.jenjang = p_jenjang);

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_dashboard_summary TO anon, authenticated;
GRANT EXECUTE ON FUNCTION detect_pembagian_konflik TO anon, authenticated;
GRANT EXECUTE ON FUNCTION sync_pembagian_dapo_to_real TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_nilai_status_per_kelas TO anon, authenticated;

COMMENT ON FUNCTION get_dashboard_summary IS 'Returns dashboard summary based on user role';
COMMENT ON FUNCTION detect_pembagian_konflik IS 'Detects conflicts in pembagian mengajar';
COMMENT ON FUNCTION sync_pembagian_dapo_to_real IS 'Syncs pembagian from dapo to real';
COMMENT ON FUNCTION get_nilai_status_per_kelas IS 'Returns nilai completion status per class';
