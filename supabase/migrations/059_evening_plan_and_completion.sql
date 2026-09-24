-- =====================================================
-- 059 — Ritual da noite + registro de conclusão
-- 1) tarefas_unificadas.concluido_em: quando a tarefa foi concluída de fato
--    (antes os relatórios só tinham a data de vencimento)
-- 2) daily_plans: o plano de amanhã feito à noite (check-in + essenciais)
-- =====================================================

ALTER TABLE public.tarefas_unificadas
  ADD COLUMN IF NOT EXISTS concluido_em TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.tarefas_set_concluido_em()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IN ('concluido', 'concluida', 'done')
     AND (TG_OP = 'INSERT' OR COALESCE(OLD.status, '') NOT IN ('concluido', 'concluida', 'done'))
  THEN
    NEW.concluido_em := COALESCE(NEW.concluido_em, now());
  ELSIF NEW.status NOT IN ('concluido', 'concluida', 'done') THEN
    NEW.concluido_em := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tarefas_concluido_em ON public.tarefas_unificadas;
CREATE TRIGGER trg_tarefas_concluido_em
  BEFORE INSERT OR UPDATE OF status ON public.tarefas_unificadas
  FOR EACH ROW EXECUTE FUNCTION public.tarefas_set_concluido_em();

CREATE INDEX IF NOT EXISTS ix_tarefas_user_concluido_em
  ON public.tarefas_unificadas (user_id, concluido_em DESC)
  WHERE concluido_em IS NOT NULL;

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.daily_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date       DATE NOT NULL,                 -- o dia planejado (amanhã)
  mode            TEXT NOT NULL CHECK (mode IN ('cuidado', 'gentil', 'normal')),
  mood            SMALLINT CHECK (mood BETWEEN 1 AND 5),
  energy          TEXT CHECK (energy IN ('baixa', 'media', 'alta')),
  anxiety         SMALLINT CHECK (anxiety BETWEEN 0 AND 3),
  essential_ids   TEXT[] NOT NULL DEFAULT '{}',
  planned_ids     TEXT[] NOT NULL DEFAULT '{}',
  capacity_min    INTEGER,
  planned_min     INTEGER,
  worries_count   SMALLINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan_date)
);

ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS daily_plans_own ON public.daily_plans;
CREATE POLICY daily_plans_own ON public.daily_plans
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
