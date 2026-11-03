-- Exclusão de conta pela admin, na própria sessão.
-- A lista já passa por is_admin_user(). A API publicada recusava o mesmo login.

CREATE OR REPLACE FUNCTION public.admin_delete_user(target uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF target IS NULL OR target = auth.uid() THEN
    RAISE EXCEPTION 'Não é possível excluir a própria conta por aqui';
  END IF;

  DELETE FROM auth.users WHERE id = target;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta não encontrada';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
