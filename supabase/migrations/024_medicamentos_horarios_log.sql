-- 024 — Medicamentos: múltiplos horários + log de tomadas

ALTER TABLE public.medicamentos
  ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.medicamento_tomadas (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medicamento_id    INTEGER NOT NULL REFERENCES public.medicamentos(id) ON DELETE CASCADE,
  horario_previsto  TEXT NOT NULL,
  tomado_em         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_medicamento_tomadas_user_dia
  ON public.medicamento_tomadas (user_id, tomado_em DESC);

ALTER TABLE public.medicamento_tomadas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "medicamento_tomadas_own" ON public.medicamento_tomadas;
CREATE POLICY "medicamento_tomadas_own"
  ON public.medicamento_tomadas FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
