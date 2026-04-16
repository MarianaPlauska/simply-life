from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, DateTime, Date, UniqueConstraint, Index, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import database

# 1. usuários
class Usuario(database.Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    nome_completo = Column(String, nullable=True)
    senha_hash = Column(String, nullable=True)
    provedor_auth = Column(String, default="local")
    ativo = Column(Integer, default=1)
    criado_em = Column(String, nullable=True)
    ultimo_login = Column(String, nullable=True)
    xp = Column(Integer, default=0)
    streak_days = Column(Integer, default=0)
    ultima_sessao_foco = Column(String, nullable=True)
    # Novos campos de gamificação (Fase 2)
    xp_total = Column(Integer, default=0)
    streak_atual = Column(Integer, default=0)
    ultima_sessao_data = Column(DateTime, nullable=True)
    # Sprint Security: rastreamento de inatividade de sessão
    last_active_at = Column(DateTime, nullable=True)
    tarefas = relationship("TarefaUnificada", back_populates="dono")
    sessoes_foco = relationship("SessaoFoco", back_populates="usuario")

# ── Sprint B: Token Blacklist (B3) ───────────────────────────
class TokenBlacklist(database.Base):
    __tablename__ = "token_blacklist"
    id = Column(Integer, primary_key=True, index=True)
    jti = Column(String, unique=True, nullable=False, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    expira_em = Column(DateTime, nullable=False)
    criado_em = Column(DateTime, default=lambda: datetime.now(timezone.utc))

# 2. tarefas Unificadas
class TarefaUnificada(database.Base):
    __tablename__ = "tarefas_unificadas"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), index=True)  # B10: idx
    titulo = Column(String(200))                        # B9: limite 200
    descricao = Column(Text, nullable=True)
    snippet_100_char = Column(String(100))
    score_urgencia = Column(Integer, default=0)
    status = Column(String, default="pendente")        # pendente, em_progresso, concluida
    prioridade = Column(String, default="media")        # baixa, media, alta, critica
    origem = Column(String, default="manual")           # manual, gmail_triage, webhook
    data_vencimento = Column(DateTime, nullable=True)
    notas_locais = Column(Text, nullable=True)
    hash_seguranca = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    # E2: optimistic locking — versão incrementada a cada update
    versao = Column(Integer, default=1, nullable=False, server_default="1")
    # B11: soft delete
    deletado_em = Column(DateTime, nullable=True, default=None)
    palavra_chave_id = Column(Integer, ForeignKey("palavras_chave.id"), nullable=True)
    dono = relationship("Usuario", back_populates="tarefas")
    palavra_chave = relationship("PalavraChave", foreign_keys=[palavra_chave_id])
    # Sprint 1: subtarefas e labels
    subtarefas = relationship("Subtarefa", back_populates="tarefa", cascade="all, delete-orphan", order_by="Subtarefa.ordem")
    labels = relationship("Label", secondary="tarefa_labels", lazy="joined")

# 3. integrações 
class Integracao(database.Base):
    __tablename__ = "integracoes"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), index=True)
    plataforma = Column(String)
    token_criptografado = Column(String)
    status = Column(String, default="ativa")
    hash_seguranca = Column(String, nullable=True)
    dono = relationship("Usuario")

# 4.anotações 
class Anotacao(database.Base):
    __tablename__ = "anotacoes"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), index=True)
    titulo = Column(String, nullable=True)
    conteudo = Column(Text)
    fixado = Column(Integer, default=0)
    categoria = Column(String, default="pessoal")
    dono = relationship("Usuario")

# 5. Keywords do Usuário
class PreferenciasUsuario(database.Base):
    __tablename__ = "preferencias_usuario"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True)
    palavras_chave_email = Column(String, default="")
    modulos_fixados = Column(String, default="dashboard,kanban") 

# 6. finanças
class Despesa(database.Base):
    __tablename__ = "despesas"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), index=True)
    descricao = Column(String)
    categoria = Column(String)
    valor = Column(Integer) 
    data_gasto = Column(String)
    status_pagamento = Column(String, default="pendente")
    hash_seguranca = Column(String, nullable=True)

