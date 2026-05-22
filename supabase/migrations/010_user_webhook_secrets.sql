-- =====================================================
-- 010 — Webhook M2M por usuário (Jarvis ingest)
-- Idempotent
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_webhook_secrets (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  secret      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_webhook_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "webhook_secret_select_own" ON public.user_webhook_secrets;
CREATE POLICY "webhook_secret_select_own"
  ON public.user_webhook_secrets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "webhook_secret_insert_own" ON public.user_webhook_secrets;
CREATE POLICY "webhook_secret_insert_own"
  ON public.user_webhook_secrets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "webhook_secret_update_own" ON public.user_webhook_secrets;
CREATE POLICY "webhook_secret_update_own"
  ON public.user_webhook_secrets FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "webhook_secret_delete_own" ON public.user_webhook_secrets;
CREATE POLICY "webhook_secret_delete_own"
  ON public.user_webhook_secrets FOR DELETE
  USING (auth.uid() = user_id);

GRANT ALL ON public.user_webhook_secrets TO authenticated;

NOTIFY pgrst, 'reload schema';
