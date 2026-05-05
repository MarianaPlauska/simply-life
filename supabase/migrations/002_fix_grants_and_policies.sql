-- =============================================================
-- FIX: GRANTS + RLS POLICIES CORRIGIDAS
-- Execute no SQL Editor do Supabase APÓS a migration 001
--
-- Problema: RLS habilitado mas sem GRANT para role authenticated
-- Solução: dar permissão ao role authenticated em todas as tabelas
-- =============================================================

-- ─── GRANTS para role authenticated ─────────────────────────
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- todas as tabelas
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- sequences (necessário para INSERT com SERIAL/auto-increment)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- default para tabelas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon;

-- ─── Fix trigger handle_new_user ────────────────────────────
-- Recria com tratamento de erro mais robusto
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, nome_completo, email)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'nome_completo',
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(NEW.email, '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, profiles.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Fix RLS policies: adicionar WITH CHECK para INSERT ─────
-- sem WITH CHECK, INSERT é bloqueado mesmo com USING

-- profiles
DROP POLICY IF EXISTS "profiles_own" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- tarefas_unificadas
DROP POLICY IF EXISTS "tarefas_own" ON tarefas_unificadas;
CREATE POLICY "tarefas_select" ON tarefas_unificadas FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "tarefas_insert" ON tarefas_unificadas FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "tarefas_update" ON tarefas_unificadas FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "tarefas_delete" ON tarefas_unificadas FOR DELETE USING (user_id = auth.uid());

-- subtarefas
DROP POLICY IF EXISTS "subtarefas_own" ON subtarefas;
CREATE POLICY "subtarefas_select" ON subtarefas FOR SELECT
  USING (EXISTS (SELECT 1 FROM tarefas_unificadas t WHERE t.id = subtarefas.tarefa_id AND t.user_id = auth.uid()));
CREATE POLICY "subtarefas_insert" ON subtarefas FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tarefas_unificadas t WHERE t.id = subtarefas.tarefa_id AND t.user_id = auth.uid()));
CREATE POLICY "subtarefas_update" ON subtarefas FOR UPDATE
  USING (EXISTS (SELECT 1 FROM tarefas_unificadas t WHERE t.id = subtarefas.tarefa_id AND t.user_id = auth.uid()));
CREATE POLICY "subtarefas_delete" ON subtarefas FOR DELETE
  USING (EXISTS (SELECT 1 FROM tarefas_unificadas t WHERE t.id = subtarefas.tarefa_id AND t.user_id = auth.uid()));

-- labels
DROP POLICY IF EXISTS "labels_own" ON labels;
CREATE POLICY "labels_select" ON labels FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "labels_insert" ON labels FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "labels_update" ON labels FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "labels_delete" ON labels FOR DELETE USING (user_id = auth.uid());

-- tarefa_labels
DROP POLICY IF EXISTS "tarefa_labels_own" ON tarefa_labels;
CREATE POLICY "tarefa_labels_select" ON tarefa_labels FOR SELECT
  USING (EXISTS (SELECT 1 FROM tarefas_unificadas t WHERE t.id = tarefa_labels.tarefa_id AND t.user_id = auth.uid()));
CREATE POLICY "tarefa_labels_insert" ON tarefa_labels FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tarefas_unificadas t WHERE t.id = tarefa_labels.tarefa_id AND t.user_id = auth.uid()));
CREATE POLICY "tarefa_labels_delete" ON tarefa_labels FOR DELETE
  USING (EXISTS (SELECT 1 FROM tarefas_unificadas t WHERE t.id = tarefa_labels.tarefa_id AND t.user_id = auth.uid()));

-- anotacoes
DROP POLICY IF EXISTS "anotacoes_own" ON anotacoes;
CREATE POLICY "anotacoes_select" ON anotacoes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "anotacoes_insert" ON anotacoes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "anotacoes_update" ON anotacoes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "anotacoes_delete" ON anotacoes FOR DELETE USING (user_id = auth.uid());

-- preferencias_usuario
DROP POLICY IF EXISTS "preferencias_own" ON preferencias_usuario;
CREATE POLICY "preferencias_select" ON preferencias_usuario FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "preferencias_insert" ON preferencias_usuario FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "preferencias_update" ON preferencias_usuario FOR UPDATE USING (user_id = auth.uid());

