-- Rode APENAS para conferir se a migration 008 está completa no Supabase.
-- Resultado esperado: 3 tabelas + 8 policies + 1 função handle_new_user com user_stats.

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_stats', 'achievements', 'user_quests')
ORDER BY table_name;

SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_stats', 'achievements', 'user_quests')
ORDER BY tablename, policyname;

SELECT COUNT(*) AS usuarios_com_stats
FROM public.profiles p
LEFT JOIN public.user_stats s ON s.id = p.id;

SELECT COUNT(*) AS usuarios_sem_stats
FROM public.profiles p
LEFT JOIN public.user_stats s ON s.id = p.id
WHERE s.id IS NULL;
