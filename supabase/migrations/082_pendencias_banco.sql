-- =====================================================
-- 082 - Tudo o que faltava no banco ao vivo (checado em 2026-11-03)
-- Junta 050, 051, 052 e 079, que nunca foram rodadas, e cria a coluna
-- estimativa_minutos (o app grava ao criar tarefa e nenhuma migracao criava).
-- Pode rodar mais de uma vez: tudo usa IF NOT EXISTS / DROP IF EXISTS.
-- =====================================================

-- Tarefas: tempo estimado
ALTER TABLE public.tarefas_unificadas
  ADD COLUMN IF NOT EXISTS estimativa_minutos INTEGER NOT NULL DEFAULT 30;

-- ---------- de 050_ouro_recompensas_irl.sql ----------
-- Ouro do herói + recompensas da vida real

ALTER TABLE public.user_stats
  ADD COLUMN IF NOT EXISTS ouro INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.recompensas_irl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  custo INTEGER NOT NULL DEFAULT 30,
  claimed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recompensas_irl ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own irl rewards" ON public.recompensas_irl;
CREATE POLICY "Users read own irl rewards"
  ON public.recompensas_irl FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own irl rewards" ON public.recompensas_irl;
CREATE POLICY "Users insert own irl rewards"
  ON public.recompensas_irl FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own irl rewards" ON public.recompensas_irl;
CREATE POLICY "Users update own irl rewards"
  ON public.recompensas_irl FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own irl rewards" ON public.recompensas_irl;
CREATE POLICY "Users delete own irl rewards"
  ON public.recompensas_irl FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recompensas_irl TO authenticated;

NOTIFY pgrst, 'reload schema';

-- ---------- de 051_push_snoozes.sql ----------
-- Soneca de push — permite reenviar após o prazo

CREATE TABLE IF NOT EXISTS public.push_snoozes (
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snooze_key    TEXT NOT NULL,
  snooze_until  TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, snooze_key)
);

CREATE INDEX IF NOT EXISTS ix_push_snoozes_until ON public.push_snoozes (snooze_until);

ALTER TABLE public.push_snoozes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_snoozes_deny ON public.push_snoozes;
CREATE POLICY push_snoozes_deny
  ON public.push_snoozes FOR ALL
  USING (false);

NOTIFY pgrst, 'reload schema';

-- ---------- de 052_push_expo_provider.sql ----------
-- Push Expo: provider/platform em push_subscriptions (endpoint = token Expo)
-- Aplicar no projeto Simply-Life (zuxkqmooxvnulgllduhr)

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'web';

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS platform TEXT;

COMMENT ON COLUMN public.push_subscriptions.provider IS 'web | expo';
COMMENT ON COLUMN public.push_subscriptions.platform IS 'ios | android | web';

-- Índice para fan-out por provedor
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_provider
  ON public.push_subscriptions (provider);

-- ---------- de 079_foco_sessao.sql ----------
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

NOTIFY pgrst, 'reload schema';
