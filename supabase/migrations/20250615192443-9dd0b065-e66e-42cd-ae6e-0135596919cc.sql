
-- Create the parking_records table to store all vehicle entry/exit records
CREATE TABLE public.parking_records (
  id BIGSERIAL PRIMARY KEY,
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
  exit_time TIMESTAMP WITH TIME ZONE,
  duration INT,
  amount_due NUMERIC,
  status TEXT NOT NULL, -- 'active' or 'completed'
  is_pass_holder BOOLEAN,
  pass_id TEXT,
  calculation_breakdown JSONB,
  helmet BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security (RLS) for future permission control
ALTER TABLE public.parking_records ENABLE ROW LEVEL SECURITY;

-- Add a permissive RLS policy so you can read/write all rows for now
CREATE POLICY "Allow all access for now"
  ON public.parking_records
  FOR ALL
  USING (true)
  WITH CHECK (true);
