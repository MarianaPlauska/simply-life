-- =====================================================
-- 009 — Saúde: sessões de treino + config em hábitos
-- Idempotent (safe to re-run in SQL Editor)
-- =====================================================

ALTER TABLE public.habitos_diarios
  ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.sessoes_treino (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habito_id         INTEGER REFERENCES public.habitos_diarios(id) ON DELETE SET NULL,
  tipo_treino       TEXT NOT NULL,
  meta_minutos      INTEGER NOT NULL DEFAULT 30,
  iniciado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalizado_em     TIMESTAMPTZ,
  duracao_real_min  INTEGER,
  concluido         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP INDEX IF EXISTS ix_sessoes_treino_user_dia;
CREATE INDEX IF NOT EXISTS ix_sessoes_treino_user_created
  ON public.sessoes_treino (user_id, created_at DESC);

ALTER TABLE public.sessoes_treino ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sessoes_treino_select" ON public.sessoes_treino;
CREATE POLICY "sessoes_treino_select"
  ON public.sessoes_treino FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "sessoes_treino_insert" ON public.sessoes_treino;
CREATE POLICY "sessoes_treino_insert"
  ON public.sessoes_treino FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sessoes_treino_update" ON public.sessoes_treino;
CREATE POLICY "sessoes_treino_update"
  ON public.sessoes_treino FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "sessoes_treino_delete" ON public.sessoes_treino;
CREATE POLICY "sessoes_treino_delete"
  ON public.sessoes_treino FOR DELETE
  USING (auth.uid() = user_id);

GRANT ALL ON public.sessoes_treino TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

NOTIFY pgrst, 'reload schema';
