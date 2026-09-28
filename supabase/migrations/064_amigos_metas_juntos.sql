-- Amigos no celular + Metas juntos (docs/METAS_JUNTOS.md, fases 0, 1 e 2)
--
-- 1. Círculo: aceite atômico por RPC (accept_friend_invite), fim da policy
--    frouxa de UPDATE em friend_invites, fim do INSERT direto em friendships,
--    remover amigo e silenciar amigo.
-- 2. Metas juntos: metas com até 5 pessoas. Cada contribuição só o dono lê.
--    O grupo lê o progresso por shared_goal_progress (SECURITY DEFINER), que
--    devolve só faixa (0..4) ou ritmo, nunca número por pessoa nem soma.

-- ════════════════════════════════════════════════════════════════════
-- 1. Círculo de amigos
-- ════════════════════════════════════════════════════════════════════

-- Qualquer usuário logado podia atualizar convite alheio (uses_left) e listar
-- todos os códigos válidos. O aceite agora é só pela RPC abaixo.
DROP POLICY IF EXISTS "friend_invites_update_accept" ON public.friend_invites;
DROP POLICY IF EXISTS "friend_invites_select_valid" ON public.friend_invites;

DROP POLICY IF EXISTS "friend_invites_delete_own" ON public.friend_invites;
CREATE POLICY "friend_invites_delete_own"
  ON public.friend_invites FOR DELETE
  USING (inviter_id = auth.uid());

-- INSERT direto deixava criar amizade com qualquer user_id.
DROP POLICY IF EXISTS "friendships_insert_participant" ON public.friendships;

DROP POLICY IF EXISTS "friendships_delete_participant" ON public.friendships;
CREATE POLICY "friendships_delete_participant"
  ON public.friendships FOR DELETE
  USING (user_a = auth.uid() OR user_b = auth.uid());

CREATE OR REPLACE FUNCTION public.accept_friend_invite(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_inv public.friend_invites%ROWTYPE;
  v_a UUID;
  v_b UUID;
  v_existing TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Faça login para aceitar o convite');
  END IF;

  SELECT * INTO v_inv
  FROM public.friend_invites
  WHERE code = upper(trim(p_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Convite inválido ou expirado');
  END IF;

  IF v_inv.inviter_id = v_uid THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Este convite é seu. Mande o link para alguém');
  END IF;

  v_a := LEAST(v_inv.inviter_id, v_uid);
  v_b := GREATEST(v_inv.inviter_id, v_uid);

  SELECT status INTO v_existing
  FROM public.friendships
  WHERE user_a = v_a AND user_b = v_b;

  IF v_existing = 'accepted' THEN
    RETURN jsonb_build_object('ok', true, 'message', 'Vocês já estão no mesmo Círculo', 'friend_id', v_inv.inviter_id);
  END IF;

  IF v_inv.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Este convite expirou. Peça um novo quando quiser');
  END IF;

  IF v_inv.uses_left <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Este convite já foi usado. Peça um novo quando quiser');
  END IF;

  INSERT INTO public.friendships (user_a, user_b, status)
  VALUES (v_a, v_b, 'accepted')
  ON CONFLICT (user_a, user_b) DO UPDATE SET status = 'accepted';

  UPDATE public.friend_invites
  SET uses_left = GREATEST(0, uses_left - 1)
  WHERE id = v_inv.id;

  RETURN jsonb_build_object('ok', true, 'message', 'Vocês estão no mesmo Círculo', 'friend_id', v_inv.inviter_id);
END;
$$;

REVOKE ALL ON FUNCTION public.accept_friend_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_friend_invite(TEXT) TO authenticated;

-- Silenciar amigo: só quem silenciou sabe. Não recebe apoio dele por push.
CREATE TABLE IF NOT EXISTS public.friend_mutes (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, friend_id)
);

ALTER TABLE public.friend_mutes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS friend_mutes_own ON public.friend_mutes;
CREATE POLICY friend_mutes_own ON public.friend_mutes
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════
-- 2. Metas juntos
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.shared_goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo        TEXT NOT NULL CHECK (char_length(trim(titulo)) BETWEEN 1 AND 60),
  metrica       TEXT NOT NULL CHECK (metrica IN ('agua', 'treino', 'proteina', 'sono', 'foco', 'tarefas', 'humor', 'livre')),
  unidade       TEXT NOT NULL DEFAULT '' CHECK (char_length(unidade) <= 24),
  alvo          NUMERIC NOT NULL CHECK (alvo > 0 AND alvo <= 1000000),
  modo_contagem TEXT NOT NULL DEFAULT 'pote' CHECK (modo_contagem IN ('pote', 'cada_um')),
  exibicao      TEXT NOT NULL DEFAULT 'faixas' CHECK (exibicao IN ('faixas', 'ritmo')),
  inicio        DATE NOT NULL,
  fim           DATE,
  ciclo         TEXT NOT NULL DEFAULT 'total' CHECK (ciclo IN ('semanal', 'total')),
  status        TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'encerrada')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (fim IS NULL OR fim >= inicio),
  CHECK (fim IS NOT NULL OR ciclo = 'semanal')
);

