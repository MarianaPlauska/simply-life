-- =====================================================
-- 071 — Espera ligada a um amigo do Círculo
-- Quando quem você espera é um amigo, a tarefa aparece no cantinho dele
-- (perfil > Círculo). Só você vê: o amigo não recebe nada.
-- =====================================================

ALTER TABLE public.tarefa_esperas
  ADD COLUMN IF NOT EXISTS amigo_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ix_tarefa_esperas_amigo
  ON public.tarefa_esperas (user_id, amigo_id)
  WHERE amigo_id IS NOT NULL;
