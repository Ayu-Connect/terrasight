-- Create detections table
CREATE TABLE IF NOT EXISTS detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  coords JSONB NOT NULL,
  violation_type TEXT,
  law_section TEXT,
  severity TEXT,
  status TEXT DEFAULT 'PENDING',
  blockchain_hash TEXT
);

-- Enable RLS
ALTER TABLE detections ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all access (since this is a demo/mock)
CREATE POLICY "Allow all access" ON detections
  FOR ALL USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE detections;
