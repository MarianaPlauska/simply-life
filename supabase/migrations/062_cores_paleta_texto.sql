-- =====================================================
-- 062 — Cores como chave da paleta categórica
-- O app passa a guardar a chave da paleta ('teal', 'amber', 'blue', 'clay',
-- 'violet', 'green', 'plum', 'slate') em vez do hex; a cor final depende do
-- modo claro/escuro e é resolvida na tela. Hex antigos continuam valendo
-- (o app converte na leitura), então nada aqui reescreve dados.
--
-- 1) Toda coluna `cor` vira TEXT (antes VARCHAR(7) em labels, fin_categorias
--    e fin_metas; contextos e fin_contas_fixas já eram TEXT). As chaves atuais
--    cabem em 7 letras, mas TEXT deixa folga para chaves futuras.
--    VARCHAR -> TEXT é compatível em binário: sem reescrever a tabela.
-- 2) Remove qualquer CHECK que force formato hex nessas colunas (nenhuma
--    migração criou um, mas o banco de produção pode ter). Não criamos CHECK
--    novo: clientes antigos ainda gravam hex e o app já normaliza o que ler.
-- 3) DEFAULT '#E8734A' (coral, cor de ação) vira 'clay', se existir.
--    O DEFAULT '#8b5cf6' fica como está (o app lê como 'violet') para não
--    quebrar clientes antigos que pintam o valor cru.
-- Idempotente e defensiva: pula tabela ou coluna que não exista.
-- =====================================================

DO $$
DECLARE
  t   TEXT;
  c   RECORD;
  def TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['labels', 'fin_categorias', 'fin_metas', 'fin_contas_fixas', 'contextos']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'cor'
    ) THEN
      CONTINUE;
    END IF;

    -- 2) CHECK de formato hex sobre `cor`
    FOR c IN
      SELECT con.conname
      FROM pg_constraint con
      JOIN pg_attribute att
        ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
      WHERE con.conrelid = format('public.%I', t)::regclass
        AND con.contype = 'c'
        AND att.attname = 'cor'
    LOOP
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', t, c.conname);
    END LOOP;

    -- 1) tipo
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'cor'
        AND data_type <> 'text'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN cor TYPE TEXT', t);
    END IF;

    -- 3) DEFAULT coral
    SELECT column_default INTO def
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = t AND column_name = 'cor';
    IF def IS NOT NULL AND def ILIKE '%#e8734a%' THEN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN cor SET DEFAULT %L', t, 'clay');
    END IF;
  END LOOP;
END $$;
