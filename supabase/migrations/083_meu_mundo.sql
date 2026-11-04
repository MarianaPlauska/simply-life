-- =====================================================
-- 083 - Meu Mundo
-- Blocos da agenda (compromisso fixo ou tempo flexível), com repetição,
-- aviso e cor. bloco_marcas guarda o que aconteceu num dia específico
-- (feito, pulado, mudou de hora). O id vem do app para funcionar offline.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.blocos (
  id                UUID PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo            TEXT NOT NULL CHECK (char_length(titulo) BETWEEN 1 AND 120),
  tipo              TEXT NOT NULL DEFAULT 'fixo' CHECK (tipo IN ('fixo', 'flexivel')),
  data_inicio       DATE NOT NULL,
  hora_minutos      INTEGER CHECK (hora_minutos BETWEEN 0 AND 1439),
  duracao_minutos   INTEGER NOT NULL DEFAULT 30 CHECK (duracao_minutos BETWEEN 5 AND 1440),
  repete            TEXT NOT NULL DEFAULT 'nao' CHECK (repete IN ('nao', 'diario', 'semanal')),
  dias_semana       INTEGER[] NOT NULL DEFAULT '{}',
  intervalo_semanas INTEGER NOT NULL DEFAULT 1 CHECK (intervalo_semanas BETWEEN 1 AND 12),
  repete_ate        DATE,
  aviso_minutos     INTEGER CHECK (aviso_minutos BETWEEN 0 AND 1440),
  aviso_fim         BOOLEAN NOT NULL DEFAULT false,
  cor               TEXT,
  categoria         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deletado_em       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_blocos_user
  ON public.blocos (user_id)
  WHERE deletado_em IS NULL;

CREATE TABLE IF NOT EXISTS public.bloco_marcas (
  bloco_id      UUID NOT NULL REFERENCES public.blocos(id) ON DELETE CASCADE,
  dia           DATE NOT NULL,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status        TEXT CHECK (status IN ('feito', 'pulado')),
  hora_minutos  INTEGER CHECK (hora_minutos BETWEEN 0 AND 1439),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (bloco_id, dia)
);

CREATE INDEX IF NOT EXISTS ix_bloco_marcas_user_dia
  ON public.bloco_marcas (user_id, dia);

ALTER TABLE public.blocos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloco_marcas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS blocos_own ON public.blocos;
CREATE POLICY blocos_own ON public.blocos
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS bloco_marcas_own ON public.bloco_marcas;
CREATE POLICY bloco_marcas_own ON public.bloco_marcas
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- mesma trava de dois fatores das outras tabelas (075)
DROP POLICY IF EXISTS mfa_aal2 ON public.blocos;
CREATE POLICY mfa_aal2 ON public.blocos AS RESTRICTIVE FOR ALL TO authenticated
  USING ((SELECT public.mfa_session_ok())) WITH CHECK ((SELECT public.mfa_session_ok()));
DROP POLICY IF EXISTS mfa_aal2 ON public.bloco_marcas;
CREATE POLICY mfa_aal2 ON public.bloco_marcas AS RESTRICTIVE FOR ALL TO authenticated
  USING ((SELECT public.mfa_session_ok())) WITH CHECK ((SELECT public.mfa_session_ok()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bloco_marcas TO authenticated;

NOTIFY pgrst, 'reload schema';
