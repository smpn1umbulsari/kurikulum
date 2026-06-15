-- =============================================================================
-- MIGRATION 003: Trigger Functions & Triggers
-- Guru Spenturi v2 - Business Logic Enforcement
-- Created: 2026-06-14
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Trigger 1: Validate Student Class Level Match (Jenjang must match)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_siswa_kelas_jenjang()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.kelas_dapo_id IS NOT NULL AND NEW.kelas_real_id IS NOT NULL THEN
        IF (SELECT jenjang FROM kelas_dapo WHERE id = NEW.kelas_dapo_id) !=
           (SELECT jenjang FROM kelas_real WHERE id = NEW.kelas_real_id) THEN
            RAISE EXCEPTION 'Jenjang kelas Dapodik dan kelas Real harus sama untuk siswa %', NEW.siswa_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_jenjang
BEFORE INSERT OR UPDATE ON siswa_kelas
FOR EACH ROW EXECUTE FUNCTION validate_siswa_kelas_jenjang();

-- -----------------------------------------------------------------------------
-- Trigger 2: Take snapshot of grading weights on INSERT
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION snapshot_bobot_nilai()
RETURNS TRIGGER AS $$
DECLARE
    v_bobot komponen_nilai%ROWTYPE;
BEGIN
    SELECT * INTO v_bobot
    FROM komponen_nilai
    WHERE semester_id = NEW.semester_id
        AND mata_pelajaran_id = NEW.mata_pelajaran_id;

    IF FOUND THEN
        NEW.bobot_uh_pct := v_bobot.bobot_uh;
        NEW.bobot_pts_pct := v_bobot.bobot_pts;
        NEW.bobot_semester_pct := v_bobot.bobot_semester;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_snapshot_bobot
BEFORE INSERT ON nilai
FOR EACH ROW EXECUTE FUNCTION snapshot_bobot_nilai();

-- -----------------------------------------------------------------------------
-- Trigger 3: Validate Student has both classes configured before grades/attendance
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_siswa_sudah_punya_kelas()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM siswa_kelas
        WHERE siswa_id = NEW.siswa_id
            AND semester_id = NEW.semester_id
            AND kelas_dapo_id IS NOT NULL
            AND kelas_real_id IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Siswa % belum memiliki kelas Dapo dan kelas Real di semester ini', NEW.siswa_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_siswa_punya_kelas_nilai
BEFORE INSERT ON nilai
FOR EACH ROW EXECUTE FUNCTION validate_siswa_sudah_punya_kelas();

CREATE TRIGGER trg_validate_siswa_punya_kelas_kehadiran
BEFORE INSERT ON kehadiran
FOR EACH ROW EXECUTE FUNCTION validate_siswa_sudah_punya_kelas();

-- -----------------------------------------------------------------------------
-- Trigger 4: Auto-update updated_at timestamp
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER update_tahun_pelajaran_updated_at
    BEFORE UPDATE ON tahun_pelajaran
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pengguna_updated_at
    BEFORE UPDATE ON pengguna
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guru_updated_at
    BEFORE UPDATE ON guru
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_siswa_updated_at
    BEFORE UPDATE ON siswa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kepala_sekolah_updated_at
    BEFORE UPDATE ON kepala_sekolah
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mata_pelajaran_updated_at
    BEFORE UPDATE ON mata_pelajaran
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_semester_updated_at
    BEFORE UPDATE ON semester
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kelas_dapo_updated_at
    BEFORE UPDATE ON kelas_dapo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kelas_real_updated_at
    BEFORE UPDATE ON kelas_real
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_siswa_kelas_updated_at
    BEFORE UPDATE ON siswa_kelas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tugas_tambahan_updated_at
    BEFORE UPDATE ON tugas_tambahan
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_komponen_nilai_updated_at
    BEFORE UPDATE ON komponen_nilai
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pembagian_mengajar_dapo_updated_at
    BEFORE UPDATE ON pembagian_mengajar_dapo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pembagian_mengajar_real_updated_at
    BEFORE UPDATE ON pembagian_mengajar_real
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nilai_updated_at
    BEFORE UPDATE ON nilai
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kehadiran_updated_at
    BEFORE UPDATE ON kehadiran
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asesmen_updated_at
    BEFORE UPDATE ON asesmen
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asesmen_jadwal_updated_at
    BEFORE UPDATE ON asesmen_jadwal
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asesmen_ruang_updated_at
    BEFORE UPDATE ON asesmen_ruang
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asesmen_nomor_peserta_updated_at
    BEFORE UPDATE ON asesmen_nomor_peserta
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kepengawasan_updated_at
    BEFORE UPDATE ON kepengawasan
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kartu_pengawas_updated_at
    BEFORE UPDATE ON kartu_pengawas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pengaturan_sekolah_updated_at
    BEFORE UPDATE ON pengaturan_sekolah
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- END OF MIGRATION 003
-- =============================================================================