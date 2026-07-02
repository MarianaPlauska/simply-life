-- Saldos fixados manualmente quando o cálculo automático não reflete a conta real

ALTER TABLE fin_conta_corrente
  ADD COLUMN IF NOT EXISTS saldos_manual JSONB;

COMMENT ON COLUMN fin_conta_corrente.saldos_manual IS 'KPIs da conta corrente fixados pelo usuário (disponível, corrente, reservado, projetado)';
