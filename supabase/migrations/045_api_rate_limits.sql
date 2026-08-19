-- =====================================================
-- 045 — Rate limit das APIs Vercel (service role only)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id          BIGSERIAL PRIMARY KEY,
  route       TEXT NOT NULL,
  client_key  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_api_rate_limits_window
  ON public.api_rate_limits (route, client_key, created_at DESC);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.api_rate_limits IS
  'Contador de requisições por rota/cliente. Só o service role (APIs Vercel) escreve.';

NOTIFY pgrst, 'reload schema';
