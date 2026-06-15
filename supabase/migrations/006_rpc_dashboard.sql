-- ============================================================================
-- RPC FUNCTIONS FOR DASHBOARD (Sprint 2 - Fase 3.5)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- RPC: get_dashboard_summary_guru
-- Dashboard summary untuk role Guru
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_summary_guru(p_guru_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result json;
    v_semester_id uuid;
BEGIN
    -- Get active semester
    SELECT id INTO v_semester_id
    FROM semester
    WHERE status = 'aktif'
    LIMIT 1;

    -- Get guru info
    SELECT json_build_object(
        'guru', (
            SELECT json_build_object(
                'id', g.id,
                'nama', g.nama,
                'status_pegawai', g.status_pegawai
            )
            FROM guru g
            WHERE g.id = p_guru_id
        ),
        'stats', (
            SELECT json_build_object(
                'jumlah_mapel', COUNT(DISTINCT mata_pelajaran_id),
                'jumlah_kelas', COUNT(DISTINCT kelas_real_id),
                'total_jam', COALESCE(SUM(jam_mengajar), 0)
            )
            FROM pembagian_mengajar_real
            WHERE guru_id = p_guru_id
            AND semester_id = v_semester_id
        ),
        'tugas_tambahan', (
            SELECT COALESCE(json_agg(
                json_build_object('jenis', jenis_tugas)
            ), '[]'::json)
            FROM tugas_tambahan
            WHERE guru_id = p_guru_id
            AND semester_id = v_semester_id
        ),
        'wali_kelas', (
            SELECT COALESCE(json_agg(
                json_build_object('kelas', kr.nama, 'jenjang', kr.jenjang)
            ), '[]'::json)
            FROM wali_kelas wk
            JOIN kelas_real kr ON kr.id = wk.kelas_real_id
            WHERE wk.guru_id = p_guru_id
            AND wk.semester_id = v_semester_id
        ),
        'jadwal_hari_ini', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'hari', hari,
                    'jam_ke', jam_ke,
                    'mapel', m.nama,
                    'kelas', kr.nama
                )
            ), '[]'::json)
            FROM jadwal_mengajar jm
            JOIN mata_pelajaran m ON m.id = jm.mata_pelajaran_id
            JOIN kelas_real kr ON kr.id = jm.kelas_real_id
            WHERE jm.guru_id = p_guru_id
            AND jm.semester_id = v_semester_id
            LIMIT 10
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC: get_dashboard_summary_admin
-- Dashboard summary untuk role Admin
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_summary_admin()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result json;
    v_semester_id uuid;
BEGIN
    -- Get active semester
    SELECT id INTO v_semester_id
    FROM semester
    WHERE status = 'aktif'
    LIMIT 1;

    SELECT json_build_object(
        'stats', (
            SELECT json_build_object(
                'total_guru', (
                    SELECT COUNT(*) FROM guru WHERE status = 'aktif'
                ),
                'total_siswa', (
                    SELECT COUNT(*) FROM siswa WHERE status = 'aktif'
                ),
                'total_kelas', (
                    SELECT COUNT(*) FROM kelas_real WHERE semester_id = v_semester_id
                ),
                'total_mapel', (
                    SELECT COUNT(*) FROM mata_pelajaran WHERE status = 'aktif'
                )
            )
        ),
        'guru_terbaru', (
            SELECT COALESCE(json_agg(
                json_build_object('id', id, 'nama', nama, 'status', status_pegawai)
                ORDER BY created_at DESC
            ), '[]'::json)
            FROM guru
            WHERE status = 'aktif'
            LIMIT 5
        ),
        'siswa_terbaru', (
            SELECT COALESCE(json_agg(
                json_build_object('id', id, 'nama', nama, 'nis', nis)
                ORDER BY created_at DESC
            ), '[]'::json)
            FROM siswa
            WHERE status = 'aktif'
            LIMIT 5
        ),
        'kelas_list', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'id', kr.id,
                    'nama', kr.nama,
                    'jenjang', kr.jenjang,
                    'wali', (
                        SELECT g.nama FROM wali_kelas wk
                        JOIN guru g ON g.id = wk.guru_id
                        WHERE wk.kelas_real_id = kr.id
                        LIMIT 1
                    ),
                    'jumlah_siswa', (
                        SELECT COUNT(*) FROM siswa_kelas sk
                        WHERE sk.kelas_real_id = kr.id
                    )
                )
                ORDER BY kr.jenjang, kr.nama
            ), '[]'::json)
            FROM kelas_real kr
            WHERE kr.semester_id = v_semester_id
        ),
        'tugas_tambahan', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'jenis', tt.jenis_tugas,
                    'guru', g.nama
                )
            ), '[]'::json)
            FROM tugas_tambahan tt
            JOIN guru g ON g.id = tt.guru_id
            WHERE tt.semester_id = v_semester_id
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC: get_dashboard_summary_superadmin
-- Dashboard summary untuk role Superadmin (all access)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_summary_superadmin()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result json;
    v_semester_id uuid;
