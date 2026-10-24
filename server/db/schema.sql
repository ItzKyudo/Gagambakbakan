-- Supabase PostgreSQL Migration for Gagambakbakan
-- Handles Battlefields stats (matches, win rate, wins, losses), competitive ranking,
-- ability EXP points, unlocked skills web, and spider customization persistence.

-- 1. Create or extend the public.profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  rating INTEGER DEFAULT 0 NOT NULL,
  rank TEXT DEFAULT 'wolf-spider' NOT NULL,
  wins INTEGER DEFAULT 0 NOT NULL,
  losses INTEGER DEFAULT 0 NOT NULL,
  matches INTEGER DEFAULT 0 NOT NULL,
  win_rate INTEGER DEFAULT 0 NOT NULL,
  online_exp INTEGER DEFAULT 0 NOT NULL,
  unlocked_skills JSONB DEFAULT '["dash"]'::jsonb,
  looks JSONB DEFAULT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add columns if profiles table already exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rank TEXT DEFAULT 'wolf-spider';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS matches INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS win_rate INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS online_exp INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unlocked_skills JSONB DEFAULT '["dash"]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS looks JSONB DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Indexes for fast leaderboard, ranking & matchmaking queries
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON public.profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_rank ON public.profiles(rank);

-- 3. Row Level Security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read of all profiles (leaderboards, matchmaking, opponent display)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone'
  ) THEN
    CREATE POLICY "Public profiles are viewable by everyone"
      ON public.profiles FOR SELECT USING (true);
  END IF;
END $$;

-- Allow users to update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Allow users to insert their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 4. Automatic profile initialization trigger upon user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    rating,
    rank,
    wins,
    losses,
    matches,
    win_rate,
    online_exp,
    unlocked_skills,
    looks
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'Player_' || SUBSTRING(NEW.id::text FROM 1 FOR 6)),
    COALESCE((NEW.raw_user_meta_data->>'rating')::int, 0),
    COALESCE(NEW.raw_user_meta_data->>'rank', 'wolf-spider'),
    COALESCE((NEW.raw_user_meta_data->>'wins')::int, 0),
    COALESCE((NEW.raw_user_meta_data->>'losses')::int, 0),
    COALESCE((NEW.raw_user_meta_data->>'matches')::int, 0),
    COALESCE((NEW.raw_user_meta_data->>'win_rate')::int, 0),
    COALESCE((NEW.raw_user_meta_data->>'onlineExp')::int, (NEW.raw_user_meta_data->>'online_exp')::int, 0),
    COALESCE(NEW.raw_user_meta_data->'unlockedSkills', NEW.raw_user_meta_data->'unlocked_skills', '["dash"]'::jsonb),
    NEW.raw_user_meta_data->'looks'
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

