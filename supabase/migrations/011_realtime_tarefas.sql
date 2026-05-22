-- Habilita Realtime na tabela tarefas_unificadas (Kanban ao vivo via webhook/ingest)
-- Idempotente: ignora se já estiver na publication

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'tarefas_unificadas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tarefas_unificadas;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
