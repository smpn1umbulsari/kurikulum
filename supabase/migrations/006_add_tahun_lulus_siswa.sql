-- Migration: Add tahun_lulus field to siswa table
-- Date: 15 Juni 2026
-- Purpose: Track graduation year for alumni students

-- Add tahun_lulus column to siswa table
ALTER TABLE siswa 
ADD COLUMN IF NOT EXISTS tahun_lulus INTEGER;

-- Add index for faster alumni queries
CREATE INDEX IF NOT EXISTS idx_siswa_tahun_lulus ON siswa(tahun_lulus) 
WHERE tahun_lulus IS NOT NULL;

-- Add index for alumni filtering
CREATE INDEX IF NOT EXISTS idx_siswa_status_alumni ON siswa(status) 
WHERE status = 'alumni';

-- Add check constraint for valid graduation year
ALTER TABLE siswa DROP CONSTRAINT IF EXISTS chk_tahun_lulus_range;
ALTER TABLE siswa 
ADD CONSTRAINT chk_tahun_lulus_range 
CHECK (tahun_lulus IS NULL OR (tahun_lulus >= 2000 AND tahun_lulus <= EXTRACT(YEAR FROM CURRENT_DATE) + 1));

-- Add trigger to auto-set tahun_lulus when status changes to alumni
CREATE OR REPLACE FUNCTION set_tahun_lulus_on_alumni()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'alumni' AND OLD.status != 'alumni' AND NEW.tahun_lulus IS NULL THEN
        NEW.tahun_lulus := EXTRACT(YEAR FROM CURRENT_DATE);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_tahun_lulus_on_alumni ON siswa;
CREATE TRIGGER trigger_set_tahun_lulus_on_alumni
    BEFORE UPDATE ON siswa
    FOR EACH ROW
    EXECUTE FUNCTION set_tahun_lulus_on_alumni();

-- Update RLS policies to include tahun_lulus
-- (RLS policies should already exist, this is a no-op for reference)

COMMENT ON COLUMN siswa.tahun_lulus IS 'Tahun lulus siswa, diisi otomatis saat status改为alumni';
