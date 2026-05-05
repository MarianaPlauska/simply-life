-- =============================================================
-- FIX FINAL: GRANTS + POLICIES (100% IDEMPOTENTE)
-- Pode rodar quantas vezes quiser sem erro
-- =============================================================

-- ─── GRANTS ─────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon;

-- ─── LIMPA TODAS AS POLICIES EXISTENTES ─────────────────────
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END;
$$;

-- ─── GARANTE RLS HABILITADO ─────────────────────────────────
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    END LOOP;
END;
$$;

-- ─── PROFILES ───────────────────────────────────────────────
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid());

-- ─── TAREFAS_UNIFICADAS ────────────────────────────────────
CREATE POLICY "tarefas_select" ON tarefas_unificadas FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "tarefas_insert" ON tarefas_unificadas FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "tarefas_update" ON tarefas_unificadas FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "tarefas_delete" ON tarefas_unificadas FOR DELETE USING (user_id = auth.uid());

-- ─── SUBTAREFAS ─────────────────────────────────────────────
CREATE POLICY "subtarefas_select" ON subtarefas FOR SELECT
  USING (EXISTS (SELECT 1 FROM tarefas_unificadas t WHERE t.id = subtarefas.tarefa_id AND t.user_id = auth.uid()));
CREATE POLICY "subtarefas_insert" ON subtarefas FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tarefas_unificadas t WHERE t.id = subtarefas.tarefa_id AND t.user_id = auth.uid()));
CREATE POLICY "subtarefas_update" ON subtarefas FOR UPDATE
  USING (EXISTS (SELECT 1 FROM tarefas_unificadas t WHERE t.id = subtarefas.tarefa_id AND t.user_id = auth.uid()));
CREATE POLICY "subtarefas_delete" ON subtarefas FOR DELETE
  USING (EXISTS (SELECT 1 FROM tarefas_unificadas t WHERE t.id = subtarefas.tarefa_id AND t.user_id = auth.uid()));

-- ─── LABELS ─────────────────────────────────────────────────
CREATE POLICY "labels_select" ON labels FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "labels_insert" ON labels FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "labels_update" ON labels FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "labels_delete" ON labels FOR DELETE USING (user_id = auth.uid());

-- ─── TAREFA_LABELS ──────────────────────────────────────────
CREATE POLICY "tarefa_labels_select" ON tarefa_labels FOR SELECT
  USING (EXISTS (SELECT 1 FROM tarefas_unificadas t WHERE t.id = tarefa_labels.tarefa_id AND t.user_id = auth.uid()));
CREATE POLICY "tarefa_labels_insert" ON tarefa_labels FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tarefas_unificadas t WHERE t.id = tarefa_labels.tarefa_id AND t.user_id = auth.uid()));
CREATE POLICY "tarefa_labels_delete" ON tarefa_labels FOR DELETE
  USING (EXISTS (SELECT 1 FROM tarefas_unificadas t WHERE t.id = tarefa_labels.tarefa_id AND t.user_id = auth.uid()));

-- ─── ANOTACOES ──────────────────────────────────────────────
CREATE POLICY "anotacoes_select" ON anotacoes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "anotacoes_insert" ON anotacoes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "anotacoes_update" ON anotacoes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "anotacoes_delete" ON anotacoes FOR DELETE USING (user_id = auth.uid());

-- ─── PREFERENCIAS_USUARIO ───────────────────────────────────
CREATE POLICY "preferencias_select" ON preferencias_usuario FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "preferencias_insert" ON preferencias_usuario FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "preferencias_update" ON preferencias_usuario FOR UPDATE USING (user_id = auth.uid());

-- ─── FIN_CATEGORIAS ─────────────────────────────────────────
CREATE POLICY "fin_categorias_select" ON fin_categorias FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "fin_categorias_insert" ON fin_categorias FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "fin_categorias_update" ON fin_categorias FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "fin_categorias_delete" ON fin_categorias FOR DELETE USING (user_id = auth.uid());

