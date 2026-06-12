-- E12: reconciliação — saldo real informado pelo usuário vs calculado no app

ALTER TABLE fin_conta_corrente
  ADD COLUMN IF NOT EXISTS saldo_banco NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS saldo_banco_at TIMESTAMPTZ;

COMMENT ON COLUMN fin_conta_corrente.saldo_banco IS 'Saldo informado pelo usuário no app do banco';
COMMENT ON COLUMN fin_conta_corrente.saldo_banco_at IS 'Quando o saldo banco foi atualizado';
