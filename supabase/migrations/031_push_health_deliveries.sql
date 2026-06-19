-- Entregas push — saúde (medicamentos + bem-estar)

CREATE TABLE IF NOT EXISTS push_medication_deliveries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dose_key TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, dose_key)
);

CREATE TABLE IF NOT EXISTS push_wellbeing_deliveries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nudge_key TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, nudge_key)
);

CREATE INDEX IF NOT EXISTS idx_push_med_deliveries_user ON push_medication_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_push_wellbeing_deliveries_user ON push_wellbeing_deliveries(user_id);

ALTER TABLE push_medication_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_wellbeing_deliveries ENABLE ROW LEVEL SECURITY;
