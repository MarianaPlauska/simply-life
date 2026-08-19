-- =====================================================
-- 044 — Override manual de horizonte + ref externa de ingestão
-- Idempotent (safe to re-run in SQL Editor)
-- =====================================================

ALTER TABLE public.tarefas_unificadas
  ADD COLUMN IF NOT EXISTS horizon_override TEXT,
  ADD COLUMN IF NOT EXISTS external_ref TEXT;

ALTER TABLE public.tarefas_unificadas
  DROP CONSTRAINT IF EXISTS tarefas_horizon_override_check;

ALTER TABLE public.tarefas_unificadas
  ADD CONSTRAINT tarefas_horizon_override_check
  CHECK (
    horizon_override IS NULL
    OR horizon_override IN ('hoje', 'semana', 'backlog')
  );

COMMENT ON COLUMN public.tarefas_unificadas.horizon_override IS
  'Horizonte fixado pelo usuário (drag). O pipeline AXEL não sobrescreve até Recalcular.';

COMMENT ON COLUMN public.tarefas_unificadas.external_ref IS
  'Identificador estável da origem (IMAP UID, webhook id). Evita duplicar a mesma demanda.';

CREATE UNIQUE INDEX IF NOT EXISTS ux_tarefas_user_external_ref
  ON public.tarefas_unificadas (user_id, external_ref)
  WHERE external_ref IS NOT NULL AND deletado_em IS NULL;

NOTIFY pgrst, 'reload schema';
