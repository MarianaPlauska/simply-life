import asyncio
import logging
import os
import secrets
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse

# ── Sentry (observabilidade) ─────────────────────────────────
_SENTRY_DSN = os.environ.get("SENTRY_DSN", "")
try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    _SENTRY_AVAILABLE = True
except ImportError:
    _SENTRY_AVAILABLE = False

if _SENTRY_DSN and _SENTRY_AVAILABLE:
    sentry_sdk.init(
        dsn=_SENTRY_DSN,
        integrations=[FastApiIntegration(), SqlalchemyIntegration()],
        # Captura 10% das transações em produção (ajuste via env SENTRY_TRACES_RATE)
        traces_sample_rate=float(os.environ.get("SENTRY_TRACES_RATE", "0.1")),
        # Nunca enviar PII como email/IP na payload do evento
        send_default_pii=False,
        environment=os.environ.get("ENVIRONMENT", "development"),
    )

# Carrega .env do diretório backend/ (onde estão as credenciais reais)
_backend_dir = Path(__file__).resolve().parent
load_dotenv(_backend_dir / ".env", override=True)
# Fallback: tenta também a raiz do projeto (sem sobrescrever chaves já carregadas)
load_dotenv(_backend_dir.parent / ".env")

from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from fastapi import Depends
from sqlalchemy.orm import Session

import database
import models

from routers import auth as auth_router
from routers import tarefas as tarefas_router
from routers import webhooks as webhooks_router
from routers import labels as labels_router
from routers import anotacoes as anotacoes_router
from routers import templates as templates_router
from routers import relacionamentos as relacionamentos_router
from routers import configuracoes as config_router
from routers import financas as financas_router
from routers import saude as saude_router
from routers import dashboard as dashboard_router
from routers import integracoes as integracoes_router
from routers import gamificacao as gamificacao_router
from routers import triagem as triagem_router
from routers import busca as busca_router
from routers import bem_estar as bem_estar_router
from routers import relatorios as relatorios_router
from routers import lgpd as lgpd_router
from routers import ws as ws_router

# ── B12: Logging Estruturado ─────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("simply-life")


# ── Worker de background (polling) ────────────────────────────
_WORKER_BASE_DELAY = 60       # segundos entre ciclos normais
_WORKER_MAX_BACKOFF = 300     # backoff máximo após erros (5 min)

async def motor_busca_ativa():
    """
    Worker periódico com retry e backoff exponencial.
    Em produção cheque integrações externas (Gmail, GitHub, etc.).
    Em caso de erro, espera progressivamente até _WORKER_MAX_BACKOFF.
    """
    backoff = _WORKER_BASE_DELAY
    consecutive_errors = 0
    while True:
        try:
            logger.debug("Worker: iniciando ciclo de verificação de integrações...")
            # TODO: disparar chamadas de sincronização (Gmail, GitHub, etc.)
            consecutive_errors = 0
            backoff = _WORKER_BASE_DELAY
            await asyncio.sleep(backoff)
        except asyncio.CancelledError:
            logger.info("Worker: encerrado normalmente.")
            raise
        except Exception as exc:
            consecutive_errors += 1
            # backoff exponencial: 60s → 120s → 240s → 300s (teto)
            backoff = min(_WORKER_BASE_DELAY * (2 ** (consecutive_errors - 1)), _WORKER_MAX_BACKOFF)
            logger.error(
                "Worker: erro no ciclo #%d — %s — aguardando %ds antes de tentar novamente",
                consecutive_errors, exc, backoff,
            )
            if _SENTRY_DSN and _SENTRY_AVAILABLE:
                sentry_sdk.capture_exception(exc)
            await asyncio.sleep(backoff)


# ── Lifespan (substitui @app.on_event) ───────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(motor_busca_ativa())
    yield
    task.cancel()


# ── Tabelas criadas via Alembic (não usar create_all em produção) ──
# models.database.Base.metadata.create_all(bind=database.engine)

# ── B4: Rate Limiter por usuário (cookie/IP) ─────────────────

