"""
routers/auth.py — Autenticação: Registro, Login, Refresh, Logout (Sprint B)
B1: httpOnly cookies
B2: Refresh token (7d) + access token (15min)
B3: Logout com blacklist de JTI
"""
import uuid
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

import database
import models
from auth import (
    hash_senha, verificar_senha,
    criar_access_token, criar_refresh_token, verificar_token,
    set_auth_cookies, clear_auth_cookies,
    get_current_user, registrar_auditoria,
    ACCESS_COOKIE, REFRESH_COOKIE,
    REFRESH_TOKEN_EXPIRE_DAYS,
)

from schemas import RegistroPayload, LoginPayload

logger = logging.getLogger("simply-life")
router = APIRouter(prefix="/auth", tags=["Autenticação"])
limiter = Limiter(key_func=get_remote_address)


def _issue_tokens(user_id: int, email: str) -> tuple[str, str]:
    """Gera par access + refresh com JTI para revogação."""
    jti = str(uuid.uuid4())
    access = criar_access_token({"sub": str(user_id), "email": email, "jti": jti})
    refresh = criar_refresh_token({"sub": str(user_id), "email": email, "jti": jti})
    return access, refresh


@router.post("/registro")
def registrar_usuario(
    request: Request,
    dados: RegistroPayload,
    response: Response,
    db: Session = Depends(database.get_db),
):
    existente = db.query(models.Usuario).filter(
        models.Usuario.email == dados.email
    ).first()
    if existente:
        raise HTTPException(status_code=409, detail="E-mail já cadastrado.")

    novo = models.Usuario(
        email=dados.email,
        nome_completo=dados.nome_completo or dados.email.split("@")[0],
        senha_hash=hash_senha(dados.senha),
        provedor_auth="local",
        criado_em=datetime.now().isoformat(),
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)

    access, refresh = _issue_tokens(novo.id, novo.email)

    # B1: seta cookies httpOnly
    set_auth_cookies(response, access, refresh)

    logger.info("novo usuario registrado: id=%s email=%s", novo.id, novo.email)
    registrar_auditoria(db, "registro", request, usuario_id=novo.id)

    return {
        "status": "sucesso",
        "access_token": access,
        "token_type": "bearer",
        "usuario_id": novo.id,
        "nome": novo.nome_completo,
    }


@router.post("/login")
@limiter.limit("5/minute")
def login_usuario(
    request: Request,
    response: Response,
    dados: LoginPayload,
    db: Session = Depends(database.get_db),
):
    usuario = db.query(models.Usuario).filter(
        models.Usuario.email == dados.email
    ).first()
    if not usuario or not usuario.senha_hash:
        registrar_auditoria(db, "login_falhou", request, detalhes={"email": dados.email, "motivo": "usuario_nao_encontrado"})
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")
    if not verificar_senha(dados.senha, usuario.senha_hash):
        registrar_auditoria(db, "login_falhou", request, usuario_id=usuario.id, detalhes={"motivo": "senha_invalida"})
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")
    if not usuario.ativo:
        registrar_auditoria(db, "login_falhou", request, usuario_id=usuario.id, detalhes={"motivo": "conta_desativada"})
        raise HTTPException(status_code=403, detail="Conta desativada.")

    usuario.ultimo_login = datetime.now().isoformat()
    db.commit()

    access, refresh = _issue_tokens(usuario.id, usuario.email)
    set_auth_cookies(response, access, refresh)

    logger.info("login: id=%s", usuario.id)
    registrar_auditoria(db, "login", request, usuario_id=usuario.id)

    return {
        "status": "sucesso",
        "access_token": access,
        "token_type": "bearer",
        "usuario_id": usuario.id,
        "nome": usuario.nome_completo,
        "provedor": usuario.provedor_auth,
    }


@router.post("/refresh")
def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(database.get_db),
):
    """B2: gera novo par de tokens a partir do refresh cookie."""
    token = request.cookies.get(REFRESH_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="Refresh token ausente.")

    payload = verificar_token(token, expected_type="refresh")

    # verifica blacklist
    old_jti = payload.get("jti")
    if old_jti:
        existing = db.query(models.TokenBlacklist).filter(
            models.TokenBlacklist.jti == old_jti
        ).first()
        if existing:
            raise HTTPException(status_code=401, detail="Token revogado.")

        # blacklist o refresh anterior (rotação)
        from datetime import timedelta
        db.add(models.TokenBlacklist(
            jti=old_jti,
            usuario_id=int(payload["sub"]),
            expira_em=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        ))
        db.commit()

    access, refresh = _issue_tokens(int(payload["sub"]), payload.get("email", ""))
    set_auth_cookies(response, access, refresh)

    return {"status": "renovado"}


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(database.get_db),
):
    """B3: revoga tokens e limpa cookies."""
    # blacklist access token se existir
    access_token = request.cookies.get(ACCESS_COOKIE)
    if access_token:
        try:
            payload = verificar_token(access_token, expected_type="access")
            jti = payload.get("jti")
            if jti:
                from datetime import timedelta
                exists = db.query(models.TokenBlacklist).filter(
                    models.TokenBlacklist.jti == jti
                ).first()
                if not exists:
                    db.add(models.TokenBlacklist(
                        jti=jti,
                        usuario_id=int(payload["sub"]),
                        expira_em=datetime.now(timezone.utc) + timedelta(minutes=30),
                    ))
        except HTTPException:
            pass  # token inválido — ignora

    # blacklist refresh token se existir
    refresh_tok = request.cookies.get(REFRESH_COOKIE)
    if refresh_tok:
        try:
            payload = verificar_token(refresh_tok, expected_type="refresh")
            jti = payload.get("jti")
            if jti:
                from datetime import timedelta
                exists = db.query(models.TokenBlacklist).filter(
                    models.TokenBlacklist.jti == jti
                ).first()
                if not exists:
                    db.add(models.TokenBlacklist(
                        jti=jti,
                        usuario_id=int(payload["sub"]),
                        expira_em=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
                    ))
        except HTTPException:
            pass

    db.commit()
    clear_auth_cookies(response)

    logger.info("logout realizado")
    registrar_auditoria(db, "logout", request)
    return {"status": "desconectado"}


@router.get("/me")
def get_me(
    current_user: models.Usuario = Depends(get_current_user),
):
    """Retorna dados do usuário autenticado (valida cookie)."""
    return {
        "usuario_id": current_user.id,
        "email": current_user.email,
        "nome": current_user.nome_completo,
        "provedor": current_user.provedor_auth,
    }
