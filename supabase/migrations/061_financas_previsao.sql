-- =====================================================
-- 061 — Finanças Etapa 2: salário com hora extra, confirmação,
-- contas fixas viram lançamentos, e sincronização do que era só local
-- (ícone/cor de categoria, ícone/cor/urgência de fixa, "fatura/conta paga").
-- =====================================================

-- 0) TABELAS BASE (defensivo: o banco de produção pode não ter todas) -------------
CREATE TABLE IF NOT EXISTS public.fin_receitas_recorrentes (
  id               SERIAL PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo           VARCHAR(120) NOT NULL,
  valor            NUMERIC(12,2) NOT NULL,
  dia_recebimento  INTEGER NOT NULL DEFAULT 5 CHECK (dia_recebimento BETWEEN 1 AND 31),
  categoria_id     INTEGER REFERENCES public.fin_categorias(id),
  ativa            BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_fin_receitas_recorrentes_user ON public.fin_receitas_recorrentes (user_id);

CREATE TABLE IF NOT EXISTS public.fin_contas_fixas (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  valor           NUMERIC(12,2) NOT NULL DEFAULT 0,
  dia_vencimento  INTEGER NOT NULL DEFAULT 1,
  categoria       TEXT NOT NULL DEFAULT 'outros',
  ativa           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.finance_bill_settlements (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tarefa_id   INTEGER,
  bill_id     TEXT,
  titulo      TEXT NOT NULL,
  valor       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  pago_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  origem      TEXT NOT NULL DEFAULT 'kanban',
  notas       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_fin_bill_settlements_user_pago ON public.finance_bill_settlements (user_id, pago_em DESC);

ALTER TABLE public.fin_receitas_recorrentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_contas_fixas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_bill_settlements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fin_receitas_recorrentes_own_061 ON public.fin_receitas_recorrentes;
CREATE POLICY fin_receitas_recorrentes_own_061 ON public.fin_receitas_recorrentes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS fin_contas_fixas_own_061 ON public.fin_contas_fixas;
CREATE POLICY fin_contas_fixas_own_061 ON public.fin_contas_fixas
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- settlements: o app também apaga (desmarcar "pago")
DROP POLICY IF EXISTS finance_bill_settlements_own_061 ON public.finance_bill_settlements;
CREATE POLICY finance_bill_settlements_own_061 ON public.finance_bill_settlements
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT ALL ON public.fin_receitas_recorrentes, public.fin_contas_fixas, public.finance_bill_settlements TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 1) SALÁRIO (reaproveita fin_receitas_recorrentes) ---------------------------
ALTER TABLE public.fin_receitas_recorrentes
  ADD COLUMN IF NOT EXISTS variavel         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS horas_semanais   NUMERIC(5,2) DEFAULT 40,
  ADD COLUMN IF NOT EXISTS entrada          TEXT,            -- "08:00"
  ADD COLUMN IF NOT EXISTS saida            TEXT,            -- "17:00"
  ADD COLUMN IF NOT EXISTS intervalo_min    INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS dias_semana      INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS he_util_pct      NUMERIC(5,2) DEFAULT 50,
  ADD COLUMN IF NOT EXISTS he_folga_pct     NUMERIC(5,2) DEFAULT 100,
  ADD COLUMN IF NOT EXISTS noturno_pct      NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS dsr_sobre_he     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS dia_fechamento   INTEGER CHECK (dia_fechamento IS NULL OR dia_fechamento BETWEEN 1 AND 31),
  ADD COLUMN IF NOT EXISTS quinto_dia_util  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS taxa_desconto    NUMERIC(6,4),
  ADD COLUMN IF NOT EXISTS feriados_locais  TEXT[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.fin_horas_extras (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receita_id  INTEGER NOT NULL REFERENCES public.fin_receitas_recorrentes(id) ON DELETE CASCADE,
  data        DATE NOT NULL,
  minutos     INTEGER NOT NULL CHECK (minutos > 0 AND minutos <= 960),
  tipo        TEXT NOT NULL CHECK (tipo IN ('util', 'folga', 'noturno')),
  nota        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_fin_horas_extras_user_data ON public.fin_horas_extras (user_id, data DESC);
ALTER TABLE public.fin_horas_extras ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fin_horas_extras_own ON public.fin_horas_extras;
CREATE POLICY fin_horas_extras_own ON public.fin_horas_extras
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- uma linha por competência: previsto → confirmado (vira receita em despesas)
CREATE TABLE IF NOT EXISTS public.fin_receitas_confirmacoes (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receita_id      INTEGER NOT NULL REFERENCES public.fin_receitas_recorrentes(id) ON DELETE CASCADE,
  competencia     CHAR(7) NOT NULL,            -- '2026-09'
  valor_previsto  NUMERIC(12,2) NOT NULL,
  bruto_previsto  NUMERIC(12,2),
  valor_real      NUMERIC(12,2),
  despesa_id      INTEGER REFERENCES public.despesas(id) ON DELETE SET NULL,
  confirmado_em   TIMESTAMPTZ,
  UNIQUE (user_id, receita_id, competencia)
);
ALTER TABLE public.fin_receitas_confirmacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fin_receitas_confirmacoes_own ON public.fin_receitas_confirmacoes;
CREATE POLICY fin_receitas_confirmacoes_own ON public.fin_receitas_confirmacoes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 2) CONTAS FIXAS: aparência + lançamento ligado ------------------------------
ALTER TABLE public.fin_contas_fixas
  ADD COLUMN IF NOT EXISTS icone    TEXT,
  ADD COLUMN IF NOT EXISTS cor      TEXT,
  ADD COLUMN IF NOT EXISTS urgencia SMALLINT CHECK (urgencia IS NULL OR urgencia BETWEEN 1 AND 3);

-- gasto gerado a partir de uma fixa (para não lançar duas vezes no mês)
ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS fixa_id INTEGER;

-- parcelas de uma mesma compra (editar/apagar a compra inteira)
ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS grupo_parcela TEXT;
CREATE INDEX IF NOT EXISTS ix_despesas_grupo_parcela
  ON public.despesas (user_id, grupo_parcela)
  WHERE grupo_parcela IS NOT NULL;

-- 3) CATEGORIAS: personalização vai para o banco -------------------------------
ALTER TABLE public.fin_categorias
  ADD COLUMN IF NOT EXISTS personalizada BOOLEAN NOT NULL DEFAULT false,  -- nome/ícone/cor editados pela pessoa
  ADD COLUMN IF NOT EXISTS oculta        BOOLEAN NOT NULL DEFAULT false;

-- 4) "PAGO" (fatura do cartão / conta fixa no mês) ----------------------------
-- reaproveita finance_bill_settlements: bill_id = 'cartao:<id>:2026-09' | 'fixa:<id>:2026-09'
-- repetições antigas (frontend legado) impediriam o índice único: mantém a mais antiga
DELETE FROM public.finance_bill_settlements a
 USING public.finance_bill_settlements b
 WHERE a.bill_id IS NOT NULL
   AND a.user_id = b.user_id
   AND a.bill_id = b.bill_id
   AND a.id > b.id;

CREATE UNIQUE INDEX IF NOT EXISTS ux_fin_bill_settlements_user_bill
  ON public.finance_bill_settlements (user_id, bill_id)
  WHERE bill_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
