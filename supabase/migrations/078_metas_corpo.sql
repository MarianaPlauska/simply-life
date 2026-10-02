-- 078: Cuidar do corpo juntos (métricas novas nas metas juntos)
--
-- Três métricas novas em shared_goals.metrica, todas calculadas no aparelho de cada
-- pessoa a partir do que ela já anota (refeições da Comida e hábitos da Saúde):
--   refeicoes  refeições registradas no dia (teto 6 por dia)
--   acucar_ok  1 no dia em que o açúcar estimado ficou dentro do limite que a própria
--              pessoa escolheu em Comida (teto 1). Sem limite, a pessoa não contribui.
--   corpo      1 no dia em que a pessoa cuidou do corpo: refeição, água, treino,
--              sono ou proteína (teto 1)
--
-- O modelo de privacidade não muda: cada um lê só as próprias linhas e o grupo vê
-- só faixa ou ritmo (shared_goal_progress, 064). Os tetos espelham
-- SHARED_GOAL_METRICAS.maxPorDia (packages/shared/src/sharedGoals.ts).
--
-- create_shared_goal (064) não confere a métrica por lista; quem barra é o CHECK.
-- Pode rodar de novo sem erro.

-- ── 1. CHECK da métrica ──────────────────────────────────────────────
-- O CHECK de 064 foi criado na coluna, sem nome explícito (o Postgres chama de
-- shared_goals_metrica_check). Remove qualquer CHECK que fale de metrica e recria
-- com nome fixo.
DO $$
DECLARE
  v_con TEXT;
BEGIN
  FOR v_con IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.shared_goals'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%metrica%'
  LOOP
    EXECUTE format('ALTER TABLE public.shared_goals DROP CONSTRAINT %I', v_con);
  END LOOP;
END $$;

ALTER TABLE public.shared_goals DROP CONSTRAINT IF EXISTS shared_goals_metrica_check;
ALTER TABLE public.shared_goals ADD CONSTRAINT shared_goals_metrica_check
  CHECK (metrica IN (
    'agua', 'treino', 'proteina', 'sono', 'foco', 'tarefas', 'humor',
    'refeicoes', 'acucar_ok', 'corpo',
    'livre'
  ));

-- ── 2. Teto por dia ──────────────────────────────────────────────────
-- Mesmo corpo de 064; só entram os três casos novos.

-- Teto por dia de cada métrica (espelha SHARED_GOAL_METRICAS.maxPorDia)
CREATE OR REPLACE FUNCTION public.shared_goal_entry_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_metrica TEXT;
  v_inicio DATE;
  v_fim DATE;
  v_max NUMERIC;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.shared_goal_members m
    WHERE m.goal_id = NEW.goal_id AND m.user_id = NEW.user_id AND m.left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'not a member';
  END IF;

  SELECT metrica, inicio, fim INTO v_metrica, v_inicio, v_fim
  FROM public.shared_goals WHERE id = NEW.goal_id;

  -- Só dias do período e nada no futuro (um dia de folga por fuso)
  IF NEW.dia < v_inicio
     OR (v_fim IS NOT NULL AND NEW.dia > v_fim)
     OR NEW.dia > public.shared_goal_today() + 1 THEN
    RAISE EXCEPTION 'dia fora do período';
  END IF;
  v_max := CASE v_metrica
    WHEN 'agua' THEN 15
    WHEN 'treino' THEN 5
    WHEN 'proteina' THEN 600
    WHEN 'sono' THEN 24
    WHEN 'foco' THEN 1440
    WHEN 'tarefas' THEN 100
    WHEN 'humor' THEN 1
    WHEN 'refeicoes' THEN 6
    WHEN 'acucar_ok' THEN 1
    WHEN 'corpo' THEN 1
    ELSE 100000
  END;
  NEW.valor := LEAST(GREATEST(NEW.valor, 0), v_max);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- O trigger de 064 já aponta para esta função; nada a recriar.

NOTIFY pgrst, 'reload schema';
