"""
routers/auth.py — Autenticação: Registro, Login, JWT (ÉPICO 1)
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

import database
import models
from auth import hash_senha, verificar_senha, criar_access_token

from schemas import RegistroPayload, LoginPayload

router = APIRouter(prefix="/auth", tags=["Autenticação"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/registro")
def registrar_usuario(
    dados: RegistroPayload,
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

    token = criar_access_token({"sub": str(novo.id), "email": novo.email})
    return {
        "status": "sucesso",
        "access_token": token,
        "token_type": "bearer",
        "usuario_id": novo.id,
        "nome": novo.nome_completo,
    }


@router.post("/login")
@limiter.limit("5/minute")
def login_usuario(
    request: Request,
    dados: LoginPayload,
    db: Session = Depends(database.get_db),
):
    usuario = db.query(models.Usuario).filter(
        models.Usuario.email == dados.email
    ).first()
    if not usuario or not usuario.senha_hash:
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")
    if not verificar_senha(dados.senha, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")
    if not usuario.ativo:
        raise HTTPException(status_code=403, detail="Conta desativada.")

    usuario.ultimo_login = datetime.now().isoformat()
    db.commit()

    token = criar_access_token({"sub": str(usuario.id), "email": usuario.email})
    return {
        "status": "sucesso",
        "access_token": token,
        "token_type": "bearer",
        "usuario_id": usuario.id,
        "nome": usuario.nome_completo,
        "provedor": usuario.provedor_auth,
    }
