-- 055 — Presença (quem está conectado) + admin para marianaplauska.c@gmail.com
-- Não grava senha. A conta precisa existir em auth.users (cadastro/login).

ALTER TABLE public.user_public_cards
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS ix_user_public_cards_last_seen
  ON public.user_public_cards (last_seen_at DESC NULLS LAST);

-- Signup também cria o cartão público (lista admin / círculo)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nome TEXT;
BEGIN
  nome := COALESCE(
    NEW.raw_user_meta_data->>'nome_completo',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, nome_completo, email)
  VALUES (NEW.id, nome, COALESCE(NEW.email, ''))
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email);

  INSERT INTO public.user_stats (id, level, xp_foco, xp_vitalidade, xp_estabilidade, streak_saude, streak_foco)
  VALUES (NEW.id, 1, 0, 0, 0, 0, 0)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_public_cards (
    user_id,
    display_name,
    axel_calls_you,
    updated_at
  )
  VALUES (NEW.id, COALESCE(nome, ''), COALESCE(nome, ''), now())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_directory()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  axel_calls_you text,
  is_admin boolean,
  streak_count integer,
  level integer,
  last_sign_in_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    u.id,
    u.email::text,
    COALESCE(c.display_name, ''),
    COALESCE(c.axel_calls_you, ''),
    COALESCE(c.is_admin, false),
    COALESCE(c.streak_count, 0),
    COALESCE(c.level, 1),
    u.last_sign_in_at,
    c.last_seen_at,
    u.created_at
  FROM auth.users u
  LEFT JOIN public.user_public_cards c ON c.user_id = u.id
  WHERE public.is_admin_user()
  ORDER BY
    c.last_seen_at DESC NULLS LAST,
    u.last_sign_in_at DESC NULLS LAST,
    u.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_list_directory() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_directory() TO authenticated;

DO $$
DECLARE
  target_email TEXT := 'marianaplauska.c@gmail.com';
  target_uid UUID;
BEGIN
  SELECT id INTO target_uid
  FROM auth.users
  WHERE lower(email) = lower(target_email)
  LIMIT 1;

  IF target_uid IS NULL THEN
    RAISE NOTICE 'Usuário % ainda não existe — cadastre no app e rode esta migration de novo.', target_email;
    RETURN;
  END IF;

  INSERT INTO public.user_public_cards (
    user_id,
    display_name,
    axel_calls_you,
    is_admin,
    updated_at
  )
  VALUES (
    target_uid,
    'Mariana',
    'Mariana',
    true,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET is_admin = true,
      display_name = COALESCE(NULLIF(public.user_public_cards.display_name, ''), 'Mariana'),
      axel_calls_you = COALESCE(NULLIF(public.user_public_cards.axel_calls_you, ''), 'Mariana'),
      updated_at = now();
END $$;

NOTIFY pgrst, 'reload schema';
