-- Controle de push server-side (evita duplicar alerta de boleto no mesmo mês)

CREATE TABLE IF NOT EXISTS public.push_bill_deliveries (
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_key  TEXT NOT NULL,
  sent_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, bill_key)
);

CREATE INDEX IF NOT EXISTS ix_push_bill_deliveries_sent ON public.push_bill_deliveries (sent_at);

ALTER TABLE public.push_bill_deliveries ENABLE ROW LEVEL SECURITY;

-- Apenas service role (cron) grava; usuário não precisa ler
DROP POLICY IF EXISTS "push_bill_deliveries_deny" ON public.push_bill_deliveries;
CREATE POLICY "push_bill_deliveries_deny"
  ON public.push_bill_deliveries FOR ALL
  USING (false);

NOTIFY pgrst, 'reload schema';
