-- Forma de pagamento explícita (PIX, débito, cartão, etc.)
ALTER TABLE despesas
  ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(20);

COMMENT ON COLUMN despesas.forma_pagamento IS 'pix | debito | dinheiro | boleto | cartao | ted | outro';
