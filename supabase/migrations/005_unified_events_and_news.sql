-- =============================================================
-- 005 — UNIFIED EVENTS, NEWS, USER INTERESTS
-- Infraestrutura para o JARVIS: inbox IA + radar de notícias
-- =============================================================

-- ─── UNIFIED EVENTS (e-mails/mensagens processados pela IA) ──
CREATE TABLE IF NOT EXISTS unified_events (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source          TEXT NOT NULL CHECK (source IN ('gmail','teams','calendar','manual','whatsapp')),
  source_id       TEXT,
  source_url      TEXT,

  -- dados originais
  sender          TEXT,
  raw_subject     TEXT,
  raw_body        TEXT,
  raw_language    TEXT DEFAULT 'pt',

  -- campos processados pela IA (Groq)
  resumo          TEXT,
  acao_sugerida   TEXT CHECK (acao_sugerida IN ('responder','fazer','agendar','ignorar')),
  score_urgencia  INTEGER DEFAULT 0 CHECK (score_urgencia BETWEEN 0 AND 100),
  keywords_detectadas TEXT[],

  -- referências
  tarefa_id       INTEGER REFERENCES tarefas_unificadas(id) ON DELETE SET NULL,
  processed       BOOLEAN DEFAULT false,
  dismissed       BOOLEAN DEFAULT false,

  created_at      TIMESTAMPTZ DEFAULT now(),
  processed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ue_user_unread
  ON unified_events(user_id, processed, dismissed)
  WHERE NOT dismissed;

CREATE INDEX IF NOT EXISTS idx_ue_user_recent
  ON unified_events(user_id, created_at DESC);

ALTER TABLE unified_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ue_own" ON unified_events
  FOR ALL USING (user_id = auth.uid());

-- ─── USER INTERESTS (tópicos de interesse para radar de notícias) ──
CREATE TABLE IF NOT EXISTS user_interests (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topico     TEXT NOT NULL,
  ativo      BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, topico)
);

ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interests_own" ON user_interests
  FOR ALL USING (user_id = auth.uid());

-- ─── NEWS ITEMS (notícias curadas pela IA) ──
CREATE TABLE IF NOT EXISTS news_items (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  resumo      TEXT,
  url         TEXT NOT NULL,
  fonte       TEXT,
  topico      TEXT NOT NULL,
  relevancia  INTEGER DEFAULT 50 CHECK (relevancia BETWEEN 0 AND 100),
  lida        BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, url) -- evita duplicatas
);

CREATE INDEX IF NOT EXISTS idx_news_user_recent
  ON news_items(user_id, created_at DESC);

ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_own" ON news_items
  FOR ALL USING (user_id = auth.uid());

-- ─── OAUTH TOKENS (para futuras integrações Gmail/Teams) ──
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL CHECK (provider IN ('google','microsoft')),
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  expires_at    TIMESTAMPTZ,
  scopes        TEXT[],
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tokens_own" ON oauth_tokens
  FOR ALL USING (user_id = auth.uid());

-- ─── USER LOCATION (cidade do usuário para clima) ──
-- salva a última localização para não pedir geoloc toda vez
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS cidade TEXT;

-- ─── NOTIFY POSTGREST ──
NOTIFY pgrst, 'reload schema';
