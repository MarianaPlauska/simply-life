-- 068: Calorias pessoais por alimento (Comida)
--
-- Quando a pessoa corrige a caloria de um item (ou lê pelo código de barras), o app lembra
-- esse valor para o mesmo item_key ("pao queijo") e usa de novo nas próximas refeições.
-- Ordem ao preencher: pessoal > código de barras > IA > tabela local do app.
-- Só aparece com "Mostrar calorias" ligado. porcao é texto curto ("1 unidade", "1 prato raso").
--
-- Também documenta as fontes aceitas em refeicao_itens.fonte:
--   'pessoal' | 'openfoodfacts' | 'ia' | 'estimativa_local' | 'manual'
-- (067 não tem CHECK em fonte; aqui entra um, tolerando nulo).
-- Pode rodar de novo sem erro.

CREATE TABLE IF NOT EXISTS public.alimentos_pessoais (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_key   TEXT NOT NULL,
  kcal       NUMERIC NOT NULL,
  porcao     TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_key),
  CONSTRAINT alimentos_pessoais_kcal_faixa CHECK (kcal >= 0 AND kcal <= 3000)
);

COMMENT ON TABLE public.alimentos_pessoais IS
  'Caloria que a pessoa definiu para um item (item_key canônico do app). Usada antes de qualquer estimativa.';

ALTER TABLE public.alimentos_pessoais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS alimentos_pessoais_own ON public.alimentos_pessoais;
CREATE POLICY alimentos_pessoais_own ON public.alimentos_pessoais
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alimentos_pessoais TO authenticated;
GRANT ALL ON public.alimentos_pessoais TO service_role;

-- fontes de caloria aceitas nos itens das refeições
DO $$
BEGIN
  IF to_regclass('public.refeicao_itens') IS NOT NULL THEN
    ALTER TABLE public.refeicao_itens DROP CONSTRAINT IF EXISTS refeicao_itens_fonte_valida;
    ALTER TABLE public.refeicao_itens ADD CONSTRAINT refeicao_itens_fonte_valida
      CHECK (fonte IS NULL OR fonte IN ('pessoal', 'openfoodfacts', 'ia', 'estimativa_local', 'manual'));
    COMMENT ON COLUMN public.refeicao_itens.fonte IS
      'De onde veio a caloria: pessoal, openfoodfacts (ODbL, citar na tela), ia, estimativa_local ou manual. ia e estimativa_local aparecem como estimativa.';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
