-- Prazo opcional e vínculo com categoria de gasto nas contas fixas
ALTER TABLE fin_contas_fixas
  ADD COLUMN IF NOT EXISTS duracao_meses INTEGER,
  ADD COLUMN IF NOT EXISTS data_inicio DATE,
  ADD COLUMN IF NOT EXISTS categoria_id BIGINT;

COMMENT ON COLUMN fin_contas_fixas.duracao_meses IS
  'Null = recorrente sem fim; ex: 6 para contrato de 6 meses';

NOTIFY pgrst, 'reload schema';
