-- =====================================================
-- 070 — Esperas das tarefas
-- Períodos em que a tarefa dependia de outra pessoa (fazer, responder,
-- aprovar, enviar). Base do relatório "por que demorou".
-- O id vem do app (uuid gerado no aparelho) para funcionar offline.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tarefa_esperas (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tarefa_id   INTEGER REFERENCES public.tarefas_unificadas(id) ON DELETE CASCADE,
  pessoa      TEXT NOT NULL CHECK (char_length(pessoa) BETWEEN 1 AND 80),
  motivo      TEXT NOT NULL DEFAULT 'fazer'
              CHECK (motivo IN ('fazer', 'responder', 'aprovar', 'enviar', 'outro')),
  canal       TEXT CHECK (canal IN ('whatsapp', 'email', 'telefone', 'pessoalmente', 'outro')),
  desde       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ate         TIMESTAMPTZ,
  cobrancas   TIMESTAMPTZ[] NOT NULL DEFAULT '{}',
  nota        TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ate IS NULL OR ate >= desde)
);

CREATE INDEX IF NOT EXISTS ix_tarefa_esperas_user_desde
  ON public.tarefa_esperas (user_id, desde DESC);

CREATE INDEX IF NOT EXISTS ix_tarefa_esperas_abertas
  ON public.tarefa_esperas (user_id, tarefa_id)
  WHERE ate IS NULL;

ALTER TABLE public.tarefa_esperas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tarefa_esperas_own ON public.tarefa_esperas;
CREATE POLICY tarefa_esperas_own ON public.tarefa_esperas
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarefa_esperas TO authenticated;
