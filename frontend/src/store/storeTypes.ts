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

export type CategoryGrupo =
  | 'casa'
  | 'contas'
  | 'futuro'
  | 'lazer'
  | 'streaming'
  | 'importantes'
  | 'geral';

export interface Category {
  id: number;
  nome: string;
  cor: string;
  icone: string;
  tipo: 'receita' | 'despesa';
  grupo?: CategoryGrupo;
  parent_id?: number | null;
}

export interface Despesa {
  id: number;
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
}

export type MedicamentoCategoria =
  | 'pressao'
  | 'antidepressivo'
  | 'vitamina'
  | 'dor'
  | 'cronico'
  | 'outro'

export type MedicamentoPeriodo = 'manha' | 'tarde' | 'noite'

export interface MedicamentoConfig {
  horarios?: string[];
  periodos?: MedicamentoPeriodo[];
  dosagem?: string;
  categoria?: MedicamentoCategoria;
  uso_diario?: boolean;
  notas?: string;
  /** 0=dom … 6=sáb — vazio = todos os dias */
  dias_semana?: number[];
  inicio_tratamento?: string;
  fim_tratamento?: string;
  /** null = contínuo */
  duracao_dias?: number | null;
  /** Data da consulta para renovar receita (ISO YYYY-MM-DD) */
  consulta_renovacao?: string;
}

export interface MedicamentoTomada {
  id: number;
  medicamento_id: number;
  horario_previsto: string;
  tomado_em: string;
}

export interface Medicamento {
  id: number;
  nome: string;
  horario: string;
  tomado: boolean;
  config?: MedicamentoConfig;
}

export interface UserProfile {
  nome: string;
  email: string;
  avatar: string;
}

export type ColorScheme = 'dark' | 'light';

export interface AccessibilitySettings {
  fontSize: number;
  highContrast: boolean;
  reducedMotion: boolean;
  focusVisible: boolean;
  soundFeedback: boolean;
  keyboardShortcuts: boolean;
  /** Tema global — classe `dark` no html (Tailwind) */
  colorScheme: ColorScheme;
}

export type CardModalidade = 'credito' | 'debito' | 'vr' | 'alimentacao';

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
  dia_fechamento?: number;
  modalidade?: CardModalidade;
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
  categoria_id?: number | null;
  duracao_meses?: number | null;
  data_inicio?: string | null;
  ativa: boolean;
}

export type FinancePaymentMethod =
  | 'pix'
  | 'debito'
  | 'dinheiro'
  | 'boleto'
  | 'cartao'
  | 'ted'
  | 'outro';

export interface Transaction
{
  id: number;
  descricao: string;
  /** Nota explicativa — o que é aquele dinheiro (tooltip na lista) */
  observacao?: string | null;
  categoria: string; // Legado
  categoria_id?: number;
  valor: number;
  tipo: 'receita' | 'despesa' | 'investimento';
  data: string;
  status_pagamento?: 'pago' | 'pendente' | 'agendado';
  forma_pagamento?: FinancePaymentMethod;
  card_id?: string;
  fatura_reserva_id?: number;
}

export interface CashBalanceOverrides
{
  ativo: boolean
  disponivel: number
  corrente: number
  reservado: number
  projetado: number
  atualizado_em?: string | null
}

export interface CashAccountSettings
{
  saldo_inicial: number;
  saldo_banco?: number | null;
  saldo_banco_at?: string | null;
  /** Quando ativo, os KPIs da conta corrente usam estes valores em vez do cálculo */
  saldos_manual?: CashBalanceOverrides | null;
}

export type ReservedBillStatus = 'aberta' | 'quitada' | 'cancelada';

export interface ReservedBill
{
  id: number;
  titulo: string;
  valor_alocado: number;
  valor_gasto: number;
  data_vencimento: string;
  card_id?: string;
  categoria_id?: number;
  status: ReservedBillStatus;
}

export interface ReservedBillItem
{
  id: number;
  fatura_reserva_id: number;
  descricao: string;
  valor: number;
  parcela_atual?: number;
  parcela_total?: number;
  destaque?: 'erro' | null;
  despesa_id?: number;
  created_at?: string;
}

/** Pagamento de boleto registrado ao concluir tarefa no Kanban */
export interface FinanceBillSettlement
{
  id: number;
  tarefa_id: number | null;
  bill_id: string | null;
  titulo: string;
  valor: number;
  pago_em: string;
  origem: string;
  notas: string | null;
}

export interface BudgetLimit {
  id?: number;
  categoria_id?: number;
  categoria: string; // Legado: id da categoria em string no Planner atual
  limite: number;
  mes?: number;
  ano?: number;
}

export interface RecurringIncome
{
  id: number;
  titulo: string;
  valor: number;
  dia_recebimento: number;
  categoria_id?: number;
  ativa: boolean;
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
  ultima_data?: string;
  plano_semana?: Record<string, { titulo: string; meta_minutos: number }>;
  /** Plano por data ISO (YYYY-MM-DD) — sobrescreve a semana naquele dia */
  plano_por_data?: Record<string, { titulo: string; meta_minutos: number }>;
  /** Hidratação — ml por unidade padrão e registro variável do dia */
  ml_por_copo?: number;
  /** Atalhos de ml personalizados (além dos padrões do app) */
  ml_presets?: number[];
  /** Valores padrão do app que o usuário removeu dos atalhos */
  ml_ocultos?: number[];
  registros_ml?: number[];
  /** Proteína — gramas registradas por refeição no dia */
  proteina_por_refeicao?: Record<string, number>;
  /** Kcal consumidas hoje (estimativa) */
  kcal_hoje?: number;
  /** Meta diária de kcal */
  meta_kcal_diaria?: number;
  /** Diário textual do que comeu (estimativa de proteína) */
  refeicoes_texto_log?: Array<{
    refeicao: string;
    texto: string;
    gramas: number;
    hora: string;
    kcal?: number;
    matches?: string[];
  }>;
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
