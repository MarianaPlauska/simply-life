-- =====================================================
-- 073 — Ligas cooperativas (amigos e temáticas)
-- Um grupo de 2 a 8 pessoas enche um pote semanal de XP. Bateu o pote, a
-- liga inteira sobe de divisão. Não existe rebaixamento.
-- Privacidade igual às Metas juntos (docs/METAS_JUNTOS.md):
--   * o XP de cada pessoa só o dono lê (RLS user_id = auth.uid())
--   * o grupo lê o progresso por liga_progress (SECURITY DEFINER), que devolve
--     só a faixa do pote (0..4), nunca número por pessoa nem a soma
-- Áreas: geral (todo XP) ou temática (tarefas, foco, treino).
-- Semana: segunda a domingo no horário de Brasília.
-- =====================================================

-- XP da semana por pessoa e área (o app grava o próprio total)
CREATE TABLE IF NOT EXISTS public.xp_semana (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  semana      DATE NOT NULL,                       -- segunda-feira
  area        TEXT NOT NULL CHECK (area IN ('geral', 'tarefas', 'foco', 'treino')),
  xp          INTEGER NOT NULL DEFAULT 0 CHECK (xp BETWEEN 0 AND 1000),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, semana, area),
  CHECK (extract(isodow FROM semana) = 1)
);

ALTER TABLE public.xp_semana ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS xp_semana_own ON public.xp_semana;
CREATE POLICY xp_semana_own ON public.xp_semana
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE ON public.xp_semana TO authenticated;

