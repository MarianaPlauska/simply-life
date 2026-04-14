"""
auth.py — Módulo de Identidade e Segurança (ÉPICO 1)
=====================================================
RF-1.01  Registro e Login com bcrypt + JWT
RF-1.02  Sessões via JWT (24 h, HS256)
RNF-1.01 Criptografia: bcrypt cost ≥ 12, Fernet AES-256
RNF-1.02 Rate-limiting já aplicado no main.py (slowapi)
RNF-1.03 CORS restrito a whitelist no main.py
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

import database
import models

# ── Configuração ──────────────────────────────────────────────

SECRET_KEY: str = os.environ.get("JWT_SECRET", "")
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET não definido. Adicione JWT_SECRET ao arquivo .env "
        "(ex: python -c \"import secrets; print(secrets.token_urlsafe(48))\")."
    )
ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 h (RF-1.02)

# bcrypt com cost factor 12 (RNF-1.01)
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

# ── Hashing de senha ─────────────────────────────────────────

def hash_senha(senha_texto: str) -> str:
    """Gera hash bcrypt (cost 12) de uma senha em texto puro."""
    return pwd_context.hash(senha_texto)


def verificar_senha(senha_texto: str, senha_hash: str) -> bool:
    """Verifica se a senha em texto bate com o hash armazenado."""
    return pwd_context.verify(senha_texto, senha_hash)


# ── JWT ───────────────────────────────────────────────────────

def criar_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Cria um JWT assinado com HS256 e expiração padrão de 24 h."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verificar_token(token: str) -> dict:
    """Decodifica e valida um JWT. Levanta HTTPException 401 se inválido."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── Dependência FastAPI: usuário autenticado ─────────────────

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db),
) -> models.Usuario:
    """
    Dependency — extrai o usuário a partir do Bearer token.
    Retorna None-safe: levanta 401 quando não autenticado.
    """
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticação necessária.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verificar_token(token)
    user_id: int | None = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sem identificação de usuário.",
        )

    usuario = db.query(models.Usuario).filter(models.Usuario.id == int(user_id)).first()
    if usuario is None or not usuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado ou desativado.",
        )
    return usuario
