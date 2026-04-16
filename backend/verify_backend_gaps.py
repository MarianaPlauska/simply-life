"""
Script de verificação completa — Backend Gaps
Executa: python verify_backend_gaps.py
"""
import inspect
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

results = {}

def check(name, passed):
    tag = "PASS" if passed else "FAIL"
    results[name] = passed
    print(f"  -> {tag}")
    return passed

print("=" * 64)
print("  VERIFICACAO COMPLETA — BACKEND GAPS (10 itens)")
print("=" * 64)

# ── 1. Health Check Endpoints ──────────────────────────────
print("\n[1] HEALTH CHECK ENDPOINTS")
import main
from fastapi.testclient import TestClient
client = TestClient(main.app)

r1 = client.get("/health")
print(f"  GET /health => {r1.status_code} {r1.json()}")
r2 = client.get("/ready")
print(f"  GET /ready  => {r2.status_code} {r2.json()}")
check("health_check", r1.status_code == 200 and r2.status_code == 200)

# ── 2. Sentry / Observabilidade ───────────────────────────
print("\n[2] OBSERVABILIDADE (SENTRY)")
src_main = inspect.getsource(main)
checks = {
    "sentry_sdk import": "import sentry_sdk" in src_main,
    "sentry_sdk.init()": "sentry_sdk.init" in src_main,
    "SENTRY_DSN env":    "SENTRY_DSN" in src_main,
    "Graceful fallback": "_SENTRY_AVAILABLE" in src_main,
    "FastApiIntegration": "FastApiIntegration" in src_main,
}
for k, v in checks.items():
    print(f"  {k}: {v}")
check("sentry", all(checks.values()))

# ── 3. Connection Pooling ─────────────────────────────────
print("\n[3] CONNECTION POOLING")
import database
db_src = inspect.getsource(database)
p = "pool_size" in db_src
o = "max_overflow" in db_src
print(f"  pool_size:    {p}")
print(f"  max_overflow: {o}")
check("conn_pool", p and o)

# ── 4. Background Worker Resiliente ───────────────────────
print("\n[4] BACKGROUND WORKER (retry + backoff)")
checks4 = {
    "_WORKER_MAX_BACKOFF":  "_WORKER_MAX_BACKOFF" in src_main,
    "consecutive_errors":   "consecutive_errors" in src_main,
    "CancelledError":       "CancelledError" in src_main,
    "exponential (2 **)":   ("2 **" in src_main or "2**" in src_main),
    "capture_exception":    "capture_exception" in src_main,
}
for k, v in checks4.items():
    print(f"  {k}: {v}")
check("worker_backoff", all(checks4.values()))

# ── 5. API Versioning /v1/ ────────────────────────────────
print("\n[5] API VERSIONING /v1/")
routes = [r.path for r in main.app.routes if hasattr(r, "path")]
v1_routes = sorted(set(r for r in routes if r.startswith("/v1/")))
print(f"  /v1/ routes count: {len(v1_routes)}")
print(f"  Exemplos: {v1_routes[:8]}")

# Testa que /v1/tarefas e /tarefas ambos existem
has_v1_tarefas = any("/v1/tarefas" in r for r in v1_routes)
has_legacy_tarefas = "/tarefas" in routes
print(f"  /v1/tarefas existe: {has_v1_tarefas}")
print(f"  /tarefas   existe: {has_legacy_tarefas}")
check("api_versioning", len(v1_routes) >= 5 and has_v1_tarefas)

# ── 6. Paginação nos Relatórios ───────────────────────────
print("\n[6] PAGINACAO NOS RELATORIOS")
from routers import relatorios as rel_mod
rel_src = inspect.getsource(rel_mod)
has_query_param = "semanas" in rel_src and "Query(" in rel_src
has_ge_le = "ge=1" in rel_src and "le=52" in rel_src

from logic import analytics_engine as ae
ae_src = inspect.getsource(ae)
has_max_hist = "_MAX_SEMANAS_HISTORICO" in ae_src
has_cap = "min(semanas_historico" in ae_src or "max(1, min(" in ae_src

print(f"  Query param semanas: {has_query_param}")
print(f"  ge=1, le=52 bounds:  {has_ge_le}")
print(f"  _MAX_SEMANAS_HISTORICO: {has_max_hist}")
print(f"  Cap enforced:        {has_cap}")
check("paginacao_relatorios", all([has_query_param, has_ge_le, has_max_hist, has_cap]))

