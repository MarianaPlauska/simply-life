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

## Conta Hobby (sem Team ID visível)

Na conta **Hobby** não aparece "Team ID" nas Settings do projeto — isso é normal.

**Só precisa de 2 secrets:**

| Secret | Valor |
|--------|--------|
| `VERCEL_TOKEN` | token com scope **Full Account** |
| `VERCEL_PROJECT_ID` | `prj_...` do simply-life → Settings → General |

**Pode apagar** `VERCEL_ORG_ID` e `VERCEL_DEPLOY_HOOK` — o workflow acha a conta automaticamente.

No log do deploy deve aparecer algo como:
`Projeto encontrado na conta/time: marianaplauska-...-projects (team_...)`

---

## Opção B — Token Vercel + GitHub Actions (recomendado)

Mais confiável que Deploy Hook. Funciona mesmo com Git desconectado.

### 1. Criar token

1. https://vercel.com/account/tokens
2. **Create** → nome: `github-simply-life`
3. **SCOPE: Full Account** (obrigatório na Hobby)
4. Copie o token (`vercel_...`)

### 2. Project ID

1. Projeto **simply-life** → **Settings → General**
2. Copie **Project ID** (`prj_710prqzF6iSCPuzZ6GuO5pQ21MM6J`)

### 3. Secrets no GitHub

https://github.com/MarianaPlauska/simply-life/settings/secrets/actions

| Secret | Valor |
|--------|--------|
| `VERCEL_TOKEN` | token `vercel_...` (Full Account) |
| `VERCEL_PROJECT_ID` | `prj_...` do simply-life |

**Opcional:** `VERCEL_ORG_ID` só se quiser forçar um time — na Hobby o workflow detecta sozinho.

### 4. Rodar deploy

https://github.com/MarianaPlauska/simply-life/actions/workflows/deploy-vercel.yml  
→ **Run workflow** → `main`

O job deve levar **2–5 minutos** (build real). Se terminar em 7s, algo ainda está errado.

---

## Opção C — Deploy Hook (alternativa)

**Erro 404** = URL incompleta, hook apagado ou projeto errado.

### URL correta

Deve ter este formato (duas partes depois de `deploy/`):

```
https://api.vercel.com/v1/integrations/deploy/prj_XXXXXXXX/xxxxxxxxxxxxxxxx
```

Geralmente **90–130 caracteres**. Se tiver ~89 e der 404, a URL foi cortada — use o botão **Copy**.

### Passos

1. Vercel → **simply-life** → **Settings → Git → Deploy Hooks**
2. Apague hooks antigos → **Create Hook** (`main`)
3. **Copy** na URL (não selecione com o mouse)
4. GitHub → secret `VERCEL_DEPLOY_HOOK` → **Update** com a URL nova
5. **Run workflow** de novo

Teste no PowerShell:

```powershell
(Invoke-WebRequest -Method POST -Uri "URL_DO_HOOK").Content
```

Deve retornar JSON com `"job"` — se der 404, a URL está errada.

---

## Opção D — Deploy manual pelo terminal

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
