-- =====================================================
-- 008 — Jarvis Gamification & RPG Engine
-- Creates tables user_stats, achievements, and user_quests.
-- Idempotent: safe to re-run in SQL Editor after partial apply.
-- =====================================================

-- 1. Create user_stats table
CREATE TABLE IF NOT EXISTS public.user_stats (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level             INTEGER NOT NULL DEFAULT 1,
  xp_foco           INTEGER NOT NULL DEFAULT 0,
  xp_vitalidade     INTEGER NOT NULL DEFAULT 0,
  xp_estabilidade   INTEGER NOT NULL DEFAULT 0,
  streak_saude      INTEGER NOT NULL DEFAULT 0,
  streak_foco       INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own stats" ON public.user_stats;
CREATE POLICY "Users read own stats"
  ON public.user_stats FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own stats" ON public.user_stats;
CREATE POLICY "Users update own stats"
  ON public.user_stats FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users insert own stats" ON public.user_stats;
CREATE POLICY "Users insert own stats"
  ON public.user_stats FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "service_role_insert_stats" ON public.user_stats;
CREATE POLICY "service_role_insert_stats"
  ON public.user_stats FOR INSERT
  WITH CHECK (true);

-- 2. Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key   TEXT NOT NULL,
  titulo            TEXT NOT NULL,
  descricao         TEXT NOT NULL,
  unlocked_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own achievements" ON public.achievements;
CREATE POLICY "Users read own achievements"
  ON public.achievements FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own achievements" ON public.achievements;
CREATE POLICY "Users insert own achievements"
  ON public.achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Create user_quests table
CREATE TABLE IF NOT EXISTS public.user_quests (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL,
  titulo        TEXT NOT NULL,
  recompensa_xp INTEGER NOT NULL,
  progresso     INTEGER NOT NULL DEFAULT 0,
  meta          INTEGER NOT NULL DEFAULT 1,
  concluida     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own quests" ON public.user_quests;
CREATE POLICY "Users read own quests"
  ON public.user_quests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own quests" ON public.user_quests;
CREATE POLICY "Users insert own quests"
  ON public.user_quests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own quests" ON public.user_quests;
CREATE POLICY "Users update own quests"
  ON public.user_quests FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own quests" ON public.user_quests;
CREATE POLICY "Users delete own quests"
  ON public.user_quests FOR DELETE
  USING (auth.uid() = user_id);

-- Grants (idempotent)
GRANT ALL ON public.user_stats TO authenticated;
GRANT ALL ON public.achievements TO authenticated;
GRANT ALL ON public.user_quests TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Signup trigger — also seeds user_stats
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nome_completo, email)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'nome_completo',
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(NEW.email, '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, public.profiles.email);

    INSERT INTO public.user_stats (id, level, xp_foco, xp_vitalidade, xp_estabilidade, streak_saude, streak_foco)
    VALUES (NEW.id, 1, 0, 0, 0, 0, 0)
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Backfill existing users
INSERT INTO public.user_stats (id, level, xp_foco, xp_vitalidade, xp_estabilidade, streak_saude, streak_foco)
SELECT id, 1, 0, 0, 0, 0, 0 FROM public.profiles
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
