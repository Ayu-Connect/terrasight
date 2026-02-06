-- Add img_url column to detections table
ALTER TABLE detections ADD COLUMN IF NOT EXISTS img_url TEXT;
