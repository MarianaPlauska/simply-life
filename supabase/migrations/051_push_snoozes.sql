-- Soneca de push — permite reenviar após o prazo

CREATE TABLE IF NOT EXISTS public.push_snoozes (
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snooze_key    TEXT NOT NULL,
  snooze_until  TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, snooze_key)
);

CREATE INDEX IF NOT EXISTS ix_push_snoozes_until ON public.push_snoozes (snooze_until);

ALTER TABLE public.push_snoozes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_snoozes_deny ON public.push_snoozes;
CREATE POLICY push_snoozes_deny
  ON public.push_snoozes FOR ALL
  USING (false);

NOTIFY pgrst, 'reload schema';
