import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI

# Carrega .env do diretório backend/ (onde estão as credenciais reais)
_backend_dir = Path(__file__).resolve().parent
load_dotenv(_backend_dir / ".env", override=True)
# Fallback: tenta também a raiz do projeto (sem sobrescrever chaves já carregadas)
load_dotenv(_backend_dir.parent / ".env")

from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

import database
import models

from routers import auth as auth_router
from routers import tarefas as tarefas_router
from routers import configuracoes as config_router
from routers import financas as financas_router
from routers import saude as saude_router
from routers import dashboard as dashboard_router
from routers import integracoes as integracoes_router
from routers import gamificacao as gamificacao_router
from routers import triagem as triagem_router
from routers import busca as busca_router
from routers import bem_estar as bem_estar_router

# ── Worker de background (polling) ────────────────────────────
async def motor_busca_ativa():
    while True:
        print("🕵️‍♂️ [Worker] Checando novas demandas de serviços externos...")
        await asyncio.sleep(60)


# ── Lifespan (substitui @app.on_event) ───────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(motor_busca_ativa())
    yield
    task.cancel()


# ── Tabelas criadas via Alembic (não usar create_all em produção) ──
# models.database.Base.metadata.create_all(bind=database.engine)

# ── Rate Limiter (RNF-1.02) ──────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

app = FastAPI(title="API - Simply-Life OS", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────
app.include_router(auth_router.router)
app.include_router(tarefas_router.router)
app.include_router(config_router.router)
app.include_router(financas_router.router)
app.include_router(saude_router.router)
app.include_router(dashboard_router.router)
app.include_router(integracoes_router.router)
app.include_router(gamificacao_router.router)
app.include_router(triagem_router.router)
app.include_router(busca_router.router)
app.include_router(bem_estar_router.router)
