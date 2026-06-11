-- 013 — Gmail gratuito via IMAP + senha de app (sem Google Cloud OAuth)

CREATE TABLE IF NOT EXISTS gmail_imap_settings (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  app_password    TEXT NOT NULL,
  enabled         BOOLEAN DEFAULT true,
  last_sync_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE gmail_imap_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gmail_imap_own" ON gmail_imap_settings
  FOR ALL USING (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
