-- Ouro do herói + recompensas da vida real

ALTER TABLE public.user_stats
  ADD COLUMN IF NOT EXISTS ouro INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.recompensas_irl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  custo INTEGER NOT NULL DEFAULT 30,
  claimed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recompensas_irl ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own irl rewards" ON public.recompensas_irl;
CREATE POLICY "Users read own irl rewards"
  ON public.recompensas_irl FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own irl rewards" ON public.recompensas_irl;
CREATE POLICY "Users insert own irl rewards"
  ON public.recompensas_irl FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own irl rewards" ON public.recompensas_irl;
CREATE POLICY "Users update own irl rewards"
  ON public.recompensas_irl FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own irl rewards" ON public.recompensas_irl;
CREATE POLICY "Users delete own irl rewards"
  ON public.recompensas_irl FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recompensas_irl TO authenticated;

NOTIFY pgrst, 'reload schema';
