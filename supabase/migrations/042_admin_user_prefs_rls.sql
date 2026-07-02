-- 042 — Admin: editar prefs de usuários + políticas RLS reforçadas

-- Admin lê e grava preferências de workspace de qualquer usuário
DROP POLICY IF EXISTS "user_workspace_prefs_admin_select" ON public.user_workspace_prefs;
CREATE POLICY "user_workspace_prefs_admin_select"
  ON public.user_workspace_prefs FOR SELECT
  USING (public.is_admin_user());

DROP POLICY IF EXISTS "user_workspace_prefs_admin_insert" ON public.user_workspace_prefs;
CREATE POLICY "user_workspace_prefs_admin_insert"
  ON public.user_workspace_prefs FOR INSERT
  WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "user_workspace_prefs_admin_update" ON public.user_workspace_prefs;
CREATE POLICY "user_workspace_prefs_admin_update"
  ON public.user_workspace_prefs FOR UPDATE
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Admin atualiza cartão público (avatar, nome)
DROP POLICY IF EXISTS "user_public_cards_admin_update" ON public.user_public_cards;
CREATE POLICY "user_public_cards_admin_update"
  ON public.user_public_cards FOR UPDATE
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

NOTIFY pgrst, 'reload schema';
