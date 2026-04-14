"""
schemas.py — Pydantic models compartilhados entre routers.
RF-1.04: usuario_id é extraído do JWT (get_current_user), NÃO do body.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# ── Auth ──────────────────────────────────────────────────────
class RegistroPayload(BaseModel):
    email: str
    senha: str
    nome_completo: str = ""


class LoginPayload(BaseModel):
    email: str
    senha: str


# ── Tarefas / Webhook ────────────────────────────────────────
class WebhookPayload(BaseModel):
    plataforma: str
    titulo: str
    conteudo: str


class TarefaCreate(BaseModel):
    titulo: str
    descricao: Optional[str] = None
    notas_locais: Optional[str] = None
    status: str = "pendente"
    prioridade: str = "media"
    origem: str = "manual"
    data_vencimento: Optional[datetime] = None


class TarefaUpdate(BaseModel):
    titulo: Optional[str] = None
    descricao: Optional[str] = None
    status: Optional[str] = None
    prioridade: Optional[str] = None
    notas_locais: Optional[str] = None
    data_vencimento: Optional[datetime] = None


class TarefaResponse(BaseModel):
    id: int
    titulo: str
    descricao: Optional[str] = None
    status: str
    prioridade: str
    origem: str
    score_urgencia: int
    notas_locais: Optional[str] = None
    data_vencimento: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Integrações ──────────────────────────────────────────────
class TokenPayload(BaseModel):
    plataforma: str
    token_secreto: str


# ── Preferências ─────────────────────────────────────────────
class PreferenciasUpdate(BaseModel):
    palavras_chave_email: Optional[str] = None
    modulos_fixados: Optional[str] = None


# ── Anotações ────────────────────────────────────────────────
class AnotacaoCreate(BaseModel):
    titulo: Optional[str] = None
    conteudo: str
    categoria: str = "pessoal"


# ── Finanças ─────────────────────────────────────────────────
class DespesaCreate(BaseModel):
    descricao: str
    categoria: str
    valor: float
    data_gasto: str = ""
    status_pagamento: str = "pendente"


# ── Saúde ────────────────────────────────────────────────────
class MedicamentoCreate(BaseModel):
    nome: str
    horario: str


class HabitoCreate(BaseModel):
    tipo: str
    nome_exibicao: str
    meta_diaria: int = 8
    unidade: str = "un"


# ── Notificações ─────────────────────────────────────────────
class NotificacaoCreate(BaseModel):
    titulo: str
    mensagem: str = ""
    tipo: str = "sistema"
    urgencia: str = "normal"
    score_urgencia: int = 0
