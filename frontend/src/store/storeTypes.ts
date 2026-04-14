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
  | 'login';

export interface Anotacao {
  id: number;
  usuario_id: number;
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

export interface Transaction {
  id: number;
  descricao: string;
  categoria: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  data: string;
}

export interface BudgetLimit {
  categoria: string;
  limite: number;
}

export interface HabitoDiario {
  id: number;
  tipo: string;
  nome_exibicao: string;
  meta_diaria: number;
  progresso_atual: number;
  unidade: string;
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
  user_id: number;
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
