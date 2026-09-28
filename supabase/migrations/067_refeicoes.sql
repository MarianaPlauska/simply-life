-- 067: Refeições registradas por texto (Comida)
--
-- "almocei arroz, feijão e frango" vira uma linha em refeicoes e três em refeicao_itens.
-- item_key é a chave canônica do app (sem acento, singular, sinônimos: "pão de queijo" e
-- "pao queijo" viram "pao queijo"), usada para a frequência do mês e para juntar com os gastos.
-- Calorias são opcionais: kcal fica nulo quando não se sabe. fonte diz de onde veio o dado
-- ('openfoodfacts' pelo código de barras, 'manual'). Nada de TACO/TBCA aqui.
-- O id da refeição vem do app (uuid), para o registro feito offline subir sem duplicar.
-- Pode rodar de novo sem erro.

CREATE TABLE IF NOT EXISTS public.refeicoes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data       DATE NOT NULL,
  hora       TIME,
  tipo       TEXT NOT NULL
    CHECK (tipo IN ('cafe_da_manha', 'almoco', 'lanche', 'jantar', 'ceia')),
  texto      TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS refeicoes_user_data_idx ON public.refeicoes (user_id, data DESC);

COMMENT ON TABLE public.refeicoes IS
  'Refeições registradas pela pessoa (texto livre lido pelo app). Uma linha por refeição.';

CREATE TABLE IF NOT EXISTS public.refeicao_itens (
  id          BIGSERIAL PRIMARY KEY,
  refeicao_id UUID NOT NULL REFERENCES public.refeicoes(id) ON DELETE CASCADE,
  posicao     SMALLINT NOT NULL DEFAULT 0,
  item_key    TEXT NOT NULL,
  nome        TEXT NOT NULL,
  quantidade  TEXT,
  kcal        NUMERIC,
  fonte       TEXT,
  barcode     TEXT,
  CONSTRAINT refeicao_itens_kcal_nao_negativa CHECK (kcal IS NULL OR kcal >= 0)
);

CREATE INDEX IF NOT EXISTS refeicao_itens_refeicao_idx ON public.refeicao_itens (refeicao_id);
CREATE INDEX IF NOT EXISTS refeicao_itens_key_idx ON public.refeicao_itens (item_key);

COMMENT ON TABLE public.refeicao_itens IS
  'Itens de cada refeição. kcal só quando conhecida; fonte = openfoodfacts (ODbL, citar na tela) ou manual.';

ALTER TABLE public.refeicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refeicao_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS refeicoes_own ON public.refeicoes;
CREATE POLICY refeicoes_own ON public.refeicoes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS refeicao_itens_own ON public.refeicao_itens;
CREATE POLICY refeicao_itens_own ON public.refeicao_itens
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.refeicoes r
    WHERE r.id = refeicao_itens.refeicao_id AND r.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.refeicoes r
    WHERE r.id = refeicao_itens.refeicao_id AND r.user_id = auth.uid()
  ));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.refeicoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.refeicao_itens TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.refeicao_itens_id_seq TO authenticated;
GRANT ALL ON public.refeicoes TO service_role;
GRANT ALL ON public.refeicao_itens TO service_role;

NOTIFY pgrst, 'reload schema';
