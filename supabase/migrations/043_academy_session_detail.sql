-- =====================================================
-- 043 — Academia: detalhe estruturado por sessão de treino
-- Idempotent (safe to re-run in SQL Editor)
-- =====================================================

ALTER TABLE public.sessoes_treino
  ADD COLUMN IF NOT EXISTS treino_codigo TEXT,
  ADD COLUMN IF NOT EXISTS volume_kg NUMERIC,
  ADD COLUMN IF NOT EXISTS detalhe JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.sessoes_treino.treino_codigo IS 'Código estável do treino (A, B, 01…) no plano do usuário';
COMMENT ON COLUMN public.sessoes_treino.volume_kg IS 'Volume total da sessão: soma de (peso_kg × reps) por série';
COMMENT ON COLUMN public.sessoes_treino.detalhe IS 'JSON com exercícios, séries, cargas e totais da sessão';

DROP INDEX IF EXISTS ix_sessoes_treino_user_finalizado;
CREATE INDEX IF NOT EXISTS ix_sessoes_treino_user_finalizado
  ON public.sessoes_treino (user_id, finalizado_em DESC NULLS LAST)
  WHERE finalizado_em IS NOT NULL;

NOTIFY pgrst, 'reload schema';