def _rate_limit_key(request: Request) -> str:
    """Usa usuario_id do cookie JWT quando disponível, senão IP."""
    from auth import ACCESS_COOKIE, verificar_token
    token = request.cookies.get(ACCESS_COOKIE)
    if token:
        try:
            payload = verificar_token(token, expected_type="access")
            return f"user:{payload.get('sub', get_remote_address(request))}"
        except Exception:
            pass
    return get_remote_address(request)

limiter = Limiter(key_func=_rate_limit_key, default_limits=["120/minute"])

app = FastAPI(title="API - Simply-Life OS", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Ambiente (produção vs. desenvolvimento) ──────────────────
IS_PRODUCTION = os.environ.get("ENVIRONMENT", "development") == "production"

# ── Security Headers Middleware (API responses) ──────────────
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    if IS_PRODUCTION:
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    return response

# ── CSRF Double-Submit Cookie Middleware ─────────────────────
CSRF_COOKIE = "csrf_token"
CSRF_HEADER = "X-CSRF-Token"
CSRF_SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

@app.middleware("http")
async def csrf_middleware(request: Request, call_next):
    # Garante que o cookie CSRF sempre exista
    csrf_cookie = request.cookies.get(CSRF_COOKIE)

    if request.method not in CSRF_SAFE_METHODS:
        # Rotas de auth (login/registro) e webhook são isentas
        path = request.url.path
        csrf_exempt = path.startswith("/auth/login") or path.startswith("/auth/registro") or path.startswith("/auth/google") or path.startswith("/webhook/")
        if not csrf_exempt and csrf_cookie:
            csrf_header = request.headers.get(CSRF_HEADER, "")
            if not secrets.compare_digest(csrf_cookie, csrf_header):
                return JSONResponse(
                    status_code=403,
                    content={"detail": "CSRF token inválido ou ausente."},
                )

    response: Response = await call_next(request)

    # Se não tem cookie CSRF, gera um novo
    if not csrf_cookie:
        new_csrf = secrets.token_urlsafe(32)
        response.set_cookie(
            key=CSRF_COOKIE,
            value=new_csrf,
            httponly=False,      # JS precisa ler para enviar no header
            secure=IS_PRODUCTION,
            samesite="strict",
            max_age=86400,
            path="/",
        )
    return response

# ── Error Sanitization — não vazar stack traces ──────────────
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Erro não tratado: %s", str(exc))
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor."},
    )

# ── CORS (RNF-1.03) ──────────────────────────────────────────
ORIGINS_PERMITIDAS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS_PERMITIDAS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-CSRF-Token", "X-Confirm-Delete"],
    expose_headers=["X-CSRF-Token"],
)

# ── Routers ───────────────────────────────────────────────────
# Todos os routers são registrados duas vezes:
#   • /v1/... — canônico (clientes novos e futuras versões)
#   • /...    — legado (compatibilidade com clientes existentes)
# Quando a v2 existir, basta adicionar um novo bloco sem remover v1.
_FEATURE_ROUTERS = [
    auth_router.router,
    tarefas_router.router,
    webhooks_router.router,
    labels_router.router,
    anotacoes_router.router,
    templates_router.router,
    relacionamentos_router.router,
    config_router.router,
    financas_router.router,
    saude_router.router,
    dashboard_router.router,
    integracoes_router.router,
    gamificacao_router.router,
    triagem_router.router,
    busca_router.router,
    bem_estar_router.router,
    relatorios_router.router,
    lgpd_router.router,
]

for _r in _FEATURE_ROUTERS:
    app.include_router(_r)                          # legado: /tarefas, /dashboard/resumo …
    app.include_router(_r, prefix="/v1")            # canônico: /v1/tarefas, /v1/dashboard/resumo …

# WebSocket e infra ficam sem prefixo versionado (protocolo especial / ops)
app.include_router(ws_router.router)

# ── Health Check (para load balancers / Docker) ──────────────
@app.get("/health", tags=["Infraestrutura"])
def health_check():
    return {"status": "ok"}


@app.get("/ready", tags=["Infraestrutura"])
def readiness_check(db: Session = Depends(database.get_db)):
    """Verifica que o banco está acessível."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception:
        return JSONResponse(status_code=503, content={"status": "not ready", "database": "disconnected"})
