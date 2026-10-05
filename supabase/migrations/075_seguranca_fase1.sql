-- =====================================================
-- 075 — Segurança: fase 1
-- 1) Convites de casal: ninguém lista códigos de outra pessoa. Antes, a
--    policy de 053 mostrava a qualquer logado todo convite válido (com o
--    código), e com ele dava para entrar no workspace e ver os gastos.
--    O aceite segue pela função accept_partner_invite (SECURITY DEFINER).
-- 2) Duas etapas no banco: quem tem fator TOTP verificado só lê e grava
--    com sessão aal2. Policy RESTRICTIVE em todas as tabelas do schema
--    public (soma com as policies existentes, nunca abre nada).
--    Padrão da documentação do Supabase (MFA + RLS).
-- 3) E-mail volta a ser confirmado de verdade: sai o gatilho de 022 que
--    confirmava todo cadastro sozinho. Contas já criadas não mudam.
-- 4) Fecha os INSERT abertos de profiles e user_stats (WITH CHECK true,
--    valiam para qualquer papel). O cadastro usa handle_new_user, que é
--    SECURITY DEFINER e não depende dessas policies.
-- =====================================================

-- 1) Convites de casal ---------------------------------------------------
DROP POLICY IF EXISTS partner_invites_select_own ON public.partner_invites;
CREATE POLICY partner_invites_select_own ON public.partner_invites
  FOR SELECT
  USING (inviter_id = auth.uid());

-- 2) Duas etapas no banco ------------------------------------------------
CREATE OR REPLACE FUNCTION public.mfa_session_ok()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      OR NOT EXISTS (
        SELECT 1 FROM auth.mfa_factors f
        WHERE f.user_id = auth.uid() AND f.status = 'verified'
      );
$$;
REVOKE EXECUTE ON FUNCTION public.mfa_session_ok() FROM anon;
GRANT EXECUTE ON FUNCTION public.mfa_session_ok() TO authenticated;

DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT c.relname AS name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS mfa_aal2 ON public.%I', t.name);
    -- (select ...) avalia uma vez por consulta, não por linha
    EXECUTE format(
      'CREATE POLICY mfa_aal2 ON public.%I AS RESTRICTIVE FOR ALL TO authenticated '
      'USING ((SELECT public.mfa_session_ok())) WITH CHECK ((SELECT public.mfa_session_ok()))',
      t.name
    );
  END LOOP;
END;
$$;

-- 3) Confirmação de e-mail de verdade ------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_auto_confirm ON auth.users;
DROP FUNCTION IF EXISTS public.auto_confirm_user_email();

-- 4) INSERT abertos ------------------------------------------------------
DROP POLICY IF EXISTS "profiles_service_insert" ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "service_role_insert_stats" ON public.user_stats;

NOTIFY pgrst, 'reload schema';
