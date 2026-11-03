-- despesas.tipo ('despesa' | 'receita') faltava no banco de produção: o app manda e o insert falhava.
ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS tipo VARCHAR DEFAULT 'despesa';
UPDATE public.despesas SET tipo = 'despesa' WHERE tipo IS NULL;

NOTIFY pgrst, 'reload schema';
