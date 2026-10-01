-- =====================================================
-- 074 — Ligas: avisos no celular + fechar funções internas
-- 1) No Supabase as funções novas já recebem EXECUTE para anon e
--    authenticated por padrão. "REVOKE ... FROM PUBLIC" (073) não tira esse
--    acesso. liga_soma devolve a soma do pote, que numa dupla entrega o XP
--    do outro: só o servidor (service_role) e as funções SECURITY DEFINER
--    podem chamar.
-- 2) liga_avisos: cada aviso (pote cheio na semana, liga subiu) sai uma vez
--    só por liga e semana. Só o servidor lê e escreve.
-- =====================================================

REVOKE EXECUTE ON FUNCTION public.liga_soma(UUID, DATE) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.liga_settle(UUID) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.liga_progress(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.liga_members_public(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_liga(TEXT, TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_liga_invite(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.preview_liga_invite(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.accept_liga_invite(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.leave_liga(UUID) FROM anon;

CREATE TABLE IF NOT EXISTS public.liga_avisos (
  liga_id  UUID NOT NULL REFERENCES public.ligas(id) ON DELETE CASCADE,
  semana   DATE NOT NULL,
  tipo     TEXT NOT NULL CHECK (tipo IN ('cheio', 'subiu')),
  sent_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (liga_id, semana, tipo)
);

-- Sem policies: só o service_role (endpoint /api/axel/league-pot) acessa
ALTER TABLE public.liga_avisos ENABLE ROW LEVEL SECURITY;
