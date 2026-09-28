-- =====================================================
-- 063 · Valor do dia no histórico de hábitos
-- Até aqui só a água gravava um valor por dia (copos em `concluido`, INTEGER).
-- Agora proteína (gramas), sono (horas, com meia hora) e treino (1 feito, 0 não)
-- também gravam o total do dia, para as metas juntos lerem por período.
--
-- 1) Coluna `valor NUMERIC` (sono precisa de decimal). `concluido` continua sendo
--    gravado (valor arredondado) para clientes antigos e para o web.
-- 2) Preenche `valor` com `concluido` nas linhas antigas.
-- 3) Índice por (user_id, data) para leituras por período.
-- Idempotente: pode rodar de novo sem efeito.
-- =====================================================

ALTER TABLE public.historico_habitos
  ADD COLUMN IF NOT EXISTS valor NUMERIC;

UPDATE public.historico_habitos
   SET valor = concluido
 WHERE valor IS NULL
   AND concluido IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_historico_habitos_user_data
  ON public.historico_habitos (user_id, data);

-- 4) `habitos_diarios.progresso_atual` era INTEGER e recusava meia hora de sono (7,5 h).
--    Passa a NUMERIC; os valores inteiros antigos continuam iguais.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'habitos_diarios'
      AND column_name = 'progresso_atual' AND data_type = 'integer'
  ) THEN
    ALTER TABLE public.habitos_diarios
      ALTER COLUMN progresso_atual TYPE NUMERIC USING progresso_atual::NUMERIC;
  END IF;
END $$;