CREATE TABLE IF NOT EXISTS public.ligas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL CHECK (char_length(trim(nome)) BETWEEN 1 AND 40),
  tipo        TEXT NOT NULL DEFAULT 'amigos' CHECK (tipo IN ('amigos', 'tematica')),
  area        TEXT NOT NULL DEFAULT 'geral' CHECK (area IN ('geral', 'tarefas', 'foco', 'treino')),
  divisao     SMALLINT NOT NULL DEFAULT 0 CHECK (divisao >= 0),
  /** primeira semana que conta (segunda da semana de criação) */
  inicio      DATE NOT NULL,
  /** última semana já fechada (promoção aplicada) */
  fechada_ate DATE,
  status      TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'encerrada')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.liga_membros (
  liga_id    UUID NOT NULL REFERENCES public.ligas(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at    TIMESTAMPTZ,
  PRIMARY KEY (liga_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.liga_convites (
  id          BIGSERIAL PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  liga_id     UUID NOT NULL REFERENCES public.ligas(id) ON DELETE CASCADE,
  inviter_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  uses_left   INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Histórico das semanas fechadas de cada liga (só faixa e se subiu)
CREATE TABLE IF NOT EXISTS public.liga_semanas (
  liga_id   UUID NOT NULL REFERENCES public.ligas(id) ON DELETE CASCADE,
  semana    DATE NOT NULL,
  faixa     SMALLINT NOT NULL CHECK (faixa BETWEEN 0 AND 4),
  subiu     BOOLEAN NOT NULL DEFAULT false,
  divisao   SMALLINT NOT NULL,
  PRIMARY KEY (liga_id, semana)
);

ALTER TABLE public.ligas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liga_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liga_convites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liga_semanas ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_liga_member(p_liga_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.liga_membros
    WHERE liga_id = p_liga_id AND user_id = auth.uid() AND left_at IS NULL
  );
$$;

-- Leitura direta só para quem está na liga; escrita só pelas funções abaixo
DROP POLICY IF EXISTS ligas_select_member ON public.ligas;
CREATE POLICY ligas_select_member ON public.ligas
  FOR SELECT USING (public.is_liga_member(id));

DROP POLICY IF EXISTS liga_membros_select_self ON public.liga_membros;
CREATE POLICY liga_membros_select_self ON public.liga_membros
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS liga_semanas_select_member ON public.liga_semanas;
CREATE POLICY liga_semanas_select_member ON public.liga_semanas
  FOR SELECT USING (public.is_liga_member(liga_id));

GRANT SELECT ON public.ligas, public.liga_membros, public.liga_semanas TO authenticated;

CREATE OR REPLACE FUNCTION public.liga_week_start(p_day DATE DEFAULT NULL)
RETURNS DATE
LANGUAGE sql
STABLE
AS $$
  SELECT date_trunc('week', coalesce(p_day, (now() AT TIME ZONE 'America/Sao_Paulo')::date))::date;
$$;

-- Pote da semana: 150 XP por pessoa, +8% por divisão (sobe devagar)
CREATE OR REPLACE FUNCTION public.liga_alvo(p_members INT, p_divisao INT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT GREATEST(1, round(GREATEST(p_members, 1) * 150 * (1 + 0.08 * GREATEST(p_divisao, 0))))::int;
$$;

-- Soma do pote numa semana. Interna: nunca exposta ao app.
CREATE OR REPLACE FUNCTION public.liga_soma(p_liga_id UUID, p_semana DATE)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(sum(x.xp), 0)::int
  FROM public.liga_membros m
  JOIN public.ligas l ON l.id = m.liga_id
  JOIN public.xp_semana x
    ON x.user_id = m.user_id AND x.semana = p_semana AND x.area = l.area
  WHERE m.liga_id = p_liga_id
    AND m.joined_at < (p_semana + 7)
    AND (m.left_at IS NULL OR m.left_at >= p_semana);
$$;
REVOKE ALL ON FUNCTION public.liga_soma(UUID, DATE) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.liga_faixa(p_soma INT, p_alvo INT)
RETURNS SMALLINT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_alvo <= 0 THEN 4
    WHEN p_soma >= p_alvo THEN 4
    WHEN p_soma >= p_alvo * 0.75 THEN 3
    WHEN p_soma >= p_alvo * 0.5 THEN 2
    WHEN p_soma >= p_alvo * 0.25 THEN 1
    ELSE 0
  END::smallint;
$$;

-- Fecha as semanas passadas ainda abertas: grava a faixa e sobe a divisão
-- de quem encheu o pote. Chamada ao ler o progresso (sem cron).
CREATE OR REPLACE FUNCTION public.liga_settle(p_liga_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_liga public.ligas%ROWTYPE;
  v_week DATE;
  v_current DATE := public.liga_week_start();
  v_members INT;
  v_soma INT;
  v_alvo INT;
  v_faixa SMALLINT;
BEGIN
  SELECT * INTO v_liga FROM public.ligas WHERE id = p_liga_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  v_week := coalesce(v_liga.fechada_ate + 7, v_liga.inicio);
  WHILE v_week < v_current LOOP
    SELECT count(*) INTO v_members
    FROM public.liga_membros
    WHERE liga_id = p_liga_id
      AND joined_at < (v_week + 7)
      AND (left_at IS NULL OR left_at >= v_week);

    v_alvo := public.liga_alvo(v_members, v_liga.divisao);
    v_soma := public.liga_soma(p_liga_id, v_week);
    v_faixa := public.liga_faixa(v_soma, v_alvo);

    IF v_faixa = 4 AND v_members >= 2 THEN
      v_liga.divisao := v_liga.divisao + 1;
    END IF;

    INSERT INTO public.liga_semanas (liga_id, semana, faixa, subiu, divisao)
    VALUES (p_liga_id, v_week, v_faixa, v_faixa = 4 AND v_members >= 2, v_liga.divisao)
    ON CONFLICT (liga_id, semana) DO NOTHING;

    v_week := v_week + 7;
  END LOOP;

  UPDATE public.ligas
  SET divisao = v_liga.divisao, fechada_ate = v_current - 7
  WHERE id = p_liga_id AND v_current - 7 >= inicio;
END;
$$;
REVOKE ALL ON FUNCTION public.liga_settle(UUID) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.create_liga(p_nome TEXT, p_tipo TEXT, p_area TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_id UUID;
  v_count INT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Faça login para criar uma liga');
  END IF;

  SELECT count(*) INTO v_count
  FROM public.liga_membros WHERE user_id = v_uid AND left_at IS NULL;
  IF v_count >= 6 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Você já está em 6 ligas. Saia de uma para criar outra');
  END IF;

  IF p_tipo NOT IN ('amigos', 'tematica') OR p_area NOT IN ('geral', 'tarefas', 'foco', 'treino') THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Tipo de liga inválido');
  END IF;

  INSERT INTO public.ligas (created_by, nome, tipo, area, inicio)
  VALUES (v_uid, trim(p_nome), p_tipo, CASE WHEN p_tipo = 'amigos' THEN 'geral' ELSE p_area END, public.liga_week_start())
  RETURNING id INTO v_id;

  INSERT INTO public.liga_membros (liga_id, user_id, role) VALUES (v_id, v_uid, 'owner');
  RETURN jsonb_build_object('ok', true, 'liga_id', v_id);
END;
$$;
REVOKE ALL ON FUNCTION public.create_liga(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_liga(TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_liga_invite(p_liga_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_code TEXT;
  v_members INT;
  v_try INT := 0;
BEGIN
  IF v_uid IS NULL OR NOT public.is_liga_member(p_liga_id) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Só quem está na liga pode convidar');
  END IF;

  SELECT count(*) INTO v_members FROM public.liga_membros WHERE liga_id = p_liga_id AND left_at IS NULL;
  IF v_members >= 8 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'A liga já tem 8 pessoas');
  END IF;

  SELECT code INTO v_code
  FROM public.liga_convites
  WHERE liga_id = p_liga_id AND inviter_id = v_uid AND expires_at > now() AND uses_left > 0
  ORDER BY created_at DESC LIMIT 1;
  IF v_code IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'code', v_code);
  END IF;

  LOOP
    v_try := v_try + 1;
    v_code := public.shared_goal_random_code();
    BEGIN
      INSERT INTO public.liga_convites (code, liga_id, inviter_id, expires_at, uses_left)
      VALUES (v_code, p_liga_id, v_uid, now() + interval '7 days', 8 - v_members);
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_try >= 5 THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Não deu para gerar o convite agora');
      END IF;
    END;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'code', v_code);
END;
$$;
REVOKE ALL ON FUNCTION public.create_liga_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_liga_invite(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.preview_liga_invite(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.liga_convites%ROWTYPE;
  v_liga public.ligas%ROWTYPE;
  v_members INT;
  v_inviter TEXT;
BEGIN
  SELECT * INTO v_inv FROM public.liga_convites WHERE code = upper(trim(p_code));
  IF NOT FOUND OR v_inv.expires_at < now() OR v_inv.uses_left <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Convite inválido ou expirado');
  END IF;
  SELECT * INTO v_liga FROM public.ligas WHERE id = v_inv.liga_id;
  SELECT count(*) INTO v_members FROM public.liga_membros WHERE liga_id = v_liga.id AND left_at IS NULL;
  SELECT coalesce(nullif(trim(axel_calls_you), ''), nullif(trim(display_name), ''), 'Alguém')
    INTO v_inviter FROM public.user_public_cards WHERE user_id = v_inv.inviter_id;
  RETURN jsonb_build_object(
    'ok', true,
    'nome', v_liga.nome,
    'tipo', v_liga.tipo,
    'area', v_liga.area,
    'divisao', v_liga.divisao,
    'membros', v_members,
    'convidou', coalesce(v_inviter, 'Alguém')
  );
END;
$$;
REVOKE ALL ON FUNCTION public.preview_liga_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preview_liga_invite(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_liga_invite(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_inv public.liga_convites%ROWTYPE;
  v_liga public.ligas%ROWTYPE;
  v_row public.liga_membros%ROWTYPE;
  v_members INT;
  v_mine INT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Faça login para aceitar o convite');
  END IF;

  SELECT * INTO v_inv FROM public.liga_convites WHERE code = upper(trim(p_code)) FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Convite inválido ou expirado');
  END IF;

  SELECT * INTO v_liga FROM public.ligas WHERE id = v_inv.liga_id FOR UPDATE;
  SELECT * INTO v_row FROM public.liga_membros WHERE liga_id = v_liga.id AND user_id = v_uid;
  IF FOUND AND v_row.left_at IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'message', 'Você já está nesta liga', 'liga_id', v_liga.id);
  END IF;

  IF v_liga.status <> 'ativa' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Esta liga foi encerrada');
  END IF;
  IF v_inv.expires_at < now() OR v_inv.uses_left <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Este convite já não vale. Peça um novo quando quiser');
  END IF;

  SELECT count(*) INTO v_members FROM public.liga_membros WHERE liga_id = v_liga.id AND left_at IS NULL;
  IF v_members >= 8 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'A liga já tem 8 pessoas');
  END IF;

  SELECT count(*) INTO v_mine FROM public.liga_membros WHERE user_id = v_uid AND left_at IS NULL;
  IF v_mine >= 6 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Você já está em 6 ligas. Saia de uma para entrar nesta');
  END IF;

  IF v_row.user_id IS NOT NULL THEN
    UPDATE public.liga_membros SET left_at = NULL, joined_at = now()
    WHERE liga_id = v_liga.id AND user_id = v_uid;
  ELSE
    INSERT INTO public.liga_membros (liga_id, user_id, role) VALUES (v_liga.id, v_uid, 'member');
  END IF;

  UPDATE public.liga_convites SET uses_left = GREATEST(0, uses_left - 1) WHERE id = v_inv.id;
  RETURN jsonb_build_object('ok', true, 'message', 'Você entrou na liga', 'liga_id', v_liga.id);
END;
$$;
REVOKE ALL ON FUNCTION public.accept_liga_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_liga_invite(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.leave_liga(p_liga_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.liga_membros SET left_at = now()
  WHERE liga_id = p_liga_id AND user_id = auth.uid() AND left_at IS NULL;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.leave_liga(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leave_liga(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.liga_members_public(p_liga_id UUID)
RETURNS TABLE (user_id UUID, display_name TEXT, accent TEXT, avatar_style TEXT, role TEXT, is_me BOOLEAN)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_liga_member(p_liga_id) THEN RETURN; END IF;
  RETURN QUERY
  SELECT
    m.user_id,
    coalesce(nullif(trim(c.axel_calls_you), ''), nullif(trim(c.display_name), ''), 'Alguém')::TEXT,
    coalesce(c.accent, 'copper')::TEXT,
    coalesce(c.avatar_style, 'initials')::TEXT,
    m.role,
    m.user_id = auth.uid()
  FROM public.liga_membros m
  LEFT JOIN public.user_public_cards c ON c.user_id = m.user_id
  WHERE m.liga_id = p_liga_id AND m.left_at IS NULL
  ORDER BY m.joined_at;
END;
$$;
REVOKE ALL ON FUNCTION public.liga_members_public(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.liga_members_public(UUID) TO authenticated;

-- Progresso do pote: fecha semanas pendentes e devolve só faixa e divisão.
-- A faixa só aparece com 2 ou mais pessoas: sozinho, ela entregaria o seu número.
CREATE OR REPLACE FUNCTION public.liga_progress(p_liga_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_liga public.ligas%ROWTYPE;
  v_week DATE := public.liga_week_start();
  v_members INT;
  v_alvo INT;
  v_faixa SMALLINT;
  v_last public.liga_semanas%ROWTYPE;
  v_dias INT;
BEGIN
  IF NOT public.is_liga_member(p_liga_id) THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  PERFORM public.liga_settle(p_liga_id);
  SELECT * INTO v_liga FROM public.ligas WHERE id = p_liga_id;
  SELECT count(*) INTO v_members FROM public.liga_membros WHERE liga_id = p_liga_id AND left_at IS NULL;
  v_alvo := public.liga_alvo(v_members, v_liga.divisao);
  v_faixa := public.liga_faixa(public.liga_soma(p_liga_id, v_week), v_alvo);
  SELECT * INTO v_last FROM public.liga_semanas WHERE liga_id = p_liga_id ORDER BY semana DESC LIMIT 1;
  v_dias := (v_week + 7) - (now() AT TIME ZONE 'America/Sao_Paulo')::date;

  RETURN jsonb_build_object(
    'ok', true,
    'semana', v_week,
    'divisao', v_liga.divisao,
    'membros', v_members,
    'faixa', CASE WHEN v_members >= 2 THEN v_faixa ELSE NULL END,
    'dias_restantes', v_dias,
    'semana_passada', CASE WHEN v_last.liga_id IS NULL THEN NULL
      ELSE jsonb_build_object('semana', v_last.semana, 'faixa', v_last.faixa, 'subiu', v_last.subiu) END
  );
END;
$$;
REVOKE ALL ON FUNCTION public.liga_progress(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.liga_progress(UUID) TO authenticated;
