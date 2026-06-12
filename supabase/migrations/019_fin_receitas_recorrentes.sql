-- E5: receitas recorrentes (salário, freelance, etc.)

CREATE TABLE IF NOT EXISTS fin_receitas_recorrentes (
    id                 SERIAL PRIMARY KEY,
    user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo             VARCHAR(120) NOT NULL,
    valor              NUMERIC(12,2) NOT NULL,
    dia_recebimento    INTEGER NOT NULL DEFAULT 5 CHECK (dia_recebimento BETWEEN 1 AND 31),
    categoria_id       INTEGER REFERENCES fin_categorias(id),
    ativa              BOOLEAN NOT NULL DEFAULT true,
    created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_fin_receitas_recorrentes_user ON fin_receitas_recorrentes (user_id);

ALTER TABLE fin_receitas_recorrentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fin_receitas_recorrentes_own" ON fin_receitas_recorrentes
  FOR ALL USING (user_id = auth.uid());

COMMENT ON TABLE fin_receitas_recorrentes IS 'Receitas fixas mensais — salário, freelance, aluguel recebido';
