-- 085 - adicional por ciclo do cartão (não muda o limite) e dia de fechamento
ALTER TABLE public.fin_cartoes
  ADD COLUMN IF NOT EXISTS dia_fechamento INTEGER;

ALTER TABLE public.fin_cartoes
  ADD COLUMN IF NOT EXISTS adicionais JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.fin_cartoes.adicionais IS
  'Valor extra por ciclo: {"AAAA-MM": valor}. A chave é o mês em que o ciclo começa. Não altera o limite.';

NOTIFY pgrst, 'reload schema';
