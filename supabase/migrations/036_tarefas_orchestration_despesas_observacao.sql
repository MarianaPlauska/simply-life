-- Colunas de orquestração em tarefas + observação em lançamentos financeiros

ALTER TABLE tarefas_unificadas
  ADD COLUMN IF NOT EXISTS score_reason TEXT,
  ADD COLUMN IF NOT EXISTS urgency_reason TEXT,
  ADD COLUMN IF NOT EXISTS intent_category VARCHAR(20);

ALTER TABLE despesas
  ADD COLUMN IF NOT EXISTS observacao TEXT;
