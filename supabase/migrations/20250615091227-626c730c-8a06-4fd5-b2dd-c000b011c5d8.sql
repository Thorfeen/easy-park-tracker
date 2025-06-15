
-- 1. Monthly Passes Table
CREATE TABLE public.monthly_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number TEXT NOT NULL,
  pass_type TEXT NOT NULL CHECK (pass_type IN ('basic', 'standard', 'premium')),
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('two-wheeler', 'three-wheeler', 'four-wheeler')),
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'suspended')),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Pass Holders (optional, for future use)
CREATE TABLE public.pass_holders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Parking Records Table
CREATE TABLE public.parking_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('two-wheeler', 'three-wheeler', 'four-wheeler')),
  entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
  exit_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  amount_due NUMERIC,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed')),
  is_pass_holder BOOLEAN DEFAULT false,
  pass_id uuid REFERENCES public.monthly_passes(id),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Row Level Security (RLS) for all tables

ALTER TABLE public.monthly_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_records ENABLE ROW LEVEL SECURITY;

-- Allow users to select, insert, update, delete their own monthly_passes
CREATE POLICY "User can access their monthly_passes"
  ON public.monthly_passes 
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow users to select, insert, update, delete their own pass_holders
CREATE POLICY "User can access their pass_holders"
  ON public.pass_holders 
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow users to select, insert, update, delete their own parking_records
CREATE POLICY "User can access their parking_records"
  ON public.parking_records 
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
