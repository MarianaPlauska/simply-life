# Backup & Restore — Simply-Life OS

## Backups Automáticos (Supabase)

O Supabase realiza backups automáticos diários do banco PostgreSQL.

| Plano      | Frequência    | Retenção  |
|------------|---------------|-----------|
| Free       | Diário        | 7 dias    |
| Pro        | Diário        | 14 dias   |
| Team       | Diário        | 30 dias   |
| Enterprise | Personalizável | Custom   |

> Os backups são **point-in-time** no plano Pro e acima.

---

## 1. Restaurar via Dashboard Supabase

1. Acesse **[app.supabase.com](https://app.supabase.com)** → selecione o projeto
2. Vá em **Database → Backups**
3. Localize o backup desejado pela data/hora
4. Clique **Restore**
5. Aguarde a restauração (pode levar minutos dependendo do tamanho)
6. **Verifique** — rode o checklist na seção 4

> ⚠️ A restauração sobrescreve o banco atual. Considere criar um branch de teste antes.

---

## 2. Dump Manual via `pg_dump`

Para backups manuais independentes do Supabase:

```bash
# exportar schema + dados
pg_dump \
  --host=db.<PROJECT_REF>.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --format=custom \
  --file=backup_$(date +%Y%m%d_%H%M%S).dump

# exportar apenas schema (sem dados)
pg_dump \
  --host=db.<PROJECT_REF>.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --schema-only \
  --file=schema_$(date +%Y%m%d).sql
```

> **Credenciais**: use a senha do banco que está em `Settings → Database → Connection string` no dashboard do Supabase.

---

## 3. Restaurar via `pg_restore`

```bash
# restaurar dump completo em um banco limpo
pg_restore \
  --host=db.<PROJECT_REF>.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  backup_20260422_153000.dump
```

> ⚠️ Use `--clean --if-exists` para dropar objetos antes de recriar. **Nunca** rode em produção sem testar antes em um branch.

---

## 4. Checklist de Validação Pós-Restore

Após qualquer restauração, verifique:

- [ ] **Alembic version**: `SELECT version_num FROM alembic_version;`
  - Deve ser a migration mais recente (ex: `k6l7m8n9o0p1`)
- [ ] **Tabelas existem**: `SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';`
  - Deve retornar ≥ 15 tabelas
- [ ] **Usuários preservados**: `SELECT count(*) FROM usuarios;`
- [ ] **RLS policies**: `SELECT count(*) FROM pg_policies WHERE schemaname = 'public';`
- [ ] **Índices compostos**: `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';`
- [ ] **Health check**: `curl https://<API_URL>/health` → `{"status":"ok"}`
- [ ] **Readiness**: `curl https://<API_URL>/ready` → `{"status":"ready","database":"connected"}`
- [ ] **Login funciona**: testar login com conta de teste

---

## 5. Procedimento de Teste Periódico

**Frequência recomendada**: mensal

1. Criar um **branch de desenvolvimento** no Supabase
2. Restaurar o backup mais recente no branch
3. Rodar o checklist da seção 4
4. Deletar o branch após validar
5. Registrar resultado em `docs/backup_test_log.md`
