// tipos internos do store — tudo que não vai em types/index.ts
export type ActiveView =
  | 'dashboard'
  | 'kanban'
  | 'anotacoes'
  | 'foco'
  | 'configuracoes'
  | 'superhuman'
  | 'financeiro'
  | 'saude'
  | 'carreira'
  | 'inteligencia'
  | 'preferencias'
  | 'calendario'
  | 'drive'
  | 'planner'
  | 'perfil'
  | 'relatorios'
  | 'login';

export interface Anotacao {
  id: number;
  user_id: string;
  titulo: string | null;
  conteudo: string;
  fixado: number;
  categoria: string;
}

export interface TimerConfig {
  pomodoroTime: number;
  shortBreak: number;
  longBreak: number;
}

export interface Category {
  id: number;
  nome: string;
  cor: string;
  icone: string;
  tipo: 'receita' | 'despesa';
}

export interface Despesa {
  id: number;
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
}

export interface Medicamento {
  id: number;
  nome: string;
  horario: string;
  tomado: boolean;
}

export interface UserProfile {
  nome: string;
  email: string;
  avatar: string;
}

export interface AccessibilitySettings {
  fontSize: number;
  highContrast: boolean;
  reducedMotion: boolean;
  focusVisible: boolean;
  soundFeedback: boolean;
  keyboardShortcuts: boolean;
}

export interface VirtualCard
{
  id: string;
  nome: string;
  titular: string;
  numero: string;
  validade: string;
  cvv: string;
  limite: number;
  dia_vencimento?: number;
  tipo_gradiente: 'purple' | 'obsidian' | 'sunset' | 'ocean' | 'mint';
  bandeira: 'visa' | 'mastercard';
  status: 'ativo' | 'bloqueado';
}

export interface ContaFixa
{
  id: number;
  nome: string;
  valor: number;
  dia_vencimento: number;
  categoria: string;
  ativa: boolean;
}

export interface Transaction
{
  id: number;
  descricao: string;
  categoria: string; // Legado
  categoria_id?: number;
  valor: number;
  tipo: 'receita' | 'despesa';
  data: string;
  status_pagamento?: 'pago' | 'pendente' | 'agendado';
  card_id?: string;
}

export interface BudgetLimit {
  id?: number;
  categoria_id?: number;
  categoria: string; // Legado: id da categoria em string no Planner atual
  limite: number;
  mes?: number;
  ano?: number;
}

export interface FinancialGoal {
  id: number;
  titulo: string;
  valor_alvo: number;
  valor_atual: number;
  prazo?: string;
  icone: string;
  cor: string;
  concluida: boolean;
}

export interface HabitoDiarioConfig {
  incremento?: number;
  meta_minutos?: number;
}

export interface HabitoDiario {
  id: number;
  tipo: string;
  nome_exibicao: string;
  meta_diaria: number;
  progresso_atual: number;
  unidade: string;
  config?: HabitoDiarioConfig;
}

export interface SessaoTreino {
  id: number;
  habito_id: number | null;
  tipo_treino: string;
  meta_minutos: number;
  iniciado_em: string;
  finalizado_em: string | null;
  duracao_real_min: number | null;
  concluido: boolean;
}

export interface Notificacao {
  id: number;
  tipo: 'saude' | 'sistema' | 'tarefa' | 'financeiro';
  titulo: string;
  mensagem: string;
  lida: boolean;
  urgencia: 'normal' | 'alta' | 'critica';
  score_urgencia: number;
  criado_em: string;
}

export interface HabitoResumo {
  id: number;
  nome_exibicao: string;
  progresso_atual: number;
  meta_diaria: number;
  unidade: string;
}

export interface CalendarEvent {
  titulo: string;
  inicio: string;
  fim: string;
  local: string | null;
  descricao: string | null;
}

export interface PalavraChave {
  id: number;
  user_id: string;
  termo: string;
  peso: number;
  created_at?: string;
}

export interface ProcessarMensagemResult {
  status: 'match' | 'ignorado';
  termo_detectado?: string;
  tarefa?: unknown;
}

export type FocusPhase = 'idle' | 'focus' | 'break' | 'completed';

export interface FocusState {
  phase: FocusPhase;
  targetTaskId: number | null;
  secondsLeft: number;
  totalSeconds: number;
  sessionsCompleted: number;
  endTimestampMs: number | null;
}

export interface GamificacaoProfile {
  xp: number;
  xp_total: number;
  streak_days: number;
  streak_atual: number;
  nivel: number;
  ultima_sessao_foco: string | null;
  ultima_sessao_data: string | null;
}

export interface DashboardResumo {
  saudacao_ia: string;
  tarefas_total: number;
  tarefas_pendentes: number;
  tarefas_criticas: number;
  tarefas_concluidas: number;
  despesas_dia: number;
  despesas_mes: number;
  receita_mes: number;
  saldo_mes: number;
  medicamentos_total: number;
  medicamentos_tomados: number;
  habitos: HabitoResumo[];
  habitos_progresso_pct: number;
  notificacoes_nao_lidas: number;
}
