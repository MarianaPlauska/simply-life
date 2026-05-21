-- =============================================================
-- 006 — VIRTUAL CREDIT CARDS
-- Persistência de cartões virtuais criados pelo usuário
-- =============================================================

CREATE TABLE IF NOT EXISTS fin_cartoes (
  id              TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  titular         TEXT NOT NULL,
  numero          TEXT NOT NULL,
  validade        TEXT NOT NULL,
  cvv             TEXT NOT NULL,
  limite          NUMERIC(12,2) NOT NULL,
  tipo_gradiente  TEXT NOT NULL CHECK (tipo_gradiente IN ('purple', 'obsidian', 'sunset', 'ocean', 'mint')),
  bandeira        TEXT NOT NULL CHECK (bandeira IN ('visa', 'mastercard')),
  status          TEXT NOT NULL CHECK (status IN ('ativo', 'bloqueado')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fin_cartoes_user_id ON fin_cartoes (user_id);

ALTER TABLE fin_cartoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cartoes_own" ON fin_cartoes
  FOR ALL USING (user_id = auth.uid());

-- ─── NOTIFY POSTGREST ──
NOTIFY pgrst, 'reload schema';
