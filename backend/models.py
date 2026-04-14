from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, DateTime, Date, UniqueConstraint
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
    tarefas = relationship("TarefaUnificada", back_populates="dono")
    sessoes_foco = relationship("SessaoFoco", back_populates="usuario")

# 2. tarefas Unificadas
class TarefaUnificada(database.Base):
    __tablename__ = "tarefas_unificadas"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    titulo = Column(String)
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
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    plataforma = Column(String)
    token_criptografado = Column(String)
    status = Column(String, default="ativa")
    hash_seguranca = Column(String, nullable=True)
    dono = relationship("Usuario")

# 4.anotações 
class Anotacao(database.Base):
    __tablename__ = "anotacoes"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
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
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
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
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
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