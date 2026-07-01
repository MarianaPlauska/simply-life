-- 037 — Endurecimento de segurança (admin, webhook hash, gamificação)

-- ── 1. is_admin: cliente não pode se promover ─────────────────────────────
CREATE OR REPLACE FUNCTION public.guard_user_public_cards_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.is_admin := false;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    -- Só migrations/service_role alteram is_admin fora do app
    IF COALESCE(auth.jwt() ->> 'role', '') <> 'service_role' THEN
      NEW.is_admin := OLD.is_admin;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_user_public_cards_admin ON public.user_public_cards;
CREATE TRIGGER trg_guard_user_public_cards_admin
  BEFORE INSERT OR UPDATE ON public.user_public_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_user_public_cards_admin();

-- ── 2. Webhook secret: só hash no banco ───────────────────────────────────
ALTER TABLE public.user_webhook_secrets
  ADD COLUMN IF NOT EXISTS secret_hash TEXT;

UPDATE public.user_webhook_secrets
  SET secret_hash = encode(digest(secret, 'sha256'), 'hex')
  WHERE secret_hash IS NULL AND secret IS NOT NULL AND secret <> '';

ALTER TABLE public.user_webhook_secrets
  DROP COLUMN IF EXISTS secret;

-- Cliente não lê nem grava direto — só RPC
REVOKE ALL ON public.user_webhook_secrets FROM authenticated;
GRANT ALL ON public.user_webhook_secrets TO service_role;

DROP POLICY IF EXISTS "webhook_secret_select_own" ON public.user_webhook_secrets;
DROP POLICY IF EXISTS "webhook_secret_insert_own" ON public.user_webhook_secrets;
DROP POLICY IF EXISTS "webhook_secret_update_own" ON public.user_webhook_secrets;
DROP POLICY IF EXISTS "webhook_secret_delete_own" ON public.user_webhook_secrets;

CREATE OR REPLACE FUNCTION public.webhook_secret_configured()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_webhook_secrets
    WHERE user_id = auth.uid() AND secret_hash IS NOT NULL
  );
$$;

REVOKE ALL ON FUNCTION public.webhook_secret_configured() FROM public;
GRANT EXECUTE ON FUNCTION public.webhook_secret_configured() TO authenticated;

-- Gera secret em texto puro uma vez; persiste apenas SHA-256
CREATE OR REPLACE FUNCTION public.rotate_webhook_secret()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  plain text;
  new_hash text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  plain := encode(gen_random_bytes(24), 'hex');
  new_hash := encode(digest(plain, 'sha256'), 'hex');

  INSERT INTO public.user_webhook_secrets (user_id, secret_hash, updated_at)
  VALUES (uid, new_hash, now())
  ON CONFLICT (user_id) DO UPDATE
    SET secret_hash = EXCLUDED.secret_hash,
        updated_at = now();

  RETURN plain;
END;
$$;

REVOKE ALL ON FUNCTION public.rotate_webhook_secret() FROM public;
GRANT EXECUTE ON FUNCTION public.rotate_webhook_secret() TO authenticated;

-- ── 3. Gamificação: impede salto absurdo de XP/nível via DevTools ─────────
CREATE OR REPLACE FUNCTION public.guard_user_stats_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_xp_jump constant int := 200;
  total_xp int;
  computed_level int;
BEGIN
  IF COALESCE(auth.jwt() ->> 'role', '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.level := 1;
    NEW.xp_foco := GREATEST(0, LEAST(COALESCE(NEW.xp_foco, 0), max_xp_jump));
    NEW.xp_vitalidade := GREATEST(0, LEAST(COALESCE(NEW.xp_vitalidade, 0), max_xp_jump));
    NEW.xp_estabilidade := GREATEST(0, LEAST(COALESCE(NEW.xp_estabilidade, 0), max_xp_jump));
    NEW.streak_saude := GREATEST(0, LEAST(COALESCE(NEW.streak_saude, 0), 1));
    NEW.streak_foco := GREATEST(0, LEAST(COALESCE(NEW.streak_foco, 0), 1));
    RETURN NEW;
  END IF;

  IF NEW.xp_foco > OLD.xp_foco + max_xp_jump THEN
    NEW.xp_foco := OLD.xp_foco + max_xp_jump;
  END IF;
  IF NEW.xp_vitalidade > OLD.xp_vitalidade + max_xp_jump THEN
    NEW.xp_vitalidade := OLD.xp_vitalidade + max_xp_jump;
  END IF;
  IF NEW.xp_estabilidade > OLD.xp_estabilidade + max_xp_jump THEN
    NEW.xp_estabilidade := OLD.xp_estabilidade + max_xp_jump;
  END IF;

  NEW.xp_foco := GREATEST(0, NEW.xp_foco);
  NEW.xp_vitalidade := GREATEST(0, NEW.xp_vitalidade);
  NEW.xp_estabilidade := GREATEST(0, NEW.xp_estabilidade);

  IF NEW.streak_saude > OLD.streak_saude + 1 THEN
    NEW.streak_saude := OLD.streak_saude + 1;
  END IF;
  IF NEW.streak_foco > OLD.streak_foco + 1 THEN
    NEW.streak_foco := OLD.streak_foco + 1;
  END IF;
  NEW.streak_saude := GREATEST(0, NEW.streak_saude);
  NEW.streak_foco := GREATEST(0, NEW.streak_foco);

  total_xp := NEW.xp_foco + NEW.xp_vitalidade + NEW.xp_estabilidade;
  computed_level := GREATEST(1, (total_xp / 100) + 1);
  NEW.level := computed_level;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_user_stats_update ON public.user_stats;
CREATE TRIGGER trg_guard_user_stats_update
  BEFORE INSERT OR UPDATE ON public.user_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_user_stats_update();

NOTIFY pgrst, 'reload schema';
