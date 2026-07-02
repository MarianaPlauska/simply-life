-- 041 — Corrige promoção admin (trigger 037 bloqueava SQL Editor) e concede admin à Mariana

-- Permite migrations/SQL Editor (postgres) e service_role alterarem is_admin
CREATE OR REPLACE FUNCTION public.guard_user_public_cards_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Cliente autenticado nunca nasce admin; migrations usam bypass ou UPDATE posterior
    IF COALESCE(auth.jwt() ->> 'role', '') = 'service_role'
       OR session_user IN ('postgres', 'supabase_admin') THEN
      RETURN NEW;
    END IF;
    NEW.is_admin := false;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    IF COALESCE(auth.jwt() ->> 'role', '') <> 'service_role'
       AND session_user NOT IN ('postgres', 'supabase_admin') THEN
      NEW.is_admin := OLD.is_admin;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
DECLARE
  target_email TEXT := 'marianaplauska.cf@gmail.com';
  target_uid UUID;
  granted BOOLEAN;
BEGIN
  SELECT id INTO target_uid
  FROM auth.users
  WHERE lower(email) = lower(target_email)
  LIMIT 1;

  IF target_uid IS NULL THEN
    RAISE EXCEPTION 'Usuário % não encontrado em auth.users — faça login/cadastro antes.', target_email;
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
      updated_at = now();

  SELECT is_admin INTO granted
  FROM public.user_public_cards
  WHERE user_id = target_uid;

  IF NOT COALESCE(granted, false) THEN
    RAISE EXCEPTION 'Falha ao conceder admin para % (user_id %).', target_email, target_uid;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
