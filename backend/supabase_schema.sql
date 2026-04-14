-- =============================================================
-- SIMPLY-LIFE OS — SCHEMA COMPLETO PARA SUPABASE
-- Execute este arquivo inteiro no SQL Editor do Supabase
-- Todas as tabelas usam IF NOT EXISTS — seguro reexecutar
-- =============================================================

-- 1. usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR UNIQUE NOT NULL,
    nome_completo   VARCHAR,
    senha_hash      VARCHAR,
    provedor_auth   VARCHAR DEFAULT 'local',
    ativo           INTEGER DEFAULT 1,
    criado_em       VARCHAR,
    ultimo_login    VARCHAR,
    xp              INTEGER DEFAULT 0,
    streak_days     INTEGER DEFAULT 0,
    ultima_sessao_foco VARCHAR,
    xp_total        INTEGER DEFAULT 0,
    streak_atual    INTEGER DEFAULT 0,
    ultima_sessao_data TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_usuarios_email ON usuarios (email);

-- 2. palavras-chave para triagem (Motor de IA)
-- criada antes de tarefas_unificadas pois é referenciada por FK
CREATE TABLE IF NOT EXISTS palavras_chave (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES usuarios(id),
    termo      VARCHAR(120) NOT NULL,
    peso       INTEGER DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- 3. tarefas unificadas
CREATE TABLE IF NOT EXISTS tarefas_unificadas (
    id               SERIAL PRIMARY KEY,
    usuario_id       INTEGER REFERENCES usuarios(id),
    titulo           VARCHAR NOT NULL,
    descricao        TEXT,
    snippet_100_char VARCHAR(100),
    score_urgencia   INTEGER DEFAULT 0,
    status           VARCHAR DEFAULT 'pendente',
    prioridade       VARCHAR DEFAULT 'media',
    origem           VARCHAR DEFAULT 'manual',
    data_vencimento  TIMESTAMP,
    notas_locais     TEXT,
    hash_seguranca   VARCHAR,
    created_at       TIMESTAMP DEFAULT now(),
    palavra_chave_id INTEGER REFERENCES palavras_chave(id)
);
CREATE INDEX IF NOT EXISTS ix_tarefas_unificadas_id ON tarefas_unificadas (id);

-- 4. integrações
CREATE TABLE IF NOT EXISTS integracoes (
    id                   SERIAL PRIMARY KEY,
    usuario_id           INTEGER REFERENCES usuarios(id),
    plataforma           VARCHAR,
    token_criptografado  VARCHAR,
    status               VARCHAR DEFAULT 'ativa',
    hash_seguranca       VARCHAR
);

-- 5. anotações (segundo cérebro)
CREATE TABLE IF NOT EXISTS anotacoes (
    id         SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    titulo     VARCHAR,
    conteudo   TEXT,
    fixado     INTEGER DEFAULT 0,
    categoria  VARCHAR DEFAULT 'pessoal'
);

-- 6. preferências do usuário
CREATE TABLE IF NOT EXISTS preferencias_usuario (
    id                   SERIAL PRIMARY KEY,
    usuario_id           INTEGER UNIQUE REFERENCES usuarios(id),
    palavras_chave_email VARCHAR DEFAULT '',
    modulos_fixados      VARCHAR DEFAULT 'dashboard,kanban'
);

-- 7. despesas
CREATE TABLE IF NOT EXISTS despesas (
    id               SERIAL PRIMARY KEY,
    usuario_id       INTEGER REFERENCES usuarios(id),
    descricao        VARCHAR,
    categoria        VARCHAR,
    valor            INTEGER,
    data_gasto       VARCHAR,
    status_pagamento VARCHAR DEFAULT 'pendente',
    hash_seguranca   VARCHAR
);

-- 8. medicamentos
CREATE TABLE IF NOT EXISTS medicamentos (
    id         SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    nome       VARCHAR,
    horario    VARCHAR,
    tomado_hoje INTEGER DEFAULT 0
);

-- 9. notificações do sistema
CREATE TABLE IF NOT EXISTS notificacoes (
    id             SERIAL PRIMARY KEY,
    usuario_id     INTEGER REFERENCES usuarios(id),
    tipo           VARCHAR DEFAULT 'sistema',
    titulo         VARCHAR,
    mensagem       TEXT,
    lida           INTEGER DEFAULT 0,
    urgencia       VARCHAR DEFAULT 'normal',
    score_urgencia INTEGER DEFAULT 0,
    criado_em      VARCHAR
);

-- 10. hábitos diários
CREATE TABLE IF NOT EXISTS habitos_diarios (
    id              SERIAL PRIMARY KEY,
    usuario_id      INTEGER REFERENCES usuarios(id),
    tipo            VARCHAR,
    nome_exibicao   VARCHAR,
    meta_diaria     INTEGER,
    progresso_atual INTEGER DEFAULT 0,
    unidade         VARCHAR
);

-- 11. sessões de foco (gamificação)
CREATE TABLE IF NOT EXISTS sessoes_foco (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER NOT NULL REFERENCES usuarios(id),
    tarefa_id        INTEGER REFERENCES tarefas_unificadas(id),
    duracao_minutos  INTEGER NOT NULL,
    xp_ganho         INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT now()
);

-- 12. labels (sprint 1)
CREATE TABLE IF NOT EXISTS labels (
    id         SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    nome       VARCHAR(50) NOT NULL,
    cor        VARCHAR(7) DEFAULT '#8b5cf6',
    created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_labels_usuario_id ON labels (usuario_id);

-- 13. associação tarefa <-> label (N:N) (sprint 1)
CREATE TABLE IF NOT EXISTS tarefa_labels (
    id        SERIAL PRIMARY KEY,
    tarefa_id INTEGER NOT NULL REFERENCES tarefas_unificadas(id) ON DELETE CASCADE,
    label_id  INTEGER NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    CONSTRAINT uq_tarefa_label UNIQUE (tarefa_id, label_id)
);
CREATE INDEX IF NOT EXISTS ix_tarefa_labels_tarefa_id ON tarefa_labels (tarefa_id);
CREATE INDEX IF NOT EXISTS ix_tarefa_labels_label_id  ON tarefa_labels (label_id);

-- 14. subtarefas (sprint 1)
CREATE TABLE IF NOT EXISTS subtarefas (
    id        SERIAL PRIMARY KEY,
    tarefa_id INTEGER NOT NULL REFERENCES tarefas_unificadas(id) ON DELETE CASCADE,
    titulo    VARCHAR(200) NOT NULL,
    concluida INTEGER DEFAULT 0,
    ordem     INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_subtarefas_tarefa_id ON subtarefas (tarefa_id);

-- 15. histórico de hábitos / streaks (sprint 1)
CREATE TABLE IF NOT EXISTS historico_habitos (
    id         SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    habito_id  INTEGER NOT NULL REFERENCES habitos_diarios(id) ON DELETE CASCADE,
    data       DATE NOT NULL,
    concluido  INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT now(),
    CONSTRAINT uq_habito_data UNIQUE (habito_id, data)
);
CREATE INDEX IF NOT EXISTS ix_historico_habitos_usuario_id ON historico_habitos (usuario_id);
CREATE INDEX IF NOT EXISTS ix_historico_habitos_habito_id  ON historico_habitos (habito_id);

-- 16. alembic version tracking (para o alembic saber onde parar)
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);
-- marca como já aplicada até a última migration (sprint 2)
INSERT INTO alembic_version (version_num)
VALUES ('b3c9f2e1a5d8')
ON CONFLICT DO NOTHING;

-- =============================================================
-- SPRINT 2: índices GIN para full-text search em português
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_tarefas_fts
ON tarefas_unificadas
USING GIN(to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(descricao, '')));

CREATE INDEX IF NOT EXISTS idx_anotacoes_fts
ON anotacoes
USING GIN(to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(conteudo, '')));