# 7. saúde e Hábitos
class Medicamento(database.Base):
    __tablename__ = "medicamentos"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    nome = Column(String)
    horario = Column(String)
    tomado_hoje = Column(Integer, default=0)

# 8. motificações do Sistema
class Notificacao(database.Base):
    __tablename__ = "notificacoes"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), index=True)
    tipo = Column(String, default="sistema")  # saude, sistema, tarefa, financeiro
    titulo = Column(String)
    mensagem = Column(Text, nullable=True)
    lida = Column(Integer, default=0)
    urgencia = Column(String, default="normal")  # normal, alta, critica
    score_urgencia = Column(Integer, default=0)
    criado_em = Column(String, nullable=True)

# 9. hábitos Dinâmicos e Bem-Estar
class HabitoDiario(database.Base):
    __tablename__ = "habitos_diarios"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    
    tipo = Column(String) # Ex: "agua", "sono", "leitura", "customizado"
    nome_exibicao = Column(String) # Ex: "Copos de Água", "Horas de Sono"
    meta_diaria = Column(Integer) # Ex: 8 (copos), 8 (horas)
    progresso_atual = Column(Integer, default=0)
    unidade = Column(String) # Ex: "ml", "horas", "páginas"
    # Sprint 1: relação com histórico
    historico = relationship("HistoricoHabito", back_populates="habito", cascade="all, delete-orphan")

# 10. palavras-chave para triagem (Motor de IA)
class PalavraChave(database.Base):
    __tablename__ = "palavras_chave"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    termo = Column(String(120), nullable=False)
    peso = Column(Integer, default=1)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    usuario = relationship("Usuario")

# 11. sessões de foco (gamificação)
class SessaoFoco(database.Base):
    __tablename__ = "sessoes_foco"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    tarefa_id = Column(Integer, ForeignKey("tarefas_unificadas.id"), nullable=True)
    duracao_minutos = Column(Integer, nullable=False)
    xp_ganho = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    usuario = relationship("Usuario", back_populates="sessoes_foco")
    tarefa = relationship("TarefaUnificada")

# ── Sprint 1: Novos models ──────────────────────────────────────

# 12. Labels (tags para tarefas)
class Label(database.Base):
    __tablename__ = "labels"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    nome = Column(String(50), nullable=False)
    cor = Column(String(7), default="#8b5cf6")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    dono = relationship("Usuario")

# 13. Associação tarefa <-> label (N:N)
class TarefaLabel(database.Base):
    __tablename__ = "tarefa_labels"
    __table_args__ = (
        UniqueConstraint('tarefa_id', 'label_id', name='uq_tarefa_label'),
    )
    id = Column(Integer, primary_key=True, index=True)
    tarefa_id = Column(Integer, ForeignKey("tarefas_unificadas.id", ondelete="CASCADE"), nullable=False)
    label_id = Column(Integer, ForeignKey("labels.id", ondelete="CASCADE"), nullable=False)

# 14. Subtarefas
class Subtarefa(database.Base):
    __tablename__ = "subtarefas"
    id = Column(Integer, primary_key=True, index=True)
    tarefa_id = Column(Integer, ForeignKey("tarefas_unificadas.id", ondelete="CASCADE"), nullable=False)
    titulo = Column(String(200), nullable=False)
    concluida = Column(Integer, default=0)
    ordem = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    tarefa = relationship("TarefaUnificada", back_populates="subtarefas")

