-- Preferências financeiras do usuário (meta do mês, presets, perfil de renda)
CREATE TABLE IF NOT EXISTS fin_user_prefs (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  prefs      JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fin_user_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fin_user_prefs_select" ON fin_user_prefs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "fin_user_prefs_insert" ON fin_user_prefs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "fin_user_prefs_update" ON fin_user_prefs FOR UPDATE USING (user_id = auth.uid());
