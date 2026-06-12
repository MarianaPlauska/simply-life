-- Itens discriminantes da fatura + card_id explícito em despesas

ALTER TABLE despesas
  ADD COLUMN IF NOT EXISTS card_id TEXT;

CREATE INDEX IF NOT EXISTS ix_despesas_card_id ON despesas (card_id)
  WHERE card_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS fin_fatura_itens (
    id                 SERIAL PRIMARY KEY,
    user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fatura_reserva_id  INTEGER NOT NULL REFERENCES fin_faturas_reservas(id) ON DELETE CASCADE,
    descricao          VARCHAR(200) NOT NULL,
    valor              NUMERIC(12,2) NOT NULL DEFAULT 0,
    parcela_atual      INTEGER,
    parcela_total      INTEGER,
    destaque           VARCHAR(20),
    despesa_id         INTEGER REFERENCES despesas(id) ON DELETE SET NULL,
    created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_fin_fatura_itens_fatura ON fin_fatura_itens (fatura_reserva_id);

ALTER TABLE fin_fatura_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fin_fatura_itens_own" ON fin_fatura_itens
  FOR ALL USING (user_id = auth.uid());

COMMENT ON TABLE fin_fatura_itens IS 'Discriminantes da fatura — parcelas e gastos vinculados';
COMMENT ON COLUMN fin_fatura_itens.destaque IS 'erro = gasto fora do esperado';
