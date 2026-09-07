-- Pasta de gastos: mesma identidade das pastas do Kanban (agrupa lançamentos relacionados)

ALTER TABLE public.despesas
  ADD COLUMN IF NOT EXISTS pasta_id TEXT;

CREATE INDEX IF NOT EXISTS ix_despesas_pasta_id ON public.despesas (pasta_id)
  WHERE pasta_id IS NOT NULL;

COMMENT ON COLUMN public.despesas.pasta_id IS
  'Id da pasta do usuário (kanban lists). Gastos da mesma pasta compartilham histórico e relatório.';
