-- =====================================================
-- 076 — Elo: dias cumpridos por conta
-- O elo (a "ofensiva") era só do aparelho: trocar de celular ou usar o
-- site zerava, e os amigos viam sempre elo 0. Agora cada dia cumprido
-- fica aqui e todos os aparelhos convergem (o app faz a união).
-- Regras do elo ficam no app (packages/shared/src/elo.ts): dia cumprido,
-- descanso automático na semana, recorde. O banco só guarda os dias.
--   * só o dono lê e grava (RLS user_id = auth.uid())
--   * gatilho recusa dia no futuro (horário de Brasília, com um dia de
--     folga por fuso) e dia com mais de 400 dias, e limpa as ações
--   * elo_registrar_dias faz a UNIÃO das ações do dia: dois aparelhos
--     nunca apagam o registro um do outro
--   * o elo que os amigos veem segue em user_public_cards.streak_count
--     (027); a policy user_public_cards_own já deixa o dono atualizar
-- =====================================================

CREATE TABLE IF NOT EXISTS public.elo_dias (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dia         DATE NOT NULL,
  acoes       TEXT[] NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, dia),
  CHECK (acoes <@ ARRAY['task', 'note', 'mood', 'finance', 'water', 'focus', 'meal']::TEXT[])
);

COMMENT ON TABLE public.elo_dias IS
  'Dias cumpridos do elo (ofensiva). acoes = tipos de ação do dia, no horário local de quem registrou.';

ALTER TABLE public.elo_dias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS elo_dias_select_own ON public.elo_dias;
CREATE POLICY elo_dias_select_own ON public.elo_dias
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS elo_dias_insert_own ON public.elo_dias;
CREATE POLICY elo_dias_insert_own ON public.elo_dias
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS elo_dias_update_own ON public.elo_dias;
CREATE POLICY elo_dias_update_own ON public.elo_dias
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS elo_dias_delete_own ON public.elo_dias;
CREATE POLICY elo_dias_delete_own ON public.elo_dias
  FOR DELETE USING (user_id = auth.uid());

-- Duas etapas no banco, como as demais tabelas (075)
DROP POLICY IF EXISTS mfa_aal2 ON public.elo_dias;
CREATE POLICY mfa_aal2 ON public.elo_dias AS RESTRICTIVE FOR ALL TO authenticated
  USING ((SELECT public.mfa_session_ok())) WITH CHECK ((SELECT public.mfa_session_ok()));

REVOKE ALL ON public.elo_dias FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.elo_dias TO authenticated;

-- Dia de hoje no Brasil (mesma base das ligas e metas juntos)
CREATE OR REPLACE FUNCTION public.elo_hoje()
RETURNS DATE
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::DATE;
$$;

-- Guarda: nada no futuro, nada muito antigo, só ações conhecidas
CREATE OR REPLACE FUNCTION public.elo_dias_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- um dia de folga para quem está num fuso à frente de Brasília
  IF NEW.dia > public.elo_hoje() + 1 THEN
    RAISE EXCEPTION 'dia no futuro';
  END IF;
  IF NEW.dia < public.elo_hoje() - 400 THEN
    RAISE EXCEPTION 'dia antigo demais';
  END IF;
  NEW.acoes := ARRAY(
    SELECT DISTINCT a
    FROM unnest(coalesce(NEW.acoes, '{}'::TEXT[])) AS a
    WHERE a IN ('task', 'note', 'mood', 'finance', 'water', 'focus', 'meal')
    ORDER BY a
  );
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_elo_dias_guard ON public.elo_dias;
CREATE TRIGGER trg_elo_dias_guard
  BEFORE INSERT OR UPDATE ON public.elo_dias
  FOR EACH ROW
  EXECUTE FUNCTION public.elo_dias_guard();

-- Envio em lote com união das ações. p_dias = [{"dia":"2026-10-02","acoes":["task","water"]}]
-- SECURITY INVOKER: grava como a própria pessoa, a RLS vale normalmente.
-- Dias fora da janela são ignorados em silêncio (não derrubam o lote).
CREATE OR REPLACE FUNCTION public.elo_registrar_dias(p_dias JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_hoje DATE := public.elo_hoje();
  v_count INTEGER := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF p_dias IS NULL OR jsonb_typeof(p_dias) <> 'array' THEN
    RETURN 0;
  END IF;
  IF jsonb_array_length(p_dias) > 500 THEN
    RAISE EXCEPTION 'lote grande demais';
  END IF;

  WITH entrada AS (
    SELECT (e ->> 'dia')::DATE AS dia,
           ARRAY(
             SELECT DISTINCT a
             FROM jsonb_array_elements_text(coalesce(e -> 'acoes', '[]'::JSONB)) AS a
             WHERE a IN ('task', 'note', 'mood', 'finance', 'water', 'focus', 'meal')
           ) AS acoes
    FROM jsonb_array_elements(p_dias) AS e
    WHERE (e ->> 'dia') ~ '^\d{4}-\d{2}-\d{2}$'
  ),
  validos AS (
    SELECT dia, acoes
    FROM entrada
    WHERE dia BETWEEN v_hoje - 400 AND v_hoje + 1
      AND cardinality(acoes) > 0
  ),
  gravados AS (
    INSERT INTO public.elo_dias AS d (user_id, dia, acoes)
    SELECT v_uid, dia, acoes FROM validos
    ON CONFLICT (user_id, dia) DO UPDATE
      SET acoes = ARRAY(
        SELECT DISTINCT a FROM unnest(d.acoes || EXCLUDED.acoes) AS a ORDER BY a
      )
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM gravados;

  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.elo_registrar_dias(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.elo_registrar_dias(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.elo_hoje() TO authenticated;

NOTIFY pgrst, 'reload schema';
