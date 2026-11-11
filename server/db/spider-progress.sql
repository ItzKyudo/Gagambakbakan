-- Run after competitive-integrity.sql. Existing account XP and skills stay with its saved spider.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spider_exp jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spider_skills jsonb NOT NULL DEFAULT '{}'::jsonb;
UPDATE public.profiles
SET spider_exp = jsonb_build_object(
  CASE WHEN looks->'p1'->>'species' IN ('weaver', 'hunter', 'guardian', 'wolf', 'lynx')
    THEN looks->'p1'->>'species' ELSE 'weaver' END,
  online_exp
), spider_skills = jsonb_build_object(
  CASE WHEN looks->'p1'->>'species' IN ('weaver', 'hunter', 'guardian', 'wolf', 'lynx')
    THEN looks->'p1'->>'species' ELSE 'weaver' END,
  COALESCE(unlocked_skills, '["dash"]'::jsonb)
)
WHERE spider_exp = '{}'::jsonb AND spider_skills = '{}'::jsonb;

GRANT UPDATE (spider_skills) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.record_battle_result(
  p_match_id uuid, p_p1 uuid, p_p2 uuid, p_winner integer,
  p_p1_rounds integer, p_p2_rounds integer, p_ranked boolean,
  p_p1_species text, p_p2_species text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_slot integer;
  v_id uuid;
  v_other uuid;
  v_species text;
  v_rounds integer;
  v_other_rounds integer;
  v_rating integer;
  v_wins integer;
  v_losses integer;
  v_matches integer;
  v_exp integer;
  v_gain integer;
  v_delta integer;
  v_rank text;
  v_rows integer;
BEGIN
  IF p_match_id IS NULL OR p_winner IS NULL OR p_winner NOT IN (0, 1) OR
     (p_p1 IS NULL AND p_p2 IS NULL) OR
     (p_p1 IS NOT NULL AND p_p1 = p_p2) OR
     p_p1_rounds IS NULL OR p_p2_rounds IS NULL OR p_ranked IS NULL OR
     p_p1_rounds NOT BETWEEN 0 AND 2 OR p_p2_rounds NOT BETWEEN 0 AND 2 OR
     p_p1_species IS NULL OR p_p2_species IS NULL OR
     p_p1_species NOT IN ('weaver', 'hunter', 'guardian', 'wolf', 'lynx') OR
     p_p2_species NOT IN ('weaver', 'hunter', 'guardian', 'wolf', 'lynx') THEN
    RAISE EXCEPTION 'Invalid battle result';
  END IF;
  INSERT INTO public.battle_result_receipts(match_id)
    VALUES (p_match_id) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN RETURN '{"already_recorded":true}'::jsonb; END IF;
  PERFORM 1 FROM public.profiles
    WHERE id IN (p_p1, p_p2) ORDER BY id FOR UPDATE;

  FOR v_slot IN 0..1 LOOP
    v_id := CASE WHEN v_slot = 0 THEN p_p1 ELSE p_p2 END;
    IF v_id IS NULL THEN CONTINUE; END IF;
    v_other := CASE WHEN v_slot = 0 THEN p_p2 ELSE p_p1 END;
    v_species := CASE WHEN v_slot = 0 THEN p_p1_species ELSE p_p2_species END;
    v_rounds := CASE WHEN v_slot = 0 THEN p_p1_rounds ELSE p_p2_rounds END;
    v_other_rounds := CASE WHEN v_slot = 0 THEN p_p2_rounds ELSE p_p1_rounds END;
    SELECT COALESCE(rating, 0), COALESCE(wins, 0), COALESCE(losses, 0),
           COALESCE(matches, 0), COALESCE(online_exp, 0)
      INTO v_rating, v_wins, v_losses, v_matches, v_exp
      FROM public.profiles WHERE id = v_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Battle profile missing'; END IF;
    v_delta := 0;
    IF p_ranked THEN
      v_delta := CASE
        WHEN v_rating >= 1600 THEN CASE WHEN v_slot = p_winner THEN 15 ELSE -20 END
        WHEN v_rating >= 800 THEN CASE WHEN v_slot = p_winner THEN 18 ELSE -18 END
        WHEN v_rating >= 300 THEN CASE WHEN v_slot = p_winner THEN 22 ELSE -15 END
        ELSE CASE WHEN v_slot = p_winner THEN 25 ELSE -10 END
      END;
    END IF;
    v_rating := greatest(0, v_rating + v_delta);
    v_rank := CASE WHEN v_rating >= 1600 THEN 'brown-widow'
                   WHEN v_rating >= 800 THEN 'philippine-tarantula'
                   WHEN v_rating >= 300 THEN 'huntsman-spider'
                   ELSE 'wolf-spider' END;
    v_wins := v_wins + CASE WHEN v_slot = p_winner THEN 1 ELSE 0 END;
    v_losses := v_losses + CASE WHEN v_slot = p_winner THEN 0 ELSE 1 END;
    v_matches := v_matches + 1;
    v_gain := 60 + CASE WHEN v_slot = p_winner THEN 100 ELSE 0 END + least(2, v_rounds) * 20;
    v_exp := v_exp + v_gain;
    UPDATE public.profiles SET
      rating = v_rating, rank = v_rank, wins = v_wins, losses = v_losses,
      matches = v_matches, win_rate = round(v_wins * 100.0 / v_matches),
      online_exp = v_exp,
      spider_exp = jsonb_set(COALESCE(spider_exp, '{}'::jsonb), ARRAY[v_species],
        to_jsonb(COALESCE((spider_exp->>v_species)::integer, 0) + v_gain), true),
      updated_at = now()
      WHERE id = v_id;
    INSERT INTO public.match_history
      (id, user_id, player_slot, mode, opponent, won, rounds_won, rounds_lost)
      VALUES (
        gen_random_uuid(), v_id, 'p1',
        CASE WHEN p_ranked THEN 'ranked' ELSE 'online' END,
        COALESCE((SELECT username FROM public.profiles WHERE id = v_other), 'Guest'),
        v_slot = p_winner, v_rounds, v_other_rounds
      );
  END LOOP;
  RETURN '{"recorded":true}'::jsonb;
END;
$$;
REVOKE ALL ON FUNCTION public.record_battle_result(uuid, uuid, uuid, integer, integer, integer, boolean, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_battle_result(uuid, uuid, uuid, integer, integer, integer, boolean, text, text)
  TO service_role;
