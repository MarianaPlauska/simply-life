-- 048 — IMAP: pasta opcional, senha cifrada (app), dedup por Message-ID

ALTER TABLE public.gmail_imap_settings
  ADD COLUMN IF NOT EXISTS mailbox_folder TEXT NOT NULL DEFAULT 'INBOX';

COMMENT ON COLUMN public.gmail_imap_settings.app_password IS
  'Senha de app cifrada (enc:v1: AES-256-GCM). Nunca devolver ao client.';

COMMENT ON COLUMN public.gmail_imap_settings.mailbox_folder IS
  'Pasta IMAP (ex. Simply-Life). Vazio/INBOX = caixa de entrada.';

CREATE TABLE IF NOT EXISTS public.email_ingest_dedup (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id  TEXT NOT NULL,
  tarefa_id   INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, message_id)
);

ALTER TABLE public.email_ingest_dedup ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS email_ingest_dedup_own ON public.email_ingest_dedup;
CREATE POLICY email_ingest_dedup_own ON public.email_ingest_dedup
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
