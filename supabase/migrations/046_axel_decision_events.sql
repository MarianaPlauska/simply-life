-- =====================================================
-- 046 — Histórico persistente de decisões do AXEL
-- =====================================================

CREATE TABLE IF NOT EXISTS public.axel_decision_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id     INTEGER,
  kind        TEXT NOT NULL CHECK (kind IN (
    'promoted_hoje',
    'deferred_load',
    'decay_backlog',
    'manual_override',
    'email_ingest'
  )),
  rationale   TEXT,
  score       INTEGER,
  horizon     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_axel_decision_events_user_at
  ON public.axel_decision_events (user_id, created_at DESC);

ALTER TABLE public.axel_decision_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS axel_decision_events_own ON public.axel_decision_events;
CREATE POLICY axel_decision_events_own ON public.axel_decision_events
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
