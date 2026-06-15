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

**Os dois passos são obrigatórios.** Só criar o Hook na Vercel não dispara nada.

### Passo 1 — Vercel (você já fez)

1. Vercel → **Settings → Git → Deploy Hooks**
2. **Create Hook** — nome: `github-main`, branch: `main`
3. Copie a URL (`https://api.vercel.com/v1/integrations/deploy/...`)

### Passo 2 — GitHub (falta este)

1. Abra: https://github.com/MarianaPlauska/simply-life/settings/secrets/actions
2. **New repository secret**
3. **Name:** `VERCEL_DEPLOY_HOOK` (exatamente assim, maiúsculas)
4. **Secret:** cole a URL do passo 1
5. **Add secret**

### Passo 3 — Rodar

1. https://github.com/MarianaPlauska/simply-life/actions/workflows/deploy-vercel.yml
2. **Run workflow** → branch `main` → **Run workflow**
3. O job deve levar poucos segundos e mostrar `Deploy Hook aceito`
4. Na Vercel, em 1–3 min, aparece deploy novo (commit `e62e191` ou mais recente)

Se o workflow terminar em ~7s com **Success** mas a Vercel não mudar, o secret **não** foi salvo — refaça o passo 2.

### Teste rápido do Hook (sem GitHub)

No PowerShell, cole a URL do hook:

```powershell
Invoke-WebRequest -Method POST -Uri "COLE_A_URL_DO_HOOK_AQUI"
```

Se retornar JSON com `"job"` ou `"pending"`, o hook funciona. Aí só falta o secret no GitHub.

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