ALTER TABLE public.shared_goals ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.shared_goal_members (
  goal_id   UUID NOT NULL REFERENCES public.shared_goals(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  muted     BOOLEAN NOT NULL DEFAULT false,
  left_at   TIMESTAMPTZ,
  PRIMARY KEY (goal_id, user_id)
);

CREATE INDEX IF NOT EXISTS ix_shared_goal_members_user ON public.shared_goal_members (user_id);

ALTER TABLE public.shared_goal_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.shared_goal_invites (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code       TEXT NOT NULL UNIQUE,
  goal_id    UUID NOT NULL REFERENCES public.shared_goals(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  uses_left  INTEGER NOT NULL DEFAULT 4 CHECK (uses_left >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_shared_goal_invites_goal ON public.shared_goal_invites (goal_id);

ALTER TABLE public.shared_goal_invites ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.shared_goal_entries (
  goal_id    UUID NOT NULL REFERENCES public.shared_goals(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dia        DATE NOT NULL,
  valor      NUMERIC NOT NULL DEFAULT 0 CHECK (valor >= 0 AND valor <= 100000),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (goal_id, user_id, dia)
);

CREATE INDEX IF NOT EXISTS ix_shared_goal_entries_goal_dia ON public.shared_goal_entries (goal_id, dia);

ALTER TABLE public.shared_goal_entries ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.shared_goal_cheers (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  goal_id     UUID NOT NULL REFERENCES public.shared_goals(id) ON DELETE CASCADE,
  from_user   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preset_key  TEXT NOT NULL CHECK (preset_key IN ('to_contigo', 'bora_juntos', 'orgulho', 'um_passo', 'descansa')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_shared_goal_cheers_goal ON public.shared_goal_cheers (goal_id, created_at DESC);

ALTER TABLE public.shared_goal_cheers ENABLE ROW LEVEL SECURITY;

-- Progresso guardado por até 1 hora: quem muda o próprio registro para
-- testar onde a faixa vira precisa esperar, o que torna inútil tentar
-- descobrir o número do outro numa dupla. Sem policies: só as funções leem.
CREATE TABLE IF NOT EXISTS public.shared_goal_progress_cache (
  goal_id     UUID PRIMARY KEY REFERENCES public.shared_goals(id) ON DELETE CASCADE,
  cycle_start DATE NOT NULL,
  members     INTEGER NOT NULL,
  payload     JSONB NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_goal_progress_cache ENABLE ROW LEVEL SECURITY;

-- ── Helpers ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_shared_goal_member(p_goal_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shared_goal_members m
    WHERE m.goal_id = p_goal_id
      AND m.user_id = auth.uid()
      AND m.left_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_shared_goal_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_shared_goal_member(UUID) TO authenticated;

-- Dia civil do app (o público é do Brasil; o mesmo fuso do resumo semanal)
CREATE OR REPLACE FUNCTION public.shared_goal_today()
RETURNS DATE
LANGUAGE sql
STABLE
AS $$
  SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date;
$$;

CREATE OR REPLACE FUNCTION public.shared_goal_random_code()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_out TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    v_out := v_out || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
  END LOOP;
  RETURN v_out;
END;
$$;

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
    ELSE 100000
  END;
  NEW.valor := LEAST(GREATEST(NEW.valor, 0), v_max);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shared_goal_entry_guard ON public.shared_goal_entries;
CREATE TRIGGER trg_shared_goal_entry_guard
  BEFORE INSERT OR UPDATE ON public.shared_goal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.shared_goal_entry_guard();

-- ── Policies ─────────────────────────────────────────────────────────

-- Meta: só membros veem. Criar, convidar, entrar e sair: só por RPC.
DROP POLICY IF EXISTS shared_goals_select_member ON public.shared_goals;
CREATE POLICY shared_goals_select_member ON public.shared_goals
  FOR SELECT
  USING (public.is_shared_goal_member(id));

-- Membros: cada um lê só a própria linha (silenciar é privado).
-- Nome e avatar dos outros vêm de shared_goal_members_public.
DROP POLICY IF EXISTS shared_goal_members_select_own ON public.shared_goal_members;
CREATE POLICY shared_goal_members_select_own ON public.shared_goal_members
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS shared_goal_invites_select_own ON public.shared_goal_invites;
CREATE POLICY shared_goal_invites_select_own ON public.shared_goal_invites
  FOR SELECT
  USING (inviter_id = auth.uid());

DROP POLICY IF EXISTS shared_goal_invites_delete_own ON public.shared_goal_invites;
CREATE POLICY shared_goal_invites_delete_own ON public.shared_goal_invites
  FOR DELETE
  USING (inviter_id = auth.uid());

-- Contribuições: só o dono lê e escreve. Ninguém mais, nem membro.
DROP POLICY IF EXISTS shared_goal_entries_select_own ON public.shared_goal_entries;
CREATE POLICY shared_goal_entries_select_own ON public.shared_goal_entries
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS shared_goal_entries_insert_own ON public.shared_goal_entries;
CREATE POLICY shared_goal_entries_insert_own ON public.shared_goal_entries
  FOR INSERT
  WITH CHECK (user_id = auth.uid() AND public.is_shared_goal_member(goal_id));

DROP POLICY IF EXISTS shared_goal_entries_update_own ON public.shared_goal_entries;
CREATE POLICY shared_goal_entries_update_own ON public.shared_goal_entries
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND public.is_shared_goal_member(goal_id));

-- Apoio: membros leem; enviar só por RPC (presets e limite diário).
DROP POLICY IF EXISTS shared_goal_cheers_select_member ON public.shared_goal_cheers;
CREATE POLICY shared_goal_cheers_select_member ON public.shared_goal_cheers
  FOR SELECT
  USING (public.is_shared_goal_member(goal_id));

-- ── RPCs ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_shared_goal(
  p_titulo TEXT,
  p_metrica TEXT,
  p_unidade TEXT,
  p_alvo NUMERIC,
  p_modo_contagem TEXT,
  p_exibicao TEXT,
  p_inicio DATE,
  p_fim DATE,
  p_ciclo TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_id UUID;
  v_active INT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Faça login para criar uma meta');
  END IF;

  IF p_metrica = 'livre' AND char_length(trim(coalesce(p_unidade, ''))) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Diga o que vão contar');
  END IF;

  SELECT count(*) INTO v_active
  FROM public.shared_goal_members m
  JOIN public.shared_goals g ON g.id = m.goal_id
  WHERE m.user_id = v_uid AND m.left_at IS NULL AND g.status = 'ativa';

  IF v_active >= 20 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Você já tem muitas metas abertas. Que tal encerrar uma?');
  END IF;

  INSERT INTO public.shared_goals (
    created_by, titulo, metrica, unidade, alvo, modo_contagem, exibicao, inicio, fim, ciclo
  )
  VALUES (
    v_uid,
    trim(p_titulo),
    p_metrica,
    trim(coalesce(p_unidade, '')),
    p_alvo,
    coalesce(p_modo_contagem, 'pote'),
    coalesce(p_exibicao, 'faixas'),
    coalesce(p_inicio, public.shared_goal_today()),
    p_fim,
    CASE WHEN p_fim IS NULL THEN 'semanal' ELSE coalesce(p_ciclo, 'total') END
  )
  RETURNING id INTO v_id;

  INSERT INTO public.shared_goal_members (goal_id, user_id, role)
  VALUES (v_id, v_uid, 'owner');

  RETURN jsonb_build_object('ok', true, 'goal_id', v_id);
EXCEPTION
  WHEN check_violation THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Confira o nome, o alvo e as datas');
END;
$$;

REVOKE ALL ON FUNCTION public.create_shared_goal(TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, DATE, DATE, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_shared_goal(TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, DATE, DATE, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_shared_goal_invite(p_goal_id UUID)
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
  IF v_uid IS NULL OR NOT public.is_shared_goal_member(p_goal_id) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Só quem está na meta pode convidar');
  END IF;

  IF (SELECT status FROM public.shared_goals WHERE id = p_goal_id) <> 'ativa' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Esta meta já foi encerrada');
  END IF;

  SELECT count(*) INTO v_members
  FROM public.shared_goal_members
  WHERE goal_id = p_goal_id AND left_at IS NULL;

  IF v_members >= 5 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'A meta já tem 5 pessoas');
  END IF;

  -- Reaproveita convite ainda válido deste membro
  SELECT code INTO v_code
  FROM public.shared_goal_invites
  WHERE goal_id = p_goal_id AND inviter_id = v_uid AND expires_at > now() AND uses_left > 0
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_code IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'code', v_code);
  END IF;

  LOOP
    v_try := v_try + 1;
    v_code := public.shared_goal_random_code();
    BEGIN
      INSERT INTO public.shared_goal_invites (code, goal_id, inviter_id, expires_at, uses_left)
      VALUES (v_code, p_goal_id, v_uid, now() + interval '7 days', 5 - v_members);
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

REVOKE ALL ON FUNCTION public.create_shared_goal_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_shared_goal_invite(UUID) TO authenticated;

-- Prévia do convite (nome da meta, quem chamou): antes de aceitar
CREATE OR REPLACE FUNCTION public.preview_goal_invite(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.shared_goal_invites%ROWTYPE;
  v_goal public.shared_goals%ROWTYPE;
  v_name TEXT;
  v_members INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Faça login para ver o convite');
  END IF;

  SELECT * INTO v_inv FROM public.shared_goal_invites WHERE code = upper(trim(p_code));
  IF NOT FOUND OR v_inv.expires_at < now() OR v_inv.uses_left <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Convite inválido ou expirado');
  END IF;

  SELECT * INTO v_goal FROM public.shared_goals WHERE id = v_inv.goal_id;
  SELECT coalesce(nullif(trim(c.axel_calls_you), ''), nullif(trim(c.display_name), ''), 'Alguém')
    INTO v_name
  FROM public.user_public_cards c WHERE c.user_id = v_inv.inviter_id;

  SELECT count(*) INTO v_members
  FROM public.shared_goal_members WHERE goal_id = v_goal.id AND left_at IS NULL;

  RETURN jsonb_build_object(
    'ok', true,
    'titulo', v_goal.titulo,
    'metrica', v_goal.metrica,
    'unidade', v_goal.unidade,
    'alvo', v_goal.alvo,
    'modo_contagem', v_goal.modo_contagem,
    'exibicao', v_goal.exibicao,
    'inicio', v_goal.inicio,
    'fim', v_goal.fim,
    'ciclo', v_goal.ciclo,
    'inviter_name', coalesce(v_name, 'Alguém'),
    'members', v_members,
    'already_member', public.is_shared_goal_member(v_goal.id)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.preview_goal_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preview_goal_invite(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_goal_invite(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_inv public.shared_goal_invites%ROWTYPE;
  v_goal public.shared_goals%ROWTYPE;
  v_members INT;
  v_row public.shared_goal_members%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Faça login para aceitar o convite');
  END IF;

  SELECT * INTO v_inv
  FROM public.shared_goal_invites
  WHERE code = upper(trim(p_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Convite inválido ou expirado');
  END IF;

  -- Trava a meta: dois aceites ao mesmo tempo não passam de 5
  SELECT * INTO v_goal FROM public.shared_goals WHERE id = v_inv.goal_id FOR UPDATE;

  SELECT * INTO v_row
  FROM public.shared_goal_members
  WHERE goal_id = v_goal.id AND user_id = v_uid;

  IF FOUND AND v_row.left_at IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'message', 'Você já está nesta meta', 'goal_id', v_goal.id);
  END IF;

  IF v_goal.status <> 'ativa' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Esta meta já foi encerrada');
  END IF;

  IF v_inv.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Este convite expirou. Peça um novo quando quiser');
  END IF;

  IF v_inv.uses_left <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Este convite já foi usado. Peça um novo quando quiser');
  END IF;

  SELECT count(*) INTO v_members
  FROM public.shared_goal_members
  WHERE goal_id = v_goal.id AND left_at IS NULL;

  IF v_members >= 5 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'A meta já tem 5 pessoas');
  END IF;

  IF v_row.user_id IS NOT NULL THEN
    UPDATE public.shared_goal_members
    SET left_at = NULL, muted = false, joined_at = now()
    WHERE goal_id = v_goal.id AND user_id = v_uid;
  ELSE
    INSERT INTO public.shared_goal_members (goal_id, user_id, role)
    VALUES (v_goal.id, v_uid, 'member');
  END IF;

  UPDATE public.shared_goal_invites
  SET uses_left = GREATEST(0, uses_left - 1)
  WHERE id = v_inv.id;

  DELETE FROM public.shared_goal_progress_cache WHERE goal_id = v_goal.id;

  RETURN jsonb_build_object('ok', true, 'message', 'Você entrou na meta', 'goal_id', v_goal.id);
END;
$$;

REVOKE ALL ON FUNCTION public.accept_goal_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_goal_invite(TEXT) TO authenticated;

-- Sair é livre e silencioso: ninguém é avisado.
CREATE OR REPLACE FUNCTION public.leave_shared_goal(p_goal_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_left INT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  UPDATE public.shared_goal_members
  SET left_at = now()
  WHERE goal_id = p_goal_id AND user_id = v_uid AND left_at IS NULL;

  -- As próprias contribuições vão embora junto
  DELETE FROM public.shared_goal_entries WHERE goal_id = p_goal_id AND user_id = v_uid;
  DELETE FROM public.shared_goal_progress_cache WHERE goal_id = p_goal_id;

  SELECT count(*) INTO v_left
  FROM public.shared_goal_members
  WHERE goal_id = p_goal_id AND left_at IS NULL;

  IF v_left = 0 THEN
    UPDATE public.shared_goals SET status = 'encerrada' WHERE id = p_goal_id;
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.leave_shared_goal(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leave_shared_goal(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_shared_goal_muted(p_goal_id UUID, p_muted BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.shared_goal_members
  SET muted = coalesce(p_muted, true)
  WHERE goal_id = p_goal_id AND user_id = auth.uid() AND left_at IS NULL;
  RETURN jsonb_build_object('ok', FOUND);
END;
$$;

REVOKE ALL ON FUNCTION public.set_shared_goal_muted(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_shared_goal_muted(UUID, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.send_shared_goal_cheer(p_goal_id UUID, p_preset_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_today DATE := public.shared_goal_today();
  v_sent INT;
  v_id BIGINT;
BEGIN
  IF v_uid IS NULL OR NOT public.is_shared_goal_member(p_goal_id) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Só quem está na meta manda apoio');
  END IF;

  IF p_preset_key NOT IN ('to_contigo', 'bora_juntos', 'orgulho', 'um_passo', 'descansa') THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Mensagem indisponível');
  END IF;

  SELECT count(*) INTO v_sent
  FROM public.shared_goal_cheers
  WHERE goal_id = p_goal_id
    AND from_user = v_uid
    AND (created_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today;

  IF v_sent >= 3 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Seu apoio de hoje já chegou. Amanhã tem mais');
  END IF;

  INSERT INTO public.shared_goal_cheers (goal_id, from_user, preset_key)
  VALUES (p_goal_id, v_uid, p_preset_key)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'cheer_id', v_id, 'left_today', 2 - v_sent);
END;
$$;

REVOKE ALL ON FUNCTION public.send_shared_goal_cheer(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_shared_goal_cheer(UUID, TEXT) TO authenticated;

-- Nome e avatar de quem está na meta, sem número e sem "silenciado"
CREATE OR REPLACE FUNCTION public.shared_goal_members_public(p_goal_id UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  accent TEXT,
  avatar_style TEXT,
  role TEXT,
  is_me BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_shared_goal_member(p_goal_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    m.user_id,
    coalesce(nullif(trim(c.axel_calls_you), ''), nullif(trim(c.display_name), ''), 'Alguém')::TEXT,
    coalesce(c.accent, 'copper')::TEXT,
    coalesce(c.avatar_style, 'initials')::TEXT,
    m.role,
    m.user_id = auth.uid()
  FROM public.shared_goal_members m
  LEFT JOIN public.user_public_cards c ON c.user_id = m.user_id
  WHERE m.goal_id = p_goal_id AND m.left_at IS NULL
  ORDER BY m.joined_at;
END;
$$;

REVOKE ALL ON FUNCTION public.shared_goal_members_public(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.shared_goal_members_public(UUID) TO authenticated;

-- ── Progresso: só faixa ou ritmo ─────────────────────────────────────
-- Espelha packages/shared/src/sharedGoals.ts (sharedGoalCycle,
-- expectedPace, faixaFromRatio, ritmoFromRatio, isOnPace).
CREATE OR REPLACE FUNCTION public.shared_goal_progress(p_goal_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_goal public.shared_goals%ROWTYPE;
  v_today DATE := public.shared_goal_today();
  v_ref DATE;
  v_start DATE;
  v_end DATE;
  v_idx INT := 0;
  v_total INT;
  v_elapsed INT;
  v_ended BOOLEAN := false;
  v_not_started BOOLEAN := false;
  v_expected NUMERIC;
  v_members INT;
  v_sum NUMERIC;
  v_ratio NUMERIC;
  v_on_pace INT;
  v_mean NUMERIC;
  v_faixa INT;
  v_ritmo TEXT;
  v_cache public.shared_goal_progress_cache%ROWTYPE;
  v_core JSONB;
  v_tol CONSTANT NUMERIC := 0.15;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_shared_goal_member(p_goal_id) THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  SELECT * INTO v_goal FROM public.shared_goals WHERE id = p_goal_id;

  -- Ciclo atual
  IF v_today < v_goal.inicio THEN
    v_not_started := true;
    v_start := v_goal.inicio;
    v_end := CASE WHEN v_goal.ciclo = 'total' AND v_goal.fim IS NOT NULL THEN v_goal.fim ELSE v_goal.inicio + 6 END;
  ELSE
    v_ref := CASE WHEN v_goal.fim IS NOT NULL AND v_today > v_goal.fim THEN v_goal.fim ELSE v_today END;
    v_ended := v_ref <> v_today;
    IF v_goal.ciclo = 'total' AND v_goal.fim IS NOT NULL THEN
      v_start := v_goal.inicio;
      v_end := v_goal.fim;
    ELSE
      v_idx := floor((v_ref - v_goal.inicio) / 7.0)::int;
      v_start := v_goal.inicio + v_idx * 7;
      v_end := v_start + 6;
      IF v_goal.fim IS NOT NULL AND v_end > v_goal.fim THEN
        v_end := v_goal.fim;
      END IF;
    END IF;
  END IF;

  v_total := (v_end - v_start) + 1;
  v_elapsed := CASE
    WHEN v_not_started THEN 0
    WHEN v_ended THEN v_total
    ELSE LEAST(v_total, (v_today - v_start) + 1)
  END;

  SELECT count(*) INTO v_members
  FROM public.shared_goal_members
  WHERE goal_id = p_goal_id AND left_at IS NULL;

  -- Cache de até 1 hora (mesmo ciclo, mesmo número de pessoas)
  SELECT * INTO v_cache FROM public.shared_goal_progress_cache WHERE goal_id = p_goal_id;
  IF FOUND
     AND v_cache.cycle_start = v_start
     AND v_cache.members = v_members
     AND v_cache.computed_at > now() - interval '1 hour'
  THEN
    v_core := v_cache.payload;
  ELSE
    v_expected := CASE
      WHEN v_total <= 0 OR v_elapsed >= v_total THEN 1
      ELSE GREATEST(0, v_elapsed - 0.5) / v_total
    END;

    IF v_goal.modo_contagem = 'pote' THEN
      SELECT coalesce(sum(e.valor), 0) INTO v_sum
      FROM public.shared_goal_entries e
      JOIN public.shared_goal_members m
        ON m.goal_id = e.goal_id AND m.user_id = e.user_id AND m.left_at IS NULL
      WHERE e.goal_id = p_goal_id AND e.dia BETWEEN v_start AND v_end;

      v_ratio := v_sum / v_goal.alvo;
      v_on_pace := NULL;
    ELSE
      -- Cada um a sua: fração de cada pessoa, limitada a 1
      WITH per AS (
        SELECT m.user_id,
               LEAST(1, coalesce(sum(e.valor), 0) / v_goal.alvo) AS r
        FROM public.shared_goal_members m
        LEFT JOIN public.shared_goal_entries e
          ON e.goal_id = m.goal_id AND e.user_id = m.user_id AND e.dia BETWEEN v_start AND v_end
        WHERE m.goal_id = p_goal_id AND m.left_at IS NULL
        GROUP BY m.user_id
      )
      SELECT coalesce(avg(r), 0),
             count(*) FILTER (WHERE r >= 1 OR r - v_expected >= -v_tol)
      INTO v_mean, v_on_pace
      FROM per;

      v_ratio := v_mean;
    END IF;

    v_faixa := CASE
      WHEN v_ratio < 0.25 THEN 0
      WHEN v_ratio < 0.5 THEN 1
      WHEN v_ratio < 0.75 THEN 2
      WHEN v_ratio < 1 THEN 3
      ELSE 4
    END;

    v_ritmo := CASE
      WHEN v_ratio >= 1 THEN 'a_frente'
      WHEN v_ratio - v_expected < -v_tol THEN 'atras'
      WHEN v_ratio - v_expected > v_tol THEN 'a_frente'
      ELSE 'no_ritmo'
    END;

    -- Só o modo escolhido sai daqui
    v_core := jsonb_build_object(
      'faixa', CASE WHEN v_goal.exibicao = 'faixas' THEN v_faixa ELSE NULL END,
      'ritmo', CASE WHEN v_goal.exibicao = 'ritmo' THEN v_ritmo ELSE NULL END,
      'on_pace', v_on_pace
    );

    INSERT INTO public.shared_goal_progress_cache (goal_id, cycle_start, members, payload, computed_at)
    VALUES (p_goal_id, v_start, v_members, v_core, now())
    ON CONFLICT (goal_id) DO UPDATE
      SET cycle_start = EXCLUDED.cycle_start,
          members = EXCLUDED.members,
          payload = EXCLUDED.payload,
          computed_at = EXCLUDED.computed_at;
  END IF;

  RETURN v_core || jsonb_build_object(
    'ok', true,
    'exibicao', v_goal.exibicao,
    'modo', v_goal.modo_contagem,
    'members', v_members,
    'days_elapsed', v_elapsed,
    'days_total', v_total,
    'cycle_start', v_start,
    'cycle_end', v_end,
    'cycle_index', v_idx,
    'ended', v_ended,
    'not_started', v_not_started
  );
END;
$$;

REVOKE ALL ON FUNCTION public.shared_goal_progress(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.shared_goal_progress(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
