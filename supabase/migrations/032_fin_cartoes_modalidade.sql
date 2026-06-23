-- Modalidade do cartão: crédito, débito, VR ou vale-alimentação
ALTER TABLE fin_cartoes
  ADD COLUMN IF NOT EXISTS modalidade TEXT NOT NULL DEFAULT 'credito'
    CHECK (modalidade IN ('credito', 'debito', 'vr', 'alimentacao'));

COMMENT ON COLUMN fin_cartoes.modalidade IS
  'credito | debito | vr | alimentacao — define fatura e rótulos na UI';

NOTIFY pgrst, 'reload schema';
