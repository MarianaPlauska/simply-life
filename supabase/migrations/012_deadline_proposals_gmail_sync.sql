-- 012 — Propostas de prazo (AXEL) + metadados de sync Gmail

CREATE TABLE IF NOT EXISTS deadline_proposals (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id       INTEGER NOT NULL REFERENCES tarefas_unificadas(id) ON DELETE CASCADE,
  current_due   TIMESTAMPTZ,
  proposed_due  TIMESTAMPTZ NOT NULL,
  reason        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  resolved_at   TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_deadline_proposals_user_task
  ON deadline_proposals (user_id, task_id);

CREATE INDEX IF NOT EXISTS idx_deadline_proposals_user_pending
  ON deadline_proposals (user_id, status)
  WHERE status = 'pending';

ALTER TABLE deadline_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deadline_proposals_own" ON deadline_proposals
  FOR ALL USING (user_id = auth.uid());

-- Controle de sync Gmail por usuário
ALTER TABLE oauth_tokens
  ADD COLUMN IF NOT EXISTS last_gmail_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS gmail_sync_enabled BOOLEAN DEFAULT true;

NOTIFY pgrst, 'reload schema';
