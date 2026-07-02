-- 040 — Concede admin à conta marianaplauska.cf@gmail.com
-- Executa com service_role / SQL Editor (o trigger 037 bloqueia promoção pelo app)

DO $$
DECLARE
  target_email TEXT := 'marianaplauska.cf@gmail.com';
  target_uid UUID;
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
    updated_at
  )
  VALUES (
    target_uid,
    'Mariana',
    'Mariana',
    now()
  )
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_public_cards
  SET is_admin = true,
      updated_at = now()
  WHERE user_id = target_uid;
END $$;

NOTIFY pgrst, 'reload schema';