# 15. Histórico de hábitos (para streaks reais)
class HistoricoHabito(database.Base):
    __tablename__ = "historico_habitos"
    __table_args__ = (
        UniqueConstraint('habito_id', 'data', name='uq_habito_data'),
    )
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    habito_id = Column(Integer, ForeignKey("habitos_diarios.id", ondelete="CASCADE"), nullable=False)
    data = Column(Date, nullable=False)
    concluido = Column(Integer, default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    habito = relationship("HabitoDiario", back_populates="historico")

# ── Sprint 4: Bem-Estar Mental ───────────────────────────────

# 16. Mood Tracker (humor diário)
class DiarioHumor(database.Base):
    __tablename__ = "diario_humor"
    __table_args__ = (
        UniqueConstraint('usuario_id', 'data', name='uq_humor_dia'),
    )
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    data = Column(Date, nullable=False)
    humor = Column(Integer, nullable=False)        # 1-5
    emoji = Column(String(10), nullable=True)
    nota = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    usuario = relationship("Usuario")

# 17. Journaling (diário livre)
class EntradaDiario(database.Base):
    __tablename__ = "entradas_diario"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    data = Column(Date, nullable=False)
    conteudo = Column(Text, nullable=False)
    prompt_usado = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    usuario = relationship("Usuario")

# ── Sprint C: Templates de Tarefa (C7) ──────────────────────

# 18. templates reutilizáveis
class TarefaTemplate(database.Base):
    __tablename__ = "tarefa_templates"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    nome = Column(String(200), nullable=False)
    prioridade = Column(String, default="media")
    subtarefas_json = Column(Text, nullable=True)   # JSON array de strings: ["item1", "item2"]
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    dono = relationship("Usuario")

# ── Sprint D: Integração Profunda ────────────────────────────

# 19. recorrência de tarefa (D3)
class TarefaRecorrencia(database.Base):
    __tablename__ = "tarefa_recorrencias"
    id = Column(Integer, primary_key=True, index=True)
    tarefa_id = Column(Integer, ForeignKey("tarefas_unificadas.id", ondelete="CASCADE"), nullable=False, unique=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    frequencia = Column(String, nullable=False)  # 'diaria', 'semanal', 'mensal'
    ativa = Column(Boolean, default=True)
    proximo_em = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    tarefa = relationship("TarefaUnificada")

# 20. dependência entre tarefas (D4)
class TarefaDependencia(database.Base):
    __tablename__ = "tarefa_dependencias"
    __table_args__ = (
        UniqueConstraint('tarefa_id', 'depende_de_id', name='uq_tarefa_dependencia'),
    )
    id = Column(Integer, primary_key=True, index=True)
    tarefa_id = Column(Integer, ForeignKey("tarefas_unificadas.id", ondelete="CASCADE"), nullable=False)
    depende_de_id = Column(Integer, ForeignKey("tarefas_unificadas.id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    tarefa = relationship("TarefaUnificada", foreign_keys=[tarefa_id])
    bloqueio = relationship("TarefaUnificada", foreign_keys=[depende_de_id])

# 21. feed de atividade por tarefa (D5)
class AtividadeTarefa(database.Base):
    __tablename__ = "atividades_tarefa"
    id = Column(Integer, primary_key=True, index=True)
    tarefa_id = Column(Integer, ForeignKey("tarefas_unificadas.id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    tipo = Column(String, nullable=False)  # 'criou', 'editou', 'moveu', 'concluiu'
    detalhe = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    tarefa = relationship("TarefaUnificada")


# ── Sprint Security: Audit Log ───────────────────────────────

# 22. Log de auditoria (LGPD compliance)
class AuditLog(database.Base):
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    acao = Column(String(100), nullable=False)          # login, logout, login_falhou, dados_exportados, conta_excluida, etc.
    recurso = Column(String(100), nullable=True)        # tabela ou entidade afetada
    recurso_id = Column(Integer, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    detalhes = Column(Text, nullable=True)              # JSON com metadata extra
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("idx_audit_usuario_acao", "usuario_id", "acao"),
        Index("idx_audit_created", "created_at"),
    )


# ── Sprint Security: Webhook Secret ─────────────────────────

# 23. Chaves HMAC por usuário para webhooks M2M
class WebhookSecret(database.Base):
    __tablename__ = "webhook_secrets"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, unique=True)
    secret_hash = Column(String, nullable=False)        # bcrypt do secret
    ativo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    dono = relationship("Usuario")