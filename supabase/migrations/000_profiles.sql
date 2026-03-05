-- Profiles table: stores user gender for matchmaking
-- Run this in the Supabase SQL Editor BEFORE 001_token_system.sql

CREATE TABLE IF NOT EXISTS public.profiles (
  id     UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email  TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female'))
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
