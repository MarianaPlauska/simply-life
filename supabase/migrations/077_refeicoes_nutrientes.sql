-- 077: Proteína e açúcar por item da Comida (e links da pesquisa na web)
--
-- Junto com kcal, cada item pode ter proteina (gramas) e acucar (gramas de açúcares totais),
-- sempre para a quantidade do item. Os três números vêm juntos da mesma fonte
-- (manual > pessoal > openfoodfacts > ia > estimativa_local; ver refeicao_itens.fonte em 068).
-- Nulo quando não se sabe. São estimativas para a pessoa ter uma ideia, sem julgamento.
--
-- fontes: até 2 links (http/https) que a IA usou na pesquisa na web para chegar no número.
-- alimentos_pessoais também guarda proteína e açúcar corrigidos pela pessoa.
--
-- O app tolera rodar antes desta migração (sobe sem as colunas novas e avisa no log).
-- Pode rodar de novo sem erro.

DO $$
BEGIN
  IF to_regclass('public.refeicao_itens') IS NOT NULL THEN
    ALTER TABLE public.refeicao_itens ADD COLUMN IF NOT EXISTS proteina NUMERIC;
    ALTER TABLE public.refeicao_itens ADD COLUMN IF NOT EXISTS acucar NUMERIC;
    ALTER TABLE public.refeicao_itens ADD COLUMN IF NOT EXISTS fontes TEXT[];

    ALTER TABLE public.refeicao_itens DROP CONSTRAINT IF EXISTS refeicao_itens_proteina_faixa;
    ALTER TABLE public.refeicao_itens ADD CONSTRAINT refeicao_itens_proteina_faixa
      CHECK (proteina IS NULL OR (proteina >= 0 AND proteina <= 300));

    ALTER TABLE public.refeicao_itens DROP CONSTRAINT IF EXISTS refeicao_itens_acucar_faixa;
    ALTER TABLE public.refeicao_itens ADD CONSTRAINT refeicao_itens_acucar_faixa
      CHECK (acucar IS NULL OR (acucar >= 0 AND acucar <= 300));

    ALTER TABLE public.refeicao_itens DROP CONSTRAINT IF EXISTS refeicao_itens_fontes_limite;
    ALTER TABLE public.refeicao_itens ADD CONSTRAINT refeicao_itens_fontes_limite
      CHECK (fontes IS NULL OR cardinality(fontes) <= 2);

    COMMENT ON COLUMN public.refeicao_itens.proteina IS
      'Gramas de proteína na quantidade do item. Mesma fonte da kcal. Nulo quando não se sabe.';
    COMMENT ON COLUMN public.refeicao_itens.acucar IS
      'Gramas de açúcares totais na quantidade do item. Mesma fonte da kcal. Nulo quando não se sabe.';
    COMMENT ON COLUMN public.refeicao_itens.fontes IS
      'Até 2 links usados pela IA na pesquisa na web (fonte = ia). Nulo nas outras fontes.';
  END IF;

  IF to_regclass('public.alimentos_pessoais') IS NOT NULL THEN
    ALTER TABLE public.alimentos_pessoais ADD COLUMN IF NOT EXISTS proteina NUMERIC;
    ALTER TABLE public.alimentos_pessoais ADD COLUMN IF NOT EXISTS acucar NUMERIC;

    ALTER TABLE public.alimentos_pessoais DROP CONSTRAINT IF EXISTS alimentos_pessoais_proteina_faixa;
    ALTER TABLE public.alimentos_pessoais ADD CONSTRAINT alimentos_pessoais_proteina_faixa
      CHECK (proteina IS NULL OR (proteina >= 0 AND proteina <= 300));

    ALTER TABLE public.alimentos_pessoais DROP CONSTRAINT IF EXISTS alimentos_pessoais_acucar_faixa;
    ALTER TABLE public.alimentos_pessoais ADD CONSTRAINT alimentos_pessoais_acucar_faixa
      CHECK (acucar IS NULL OR (acucar >= 0 AND acucar <= 300));

    COMMENT ON COLUMN public.alimentos_pessoais.proteina IS
      'Gramas de proteína que a pessoa definiu para o item (porção em porcao). Nulo quando não informou.';
    COMMENT ON COLUMN public.alimentos_pessoais.acucar IS
      'Gramas de açúcares totais que a pessoa definiu para o item. Nulo quando não informou.';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
