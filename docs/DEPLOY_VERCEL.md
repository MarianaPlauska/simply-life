# Deploy na Vercel — Simply-Life

Guia para garantir que **cada push na `main`** atualize https://simply-life.vercel.app

## Configuração correta do projeto (painel Vercel)

Em **Project → Settings → General**:

| Campo | Valor correto |
|-------|----------------|
| **Root Directory** | *(vazio — raiz do repositório)* |
| **Framework Preset** | Vite |
| **Build Command** | `cd frontend && npm run build` |
| **Output Directory** | `frontend/dist` |
| **Install Command** | `npm install --no-audit --no-fund && cd frontend && npm install --no-audit --no-fund` |

> Se **Root Directory** estiver como `frontend`, a pasta `api/` **não** sobe e o `vercel.json` da raiz é ignorado. Deixe vazio.

Em **Settings → Git**:

- Repositório: `MarianaPlauska/simply-life`
- Branch de produção: `main`
- **Connected** (ícone verde)

Se não estiver conectado: **Connect Git Repository** → GitHub → `simply-life`.

## Variáveis de ambiente (Settings → Environment Variables)

| Variável | Ambiente |
|----------|----------|
| `VITE_SUPABASE_URL` | Production + Preview |
| `VITE_SUPABASE_ANON_KEY` | Production + Preview |
| `GROQ_API_KEY` | Production + Preview (server) |
| `SUPABASE_SERVICE_ROLE_KEY` | Production (server, webhooks) |

## Opção A — Reconectar Git (mais simples)

1. Vercel → projeto **simply-life** → **Settings → Git**
2. Se desconectado, reconecte ao repo `MarianaPlauska/simply-life`
3. **Deployments** → nos três pontos do último deploy → **Redeploy** → marque **Use existing Build Cache: No**
4. Faça um push na `main` (ou use **Deploy Hook** abaixo)

## Opção B — Deploy Hook + GitHub Actions (quando o Git da Vercel falha)

1. Vercel → **Settings → Git → Deploy Hooks**
2. **Create Hook** — nome: `github-main`, branch: `main`
3. Copie a URL gerada
4. GitHub → repo **simply-life** → **Settings → Secrets and variables → Actions**
5. **New repository secret**: `VERCEL_DEPLOY_HOOK` = URL copiada
6. Cada push na `main` dispara o workflow **Deploy Vercel** (`.github/workflows/deploy-vercel.yml`)

Também pode rodar manualmente: GitHub → **Actions** → **Deploy Vercel** → **Run workflow**.

## Opção C — Deploy manual pelo terminal

```powershell
cd C:\Users\MFC\Documents\simply-life
npx vercel login
npx vercel link          # escolha o projeto simply-life
npx vercel deploy --prod
```

## Verificar se atualizou

1. Vercel → **Deployments** — deve aparecer commit recente (ex.: mensagem do último push)
2. Abra https://simply-life.vercel.app — faça hard refresh (Ctrl+Shift+R)
3. No app logado, confira módulo **Finanças** (reconciliação, resumo diário Axel)

## Migrations Supabase (após deploy)

Rodar no SQL Editor do Supabase, na ordem, se ainda não rodou:

- `supabase/migrations/020_despesas_forma_pagamento.sql`
- `supabase/migrations/021_fin_reconciliacao.sql`
