-- =============================================================
-- SIMPLY-LIFE OS — SCHEMA DE PRODUÇÃO (SUPABASE-FIRST)
-- Execute no SQL Editor do Supabase Dashboard
--
-- MUDANÇAS FUNDAMENTAIS vs. schema anterior:
--   1. Todos os user_id agora são UUID referenciando auth.users(id)
--   2. RLS habilitado em TODAS as tabelas
--   3. Policies que filtram por auth.uid()
--   4. Tabela profiles criada automaticamente no signup
--   5. DB functions para gamificação e dashboard
-- =============================================================

-- ─── EXTENSÕES ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- 1. PROFILES (bridge auth.users → dados do app)
-- =============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_completo   TEXT,
    email           TEXT,
    xp_total        INTEGER DEFAULT 0,
    streak_atual    INTEGER DEFAULT 0,
    ultima_sessao_data TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (id = auth.uid());

-- trigger: cria profile automaticamente no signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, nome_completo, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================
-- 2. TAREFAS UNIFICADAS
-- =============================================================
CREATE TABLE IF NOT EXISTS tarefas_unificadas (
    id               SERIAL PRIMARY KEY,
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo           VARCHAR(200) NOT NULL,
    descricao        TEXT,
    snippet_100_char VARCHAR(100),
    score_urgencia   INTEGER DEFAULT 0,
    status           VARCHAR DEFAULT 'pendente',
    prioridade       VARCHAR DEFAULT 'media',
    origem           VARCHAR DEFAULT 'manual',
    data_vencimento  TIMESTAMPTZ,
    notas_locais     TEXT,
    versao           INTEGER DEFAULT 1,
    deletado_em      TIMESTAMPTZ,
    palavra_chave_id INTEGER,
    created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_tarefas_user_id ON tarefas_unificadas (user_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_fts
  ON tarefas_unificadas
  USING GIN(to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(descricao, '')));

ALTER TABLE tarefas_unificadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tarefas_own" ON tarefas_unificadas
  FOR ALL USING (user_id = auth.uid());

-- =============================================================
-- 3. SUBTAREFAS
-- =============================================================
CREATE TABLE IF NOT EXISTS subtarefas (
    id        SERIAL PRIMARY KEY,
    tarefa_id INTEGER NOT NULL REFERENCES tarefas_unificadas(id) ON DELETE CASCADE,
    titulo    VARCHAR(200) NOT NULL,
    concluida INTEGER DEFAULT 0,
    ordem     INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_subtarefas_tarefa_id ON subtarefas (tarefa_id);

ALTER TABLE subtarefas ENABLE ROW LEVEL SECURITY;

-- subtarefa é visível se o dono da tarefa-pai é o user atual
CREATE POLICY "subtarefas_own" ON subtarefas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tarefas_unificadas t
      WHERE t.id = subtarefas.tarefa_id AND t.user_id = auth.uid()
    )
  );

-- =============================================================
-- 4. LABELS
-- =============================================================
CREATE TABLE IF NOT EXISTS labels (
    id         SERIAL PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome       VARCHAR(50) NOT NULL,
    cor        VARCHAR(7) DEFAULT '#8b5cf6',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_labels_user_id ON labels (user_id);

ALTER TABLE labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "labels_own" ON labels
  FOR ALL USING (user_id = auth.uid());

-- =============================================================
-- 5. TAREFA_LABELS (N:N)
-- =============================================================
CREATE TABLE IF NOT EXISTS tarefa_labels (
    id        SERIAL PRIMARY KEY,
    tarefa_id INTEGER NOT NULL REFERENCES tarefas_unificadas(id) ON DELETE CASCADE,
    label_id  INTEGER NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    CONSTRAINT uq_tarefa_label UNIQUE (tarefa_id, label_id)
);

CREATE INDEX IF NOT EXISTS ix_tarefa_labels_tarefa_id ON tarefa_labels (tarefa_id);
CREATE INDEX IF NOT EXISTS ix_tarefa_labels_label_id  ON tarefa_labels (label_id);

ALTER TABLE tarefa_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tarefa_labels_own" ON tarefa_labels
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tarefas_unificadas t
      WHERE t.id = tarefa_labels.tarefa_id AND t.user_id = auth.uid()
    )
  );

