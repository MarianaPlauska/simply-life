# Isolamento de dados por usuário

Cada conta no Simply-Life deve ver **apenas os próprios dados**. Não pode haver vazamento entre usuários no mesmo navegador ou no banco.

## Camadas de proteção

### 1. Supabase (servidor)

- Tabelas com **RLS** (`user_id = auth.uid()`).
- Migration `034_fin_cartoes_rls_strict.sql` reforça cartões financeiros.

### 2. Cache local (navegador)

- Zustand persist: chave `simply-life-store:{userId}` (não mais global).
- Finanças/hábitos locais: chaves com sufixo `:{userId}`.
- Ao trocar de conta: `switchUserSession` limpa memória e recarrega do servidor.

### 3. Frontend

- `useUserSessionIsolation` — escuta `onAuthStateChange` e isola sessão.
- `fetchCards` filtra `user_id` e não mistura cartões de outra conta.
- Formulário de cartão usa o **nome do perfil logado**, não valor fixo.

## O que fazer após deploy

1. Rodar migration `034_fin_cartoes_rls_strict.sql` no Supabase.
2. Pedir que cada usuário faça **logout → login** uma vez (limpa cache antigo).
3. Opcional: Configurações → limpar cache local se ainda ver dados estranhos.

## Arquivos principais

| Arquivo | Função |
|---------|--------|
| `frontend/src/lib/userScopedStorage.ts` | Chaves localStorage por usuário |
| `frontend/src/store/resetUserSession.ts` | Reset ao trocar conta |
| `frontend/src/hooks/useUserSessionIsolation.ts` | Hook global no App |
| `frontend/src/store/useTaskStore.ts` | Persist escopado |
