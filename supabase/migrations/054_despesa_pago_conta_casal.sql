-- Gasto pessoal pago com a conta do casal (segregação Pessoal vs Casal)

ALTER TABLE public.despesas
  ADD COLUMN IF NOT EXISTS pago_conta_casal BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.despesas.pago_conta_casal IS
  'Quando verdadeiro e compartilhada=false: gasto pessoal que saiu da conta do casal';
