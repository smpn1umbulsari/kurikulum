-- Migration: Create Finalisasi tables for Sprint 6
-- Date: 15 Juni 2026
-- Purpose: Tables for backup, restore, audit log, validation

-- =============================================================================
-- BACKUP & RESTORE TABLES
-- =============================================================================

-- Table: backup_log
-- Table for tracking database backups
DROP TABLE IF EXISTS restore_log CASCADE;
DROP TABLE IF EXISTS backup_log CASCADE;

CREATE TABLE backup_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type TEXT NOT NULL, -- 'manual', 'scheduled'
    file_name VARCHAR(255),
    file_size BIGINT,
    status TEXT NOT NULL, -- 'in_progress', 'completed', 'failed'
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    performed_by UUID REFERENCES pengguna(id)
);

CREATE INDEX IF NOT EXISTS idx_backup_status ON backup_log(status);
CREATE INDEX IF NOT EXISTS idx_backup_date ON backup_log(started_at DESC);

-- Table: restore_log
-- Table for tracking restore operations
CREATE TABLE IF NOT EXISTS restore_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_file VARCHAR(255) NOT NULL,
    status TEXT NOT NULL, -- 'in_progress', 'completed', 'failed'
    tables_restored INTEGER DEFAULT 0,
    records_restored BIGINT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    performed_by UUID REFERENCES pengguna(id),
    confirmed_by UUID REFERENCES pengguna(id),
    confirmation_note TEXT
);

CREATE INDEX IF NOT EXISTS idx_restore_status ON restore_log(status);
CREATE INDEX IF NOT EXISTS idx_restore_date ON restore_log(started_at DESC);

-- =============================================================================
-- VALIDATION TABLES
-- =============================================================================

-- Table: validation_rule
-- Table for data validation rules
CREATE TABLE IF NOT EXISTS validation_rule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    field_name VARCHAR(100),
    rule_type TEXT NOT NULL, -- 'unique', 'required', 'range', 'custom'
    rule_config JSONB NOT NULL, -- Configuration for the rule
    error_message TEXT,
    severity TEXT DEFAULT 'error', -- 'error', 'warning'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(table_name, rule_name)
);

-- Table: validation_result
-- Table for storing validation check results
CREATE TABLE IF NOT EXISTS validation_result (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES validation_rule(id),
    record_id UUID NOT NULL, -- ID of the record that failed
    semester_id UUID REFERENCES semester(id),
    error_detail TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES pengguna(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validation_rule_table ON validation_rule(table_name) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_validation_result_semester ON validation_result(semester_id) WHERE NOT is_resolved;

-- =============================================================================
-- SYSTEM SETTINGS TABLE
-- =============================================================================

-- Table: system_settings
-- Table for application settings (maintenance mode, etc)
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type TEXT DEFAULT 'string', -- 'string', 'boolean', 'number', 'json'
    description TEXT,
    updated_by UUID REFERENCES pengguna(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
    ('maintenance_mode', 'false', 'boolean', 'Enable/disable maintenance mode'),
    ('school_name', 'SMP NEGERI 1 UMBULSARI', 'string', 'School name for rapor'),
    ('school_address', 'Jl. Raya Umbulsari, Jepara', 'string', 'School address'),
    ('school_npsn', '20101234', 'string', 'School NPSN'),
    ('school_logo', NULL, 'string', 'Base64 encoded school logo'),
    ('principal_signature', NULL, 'string', 'Base64 encoded principal signature'),
    ('backup_schedule', 'daily', 'string', 'Backup schedule: daily, weekly, monthly'),
    ('backup_retention_days', '30', 'number', 'Number of days to retain backups')
ON CONFLICT (setting_key) DO NOTHING;

-- =============================================================================
-- NOTIFICATION TABLE
-- =============================================================================

-- Table: notification
-- Table for user notifications
CREATE TABLE IF NOT EXISTS notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    is_read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_user ON notification(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notification_date ON notification(created_at DESC);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE backup_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE restore_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_result ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "backup_all_admin" ON backup_log
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));

CREATE POLICY "restore_all_admin" ON restore_log
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));

CREATE POLICY "validation_rule_all_admin" ON validation_rule
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));

CREATE POLICY "validation_result_all_admin" ON validation_result
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));

CREATE POLICY "settings_all_admin" ON system_settings
    FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin', 'admin'));

CREATE POLICY "settings_read_all" ON system_settings
    FOR SELECT USING (true);

-- Notification policies
CREATE POLICY "notification_own" ON notification
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "notification_send_admin" ON notification
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('superadmin', 'admin')
    );

COMMENT ON TABLE backup_log IS 'Tabel log backup database';
COMMENT ON TABLE restore_log IS 'Tabel log restore database';
COMMENT ON TABLE validation_rule IS 'Tabel aturan validasi data';
COMMENT ON TABLE validation_result IS 'Tabel hasil validasi data';
COMMENT ON TABLE system_settings IS 'Tabel pengaturan sistem';
COMMENT ON TABLE notification IS 'Tabel notifikasi pengguna';

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function: get_system_setting
-- Get a system setting value
CREATE OR REPLACE FUNCTION get_system_setting(p_key VARCHAR)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_value TEXT;
BEGIN
    SELECT setting_value INTO v_value
    FROM system_settings
    WHERE setting_key = p_key;
    
    RETURN v_value;
END;
$$;

-- Function: set_system_setting
-- Set a system setting value
CREATE OR REPLACE FUNCTION set_system_setting(
    p_key VARCHAR,
    p_value TEXT,
    p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE system_settings
    SET setting_value = p_value,
        updated_by = p_user_id,
        updated_at = NOW()
    WHERE setting_key = p_key;
    
    IF NOT FOUND THEN
        INSERT INTO system_settings (setting_key, setting_value, updated_by)
        VALUES (p_key, p_value, p_user_id);
    END IF;
END;
$$;

-- Function: toggle_maintenance_mode
-- Toggle maintenance mode
CREATE OR REPLACE FUNCTION toggle_maintenance_mode(
    p_enabled BOOLEAN,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    UPDATE system_settings
    SET setting_value = p_enabled::TEXT,
        updated_by = p_user_id,
        updated_at = NOW()
    WHERE setting_key = 'maintenance_mode';

    -- Send notification to all users
    IF p_enabled THEN
        INSERT INTO notification (user_id, title, message, type)
        SELECT id, 'Mode Pemeliharaan', 'Sistem sedang dalam mode pemeliharaan. Akses terbatas untuk admin.', 'warning'
        FROM pengguna
        WHERE role != 'superadmin';
    END IF;

    v_result := jsonb_build_object(
        'success', TRUE,
        'maintenance_mode', p_enabled,
        'message', CASE WHEN p_enabled THEN 'Mode pemeliharaan diaktifkan' ELSE 'Mode pemeliharaan dinonaktifkan' END
    );

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_system_setting TO authenticated;
GRANT EXECUTE ON FUNCTION set_system_setting TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_maintenance_mode TO authenticated;
