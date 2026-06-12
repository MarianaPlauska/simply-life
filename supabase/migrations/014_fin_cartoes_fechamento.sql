-- 014 — dia de fechamento da fatura (ciclo do cartão)

ALTER TABLE fin_cartoes
  ADD COLUMN IF NOT EXISTS dia_fechamento INTEGER
    CHECK (dia_fechamento IS NULL OR (dia_fechamento >= 1 AND dia_fechamento <= 28));

COMMENT ON COLUMN fin_cartoes.dia_fechamento IS
  'Dia do fechamento da fatura. Se NULL, calculado como vencimento - 7 dias.';

NOTIFY pgrst, 'reload schema';
