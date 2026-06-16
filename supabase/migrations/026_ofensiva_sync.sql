-- Ofensiva diária sincronizada entre dispositivos (user_stats)

ALTER TABLE public.user_stats
  ADD COLUMN IF NOT EXISTS ofensiva_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ofensiva_last_active_date DATE,
  ADD COLUMN IF NOT EXISTS ofensiva_freezes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ofensiva_freeze_claim_month CHAR(7),
  ADD COLUMN IF NOT EXISTS ofensiva_saved_days JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ofensiva_focus_minutes JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ofensiva_task_today BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ofensiva_wellbeing_today BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.user_stats.ofensiva_saved_days IS 'Mapa ISO date → true quando o dia salvou a ofensiva';
COMMENT ON COLUMN public.user_stats.ofensiva_focus_minutes IS 'Mapa ISO date → minutos de foco no dia';

NOTIFY pgrst, 'reload schema';
