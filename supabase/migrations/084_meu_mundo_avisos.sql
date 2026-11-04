-- =====================================================
-- 084 - Meu Mundo: avisos pelo servidor (site / iPhone)
-- Guarda quais avisos já foram enviados, para não repetir.
-- Só o servidor (service role) lê e escreve.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.bloco_avisos_enviados (
  user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chave    TEXT NOT NULL,
  sent_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, chave)
);

CREATE INDEX IF NOT EXISTS ix_bloco_avisos_enviados_sent
  ON public.bloco_avisos_enviados (sent_at);

ALTER TABLE public.bloco_avisos_enviados ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