BEGIN
    -- Get active semester
    SELECT id INTO v_semester_id
    FROM semester
    WHERE status = 'aktif'
    LIMIT 1;

    SELECT json_build_object(
        'stats', (
            SELECT json_build_object(
                'total_guru', (
                    SELECT COUNT(*) FROM guru WHERE status = 'aktif'
                ),
                'total_siswa', (
                    SELECT COUNT(*) FROM siswa WHERE status = 'aktif'
                ),
                'total_kelas', (
                    SELECT COUNT(*) FROM kelas_real WHERE semester_id = v_semester_id
                ),
                'total_mapel', (
                    SELECT COUNT(*) FROM mata_pelajaran WHERE status = 'aktif'
                ),
                'total_users', (
                    SELECT COUNT(*) FROM pengguna
                ),
                'tahun_pelajaran_aktif', (
                    SELECT tp.nama FROM semester s
                    JOIN tahun_pelajaran tp ON tp.id = s.tahun_pelajaran_id
                    WHERE s.status = 'aktif'
                    LIMIT 1
                )
            )
        ),
        'breakdown', (
            SELECT json_build_object(
                'guru_by_status', (
                    SELECT COALESCE(json_object_agg(status_pegawai, count), '{}')
                    FROM (
                        SELECT status_pegawai, COUNT(*) as count
                        FROM guru WHERE status = 'aktif'
                        GROUP BY status_pegawai
                    ) sub
                ),
                'siswa_by_jenjang', (
                    SELECT COALESCE(json_object_agg(jenjang::text, count), '{}')
                    FROM (
                        SELECT kr.jenjang, COUNT(DISTINCT sk.siswa_id) as count
                        FROM kelas_real kr
                        LEFT JOIN siswa_kelas sk ON sk.kelas_real_id = kr.id
                        WHERE kr.semester_id = v_semester_id
                        GROUP BY kr.jenjang
                    ) sub
                ),
                'kelas_by_jenjang', (
                    SELECT COALESCE(json_object_agg(jenjang::text, count), '{}')
                    FROM (
                        SELECT jenjang, COUNT(*) as count
                        FROM kelas_real
                        WHERE semester_id = v_semester_id
                        GROUP BY jenjang
                    ) sub
                )
            )
        ),
        'audit_recent', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'user', p.nama,
                    'action', al.action,
                    'table', al.table_name,
                    'timestamp', al.created_at
                )
                ORDER BY al.created_at DESC
            ), '[]'::json)
            FROM audit_log al
            JOIN pengguna p ON p.id = al.user_id
            LIMIT 10
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC: get_dashboard_summary_wali_kelas
-- Dashboard summary untuk role Wali Kelas
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_summary_wali_kelas(p_guru_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result json;
    v_semester_id uuid;
    v_kelas_id uuid;
BEGIN
    -- Get active semester
    SELECT id INTO v_semester_id
    FROM semester
    WHERE status = 'aktif'
    LIMIT 1;

    -- Get kelas yang diwalikan
    SELECT wk.kelas_real_id INTO v_kelas_id
    FROM wali_kelas wk
    WHERE wk.guru_id = p_guru_id
    AND wk.semester_id = v_semester_id
    LIMIT 1;

    SELECT json_build_object(
        'kelas', (
            SELECT json_build_object(
                'id', kr.id,
                'nama', kr.nama,
                'jenjang', kr.jenjang
            )
            FROM kelas_real kr
            WHERE kr.id = v_kelas_id
        ),
        'stats', (
            SELECT json_build_object(
                'total_siswa', COUNT(*),
                'siswa_sakit', COALESCE(SUM(CASE WHEN k.sakit > 0 THEN 1 ELSE 0 END), 0),
                'siswa_izin', COALESCE(SUM(CASE WHEN k.izin > 0 THEN 1 ELSE 0 END), 0),
                'siswa_alpha', COALESCE(SUM(CASE WHEN k.alpha > 0 THEN 1 ELSE 0 END), 0)
            )
            FROM siswa_kelas sk
            LEFT JOIN kehadiran k ON k.siswa_kelas_id = sk.id AND k.semester_id = v_semester_id
            WHERE sk.kelas_real_id = v_kelas_id
        ),
        'siswa_list', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'id', s.id,
                    'nama', s.nama,
                    'nis', s.nis,
                    'jenis_kelamin', s.jenis_kelamin,
                    'kehadiran', (
                        SELECT json_build_object(
                            'sakit', COALESCE(k.sakit, 0),
                            'izin', COALESCE(k.izin, 0),
                            'alpha', COALESCE(k.alpha, 0)
                        )
                        FROM kehadiran k
                        WHERE k.siswa_kelas_id = sk.id
                        AND k.semester_id = v_semester_id
                    ),
                    'catatan', (
                        SELECT k.catatan_wali
                        FROM kehadiran k
                        WHERE k.siswa_kelas_id = sk.id
                        AND k.semester_id = v_semester_id
                    )
                )
                ORDER BY s.nama
            ), '[]'::json)
            FROM siswa_kelas sk
            JOIN siswa s ON s.id = sk.siswa_id
            WHERE sk.kelas_real_id = v_kelas_id
            AND s.status = 'aktif'
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_summary_guru(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_summary_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_summary_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_summary_wali_kelas(uuid) TO authenticated;