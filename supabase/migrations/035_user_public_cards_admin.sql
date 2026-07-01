-- 035 — Conta administradora + visibilidade de usuários para admin
-- A conta da Mariana (único cadastro em user_public_cards) vira admin e
-- passa a poder listar todos os usuários do sistema.

ALTER TABLE public.user_public_cards
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Marca a conta administradora (Mariana / mari — único perfil no sistema)
UPDATE public.user_public_cards
  SET is_admin = true
  WHERE display_name ILIKE 'mariana%'
     OR display_name ILIKE 'mari%';

-- Função SECURITY DEFINER — checa admin sem recursão de RLS
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_public_cards
    WHERE user_id = auth.uid() AND is_admin = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_user() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- Admin pode ler todos os cartões públicos (lista de usuários do sistema).
-- Policies de SELECT são combinadas por OR — não afeta o acesso dos demais.
DROP POLICY IF EXISTS "user_public_cards_select_admin" ON public.user_public_cards;
CREATE POLICY "user_public_cards_select_admin"
  ON public.user_public_cards FOR SELECT
  USING (public.is_admin_user());

NOTIFY pgrst, 'reload schema';
