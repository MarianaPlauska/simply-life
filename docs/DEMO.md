# Modo demo — Simply-Life

Conta **fixa compartilhada**. Visitantes concorrentes podem se pisar por alguns minutos; o reset no login (e o cron diário) devolve o seed.

## Uma vez no Supabase (projeto `zuxkqmooxvnulgllduhr`)

1. Authentication → Users → **Add user**: e-mail `demo@simply-life.app`, senha forte, confirme o e-mail.
2. SQL Editor: cole `supabase/migrations/047_demo_workspace.sql` e rode.
3. Anote o UUID do user (Authentication → Users).

O reset só aceita esse e-mail (ou o UUID em `DEMO_USER_ID`). RLS continua `user_id = auth.uid()` — a demo não vê dados de outras contas.

## Variáveis na Vercel

| Nome | Onde | Valor |
|------|------|--------|
| `VITE_DEMO_EMAIL` | Production (build) | `demo@simply-life.app` |
| `VITE_DEMO_PASSWORD` | Production (build) | senha do user demo (vai no bundle — aceitável para vitrine) |
| `DEMO_EMAIL` | Production (server) | mesmo e-mail (a API não lê `VITE_*` em runtime com segurança) |
| `DEMO_USER_ID` | Production (server, opcional) | UUID do user — o cron usa isso se a tabela `app_demo_account` ainda estiver vazia |

A senha **não** entra no git. Só env.

## Checagem

1. Incógnito → https://simply-life.vercel.app/login → **Ver demo**.
2. Kanban com HOJE / Semana / Backlog; Finanças com 50/30/20; Saúde com água/proteína; banner no topo.
3. Login na sua conta real: essas rows não aparecem.
4. Segundo **Ver demo**: seed restaurado (tarefas extras somem).
