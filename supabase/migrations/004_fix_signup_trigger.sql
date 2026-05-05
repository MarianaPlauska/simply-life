-- =============================================================
-- FIX SIGNUP: Trigger precisa bypassar RLS na tabela profiles
-- O auth.uid() não existe no momento do signup, por isso o INSERT
-- do trigger era bloqueado pela policy
-- =============================================================

-- Recria a função com SET search_path para segurança
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nome_completo, email)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'nome_completo',
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(NEW.email, '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, public.profiles.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Garante que o trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Adiciona policy que permite o SERVICE ROLE (trigger) inserir
-- sem depender de auth.uid() que não existe durante signup
DROP POLICY IF EXISTS "profiles_service_insert" ON profiles;
CREATE POLICY "profiles_service_insert" ON profiles
    FOR INSERT
    WITH CHECK (true);

-- Mantém as policies de leitura/update restritas ao próprio usuário
-- (essas já existem do script 003)

NOTIFY pgrst, 'reload schema';
