-- Workspace financeiro de casal (parceiro)
-- Separado de friend_invites / círculo social. Sem Open Finance.

CREATE TABLE IF NOT EXISTS public.partner_workspaces (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_workspaces ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.partner_workspace_members (
  workspace_id UUID NOT NULL REFERENCES public.partner_workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('owner', 'partner')),
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

-- Um usuário só entra em um workspace de casal por vez
CREATE UNIQUE INDEX IF NOT EXISTS uq_partner_member_user
  ON public.partner_workspace_members (user_id);

CREATE INDEX IF NOT EXISTS ix_partner_members_workspace
  ON public.partner_workspace_members (workspace_id);

ALTER TABLE public.partner_workspace_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.partner_invites (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code         TEXT NOT NULL UNIQUE,
  workspace_id UUID NOT NULL REFERENCES public.partner_workspaces(id) ON DELETE CASCADE,
  inviter_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at   TIMESTAMPTZ NOT NULL,
  used_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_partner_invites_code ON public.partner_invites (code);
CREATE INDEX IF NOT EXISTS ix_partner_invites_inviter ON public.partner_invites (inviter_id);

ALTER TABLE public.partner_invites ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.despesas
  ADD COLUMN IF NOT EXISTS compartilhada BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.despesas
  ADD COLUMN IF NOT EXISTS partner_workspace_id UUID
    REFERENCES public.partner_workspaces(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ix_despesas_partner_ws
  ON public.despesas (partner_workspace_id)
  WHERE compartilhada = true;

-- Helper RLS: membro do workspace?
CREATE OR REPLACE FUNCTION public.is_partner_workspace_member(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.partner_workspace_members m
    WHERE m.workspace_id = p_workspace_id
      AND m.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_partner_workspace_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_partner_workspace_member(UUID) TO authenticated;

-- Policies workspace
DROP POLICY IF EXISTS partner_workspaces_select ON public.partner_workspaces;
CREATE POLICY partner_workspaces_select ON public.partner_workspaces
  FOR SELECT
  USING (
    created_by = auth.uid()
    OR public.is_partner_workspace_member(id)
  );

DROP POLICY IF EXISTS partner_workspaces_insert ON public.partner_workspaces;
CREATE POLICY partner_workspaces_insert ON public.partner_workspaces
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Members
DROP POLICY IF EXISTS partner_members_select ON public.partner_workspace_members;
CREATE POLICY partner_members_select ON public.partner_workspace_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_partner_workspace_member(workspace_id)
  );

DROP POLICY IF EXISTS partner_members_insert_owner ON public.partner_workspace_members;
CREATE POLICY partner_members_insert_owner ON public.partner_workspace_members
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'owner'
    AND EXISTS (
      SELECT 1 FROM public.partner_workspaces w
      WHERE w.id = workspace_id AND w.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS partner_members_delete_self ON public.partner_workspace_members;
CREATE POLICY partner_members_delete_self ON public.partner_workspace_members
  FOR DELETE
  USING (user_id = auth.uid());

-- Invites
DROP POLICY IF EXISTS partner_invites_select_own ON public.partner_invites;
CREATE POLICY partner_invites_select_own ON public.partner_invites
  FOR SELECT
  USING (
    inviter_id = auth.uid()
    OR (
      auth.uid() IS NOT NULL
      AND used_by IS NULL
      AND expires_at > now()
    )
  );

DROP POLICY IF EXISTS partner_invites_insert_own ON public.partner_invites;
CREATE POLICY partner_invites_insert_own ON public.partner_invites
  FOR INSERT
  WITH CHECK (
    inviter_id = auth.uid()
    AND public.is_partner_workspace_member(workspace_id)
  );

DROP POLICY IF EXISTS partner_invites_update_own ON public.partner_invites;
CREATE POLICY partner_invites_update_own ON public.partner_invites
  FOR UPDATE
  USING (inviter_id = auth.uid());

-- Aceitar convite (atômico)
CREATE OR REPLACE FUNCTION public.accept_partner_invite(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_inv public.partner_invites%ROWTYPE;
  v_existing UUID;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Faça login para aceitar o convite');
  END IF;

  SELECT * INTO v_inv
  FROM public.partner_invites
  WHERE code = upper(trim(p_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Convite inválido');
  END IF;

  IF v_inv.used_by IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Este convite já foi usado');
  END IF;

  IF v_inv.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Este convite expirou');
  END IF;

  IF v_inv.inviter_id = v_uid THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Você não pode aceitar o próprio convite');
  END IF;

  SELECT workspace_id INTO v_existing
  FROM public.partner_workspace_members
  WHERE user_id = v_uid
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Você já está em um workspace de casal');
  END IF;

  IF (
    SELECT count(*) FROM public.partner_workspace_members
    WHERE workspace_id = v_inv.workspace_id
  ) >= 2 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Este workspace já tem os dois parceiros');
  END IF;

  INSERT INTO public.partner_workspace_members (workspace_id, user_id, role)
  VALUES (v_inv.workspace_id, v_uid, 'partner');

  UPDATE public.partner_invites
  SET used_by = v_uid, used_at = now()
  WHERE id = v_inv.id;

  RETURN jsonb_build_object(
    'ok', true,
    'message', 'Parceiro conectado. Lançamentos compartilhados ficam visíveis para os dois.',
    'workspace_id', v_inv.workspace_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_partner_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_partner_invite(TEXT) TO authenticated;

-- Despesas: ver as próprias e as compartilhadas do workspace
DROP POLICY IF EXISTS "despesas_own" ON public.despesas;
DROP POLICY IF EXISTS despesas_select ON public.despesas;
DROP POLICY IF EXISTS despesas_insert ON public.despesas;
DROP POLICY IF EXISTS despesas_update ON public.despesas;
DROP POLICY IF EXISTS despesas_delete ON public.despesas;
DROP POLICY IF EXISTS "despesas_select" ON public.despesas;
DROP POLICY IF EXISTS "despesas_insert" ON public.despesas;
DROP POLICY IF EXISTS "despesas_update" ON public.despesas;
DROP POLICY IF EXISTS "despesas_delete" ON public.despesas;

CREATE POLICY despesas_select ON public.despesas
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      compartilhada = true
      AND partner_workspace_id IS NOT NULL
      AND public.is_partner_workspace_member(partner_workspace_id)
    )
  );

CREATE POLICY despesas_insert ON public.despesas
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY despesas_update ON public.despesas
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY despesas_delete ON public.despesas
  FOR DELETE
  USING (user_id = auth.uid());
