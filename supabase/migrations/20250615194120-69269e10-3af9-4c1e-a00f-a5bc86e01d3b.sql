
-- 1. Create table for monthly passes
CREATE TABLE public.monthly_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number TEXT NOT NULL,
  pass_type TEXT NOT NULL,  -- cycle, two-wheeler, three-wheeler, four-wheeler
  vehicle_type TEXT NOT NULL,  -- for redundancy and filtering
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL, -- active, expired, suspended
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. (Optional/future extensibility) Table for pass holders - not required for now
-- CREATE TABLE public.pass_holders (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   name TEXT NOT NULL,
--   phone TEXT NOT NULL,
--   email TEXT,
--   address TEXT,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
-- );

-- 3. Enable Row Level Security (RLS) on monthly_passes
ALTER TABLE public.monthly_passes ENABLE ROW LEVEL SECURITY;

-- 4. Allow all users full access for now (can restrict/extend later)
CREATE POLICY "Allow read for everyone"
  ON public.monthly_passes
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users"
  ON public.monthly_passes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users"
  ON public.monthly_passes
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow delete for authenticated users"
  ON public.monthly_passes
  FOR DELETE
  TO authenticated
  USING (true);
