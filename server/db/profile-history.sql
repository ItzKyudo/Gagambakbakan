-- Apply once in the Supabase SQL editor before deploying the profile page.
-- History starts with newly completed matches; older aggregate totals cannot be split by mode.
CREATE TABLE IF NOT EXISTS public.match_history (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_slot TEXT NOT NULL CHECK (player_slot IN ('p1', 'p2')),
  mode TEXT NOT NULL CHECK (mode IN ('cpu', '2p', 'online', 'ranked')),
  opponent TEXT NOT NULL CHECK (char_length(opponent) <= 200),
  won BOOLEAN NOT NULL,
  rounds_won INTEGER NOT NULL CHECK (rounds_won BETWEEN 0 AND 2),
  rounds_lost INTEGER NOT NULL CHECK (rounds_lost BETWEEN 0 AND 2),
  played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (player_slot = 'p1' OR mode = '2p')
);
CREATE INDEX IF NOT EXISTS idx_match_history_player
  ON public.match_history(user_id, player_slot, played_at DESC, id DESC);
ALTER TABLE public.match_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read own match history" ON public.match_history;
CREATE POLICY "Read own match history" ON public.match_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Insert own match history" ON public.match_history;
CREATE POLICY "Insert own match history" ON public.match_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT ON public.match_history TO authenticated;
