-- =====================================================
-- 058 — Replanejamento do quadro (Fase 2 do orquestrador)
-- Novos tipos de decisão + dados para "Desfazer"
-- =====================================================

-- defensivo: cria a tabela se o banco não tiver a 046
CREATE TABLE IF NOT EXISTS public.axel_decision_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id     INTEGER,
  kind        TEXT NOT NULL,
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
GRANT ALL ON public.axel_decision_events TO authenticated;

ALTER TABLE public.axel_decision_events
  DROP CONSTRAINT IF EXISTS axel_decision_events_kind_check;

ALTER TABLE public.axel_decision_events
  ADD CONSTRAINT axel_decision_events_kind_check CHECK (kind IN (
    'promoted_hoje',
    'deferred_load',
    'decay_backlog',
    'manual_override',
    'email_ingest',
    'rescued_overdue',
    'pulled_forward',
    'undo'
  ));

-- lote de movimentos de uma mesma rodada (desfazer tudo de uma vez)
ALTER TABLE public.axel_decision_events ADD COLUMN IF NOT EXISTS batch_id   UUID;
ALTER TABLE public.axel_decision_events ADD COLUMN IF NOT EXISTS trigger    TEXT;
ALTER TABLE public.axel_decision_events ADD COLUMN IF NOT EXISTS from_date  DATE;
ALTER TABLE public.axel_decision_events ADD COLUMN IF NOT EXISTS to_date    DATE;
ALTER TABLE public.axel_decision_events ADD COLUMN IF NOT EXISTS undone_at  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS ix_axel_decision_events_batch
  ON public.axel_decision_events (batch_id)
  WHERE batch_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
