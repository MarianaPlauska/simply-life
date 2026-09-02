# Simply-Life Mobile (Expo)

App React Native + Expo Router com design system **AXEL Premium**.

## Setup

```bash
# na raiz do monorepo
npm install
cp apps/mobile/.env.example apps/mobile/.env
# EXPO_PUBLIC_SUPABASE_*  — sync real (sem isso: convidado/demo)
# EXPO_PUBLIC_API_URL     — push (vercel dev :3000 ou URL de produção)

npm run mobile:web
```

Abra **http://localhost:8082** (o script `web` usa a porta 8082 para evitar conflito com outros Metros).

Na tela de login: **Continuar como convidado**.

> Se aparecer `expo-asset cannot be found`, rode `npm install` na raiz de novo.  
> O `postinstall` aplica um patch no Expo Router necessário no monorepo.

## Scripts

| Comando | Efeito |
|---------|--------|
| `npm run mobile` | Expo start (QR / dispositivo) |
| `npm run mobile:web` | Preview web em `:8082` |
| `npm run typecheck:mobile` | TypeScript |

## Estrutura

- `app/` — rotas Expo Router (login, tabs, detalhe de tarefa)
- `src/ui/` — componentes base AXEL Premium
- `src/theme/` — ThemeProvider (light/dark)
- `packages/ui-tokens` — tokens de design
- `packages/shared` — lógica de humor, tarefas, finanças, demo data

## Auth

1. Supabase configurado → login email/senha  
2. Sem env → “Continuar como convidado” ou login offline

## Sync

Login real grava e lê as mesmas tabelas do PWA (`diario_humor`, `tarefas_unificadas`, `despesas`).

## Push nativo

No iOS/Android (dispositivo físico), após login o app registra o token em `/api/push-subscribe`.  
Teste: botão **Testar push** no Início (não aparece no preview web).

