# E-mail → Kanban (grátis) — o que fazer agora

Siga **nesta ordem**. São 4 passos.

---

## Passo 1 — Banco (Supabase) — 2 min

1. Abra: https://supabase.com/dashboard/project/zuxkqmooxvnulgllduhr/sql/new
2. Cole o conteúdo de **`supabase/migrations/012_deadline_proposals_gmail_sync.sql`**
3. Clique **Run**
4. Cole o conteúdo de **`supabase/migrations/013_gmail_imap_free.sql`**
5. Clique **Run** de novo

Pronto quando aparecer `Success` nos dois.

---

## Passo 2 — Vercel (só 3 variáveis) — 3 min

Vercel → seu projeto → **Settings** → **Environment Variables**

| Nome | Valor |
|------|--------|
| `GROQ_API_KEY` | Chave em https://console.groq.com/keys (grátis) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → **service_role** → Reveal |
| `VITE_SUPABASE_URL` | `https://zuxkqmooxvnulgllduhr.supabase.co` |

Opcional: `CRON_SECRET` (qualquer texto longo) — sync automático a cada 6h.

Depois: **Deployments** → **Redeploy** do último deploy.

**Não precisa** de Google Cloud, `GOOGLE_CLIENT_ID`, nem cartão.

---

## Passo 3 — Senha de app do Gmail — 5 min

1. Conta Google → **Segurança** → ative **Verificação em 2 etapas**
2. Abra: https://myaccount.google.com/apppasswords
3. Crie senha para "Mail" / "Simply-Life"
4. Copie os 16 caracteres (ex: `abcd efgh ijkl mnop`)

---

## Passo 4 — No app — 1 min

1. Faça login no Simply-Life
2. **Configurações** → aba **Integrações**
3. Seção **Gmail — plano gratuito** → cole e-mail + senha de app → **Salvar Gmail**
4. **Sync Gmail agora** (ou no Kanban: botão **Sync Gmail** no topo)

E-mails não lidos viram tarefas no Kanban com score de urgência (Groq).

---

## Teste rápido

1. Envie um e-mail para você com assunto: `[TESTE] URGENTE revisar proposta`
2. Deixe **não lido** na caixa de entrada
3. Clique **Sync Gmail** no Kanban
4. A tarefa deve aparecer no painel de Prazo / Executar agora

---

## Problemas comuns

| Erro | Solução |
|------|---------|
| `Gmail não configurado` | Passo 4 — salvar e-mail + senha de app |
| `Senha de app inválida` | Gerar nova senha de app (Passo 3) |
| `Supabase não configurado` | Passo 2 — `SUPABASE_SERVICE_ROLE_KEY` na Vercel + redeploy |
| Nada no Kanban após sync | E-mail precisa estar **não lido** na Inbox |
