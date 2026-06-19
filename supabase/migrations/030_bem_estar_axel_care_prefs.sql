-- Estado UX de bem-estar e rotação de frases AXEL (em user_workspace_prefs.prefs JSONB)
--
-- Campos documentados no JSON prefs:
--   axel_care_rotation       — objeto { "mood-1": 0, "mood-3": 2, "streak": 4, ... }
--                            índice da próxima frase por nível (sincroniza entre dispositivos)
--   wellbeing_dashboard_hidden_until — timestamptz ISO8601
--                            ao primeiro humor do dia: now() + 12h; oculta card compacto no dashboard
--
-- Frases (45 humor + 10 ofensiva) permanecem no app; apenas o índice de rotação vai ao Supabase.

COMMENT ON TABLE public.user_workspace_prefs IS
  'Preferências de workspace. JSON prefs inclui axel_care_rotation e wellbeing_dashboard_hidden_until para UX de bem-estar.';

NOTIFY pgrst, 'reload schema';