-- fin_categorias
DROP POLICY IF EXISTS "fin_categorias_own" ON fin_categorias;
CREATE POLICY "fin_categorias_select" ON fin_categorias FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "fin_categorias_insert" ON fin_categorias FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "fin_categorias_update" ON fin_categorias FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "fin_categorias_delete" ON fin_categorias FOR DELETE USING (user_id = auth.uid());

-- despesas
DROP POLICY IF EXISTS "despesas_own" ON despesas;
CREATE POLICY "despesas_select" ON despesas FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "despesas_insert" ON despesas FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "despesas_update" ON despesas FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "despesas_delete" ON despesas FOR DELETE USING (user_id = auth.uid());

-- fin_orcamentos
DROP POLICY IF EXISTS "fin_orcamentos_own" ON fin_orcamentos;
CREATE POLICY "fin_orcamentos_select" ON fin_orcamentos FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "fin_orcamentos_insert" ON fin_orcamentos FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "fin_orcamentos_update" ON fin_orcamentos FOR UPDATE USING (user_id = auth.uid());

-- fin_metas
DROP POLICY IF EXISTS "fin_metas_own" ON fin_metas;
CREATE POLICY "fin_metas_select" ON fin_metas FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "fin_metas_insert" ON fin_metas FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "fin_metas_update" ON fin_metas FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "fin_metas_delete" ON fin_metas FOR DELETE USING (user_id = auth.uid());

-- medicamentos
DROP POLICY IF EXISTS "medicamentos_own" ON medicamentos;
CREATE POLICY "medicamentos_select" ON medicamentos FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "medicamentos_insert" ON medicamentos FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "medicamentos_update" ON medicamentos FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "medicamentos_delete" ON medicamentos FOR DELETE USING (user_id = auth.uid());

-- notificacoes
DROP POLICY IF EXISTS "notificacoes_own" ON notificacoes;
CREATE POLICY "notificacoes_select" ON notificacoes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notificacoes_insert" ON notificacoes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "notificacoes_update" ON notificacoes FOR UPDATE USING (user_id = auth.uid());

-- habitos_diarios
DROP POLICY IF EXISTS "habitos_diarios_own" ON habitos_diarios;
CREATE POLICY "habitos_diarios_select" ON habitos_diarios FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "habitos_diarios_insert" ON habitos_diarios FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "habitos_diarios_update" ON habitos_diarios FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "habitos_diarios_delete" ON habitos_diarios FOR DELETE USING (user_id = auth.uid());

-- historico_habitos
DROP POLICY IF EXISTS "historico_habitos_own" ON historico_habitos;
CREATE POLICY "historico_habitos_select" ON historico_habitos FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "historico_habitos_insert" ON historico_habitos FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "historico_habitos_update" ON historico_habitos FOR UPDATE USING (user_id = auth.uid());

-- palavras_chave
DROP POLICY IF EXISTS "palavras_chave_own" ON palavras_chave;
CREATE POLICY "palavras_chave_select" ON palavras_chave FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "palavras_chave_insert" ON palavras_chave FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "palavras_chave_delete" ON palavras_chave FOR DELETE USING (user_id = auth.uid());

-- sessoes_foco
DROP POLICY IF EXISTS "sessoes_foco_own" ON sessoes_foco;
CREATE POLICY "sessoes_foco_select" ON sessoes_foco FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "sessoes_foco_insert" ON sessoes_foco FOR INSERT WITH CHECK (user_id = auth.uid());

-- tarefa_templates
DROP POLICY IF EXISTS "tarefa_templates_own" ON tarefa_templates;
CREATE POLICY "tarefa_templates_select" ON tarefa_templates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "tarefa_templates_insert" ON tarefa_templates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "tarefa_templates_update" ON tarefa_templates FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "tarefa_templates_delete" ON tarefa_templates FOR DELETE USING (user_id = auth.uid());

-- diario_humor
DROP POLICY IF EXISTS "diario_humor_own" ON diario_humor;
CREATE POLICY "diario_humor_select" ON diario_humor FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "diario_humor_insert" ON diario_humor FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "diario_humor_update" ON diario_humor FOR UPDATE USING (user_id = auth.uid());

-- entradas_diario
DROP POLICY IF EXISTS "entradas_diario_own" ON entradas_diario;
CREATE POLICY "entradas_diario_select" ON entradas_diario FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "entradas_diario_insert" ON entradas_diario FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "entradas_diario_delete" ON entradas_diario FOR DELETE USING (user_id = auth.uid());

-- ─── Garante que RLS está habilitado em tudo ────────────────
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT IN ('schema_migrations')
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    END LOOP;
END;
$$;
