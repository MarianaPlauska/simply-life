-- Grupo hierárquico das categorias (Casa, Contas, Futuro)

ALTER TABLE fin_categorias
  ADD COLUMN IF NOT EXISTS grupo VARCHAR(20) DEFAULT 'geral';

COMMENT ON COLUMN fin_categorias.grupo IS
  'Agrupamento: casa | contas | futuro | geral';
