-- =====================================================
-- 008 — Jarvis Gamification & RPG Engine
-- Creates tables user_stats, achievements, and user_quests.
-- Habilitates RLS policies.
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

-- Enable RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Policies for user_stats
CREATE POLICY "Users read own stats"
  ON public.user_stats FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users update own stats"
  ON public.user_stats FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users insert own stats"
  ON public.user_stats FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow service role inserts (for triggers)
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

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Policies for achievements
CREATE POLICY "Users read own achievements"
  ON public.achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own achievements"
  ON public.achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Create user_quests table
CREATE TABLE IF NOT EXISTS public.user_quests (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL, -- 'diaria' | 'semanal'
  titulo        TEXT NOT NULL,
  recompensa_xp INTEGER NOT NULL,
  progresso     INTEGER NOT NULL DEFAULT 0,
  meta          INTEGER NOT NULL DEFAULT 1,
  concluida     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;

-- Policies for user_quests
CREATE POLICY "Users read own quests"
  ON public.user_quests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own quests"
  ON public.user_quests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own quests"
  ON public.user_quests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own quests"
  ON public.user_quests FOR DELETE
  USING (auth.uid() = user_id);

-- Grant privileges
GRANT ALL ON public.user_stats TO authenticated;
GRANT ALL ON public.achievements TO authenticated;
GRANT ALL ON public.user_quests TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Update signup trigger function handle_new_user to also initialize user_stats
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- profiles insertion
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

    -- user_stats insertion
    INSERT INTO public.user_stats (id, level, xp_foco, xp_vitalidade, xp_estabilidade, streak_saude, streak_foco)
    VALUES (NEW.id, 1, 0, 0, 0, 0, 0)
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Backfill existing users into user_stats
INSERT INTO public.user_stats (id, level, xp_foco, xp_vitalidade, xp_estabilidade, streak_saude, streak_foco)
SELECT id, 1, 0, 0, 0, 0, 0 FROM public.profiles
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
