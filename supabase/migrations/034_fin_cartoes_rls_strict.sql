-- Reforça RLS em fin_cartoes (SELECT/INSERT/UPDATE/DELETE por usuário)
DROP POLICY IF EXISTS "cartoes_own" ON public.fin_cartoes;

CREATE POLICY "fin_cartoes_select" ON public.fin_cartoes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "fin_cartoes_insert" ON public.fin_cartoes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "fin_cartoes_update" ON public.fin_cartoes
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "fin_cartoes_delete" ON public.fin_cartoes
  FOR DELETE USING (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