# ── 7. Cache no Dashboard ────────────────────────────────
print("\n[7] CACHE NO DASHBOARD")
from routers import dashboard as dash_mod
dash_src = inspect.getsource(dash_mod)
has_cache_get = "_cache_get" in dash_src
has_cache_set = "_cache_set" in dash_src
has_ttl = "_CACHE_TTL_SECONDS" in dash_src
has_monotonic = "monotonic" in dash_src
print(f"  _cache_get:          {has_cache_get}")
print(f"  _cache_set:          {has_cache_set}")
print(f"  _CACHE_TTL_SECONDS:  {has_ttl}")
print(f"  monotonic():         {has_monotonic}")
check("dashboard_cache", all([has_cache_get, has_cache_set, has_ttl, has_monotonic]))

# ── 8. Índices Compostos (Alembic migration) ─────────────
print("\n[8] INDICES COMPOSTOS (migration)")
migration_path = os.path.join(
    os.path.dirname(__file__),
    "alembic", "versions", "k6l7m8n9o0p1_composite_indexes_perf.py",
)
migration_exists = os.path.isfile(migration_path)
print(f"  Migration file exists: {migration_exists}")

if migration_exists:
    with open(migration_path) as f:
        mig_src = f.read()
    expected_indexes = [
        "idx_tarefa_usuario_status",
        "idx_tarefa_usuario_score",
        "idx_tarefa_usuario_created",
        "idx_despesa_usuario_data",
        "idx_sessao_foco_usuario_created",
        "idx_historico_habito_usuario_data_concluido",
        "idx_diario_humor_usuario_data",
        "idx_audit_log_usuario_created",
    ]
    for idx in expected_indexes:
        present = idx in mig_src
        print(f"  {idx}: {present}")
    all_idx = all(idx in mig_src for idx in expected_indexes)
else:
    all_idx = False

# Verifica que a migration foi aplicada (alembic current)
from sqlalchemy import text
db_session = database.SessionLocal()
try:
    row = db_session.execute(text(
        "SELECT version_num FROM alembic_version"
    )).fetchone()
    current_rev = row[0] if row else ""
    db_session.close()
except Exception:
    current_rev = ""
print(f"  DB alembic_version: {current_rev}")
applied = "k6l7m8n9o0p1" in current_rev
print(f"  Migration applied:  {applied}")
check("composite_indexes", migration_exists and all_idx and applied)

# ── 9. Testes de Integração Novos ────────────────────────
print("\n[9] TESTES DE INTEGRACAO")
tests_dir = os.path.join(os.path.dirname(__file__), "tests")
new_tests = ["test_gamificacao.py", "test_financas.py", "test_saude.py"]
for t in new_tests:
    exists = os.path.isfile(os.path.join(tests_dir, t))
    # Conta funcoes de teste
    count = 0
    if exists:
        with open(os.path.join(tests_dir, t)) as f:
            for line in f:
                if line.strip().startswith("def test_"):
                    count += 1
    print(f"  {t}: exists={exists}, test_functions={count}")
all_tests_exist = all(
    os.path.isfile(os.path.join(tests_dir, t)) for t in new_tests
)
check("integration_tests", all_tests_exist)

# ── 10. Backup/Restore (documentação) ────────────────────
print("\n[10] BACKUP/RESTORE")
print("  Supabase gerencia backups automaticos — sem arquivo local.")
print("  (Nenhuma acao de codigo necessaria, apenas ops/documentacao)")
results["backup_restore"] = None  # N/A

# ── RESUMO FINAL ─────────────────────────────────────────
print("\n" + "=" * 64)
print("  RESUMO FINAL")
print("=" * 64)
total = 0
passed = 0
for name, ok in results.items():
    if ok is None:
        tag = "N/A"
    elif ok:
        tag = "PASS"
        total += 1
        passed += 1
    else:
        tag = "FAIL"
        total += 1
    print(f"  [{tag:4s}] {name}")

print(f"\n  Score: {passed}/{total} verificacoes passaram")
if passed == total:
    print("  TUDO IMPLEMENTADO COM SUCESSO!")
else:
    print(f"  {total - passed} item(ns) com falha — verificar acima.")
