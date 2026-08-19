-- 047 — Conta demo fixa: registro + reset atômico do workspace
-- Isolamento = o mesmo RLS (user_id = auth.uid()). Reset só via service_role.

CREATE TABLE IF NOT EXISTS public.app_demo_account (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL UNIQUE,
  last_reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_demo_account ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.app_demo_account TO service_role;

CREATE OR REPLACE FUNCTION public.reset_demo_workspace(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  cat_moradia int;
  cat_mercado int;
  cat_lazer int;
  cat_reserva int;
  cat_salario int;
  t_hoje_a int;
  t_hoje_b int;
  t_semana_a int;
  t_semana_b int;
  t_back_a int;
  mes_prefix text := to_char(current_date, 'YYYY-MM');
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'demo user not found';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.app_demo_account WHERE user_id = p_user_id) THEN
    IF lower(v_email) <> 'demo@simply-life.app' THEN
      RAISE EXCEPTION 'not a demo account';
    END IF;
    INSERT INTO public.app_demo_account (user_id, email)
    VALUES (p_user_id, v_email)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  DELETE FROM public.axel_decision_events WHERE user_id = p_user_id;
  DELETE FROM public.historico_habitos WHERE user_id = p_user_id;
  DELETE FROM public.habitos_diarios WHERE user_id = p_user_id;
  DELETE FROM public.despesas WHERE user_id = p_user_id;
  DELETE FROM public.fin_contas_fixas WHERE user_id = p_user_id;
  DELETE FROM public.fin_receitas_recorrentes WHERE user_id = p_user_id;
  DELETE FROM public.fin_orcamentos WHERE user_id = p_user_id;
  DELETE FROM public.tarefas_unificadas WHERE user_id = p_user_id;
  DELETE FROM public.fin_categorias WHERE user_id = p_user_id;

  INSERT INTO public.fin_categorias (user_id, nome, cor, icone, tipo, grupo)
  VALUES
    (p_user_id, 'Moradia', '#3b82f6', 'Home', 'despesa', 'casa'),
    (p_user_id, 'Alimentação / mercado', '#10b981', 'Utensils', 'despesa', 'casa'),
    (p_user_id, 'Lazer', '#f59e0b', 'Film', 'despesa', 'geral'),
    (p_user_id, 'Reserva / investimentos', '#6366f1', 'PiggyBank', 'despesa', 'futuro'),
    (p_user_id, 'Salário', '#22c55e', 'Banknote', 'receita', 'geral');

  SELECT id INTO cat_moradia FROM public.fin_categorias WHERE user_id = p_user_id AND nome = 'Moradia';
  SELECT id INTO cat_mercado FROM public.fin_categorias WHERE user_id = p_user_id AND nome = 'Alimentação / mercado';
  SELECT id INTO cat_lazer FROM public.fin_categorias WHERE user_id = p_user_id AND nome = 'Lazer';
  SELECT id INTO cat_reserva FROM public.fin_categorias WHERE user_id = p_user_id AND nome = 'Reserva / investimentos';
  SELECT id INTO cat_salario FROM public.fin_categorias WHERE user_id = p_user_id AND nome = 'Salário';

  INSERT INTO public.despesas (user_id, descricao, categoria, categoria_id, valor, data_gasto, tipo, status_pagamento)
  VALUES
    (p_user_id, 'Salário mensal', 'Salário', cat_salario, 8000, mes_prefix || '-05', 'receita', 'pago'),
    (p_user_id, 'Aluguel', 'Moradia', cat_moradia, 2200, mes_prefix || '-07', 'despesa', 'pago'),
    (p_user_id, 'Mercado da semana', 'Alimentação / mercado', cat_mercado, 420, mes_prefix || '-08', 'despesa', 'pago'),
    (p_user_id, 'Feira', 'Alimentação / mercado', cat_mercado, 180, mes_prefix || '-12', 'despesa', 'pago'),
    (p_user_id, 'Cinema e jantar', 'Lazer', cat_lazer, 210, mes_prefix || '-10', 'despesa', 'pago'),
    (p_user_id, 'Streaming', 'Lazer', cat_lazer, 55, mes_prefix || '-03', 'despesa', 'pago'),
    (p_user_id, 'Reserva de emergência', 'Reserva / investimentos', cat_reserva, 800, mes_prefix || '-06', 'despesa', 'pago');

  INSERT INTO public.fin_receitas_recorrentes (user_id, titulo, valor, dia_recebimento, categoria_id, ativa)
  VALUES (p_user_id, 'Salário', 8000, 5, cat_salario, true);

  INSERT INTO public.fin_contas_fixas (user_id, nome, valor, dia_vencimento, categoria, ativa)
  VALUES
    (p_user_id, 'Aluguel', 2200, 7, 'moradia', true),
    (p_user_id, 'Internet', 120, 10, 'contas', true);

  INSERT INTO public.tarefas_unificadas (
    user_id, titulo, descricao, score_urgencia, status, prioridade, origem,
    data_vencimento, score_reason, horizon_override
  )
  VALUES
    (p_user_id, 'Revisar proposta do cliente', 'Demanda crítica do dia — use a Rotina Guiada.', 92, 'pendente', 'alta', 'manual',
      (current_date + time '11:00'), 'Score alto: prazo hoje + palavra urgente.', 'hoje'),
    (p_user_id, 'Pagar boleto da internet', 'Conta fixa espelhada no Kanban.', 84, 'pendente', 'alta', 'manual',
      (current_date + time '18:00'), 'Prazo hoje — não deixar vencer.', 'hoje');

  SELECT id INTO t_hoje_a FROM public.tarefas_unificadas
    WHERE user_id = p_user_id AND titulo = 'Revisar proposta do cliente';
  SELECT id INTO t_hoje_b FROM public.tarefas_unificadas
    WHERE user_id = p_user_id AND titulo = 'Pagar boleto da internet';

  INSERT INTO public.tarefas_unificadas (
    user_id, titulo, descricao, score_urgencia, status, prioridade, origem,
    data_vencimento, score_reason, horizon_override
  )
  VALUES
    (p_user_id, 'Organizar extrato do cartão', 'Conferir lançamentos da fatura.', 58, 'pendente', 'media', 'manual',
      (current_date + 3), 'Cabe nesta semana sem estourar a carga.', 'semana'),
    (p_user_id, 'Agendar check-up', 'Saúde preventiva — janela flexível.', 52, 'pendente', 'media', 'manual',
      (current_date + 5), 'Importante, mas não é de hoje.', 'semana');

  SELECT id INTO t_semana_a FROM public.tarefas_unificadas
    WHERE user_id = p_user_id AND titulo = 'Organizar extrato do cartão';
  SELECT id INTO t_semana_b FROM public.tarefas_unificadas
    WHERE user_id = p_user_id AND titulo = 'Agendar check-up';

  INSERT INTO public.tarefas_unificadas (
    user_id, titulo, descricao, score_urgencia, status, prioridade, origem,
    score_reason, horizon_override
  )
  VALUES
    (p_user_id, 'Ler artigo sobre 50/30/20', 'Backlog consciente — sem prazo.', 18, 'pendente', 'baixa', 'manual',
      'Decay: sem prazo e baixa urgência.', 'backlog'),
    (p_user_id, 'Pesquisar curso de inglês', 'Ideia para o trimestre.', 22, 'pendente', 'baixa', 'manual',
      'Adiada para não inflar HOJE.', 'backlog');

  SELECT id INTO t_back_a FROM public.tarefas_unificadas
    WHERE user_id = p_user_id AND titulo = 'Ler artigo sobre 50/30/20';

  INSERT INTO public.habitos_diarios (user_id, tipo, nome_exibicao, meta_diaria, progresso_atual, unidade, config)
  VALUES
    (p_user_id, 'agua', 'Água', 8, 5, 'copos', '{"incremento": 1}'::jsonb),
    (p_user_id, 'proteina', 'Proteína', 120, 70, 'g', '{"incremento": 10, "meta_kcal_diaria": 2000, "kcal_hoje": 1400}'::jsonb),
    (p_user_id, 'treino', 'Treino', 1, 0, 'sessão', '{"meta_minutos": 45, "plano_semana": {}}'::jsonb);

  INSERT INTO public.historico_habitos (user_id, habito_id, data, concluido)
  SELECT p_user_id, h.id, d::date, 1
  FROM public.habitos_diarios h
  CROSS JOIN generate_series(current_date - 4, current_date - 1, interval '1 day') AS d
  WHERE h.user_id = p_user_id AND h.tipo = 'agua';

  INSERT INTO public.axel_decision_events (user_id, task_id, kind, rationale, score, horizon, created_at)
  VALUES
    (p_user_id, t_hoje_a, 'promoted_hoje', 'Prazo hoje e score crítico.', 92, 'hoje', now() - interval '2 days'),
    (p_user_id, t_hoje_b, 'promoted_hoje', 'Boleto com vencimento no dia.', 84, 'hoje', now() - interval '1 day'),
    (p_user_id, t_semana_a, 'deferred_load', 'HOJE já estava no teto de carga.', 58, 'semana', now() - interval '3 days'),
    (p_user_id, t_semana_b, 'deferred_load', 'Capacidade diária insuficiente.', 52, 'semana', now() - interval '2 days'),
    (p_user_id, t_back_a, 'decay_backlog', 'Sem prazo — score decaiu.', 18, 'backlog', now() - interval '4 days'),
    (p_user_id, NULL, 'email_ingest', 'Ingestão por e-mail (exemplo do seed).', 70, 'hoje', now() - interval '5 days'),
    (p_user_id, t_hoje_a, 'manual_override', 'Visitante fixou em HOJE.', 92, 'hoje', now() - interval '6 hours'),
    (p_user_id, t_semana_a, 'manual_override', 'Arraste para Semana respeitado.', 58, 'semana', now() - interval '12 hours');

  INSERT INTO public.user_workspace_prefs (user_id, prefs, updated_at)
  VALUES (
    p_user_id,
    jsonb_build_object(
      'setup_completed_at', now()::text,
      'display_name', 'Visitante',
      'axel_calls_you', 'você',
      'accent', 'copper',
      'mascot_mood', 'calm',
      'avatar_style', 'initials',
      'dashboard_priority', 'tasks',
      'ai_coach_enabled', true
    ),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    prefs = EXCLUDED.prefs,
    updated_at = now();

  UPDATE public.profiles
  SET nome_completo = 'Visitante Demo', email = v_email
  WHERE id = p_user_id;

  UPDATE public.app_demo_account
  SET last_reset_at = now()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('ok', true, 'user_id', p_user_id, 'email', v_email);
END;
$$;

REVOKE ALL ON FUNCTION public.reset_demo_workspace(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reset_demo_workspace(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.reset_demo_workspace(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.reset_demo_workspace(uuid) TO service_role;

NOTIFY pgrst, 'reload schema';
