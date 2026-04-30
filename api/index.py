import sys
import os
from pathlib import Path

# Adiciona o diretório 'backend' ao sys.path para conseguir importar tudo do backend
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI
from main import app as backend_app

# Cria o app raiz que a Vercel vai executar
app = FastAPI(title="Simply-Life OS Vercel Entrypoint")

# Monta o app original na rota /api para que as requisições (que chegam como /api/...) batam com as rotas
app.mount("/api", backend_app)
