"""
auth.py — Módulo de Identidade e Segurança (ÉPICO 1 / Sprint B)
=====================================================
RF-1.01  Registro e Login com bcrypt + JWT
RF-1.02  Sessões via JWT (access 15 min + refresh 7 dias, HS256)
RNF-1.01 Criptografia: bcrypt cost ≥ 12, Fernet AES-256
RNF-1.02 Rate-limiting já aplicado no main.py (slowapi)
RNF-1.03 CORS restrito a whitelist no main.py
B1       httpOnly cookies em vez de Bearer + localStorage
B2       Refresh token (7 dias) + access token (15 min)
B3       Logout com blacklist de token (tabela token_blacklist)
"""

import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

import database
import models

logger = logging.getLogger("simply-life")

# ── Configuração ──────────────────────────────────────────────

SECRET_KEY: str = os.environ.get("JWT_SECRET", "")
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET não definido. Adicione JWT_SECRET ao arquivo .env "
        "(ex: python -c \"import secrets; print(secrets.token_urlsafe(48))\")."
    )
ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = 15            # B2: access curto (15 min)
REFRESH_TOKEN_EXPIRE_DAYS: int = 7               # B2: refresh longo (7 dias)

# nomes dos cookies
ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"

# bcrypt com cost factor 12 (RNF-1.01)
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
)

# mantido para retrocompatibilidade (swagger ui, testes)
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
    """Cria access token JWT (padrão 15 min)."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def criar_refresh_token(data: dict) -> str:
    """Cria refresh token JWT (7 dias)."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verificar_token(token: str, expected_type: str = "access") -> dict:
    """Decodifica e valida um JWT. Levanta HTTPException 401 se inválido."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        token_type = payload.get("type", "access")
        if token_type != expected_type:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Tipo de token inválido (esperado {expected_type}).",
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def _is_blacklisted(jti: str, db: Session) -> bool:
    """Verifica se o token (jti) está na blacklist."""
    return db.query(models.TokenBlacklist).filter(
        models.TokenBlacklist.jti == jti
    ).first() is not None


# ── Helpers de Cookie ─────────────────────────────────────────

def set_auth_cookies(response: Response, access: str, refresh: str) -> None:
    """Define cookies httpOnly com tokens de acesso e refresh."""
    response.set_cookie(
        key=ACCESS_COOKIE,
        value=access,
        httponly=True,
        secure=False,          # True em produção (HTTPS)
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/auth",          # refresh só precisa acesso ao /auth
    )


def clear_auth_cookies(response: Response) -> None:
    """Remove cookies de autenticação."""
    response.delete_cookie(ACCESS_COOKIE, path="/")
    response.delete_cookie(REFRESH_COOKIE, path="/auth")


# ── Dependência FastAPI: usuário autenticado ─────────────────

def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db),
) -> models.Usuario:
    """
    Dependency — extrai o usuário a partir do cookie httpOnly ou Bearer header.
    Prioridade: cookie > header (B1).
    """
    # 1) tenta cookie primeiro
    cookie_token = request.cookies.get(ACCESS_COOKIE)
    effective_token = cookie_token or token

    if effective_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticação necessária.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verificar_token(effective_token, expected_type="access")

    # B3: verifica blacklist
    jti = payload.get("jti")
    if jti and _is_blacklisted(jti, db):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token revogado.",
        )

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
