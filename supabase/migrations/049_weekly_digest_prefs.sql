-- 049 — Preferências do resumo semanal (e-mail e/ou push)

CREATE TABLE IF NOT EXISTS public.user_weekly_digest_prefs (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled      BOOLEAN NOT NULL DEFAULT true,
  weekday      SMALLINT NOT NULL DEFAULT 1 CHECK (weekday BETWEEN 0 AND 6),
  channel      TEXT NOT NULL DEFAULT 'both' CHECK (channel IN ('push', 'email', 'both')),
  last_sent_at TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.user_weekly_digest_prefs.weekday IS
  '0=domingo … 6=sábado, avaliado em America/Sao_Paulo no cron diário 09:00 UTC.';

ALTER TABLE public.user_weekly_digest_prefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_weekly_digest_prefs_own ON public.user_weekly_digest_prefs;
CREATE POLICY user_weekly_digest_prefs_own ON public.user_weekly_digest_prefs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

GRANT ALL ON public.user_weekly_digest_prefs TO authenticated;
GRANT ALL ON public.user_weekly_digest_prefs TO service_role;

NOTIFY pgrst, 'reload schema';
