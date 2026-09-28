-- =====================================================
-- 066 · Academia: rotinas de treino (modelos) sem limite
-- Cada rotina guarda a lista de exercícios em JSONB:
--   [{ exerciseId, name, group, bodyweight, sets, reps, cargaKg, restSec }]
-- As sessões feitas continuam em sessoes_treino (detalhe + volume_kg).
-- Idempotente: pode rodar de novo no SQL Editor sem estragar nada.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.treino_rotinas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id    TEXT NOT NULL,
  nome        TEXT NOT NULL,
  exercicios  JSONB NOT NULL DEFAULT '[]'::jsonb,
  ordem       INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.treino_rotinas IS 'Rotinas (modelos) de treino do usuário, sem limite de quantidade';
COMMENT ON COLUMN public.treino_rotinas.local_id IS 'Id gerado no app; permite upsert idempotente vindo do modo offline';
COMMENT ON COLUMN public.treino_rotinas.exercicios IS 'Lista de exercícios com séries, reps, carga e descanso sugeridos';

CREATE UNIQUE INDEX IF NOT EXISTS ux_treino_rotinas_user_local
  ON public.treino_rotinas (user_id, local_id);

CREATE INDEX IF NOT EXISTS ix_treino_rotinas_user_updated
  ON public.treino_rotinas (user_id, updated_at DESC);

ALTER TABLE public.treino_rotinas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "treino_rotinas_select" ON public.treino_rotinas;
CREATE POLICY "treino_rotinas_select"
  ON public.treino_rotinas FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "treino_rotinas_insert" ON public.treino_rotinas;
CREATE POLICY "treino_rotinas_insert"
  ON public.treino_rotinas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "treino_rotinas_update" ON public.treino_rotinas;
CREATE POLICY "treino_rotinas_update"
  ON public.treino_rotinas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "treino_rotinas_delete" ON public.treino_rotinas;
CREATE POLICY "treino_rotinas_delete"
  ON public.treino_rotinas FOR DELETE
  USING (auth.uid() = user_id);

GRANT ALL ON public.treino_rotinas TO authenticated;

-- Sessões vindas do app: evita duplicar quando o envio offline é repetido
CREATE INDEX IF NOT EXISTS ix_sessoes_treino_user_local
  ON public.sessoes_treino (user_id, ((detalhe->>'local_id')));

NOTIFY pgrst, 'reload schema';
