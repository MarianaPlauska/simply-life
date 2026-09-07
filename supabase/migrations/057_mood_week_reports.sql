-- 057 — Cache de relatório semanal de humor (IA AXEL)

CREATE TABLE IF NOT EXISTS public.mood_week_reports (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end   DATE NOT NULL,
  payload    JSONB NOT NULL,
  source     TEXT NOT NULL DEFAULT 'ai'
    CHECK (source IN ('ai', 'local', 'groq', 'gemini', 'cache')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, week_start)
);

COMMENT ON TABLE public.mood_week_reports IS
  'Relatório semanal de humor gerado por IA — uma linha por usuário e semana (domingo inicial).';

ALTER TABLE public.mood_week_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mood_week_reports_own ON public.mood_week_reports;
CREATE POLICY mood_week_reports_own ON public.mood_week_reports
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

GRANT ALL ON public.mood_week_reports TO authenticated;
GRANT ALL ON public.mood_week_reports TO service_role;

NOTIFY pgrst, 'reload schema';
