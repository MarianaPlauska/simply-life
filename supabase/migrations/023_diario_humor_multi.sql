-- =============================================================
-- Diário de humor — múltiplos registros por dia + energia/contexto
-- Remove limite 1x/dia para capturar variação ao longo do dia
-- =============================================================

ALTER TABLE diario_humor DROP CONSTRAINT IF EXISTS uq_humor_dia;

ALTER TABLE diario_humor
    ADD COLUMN IF NOT EXISTS energia SMALLINT,
    ADD COLUMN IF NOT EXISTS contexto TEXT[];

ALTER TABLE diario_humor
    DROP CONSTRAINT IF EXISTS diario_humor_energia_check;

ALTER TABLE diario_humor
    ADD CONSTRAINT diario_humor_energia_check
    CHECK (energia IS NULL OR energia BETWEEN 1 AND 3);

CREATE INDEX IF NOT EXISTS ix_diario_humor_user_data_created
    ON diario_humor (user_id, data DESC, created_at DESC);

NOTIFY pgrst, 'reload schema';