-- =============================================================
-- 6. ANOTAÇÕES
-- =============================================================
CREATE TABLE IF NOT EXISTS anotacoes (
    id         SERIAL PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo     VARCHAR,
    conteudo   TEXT,
    fixado     INTEGER DEFAULT 0,
    categoria  VARCHAR DEFAULT 'pessoal'
);

CREATE INDEX IF NOT EXISTS ix_anotacoes_user_id ON anotacoes (user_id);
CREATE INDEX IF NOT EXISTS idx_anotacoes_fts
  ON anotacoes
  USING GIN(to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(conteudo, '')));

ALTER TABLE anotacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anotacoes_own" ON anotacoes
  FOR ALL USING (user_id = auth.uid());

-- =============================================================
-- 7. PREFERÊNCIAS DO USUÁRIO
-- =============================================================
CREATE TABLE IF NOT EXISTS preferencias_usuario (
    id                   SERIAL PRIMARY KEY,
    user_id              UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    palavras_chave_email VARCHAR DEFAULT '',
    modulos_fixados      VARCHAR DEFAULT 'dashboard,kanban'
);

ALTER TABLE preferencias_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "preferencias_own" ON preferencias_usuario
  FOR ALL USING (user_id = auth.uid());

-- =============================================================
-- 8. FINANÇAS — CATEGORIAS
-- =============================================================
CREATE TABLE IF NOT EXISTS fin_categorias (
    id          SERIAL PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome        VARCHAR(50) NOT NULL,
    cor         VARCHAR(7) DEFAULT '#8b5cf6',
    icone       VARCHAR(50) DEFAULT 'Wallet',
    tipo        VARCHAR(20) DEFAULT 'despesa',
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_fin_categorias_user_id ON fin_categorias (user_id);

ALTER TABLE fin_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fin_categorias_own" ON fin_categorias
  FOR ALL USING (user_id = auth.uid());

-- =============================================================
-- 9. DESPESAS / TRANSAÇÕES
-- =============================================================
CREATE TABLE IF NOT EXISTS despesas (
    id               SERIAL PRIMARY KEY,
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    descricao        VARCHAR,
    categoria        VARCHAR,
    categoria_id     INTEGER REFERENCES fin_categorias(id),
    valor            NUMERIC(12,2),
    data_gasto       VARCHAR,
    tipo             VARCHAR DEFAULT 'despesa',
    status_pagamento VARCHAR DEFAULT 'pendente',
    created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_despesas_user_id ON despesas (user_id);
CREATE INDEX IF NOT EXISTS ix_despesas_data_gasto ON despesas (data_gasto);

ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "despesas_own" ON despesas
  FOR ALL USING (user_id = auth.uid());

-- =============================================================
-- 10. ORÇAMENTOS
-- =============================================================
CREATE TABLE IF NOT EXISTS fin_orcamentos (
    id           SERIAL PRIMARY KEY,
    user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    categoria_id INTEGER REFERENCES fin_categorias(id),
    limite       NUMERIC(12,2) NOT NULL,
    mes          INTEGER,
    ano          INTEGER,
    created_at   TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_orcamento_user_cat UNIQUE (user_id, categoria_id)
);

ALTER TABLE fin_orcamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fin_orcamentos_own" ON fin_orcamentos
  FOR ALL USING (user_id = auth.uid());

-- =============================================================
-- 11. METAS FINANCEIRAS
-- =============================================================
CREATE TABLE IF NOT EXISTS fin_metas (
    id          SERIAL PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo      VARCHAR(100) NOT NULL,
    valor_alvo  NUMERIC(12,2) NOT NULL,
    valor_atual NUMERIC(12,2) DEFAULT 0.0,
    prazo       DATE,
    icone       VARCHAR(50) DEFAULT 'Target',
    cor         VARCHAR(7) DEFAULT '#8b5cf6',
    concluida   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fin_metas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fin_metas_own" ON fin_metas
  FOR ALL USING (user_id = auth.uid());

-- =============================================================
-- 12. MEDICAMENTOS
-- =============================================================
CREATE TABLE IF NOT EXISTS medicamentos (
    id          SERIAL PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome        VARCHAR,
    horario     VARCHAR,
    tomado_hoje INTEGER DEFAULT 0
);

ALTER TABLE medicamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "medicamentos_own" ON medicamentos
  FOR ALL USING (user_id = auth.uid());

-- =============================================================
-- 13. NOTIFICAÇÕES
-- =============================================================
CREATE TABLE IF NOT EXISTS notificacoes (
    id             SERIAL PRIMARY KEY,
    user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo           VARCHAR DEFAULT 'sistema',
    titulo         VARCHAR,
    mensagem       TEXT,
    lida           INTEGER DEFAULT 0,
    urgencia       VARCHAR DEFAULT 'normal',
    score_urgencia INTEGER DEFAULT 0,
    criado_em      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_notificacoes_user_id ON notificacoes (user_id);

ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notificacoes_own" ON notificacoes
  FOR ALL USING (user_id = auth.uid());

-- =============================================================
-- 14. HÁBITOS DIÁRIOS
-- =============================================================
CREATE TABLE IF NOT EXISTS habitos_diarios (
    id              SERIAL PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo            VARCHAR,
    nome_exibicao   VARCHAR,
    meta_diaria     INTEGER,
    progresso_atual INTEGER DEFAULT 0,
    unidade         VARCHAR
);

ALTER TABLE habitos_diarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habitos_diarios_own" ON habitos_diarios
  FOR ALL USING (user_id = auth.uid());

-- =============================================================
-- 15. HISTÓRICO DE HÁBITOS
-- =============================================================
CREATE TABLE IF NOT EXISTS historico_habitos (
    id         SERIAL PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habito_id  INTEGER NOT NULL REFERENCES habitos_diarios(id) ON DELETE CASCADE,
    data       DATE NOT NULL,
    concluido  INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_habito_data UNIQUE (habito_id, data)
);

CREATE INDEX IF NOT EXISTS ix_historico_habitos_user_id ON historico_habitos (user_id);

ALTER TABLE historico_habitos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "historico_habitos_own" ON historico_habitos
  FOR ALL USING (user_id = auth.uid());

-- =============================================================
-- 16. PALAVRAS-CHAVE (TRIAGEM)
-- =============================================================
CREATE TABLE IF NOT EXISTS palavras_chave (
    id         SERIAL PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    termo      VARCHAR(120) NOT NULL,
    peso       INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE palavras_chave ENABLE ROW LEVEL SECURITY;

CREATE POLICY "palavras_chave_own" ON palavras_chave
  FOR ALL USING (user_id = auth.uid());

-- =============================================================
-- 17. SESSÕES DE FOCO
-- =============================================================
CREATE TABLE IF NOT EXISTS sessoes_foco (
    id               SERIAL PRIMARY KEY,
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tarefa_id        INTEGER REFERENCES tarefas_unificadas(id),
    duracao_minutos  INTEGER NOT NULL,
    xp_ganho         INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sessoes_foco ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessoes_foco_own" ON sessoes_foco
  FOR ALL USING (user_id = auth.uid());

-- =============================================================
-- 18. TEMPLATES DE TAREFA
-- =============================================================
CREATE TABLE IF NOT EXISTS tarefa_templates (
    id               SERIAL PRIMARY KEY,
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome             VARCHAR(200) NOT NULL,
    prioridade       VARCHAR DEFAULT 'media',
    subtarefas_json  TEXT,
    created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tarefa_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tarefa_templates_own" ON tarefa_templates
  FOR ALL USING (user_id = auth.uid());

-- =============================================================
-- 19. DIÁRIO DE HUMOR (BEM-ESTAR)
-- =============================================================
CREATE TABLE IF NOT EXISTS diario_humor (
    id         SERIAL PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data       DATE NOT NULL,
    humor      INTEGER NOT NULL,
    emoji      VARCHAR(10),
    nota       TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_humor_dia UNIQUE (user_id, data)
);

CREATE INDEX IF NOT EXISTS ix_diario_humor_user_id ON diario_humor (user_id);
CREATE INDEX IF NOT EXISTS ix_diario_humor_data    ON diario_humor (data);

ALTER TABLE diario_humor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diario_humor_own" ON diario_humor
  FOR ALL USING (user_id = auth.uid());

-- =============================================================
-- 20. ENTRADAS DE DIÁRIO (JOURNALING)
-- =============================================================
CREATE TABLE IF NOT EXISTS entradas_diario (
    id           SERIAL PRIMARY KEY,
    user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data         DATE NOT NULL,
    conteudo     TEXT NOT NULL,
    prompt_usado VARCHAR(200),
    created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_entradas_diario_user_id ON entradas_diario (user_id);

ALTER TABLE entradas_diario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entradas_diario_own" ON entradas_diario
  FOR ALL USING (user_id = auth.uid());

-- =============================================================
-- DB FUNCTIONS (RPC)
-- =============================================================

-- ─── finalizar_sessao_foco ─────────────────────────────────
-- chamada pelo frontend para registrar sessão e dar XP
CREATE OR REPLACE FUNCTION finalizar_sessao_foco(
    p_minutos INTEGER,
    p_tarefa_id INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_xp INTEGER;
    v_profile profiles%ROWTYPE;
    v_streak INTEGER;
    v_hoje DATE := CURRENT_DATE;
    v_ultima DATE;
BEGIN
    -- calcula xp: 10 xp por minuto de foco
    v_xp := p_minutos * 10;

    -- insere sessão
    INSERT INTO sessoes_foco (user_id, tarefa_id, duracao_minutos, xp_ganho)
    VALUES (v_uid, p_tarefa_id, p_minutos, v_xp);

    -- busca profile atual
    SELECT * INTO v_profile FROM profiles WHERE id = v_uid;

    -- calcula streak
    v_ultima := v_profile.ultima_sessao_data::date;
    IF v_ultima = v_hoje - INTERVAL '1 day' THEN
        v_streak := COALESCE(v_profile.streak_atual, 0) + 1;
    ELSIF v_ultima = v_hoje THEN
        v_streak := COALESCE(v_profile.streak_atual, 1);
    ELSE
        v_streak := 1;
    END IF;

    -- atualiza profile
    UPDATE profiles SET
        xp_total = COALESCE(xp_total, 0) + v_xp,
        streak_atual = v_streak,
        ultima_sessao_data = now()
    WHERE id = v_uid;

    RETURN json_build_object(
        'xp_total', COALESCE(v_profile.xp_total, 0) + v_xp,
        'streak_atual', v_streak,
        'nivel', FLOOR((COALESCE(v_profile.xp_total, 0) + v_xp) / 100),
        'xp_ganho', v_xp
    );
END;
$$;

-- ─── dashboard_resumo ──────────────────────────────────────
-- retorna KPIs do dashboard do usuário logado
CREATE OR REPLACE FUNCTION dashboard_resumo()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_tarefas_total INTEGER;
    v_tarefas_concluidas INTEGER;
    v_tarefas_pendentes INTEGER;
    v_tarefas_em_progresso INTEGER;
    v_foco_minutos INTEGER;
    v_notif_nao_lidas INTEGER;
    v_streak INTEGER;
    v_xp INTEGER;
BEGIN
    -- contagem de tarefas
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'concluida'),
        COUNT(*) FILTER (WHERE status = 'pendente'),
        COUNT(*) FILTER (WHERE status = 'em_progresso')
    INTO v_tarefas_total, v_tarefas_concluidas, v_tarefas_pendentes, v_tarefas_em_progresso
    FROM tarefas_unificadas
    WHERE user_id = v_uid AND deletado_em IS NULL;

    -- foco do mês
    SELECT COALESCE(SUM(duracao_minutos), 0)
    INTO v_foco_minutos
    FROM sessoes_foco
    WHERE user_id = v_uid
      AND created_at >= date_trunc('month', CURRENT_DATE);

    -- notificações não lidas
    SELECT COUNT(*)
    INTO v_notif_nao_lidas
    FROM notificacoes
    WHERE user_id = v_uid AND lida = 0;

    -- gamificação
    SELECT COALESCE(xp_total, 0), COALESCE(streak_atual, 0)
    INTO v_xp, v_streak
    FROM profiles
    WHERE id = v_uid;

    RETURN json_build_object(
        'tarefas_total', v_tarefas_total,
        'tarefas_concluidas', v_tarefas_concluidas,
        'tarefas_pendentes', v_tarefas_pendentes,
        'tarefas_em_progresso', v_tarefas_em_progresso,
        'foco_minutos_mes', v_foco_minutos,
        'notificacoes_nao_lidas', v_notif_nao_lidas,
        'xp_total', v_xp,
        'streak_atual', v_streak,
        'nivel', FLOOR(v_xp / 100)
    );
END;
$$;
