-- =====================================================
-- 007 — Active Context Orchestrator
-- Adds financial due dates, fixed bills, and
-- semantic context grouping.
-- =====================================================

-- 1. Add dia_vencimento column to fin_cartoes
ALTER TABLE fin_cartoes
  ADD COLUMN IF NOT EXISTS dia_vencimento INTEGER DEFAULT NULL;

COMMENT ON COLUMN fin_cartoes.dia_vencimento
  IS 'Dia do mês em que a fatura vence (1-31)';

-- =====================================================
-- 2. Fixed recurring bills (aluguel, luz, internet...)
-- =====================================================
CREATE TABLE IF NOT EXISTS fin_contas_fixas (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  valor       NUMERIC(12,2) NOT NULL DEFAULT 0,
  dia_vencimento INTEGER NOT NULL DEFAULT 1,
  categoria   TEXT NOT NULL DEFAULT 'outros',
  ativa       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE fin_contas_fixas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users read own contas fixas"
  ON fin_contas_fixas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own contas fixas"
  ON fin_contas_fixas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own contas fixas"
  ON fin_contas_fixas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own contas fixas"
  ON fin_contas_fixas FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON fin_contas_fixas TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- 3. Context grouping tables
-- =====================================================
CREATE TABLE IF NOT EXISTS contextos (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  cor         TEXT NOT NULL DEFAULT '#8b5cf6',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contextos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own contextos"
  ON contextos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own contextos"
  ON contextos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own contextos"
  ON contextos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own contextos"
  ON contextos FOR DELETE
  USING (auth.uid() = user_id);

GRANT ALL ON contextos TO authenticated;

-- =====================================================
-- 4. Context items (many-to-many join table)
-- =====================================================
CREATE TABLE IF NOT EXISTS contexto_itens (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  contexto_id   BIGINT NOT NULL REFERENCES contextos(id) ON DELETE CASCADE,
  tarefa_id     BIGINT REFERENCES tarefas_unificadas(id) ON DELETE CASCADE,
  tipo_item     TEXT NOT NULL DEFAULT 'tarefa',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contexto_id, tarefa_id)
);

ALTER TABLE contexto_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own contexto_itens"
  ON contexto_itens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contextos c
      WHERE c.id = contexto_itens.contexto_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert own contexto_itens"
  ON contexto_itens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contextos c
      WHERE c.id = contexto_itens.contexto_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users delete own contexto_itens"
  ON contexto_itens FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contextos c
      WHERE c.id = contexto_itens.contexto_id
        AND c.user_id = auth.uid()
    )
  );

GRANT ALL ON contexto_itens TO authenticated;