-- ─── DESPESAS ───────────────────────────────────────────────
CREATE POLICY "despesas_select" ON despesas FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "despesas_insert" ON despesas FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "despesas_update" ON despesas FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "despesas_delete" ON despesas FOR DELETE USING (user_id = auth.uid());

-- ─── FIN_ORCAMENTOS ─────────────────────────────────────────
CREATE POLICY "fin_orcamentos_select" ON fin_orcamentos FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "fin_orcamentos_insert" ON fin_orcamentos FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "fin_orcamentos_update" ON fin_orcamentos FOR UPDATE USING (user_id = auth.uid());

-- ─── FIN_METAS ──────────────────────────────────────────────
CREATE POLICY "fin_metas_select" ON fin_metas FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "fin_metas_insert" ON fin_metas FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "fin_metas_update" ON fin_metas FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "fin_metas_delete" ON fin_metas FOR DELETE USING (user_id = auth.uid());

-- ─── MEDICAMENTOS ───────────────────────────────────────────
CREATE POLICY "medicamentos_select" ON medicamentos FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "medicamentos_insert" ON medicamentos FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "medicamentos_update" ON medicamentos FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "medicamentos_delete" ON medicamentos FOR DELETE USING (user_id = auth.uid());

-- ─── NOTIFICACOES ───────────────────────────────────────────
CREATE POLICY "notificacoes_select" ON notificacoes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notificacoes_insert" ON notificacoes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "notificacoes_update" ON notificacoes FOR UPDATE USING (user_id = auth.uid());

-- ─── HABITOS_DIARIOS ────────────────────────────────────────
CREATE POLICY "habitos_diarios_select" ON habitos_diarios FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "habitos_diarios_insert" ON habitos_diarios FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "habitos_diarios_update" ON habitos_diarios FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "habitos_diarios_delete" ON habitos_diarios FOR DELETE USING (user_id = auth.uid());

-- ─── HISTORICO_HABITOS ──────────────────────────────────────
CREATE POLICY "historico_habitos_select" ON historico_habitos FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "historico_habitos_insert" ON historico_habitos FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "historico_habitos_update" ON historico_habitos FOR UPDATE USING (user_id = auth.uid());

-- ─── PALAVRAS_CHAVE ─────────────────────────────────────────
CREATE POLICY "palavras_chave_select" ON palavras_chave FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "palavras_chave_insert" ON palavras_chave FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "palavras_chave_delete" ON palavras_chave FOR DELETE USING (user_id = auth.uid());

-- ─── SESSOES_FOCO ───────────────────────────────────────────
CREATE POLICY "sessoes_foco_select" ON sessoes_foco FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "sessoes_foco_insert" ON sessoes_foco FOR INSERT WITH CHECK (user_id = auth.uid());

-- ─── TAREFA_TEMPLATES ───────────────────────────────────────
CREATE POLICY "tarefa_templates_select" ON tarefa_templates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "tarefa_templates_insert" ON tarefa_templates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "tarefa_templates_update" ON tarefa_templates FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "tarefa_templates_delete" ON tarefa_templates FOR DELETE USING (user_id = auth.uid());

-- ─── DIARIO_HUMOR ───────────────────────────────────────────
CREATE POLICY "diario_humor_select" ON diario_humor FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "diario_humor_insert" ON diario_humor FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "diario_humor_update" ON diario_humor FOR UPDATE USING (user_id = auth.uid());

-- ─── ENTRADAS_DIARIO ────────────────────────────────────────
CREATE POLICY "entradas_diario_select" ON entradas_diario FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "entradas_diario_insert" ON entradas_diario FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "entradas_diario_delete" ON entradas_diario FOR DELETE USING (user_id = auth.uid());

-- ─── FIX TRIGGER SIGNUP ─────────────────────────────────────
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

-- ─── RECARREGA CACHE DA API ─────────────────────────────────
NOTIFY pgrst, 'reload schema';
