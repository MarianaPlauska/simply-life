-- E2: conta corrente (saldo inicial) + E3: faturas com reserva virtual

CREATE TABLE IF NOT EXISTS fin_conta_corrente (
    user_id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    saldo_inicial  NUMERIC(12,2) NOT NULL DEFAULT 0,
    updated_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fin_conta_corrente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fin_conta_corrente_own" ON fin_conta_corrente
  FOR ALL USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS fin_faturas_reservas (
    id               SERIAL PRIMARY KEY,
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo           VARCHAR(120) NOT NULL,
    valor_alocado    NUMERIC(12,2) NOT NULL,
    valor_gasto      NUMERIC(12,2) NOT NULL DEFAULT 0,
    data_vencimento  VARCHAR(10) NOT NULL,
    card_id          TEXT,
    categoria_id     INTEGER REFERENCES fin_categorias(id),
    status           VARCHAR(20) NOT NULL DEFAULT 'aberta',
    created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_fin_faturas_reservas_user ON fin_faturas_reservas (user_id);
CREATE INDEX IF NOT EXISTS ix_fin_faturas_reservas_venc ON fin_faturas_reservas (data_vencimento);

ALTER TABLE fin_faturas_reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fin_faturas_reservas_own" ON fin_faturas_reservas
  FOR ALL USING (user_id = auth.uid());

ALTER TABLE despesas
  ADD COLUMN IF NOT EXISTS fatura_reserva_id INTEGER REFERENCES fin_faturas_reservas(id);

COMMENT ON TABLE fin_conta_corrente IS 'Saldo inicial da conta corrente do usuário';
COMMENT ON TABLE fin_faturas_reservas IS 'Faturas futuras com valor reservado do caixa';
