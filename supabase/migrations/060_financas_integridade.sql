-- =====================================================
-- 060 — Finanças: integridade (Etapa 1)
-- Defensiva: o banco de produção pode não ter todas as colunas/tabelas do 001
-- (ex.: despesas.categoria_id não existia). Tudo aqui cria o que faltar antes de usar.
--
-- 1) Cartões: nunca guardar número completo nem CVV (PCI-DSS). Só os 4 últimos.
-- 2) Categorias: slug estável ligando a categoria do app ('alimentacao') a
--    fin_categorias, e despesas.categoria_id, para o orçamento contar os gastos.
-- 3) Importação sem duplicar: import_hash único por usuário.
-- 4) Metas e orçamentos: tabelas garantidas.
-- =====================================================

-- 0) TABELAS BASE (só cria se não existirem) -----------------------------------
CREATE TABLE IF NOT EXISTS public.fin_categorias (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        VARCHAR(50) NOT NULL,
  cor         VARCHAR(7) DEFAULT '#8b5cf6',
  icone       VARCHAR(50) DEFAULT 'Wallet',
  tipo        VARCHAR(20) DEFAULT 'despesa',
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_fin_categorias_user_id ON public.fin_categorias (user_id);

CREATE TABLE IF NOT EXISTS public.fin_orcamentos (
  id           SERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria_id INTEGER REFERENCES public.fin_categorias(id) ON DELETE CASCADE,
  limite       NUMERIC(12,2) NOT NULL,
  mes          INTEGER,
  ano          INTEGER,
  created_at   TIMESTAMPTZ DEFAULT now()
);
-- o app faz upsert por (user_id, categoria_id); repetições antigas impediriam o índice
DELETE FROM public.fin_orcamentos a
 USING public.fin_orcamentos b
 WHERE a.user_id = b.user_id
   AND a.categoria_id IS NOT DISTINCT FROM b.categoria_id
   AND a.id > b.id;
CREATE UNIQUE INDEX IF NOT EXISTS ux_fin_orcamentos_user_cat ON public.fin_orcamentos (user_id, categoria_id);

CREATE TABLE IF NOT EXISTS public.fin_metas (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo      VARCHAR(100) NOT NULL,
  valor_alvo  NUMERIC(12,2) NOT NULL,
  valor_atual NUMERIC(12,2) DEFAULT 0.0,
  prazo       DATE,
  icone       VARCHAR(50) DEFAULT 'Target',
  cor         VARCHAR(7) DEFAULT '#8b5cf6',
  concluida   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_fin_metas_user_id ON public.fin_metas (user_id);

CREATE TABLE IF NOT EXISTS public.fin_cartoes (
  id              TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  titular         TEXT NOT NULL DEFAULT 'Titular',
  numero          TEXT,
  validade        TEXT,
  cvv             TEXT,
  limite          NUMERIC(12,2) NOT NULL DEFAULT 0,
  tipo_gradiente  TEXT NOT NULL DEFAULT 'copper',
  bandeira        TEXT NOT NULL DEFAULT 'mastercard',
  status          TEXT NOT NULL DEFAULT 'ativo',
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fin_cartoes_user_id ON public.fin_cartoes (user_id);
ALTER TABLE public.fin_cartoes ADD COLUMN IF NOT EXISTS dia_vencimento INTEGER DEFAULT 1;
ALTER TABLE public.fin_cartoes ADD COLUMN IF NOT EXISTS dia_fechamento INTEGER;
ALTER TABLE public.fin_cartoes ADD COLUMN IF NOT EXISTS banco TEXT;

-- RLS: cada pessoa só vê o que é seu
ALTER TABLE public.fin_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_metas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_cartoes    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fin_categorias_own_060 ON public.fin_categorias;
CREATE POLICY fin_categorias_own_060 ON public.fin_categorias
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS fin_orcamentos_own_060 ON public.fin_orcamentos;
CREATE POLICY fin_orcamentos_own_060 ON public.fin_orcamentos
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS fin_metas_own_060 ON public.fin_metas;
CREATE POLICY fin_metas_own_060 ON public.fin_metas
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS fin_cartoes_own_060 ON public.fin_cartoes;
CREATE POLICY fin_cartoes_own_060 ON public.fin_cartoes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

GRANT ALL ON public.fin_categorias, public.fin_orcamentos, public.fin_metas, public.fin_cartoes TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 1) CARTÕES: dados sensíveis ------------------------------------------------
ALTER TABLE public.fin_cartoes ALTER COLUMN numero   DROP NOT NULL;
ALTER TABLE public.fin_cartoes ALTER COLUMN validade DROP NOT NULL;
ALTER TABLE public.fin_cartoes ALTER COLUMN cvv      DROP NOT NULL;

-- dados que nunca deveriam estar salvos: apaga CVV e reduz o número aos 4 últimos
UPDATE public.fin_cartoes SET cvv = NULL WHERE cvv IS NOT NULL;
UPDATE public.fin_cartoes
   SET numero = right(regexp_replace(numero, '\D', '', 'g'), 4)
 WHERE numero IS NOT NULL AND length(regexp_replace(numero, '\D', '', 'g')) > 4;

-- o app também usa o gradiente 'copper'
ALTER TABLE public.fin_cartoes DROP CONSTRAINT IF EXISTS fin_cartoes_tipo_gradiente_check;
ALTER TABLE public.fin_cartoes
  ADD CONSTRAINT fin_cartoes_tipo_gradiente_check
  CHECK (tipo_gradiente IN ('purple', 'obsidian', 'sunset', 'ocean', 'mint', 'copper'));

-- 2) CATEGORIAS -----------------------------------------------------------------
ALTER TABLE public.fin_categorias ADD COLUMN IF NOT EXISTS slug VARCHAR(40);
CREATE UNIQUE INDEX IF NOT EXISTS ux_fin_categorias_user_slug
  ON public.fin_categorias (user_id, slug)
  WHERE slug IS NOT NULL;

-- o banco de produção não tinha esta coluna: sem ela o orçamento nunca somava nada
ALTER TABLE public.despesas
  ADD COLUMN IF NOT EXISTS categoria_id INTEGER REFERENCES public.fin_categorias(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS ix_despesas_categoria_id ON public.despesas (categoria_id);

-- liga gastos antigos (só texto em "categoria") às categorias com slug, quando existirem
UPDATE public.despesas d
   SET categoria_id = c.id
  FROM public.fin_categorias c
 WHERE d.categoria_id IS NULL
   AND c.user_id = d.user_id
   AND c.slug IS NOT NULL
   AND c.slug = d.categoria;

-- 3) IMPORTAÇÃO SEM DUPLICAR -----------------------------------------------------
ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS import_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS ux_despesas_user_import_hash
  ON public.despesas (user_id, import_hash)
  WHERE import_hash IS NOT NULL;

NOTIFY pgrst, 'reload schema';
