-- Subcategorias — hierarquia dentro da categoria pai

ALTER TABLE fin_categorias
  ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES fin_categorias(id) ON DELETE CASCADE;

COMMENT ON COLUMN fin_categorias.parent_id IS
  'Categoria pai — NULL = categoria de topo';

CREATE INDEX IF NOT EXISTS ix_fin_categorias_parent_id ON fin_categorias (parent_id);
