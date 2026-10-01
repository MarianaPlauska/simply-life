-- =====================================================
-- 072 — Foco junto
-- Quem escolhe compartilhar mostra aos amigos do Círculo até quando está
-- focando. Só a hora de término, nada sobre a tarefa. Desligado por padrão
-- (preferência share_focus_status); o app grava null quando para.
-- Amigos já leem user_public_cards pela policy de 027.
-- =====================================================

ALTER TABLE public.user_public_cards
  ADD COLUMN IF NOT EXISTS focando_ate TIMESTAMPTZ;
