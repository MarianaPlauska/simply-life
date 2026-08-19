# E-mail → Kanban (grátis) — o que fazer agora

Siga **nesta ordem**. São 4 passos.

---

## Passo 1 — Banco (Supabase) — 2 min

1. Abra: https://supabase.com/dashboard/project/zuxkqmooxvnulgllduhr/sql/new
2. Cole **`012`**, **`013`** e **`048_imap_encrypt_dedup.sql`** (pasta + cifração + dedup)
3. Clique **Run** em cada um

Pronto quando aparecer `Success` nos dois.

---

## Passo 2 — Vercel (só 3 variáveis) — 3 min

Vercel → seu projeto → **Settings** → **Environment Variables**

| Nome | Valor |
|------|--------|
| `GROQ_API_KEY` | Chave em https://console.groq.com/keys (grátis) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → **service_role** → Reveal |
| `VITE_SUPABASE_URL` | `https://zuxkqmooxvnulgllduhr.supabase.co` |
| `ENCRYPTION_KEY` | 32 bytes hex (64 chars) ou base64 — cifra a senha de app IMAP |

Opcional: `CRON_SECRET` (qualquer texto longo) — sync automático no cron diário.

A senha **não** volta no GET de status. Sem `ENCRYPTION_KEY` o save responde 503 (não grava texto puro).

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
3. Seção **Gmail — plano gratuito** → cole e-mail + senha de app (pasta opcional `Simply-Life`) → **Salvar Gmail**
4. **Sync Gmail agora** e, se quiser, **Enviar e-mail de teste** (SMTP da mesma senha)

E-mails não lidos viram tarefas com origem `email`, `score_reason` “Ingestão por e-mail” e evento no histórico AXEL. Duplicatas usam Message-ID.

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
