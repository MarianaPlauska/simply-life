-- =====================================================
-- 079 — Sessão de foco em silêncio
-- Duas pessoas do Círculo combinam um horário. Não há tarefa, câmera nem texto.
-- O foco junto que já existe (focando_ate) continua separado.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.foco_sessoes (
  id          UUID PRIMARY KEY,
  anfitriao   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  convidado   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inicio      TIMESTAMPTZ NOT NULL,
  fim         TIMESTAMPTZ NOT NULL,
  estado      TEXT NOT NULL DEFAULT 'convite'
              CHECK (estado IN ('convite', 'ativa', 'encerrada', 'recusada')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (convidado <> anfitriao),
  CHECK (fim > inicio)
);

CREATE INDEX IF NOT EXISTS ix_foco_sessoes_anfitriao ON public.foco_sessoes (anfitriao, fim DESC);
CREATE INDEX IF NOT EXISTS ix_foco_sessoes_convidado ON public.foco_sessoes (convidado, fim DESC);

ALTER TABLE public.foco_sessoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS foco_sessoes_select ON public.foco_sessoes;
CREATE POLICY foco_sessoes_select ON public.foco_sessoes
  FOR SELECT USING (auth.uid() = anfitriao OR auth.uid() = convidado);

DROP POLICY IF EXISTS foco_sessoes_insert ON public.foco_sessoes;
CREATE POLICY foco_sessoes_insert ON public.foco_sessoes
  FOR INSERT WITH CHECK (auth.uid() = anfitriao AND convidado <> anfitriao);

DROP POLICY IF EXISTS foco_sessoes_update ON public.foco_sessoes;
CREATE POLICY foco_sessoes_update ON public.foco_sessoes
  FOR UPDATE USING (auth.uid() = anfitriao OR auth.uid() = convidado)
  WITH CHECK (auth.uid() = anfitriao OR auth.uid() = convidado);

GRANT SELECT, INSERT, UPDATE ON public.foco_sessoes TO authenticated;

CREATE OR REPLACE FUNCTION public.foco_sessoes_so_estado()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.anfitriao <> OLD.anfitriao
     OR NEW.convidado <> OLD.convidado
     OR NEW.inicio <> OLD.inicio
     OR NEW.fim <> OLD.fim
     OR NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'só o estado da sessão pode mudar';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS foco_sessoes_so_estado ON public.foco_sessoes;
CREATE TRIGGER foco_sessoes_so_estado
  BEFORE UPDATE ON public.foco_sessoes
  FOR EACH ROW EXECUTE FUNCTION public.foco_sessoes_so_estado();
