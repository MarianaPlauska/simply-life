"""
routers/configuracoes.py — Preferências, Integrações (Cofre de Tokens)
RF-1.04: Todas as queries filtram por usuario_id = current_user.id
"""
import os

from cryptography.fernet import Fernet
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import database
import models
from auth import get_current_user
from schemas import PreferenciasUpdate, TokenPayload

router = APIRouter(tags=["Configurações"])

# ── Criptografia AES-256 (Cofre de Tokens) ───────────────────
CHAVE_MESTRE_AES = os.environ.get("FERNET_KEY", "")
if not CHAVE_MESTRE_AES:
    raise RuntimeError(
        "FERNET_KEY não definido. Adicione FERNET_KEY ao arquivo .env "
        "(ex: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\")."
    )
cofre = Fernet(CHAVE_MESTRE_AES.encode() if isinstance(CHAVE_MESTRE_AES, str) else CHAVE_MESTRE_AES)


# ── Preferências ──────────────────────────────────────────────

@router.get("/preferencias")
def buscar_preferencias(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    prefs = (
        db.query(models.PreferenciasUsuario)
        .filter(models.PreferenciasUsuario.usuario_id == current_user.id)
        .first()
    )
    if not prefs:
        return {"palavras_chave_email": "", "modulos_fixados": "dashboard,kanban"}
    return {
        "palavras_chave_email": prefs.palavras_chave_email or "",
        "modulos_fixados": prefs.modulos_fixados or "",
    }


@router.patch("/preferencias")
def atualizar_preferencias(
    dados: PreferenciasUpdate,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    prefs = (
        db.query(models.PreferenciasUsuario)
        .filter(models.PreferenciasUsuario.usuario_id == current_user.id)
        .first()
    )
    if not prefs:
        prefs = models.PreferenciasUsuario(usuario_id=current_user.id)
        db.add(prefs)

    if dados.palavras_chave_email is not None:
        prefs.palavras_chave_email = dados.palavras_chave_email
    if dados.modulos_fixados is not None:
        prefs.modulos_fixados = dados.modulos_fixados

    db.commit()
    return {"status": "sucesso", "preferencias": {
        "palavras_chave_email": prefs.palavras_chave_email or "",
        "modulos_fixados": prefs.modulos_fixados or "",
    }}


# ── Integrações (Cofre de Tokens) ────────────────────────────

@router.post("/integracoes/conectar")
def conectar_plataforma(
    dados: TokenPayload,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    token_blindado = cofre.encrypt(dados.token_secreto.encode()).decode()
    nova_integracao = models.Integracao(
        usuario_id=current_user.id,
        plataforma=dados.plataforma,
        token_criptografado=token_blindado,
    )
    db.add(nova_integracao)
    db.commit()
    return {"status": "sucesso", "mensagem": f"Conta de {dados.plataforma} conectada com segurança."}
