-- =====================================================
-- 038 — Histórico de boletos pagos via Kanban
-- Idempotent (safe to re-run in SQL Editor)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.finance_bill_settlements (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tarefa_id     INTEGER REFERENCES public.tarefas_unificadas(id) ON DELETE SET NULL,
  bill_id       TEXT,
  titulo        TEXT NOT NULL,
  valor         NUMERIC(12, 2) NOT NULL DEFAULT 0,
  pago_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  origem        TEXT NOT NULL DEFAULT 'kanban',
  notas         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_fin_bill_settlements_user_pago
  ON public.finance_bill_settlements (user_id, pago_em DESC);

CREATE INDEX IF NOT EXISTS ix_fin_bill_settlements_tarefa
  ON public.finance_bill_settlements (user_id, tarefa_id)
  WHERE tarefa_id IS NOT NULL;

ALTER TABLE public.finance_bill_settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "finance_bill_settlements_select" ON public.finance_bill_settlements;
CREATE POLICY "finance_bill_settlements_select"
  ON public.finance_bill_settlements FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "finance_bill_settlements_insert" ON public.finance_bill_settlements;
CREATE POLICY "finance_bill_settlements_insert"
  ON public.finance_bill_settlements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "finance_bill_settlements_delete" ON public.finance_bill_settlements;
CREATE POLICY "finance_bill_settlements_delete"
  ON public.finance_bill_settlements FOR DELETE
  USING (auth.uid() = user_id);

GRANT ALL ON public.finance_bill_settlements TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

NOTIFY pgrst, 'reload schema';
