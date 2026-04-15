"""
schemas.py — Pydantic models compartilhados entre routers.
RF-1.04: usuario_id é extraído do JWT (get_current_user), NÃO do body.
B9: Limites de tamanho em todos os campos de texto.
"""
import html
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


# ── Helpers de sanitização (B8) ──────────────────────────────

def _sanitize(value: str | None, max_len: int = 5000) -> str | None:
    """Escapa HTML e trunca para evitar stored XSS e payload abuse."""
    if value is None:
        return None
    return html.escape(value[:max_len].strip())


# ── Auth ──────────────────────────────────────────────────────
class RegistroPayload(BaseModel):
    email: str
    senha: str
    nome_completo: str = ""

    @field_validator("email")
    @classmethod
    def email_valido(cls, v: str) -> str:
        v = v.strip().lower()
        if len(v) > 254 or "@" not in v:
            raise ValueError("E-mail inválido.")
        return v

    @field_validator("senha")
    @classmethod
    def senha_minima(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("A senha deve ter no mínimo 6 caracteres.")
        if len(v) > 128:
            raise ValueError("A senha deve ter no máximo 128 caracteres.")
        return v

    @field_validator("nome_completo")
    @classmethod
    def nome_sanitizado(cls, v: str) -> str:
        return html.escape(v[:100].strip())


class LoginPayload(BaseModel):
    email: str
    senha: str

    @field_validator("email")
    @classmethod
    def email_lower(cls, v: str) -> str:
        return v.strip().lower()


# ── Tarefas / Webhook ────────────────────────────────────────
class WebhookPayload(BaseModel):
    plataforma: str
    titulo: str
    conteudo: str

    @field_validator("titulo")
    @classmethod
    def titulo_sanitizado(cls, v: str) -> str:
        return html.escape(v[:200].strip())

    @field_validator("conteudo")
    @classmethod
    def conteudo_sanitizado(cls, v: str) -> str:
        return html.escape(v[:5000].strip())


class TarefaCreate(BaseModel):
    titulo: str
    descricao: Optional[str] = None
    notas_locais: Optional[str] = None
    status: str = "pendente"
    prioridade: str = "media"
    origem: str = "manual"
    data_vencimento: Optional[datetime] = None

    @field_validator("titulo")
    @classmethod
    def titulo_limit(cls, v: str) -> str:
        return v[:200].strip()

    @field_validator("descricao", "notas_locais")
    @classmethod
    def text_limit(cls, v: str | None) -> str | None:
        return _sanitize(v, 5000)


class TarefaUpdate(BaseModel):
    titulo: Optional[str] = None
    descricao: Optional[str] = None
    status: Optional[str] = None
    prioridade: Optional[str] = None
    notas_locais: Optional[str] = None
    data_vencimento: Optional[datetime] = None

    @field_validator("titulo")
    @classmethod
    def titulo_limit(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return v[:200].strip()

    @field_validator("descricao", "notas_locais")
    @classmethod
    def text_limit(cls, v: str | None) -> str | None:
        return _sanitize(v, 5000)


# ── Labels (Sprint 1) ────────────────────────────────────────
class LabelCreate(BaseModel):
    nome: str
    cor: str = "#8b5cf6"


class LabelResponse(BaseModel):
    id: int
    nome: str
    cor: str

    model_config = ConfigDict(from_attributes=True)


# ── Subtarefas (Sprint 1) ────────────────────────────────────
class SubtarefaCreate(BaseModel):
    titulo: str
    ordem: int = 0


class SubtarefaUpdate(BaseModel):
    titulo: Optional[str] = None
    concluida: Optional[bool] = None
    ordem: Optional[int] = None


class SubtarefaResponse(BaseModel):
    id: int
    titulo: str
    concluida: bool
    ordem: int

    model_config = ConfigDict(from_attributes=True)


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
    subtarefas: list[SubtarefaResponse] = []
    labels: list[LabelResponse] = []

    model_config = ConfigDict(from_attributes=True)


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


# ── Gamificação / Sessão de Foco ─────────────────────────
class FinalizarSessaoRequest(BaseModel):
    minutos: int
    tarefa_id: Optional[int] = None


class SessaoFocoResponse(BaseModel):
    id: int
    user_id: int
    tarefa_id: Optional[int] = None
    duracao_minutos: int
    xp_ganho: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class GamificacaoProfileResponse(BaseModel):
    xp_total: int
    streak_atual: int
    nivel: int
    ultima_sessao_data: Optional[datetime] = None
    xp_ganho: int = 0
    streak_bonus: bool = False


# ── Streaks de Hábitos (Sprint 1) ────────────────────────────
class HabitoStreakResponse(BaseModel):
    habito_id: int
    nome_exibicao: str
    streak_dias: int
    ultima_data: Optional[str] = None


# ── Motor de Triagem / Palavras-Chave ────────────────────────
class PalavraChaveCreate(BaseModel):
    termo: str
    peso: int = 1


class PalavraChaveResponse(BaseModel):
    id: int
    user_id: int
    termo: str
    peso: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProcessarMensagemRequest(BaseModel):
    conteudo: str
    origem: str = "manual"
    remetente: str = ""


class ProcessarMensagemResponse(BaseModel):
    status: str                        # "match" | "ignorado"
    termo_detectado: Optional[str] = None
    tarefa: Optional[TarefaResponse] = None


# ── Busca Global (Sprint 2) ──────────────────────────────────
class BuscaTarefaItem(BaseModel):
    id: int
    titulo: str
    status: str
    prioridade: str
    origem: str

    model_config = ConfigDict(from_attributes=True)


class BuscaAnotacaoItem(BaseModel):
    id: int
    titulo: Optional[str] = None
    preview: str

    model_config = ConfigDict(from_attributes=True)


class BuscaResponse(BaseModel):
    tarefas: list[BuscaTarefaItem] = []
    anotacoes: list[BuscaAnotacaoItem] = []
    total: int = 0


# ── Bem-Estar Mental (Sprint 4) ──────────────────────────────
class HumorCreate(BaseModel):
    humor: int                  # 1 a 5
    emoji: str = ""
    nota: str = ""


class HumorResponse(BaseModel):
    id: int
    data: str
    humor: int
    emoji: str | None = None
    nota: str | None = None

    model_config = ConfigDict(from_attributes=True)


class EntradaDiarioCreate(BaseModel):
    conteudo: str
    prompt_usado: str = ""


class EntradaDiarioResponse(BaseModel):
    id: int
    data: str
    conteudo: str
    prompt_usado: str | None = None

    model_config = ConfigDict(from_attributes=True)


class WeeklyReviewResponse(BaseModel):
    semana: str
    humor_medio: float
    registros_humor: int
    tarefas_concluidas: int
    tarefas_criadas: int
    habitos_pct: float
    despesas_total: float
    foco_minutos: int
    insight_ia: str


class CorrelacaoResponse(BaseModel):
    insights: list[str]
    dados: list[dict]


# ── Sprint C: Templates de Tarefa (C7) ───────────────────────
class TemplateCreate(BaseModel):
    nome: str
    prioridade: str = "media"
    subtarefas: list[str] = []   # lista de títulos

class TemplateResponse(BaseModel):
    id: int
    nome: str
    prioridade: str
    subtarefas: list[str] = []
    created_at: Optional[datetime] = None

