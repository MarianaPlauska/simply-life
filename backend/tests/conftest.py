"""
conftest.py — Fixtures compartilhadas para testes do backend.
Usa um banco SQLite em memória isolado para cada teste.
"""
import os
import sys

# Garante que JWT_SECRET, FERNET_KEY e DATABASE_URL existam para testes
os.environ.setdefault("JWT_SECRET", "test-secret-key-for-pytest-only-do-not-use")
os.environ.setdefault("FERNET_KEY", "tBCpoHjUPHuKfAMwYmKJxbi8bC96D4JFJatJNI3crkE=")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_orquestrador.db")

# Adiciona backend/ ao path para imports funcionarem
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import database
import models
from main import app
from auth import criar_access_token

# Desabilita rate limiting em testes
app.state.limiter.enabled = False


# Banco em memória para testes (SQLite — não requer Postgres)
TEST_DATABASE_URL = "sqlite:///./test_orquestrador.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_database():
    """Cria tabelas antes de cada teste e limpa depois."""
    models.database.Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[database.get_db] = override_get_db
    yield
    models.database.Base.metadata.drop_all(bind=test_engine)
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    """TestClient do FastAPI."""
    return TestClient(app)


@pytest.fixture
def auth_headers(client):
    """Registra um usuário e retorna headers com Bearer token."""
    # Registra via API (sem rate limit)
    client.post("/auth/registro", json={
        "email": "test@simply.life",
        "senha": "Senha123!",
        "nome_completo": "Testador",
    })
    # Cria token diretamente (evita rate limiting do login)
    db = TestSession()
    user = db.query(models.Usuario).filter(models.Usuario.email == "test@simply.life").first()
    db.close()
    token = criar_access_token({"sub": str(user.id), "email": user.email})
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
