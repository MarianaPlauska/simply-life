-- Push Expo: provider/platform em push_subscriptions (endpoint = token Expo)
-- Aplicar no projeto Simply-Life (zuxkqmooxvnulgllduhr)

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'web';

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS platform TEXT;

COMMENT ON COLUMN public.push_subscriptions.provider IS 'web | expo';
COMMENT ON COLUMN public.push_subscriptions.platform IS 'ios | android | web';

-- Índice para fan-out por provedor
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_provider
  ON public.push_subscriptions (provider);
