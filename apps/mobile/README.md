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

## Instalador (APK / Play Store)

Guia: [`docs/MOBILE_INSTALADOR.md`](../../docs/MOBILE_INSTALADOR.md).

```bash
cd apps/mobile
npx eas-cli login
npx eas-cli build -p android --profile preview
```

Play Store: mesmo comando com `--profile production` (gera `.aab`). Secrets no Expo; o `.env` local não entra no instalador.

## Estrutura

- `app/` — rotas Expo Router (login, tabs, detalhe de tarefa)
- `src/ui/` — componentes base AXEL Premium
- `src/theme/` — ThemeProvider (light/dark)
- `packages/ui-tokens` — tokens de design
- `packages/shared` — lógica de humor, tarefas, finanças, demo data

## Auth

1. Supabase configurado → login email/senha  
2. Sem env → “Continuar como convidado” ou login offline  
3. **Google OAuth (web local)** — no Dashboard Supabase do projeto `zuxkqmooxvnulgllduhr`:

   - **Authentication → Providers → Google**: ativo, com Client ID/Secret do Google Cloud  
   - **Authentication → URL Configuration**:
     - **Site URL** (dev): `http://localhost:8082` (ou a porta que o Expo estiver usando)
     - **Redirect URLs** (adicione todas as que usar):

       ```
       http://localhost:8082/auth/callback
       http://localhost:8083/auth/callback
       http://127.0.0.1:8082/auth/callback
       http://127.0.0.1:8083/auth/callback
       http://localhost:8082/**
       http://localhost:8083/**
       ```

   Um `GET …/auth/v1/authorize … 400` quase sempre significa que o `redirect_to` **não está** nessa lista (ex.: app em `:8083` e só `:8082` cadastrado).

   No Google Cloud Console → OAuth Client → **Authorized redirect URIs**, use o callback do Supabase:

   `https://zuxkqmooxvnulgllduhr.supabase.co/auth/v1/callback`

## Sync

Login real grava e lê as mesmas tabelas do PWA (`diario_humor`, `tarefas_unificadas`, `despesas`).

## Push nativo

No iOS/Android (dispositivo físico), após login o app registra o token em `/api/push-subscribe`.  
Teste: botão **Testar push** no Início (não aparece no preview web).

