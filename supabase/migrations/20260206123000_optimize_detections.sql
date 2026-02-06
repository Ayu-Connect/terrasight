-- Migration: Optimize Detections Table
-- 1. Create Enums for stricter type safety
DO $$ BEGIN
    CREATE TYPE severity_level AS ENUM ('INFO', 'WARNING', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE detection_status AS ENUM ('PENDING', 'VERIFIED', 'IGNORED', 'RESOLVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add PostGIS Geometry Column
-- Ensure PostGIS is enabled (already done in previous migration, but good to be safe)
CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE detections 
ADD COLUMN IF NOT EXISTS location GEOMETRY(POINT, 4326);

-- 3. Migrate existing JSON coords to Geometry
-- Assumes coords -> 'lng' and 'lat' exist
UPDATE detections 
SET location = ST_SetSRID(ST_MakePoint((coords->>'lng')::float, (coords->>'lat')::float), 4326)
WHERE location IS NULL AND coords IS NOT NULL;

-- 4. Add Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_detections_location ON detections USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_detections_status ON detections (status);
CREATE INDEX IF NOT EXISTS idx_detections_created_at ON detections (created_at DESC);
