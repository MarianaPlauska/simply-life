import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TarefaUnificada, Label, Subtarefa, HabitoStreak, BuscaResult } from '../types';

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

interface TimerConfig {
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
  /** Wall-clock timestamp (ms) when current phase ends — used for tab-resume accuracy */
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

interface TaskStore {
  tarefas: TarefaUnificada[];
  isLoading: boolean;
  error: string | null;
  activeView: ActiveView;
  anotacoes: Anotacao[];
  isQuickCaptureOpen: boolean;
  isCommandPaletteOpen: boolean;
  timerConfig: TimerConfig;
  interactionScore: Record<string, number>;
  sidebarCollapsed: boolean;
  despesas: Despesa[];
  medicamentos: Medicamento[];
  scoreDiario: number;
  pinnedModules: string[];
  isLoggedIn: boolean;
  userProfile: UserProfile;
  authToken: string;
  accessibility: AccessibilitySettings;
  keywords: string[];
  transactions: Transaction[];
  budgetLimits: BudgetLimit[];
  habitos: HabitoDiario[];
  notificacoes: Notificacao[];
  dashboardResumo: DashboardResumo | null;
  dashboardLoading: boolean;
  calendarEvents: CalendarEvent[];
  calendarLoading: boolean;
  calendarError: string | null;
  googleCalendarConnected: boolean;
  fetchDashboard: () => Promise<void>;
  fetchCalendarEvents: () => Promise<void>;
  connectGoogleCalendar: () => Promise<void>;
  disconnectGoogleCalendar: () => Promise<void>;
  checkGoogleStatus: () => Promise<void>;
  processGoogleCallback: (code: string) => Promise<boolean>;
  fetchNotificacoes: () => Promise<void>;
  markNotificacaoRead: (id: number) => Promise<void>;
  markAllNotificacoesRead: () => Promise<void>;
  fetchTarefas: () => Promise<void>;
  createTarefa: (titulo: string, notas?: string) => Promise<void>;
  updateTarefa: (id: number, dados: { titulo?: string; status?: string; notas_locais?: string }) => Promise<void>;
  deleteTarefa: (id: number) => Promise<void>;
  moveTask: (taskId: number, newStatus: string) => void;
  setActiveView: (view: ActiveView) => void;
  setQuickCaptureOpen: (isOpen: boolean) => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
  fetchAnotacoes: () => Promise<void>;
  addAnotacao: (conteudo: string, titulo?: string) => Promise<void>;
  setTimerConfig: (key: keyof TimerConfig, value: number) => void;
  registerInteraction: (moduleId: string) => void;
  toggleSidebar: () => void;
  fetchDespesas: () => Promise<void>;
  addDespesa: (dados: { descricao: string; categoria: string; valor: number }) => Promise<void>;
  fetchMedicamentos: () => Promise<void>;
  toggleMedicamento: (id: number) => Promise<void>;
  addMedicamento: (med: { nome: string; horario: string }) => Promise<void>;
  concluirHabito: (pontos: number) => void;
  togglePin: (moduleId: string) => void;
  login: (email: string, nome: string, token?: string) => void;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  setAccessibility: (key: keyof AccessibilitySettings, value: boolean | number) => void;
  setKeywords: (keywords: string[]) => void;
  fetchPreferencias: () => Promise<void>;
  saveKeywords: (palavras: string[]) => Promise<void>;
  simularIngestao: (titulo: string) => Promise<void>;
  fetchTransactions: () => Promise<void>;
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  removeTransaction: (id: number) => void;
  setBudgetLimit: (categoria: string, limite: number) => void;
  fetchHabitos: () => Promise<void>;
  addHabito: (h: { tipo: string; nome_exibicao: string; meta_diaria: number; unidade: string }) => Promise<void>;
  incrementHabito: (id: number) => Promise<void>;
  decrementHabito: (id: number) => Promise<void>;
  deleteHabito: (id: number) => Promise<void>;
  // Focus Mode
  isFocusModeActive: boolean;
  focusState: FocusState;
  gamificacao: GamificacaoProfile;
  startFocusSession: (taskId?: number) => void;
  pauseFocusSession: () => void;
  tickFocus: () => void;
  syncFocusFromClock: () => void;
  completeFocusPhase: () => Promise<void>;
  resetFocus: () => void;
  fetchGamificacao: () => Promise<void>;
  finalizarSessaoFoco: (minutos: number, tarefaId?: number | null) => Promise<void>;
  // Labels + Subtarefas (Sprint 1)
  labels: Label[];
  fetchLabels: () => Promise<void>;
  createLabel: (nome: string, cor?: string) => Promise<void>;
  deleteLabel: (id: number) => Promise<void>;
  createSubtarefa: (tarefaId: number, titulo: string) => Promise<void>;
  updateSubtarefa: (id: number, dados: Partial<Subtarefa>) => Promise<void>;
  deleteSubtarefa: (id: number, tarefaId: number) => Promise<void>;
  addLabelToTarefa: (tarefaId: number, labelId: number) => Promise<void>;
  removeLabelFromTarefa: (tarefaId: number, labelId: number) => Promise<void>;
  // Streaks de hábitos (Sprint 1)
  habitosStreaks: HabitoStreak[];
  fetchHabitosStreaks: () => Promise<void>;
  // Motor de Triagem
  palavrasChave: PalavraChave[];
  fetchPalavrasChave: () => Promise<void>;
  addPalavraChave: (termo: string, peso?: number) => Promise<void>;
  removePalavraChave: (id: number) => Promise<void>;
  processarMensagem: (conteudo: string, origem: string, remetente: string) => Promise<ProcessarMensagemResult>;
  // teste de integração do motor de triagem (mock inbox)
  simularEmailRecebido: (texto: string, remetente: string) => Promise<void>;
  // busca global (sprint 2)
  searchResults: BuscaResult | null;
  searchLoading: boolean;
  buscar: (query: string) => Promise<void>;
}

const API = 'http://127.0.0.1:8000';

function authHeaders(): HeadersInit {
  const token = useTaskStore.getState?.()?.authToken || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
  tarefas: [],
  isLoading: false,
  error: null,
  activeView: 'dashboard',
  anotacoes: [],
  isQuickCaptureOpen: false,
  isCommandPaletteOpen: false,
  timerConfig: { pomodoroTime: 25, shortBreak: 5, longBreak: 15 },
  interactionScore: {},
  sidebarCollapsed: false,
  despesas: [],
  medicamentos: [],
  scoreDiario: 0,
  pinnedModules: ['dashboard', 'kanban'],
  isLoggedIn: false,
  userProfile: { nome: '', email: '', avatar: '' },
  authToken: '',
  accessibility: {
    fontSize: 14,
    highContrast: false,
    reducedMotion: false,
    focusVisible: true,
    soundFeedback: false,
    keyboardShortcuts: true,
  },
  keywords: [] as string[],
  transactions: [],
  budgetLimits: [
    { categoria: 'habitacao', limite: 2500 },
    { categoria: 'alimentacao', limite: 1200 },
    { categoria: 'transporte', limite: 800 },
    { categoria: 'lazer', limite: 600 },
    { categoria: 'internet', limite: 300 },
    { categoria: 'saude', limite: 500 },
    { categoria: 'educacao', limite: 400 },
    { categoria: 'compras', limite: 500 },
  ],
  habitos: [],
  notificacoes: [],
  dashboardResumo: null,
  dashboardLoading: false,
  calendarEvents: [],
  calendarLoading: false,
  calendarError: null,
  googleCalendarConnected: false,
  isFocusModeActive: false,
  focusState: { phase: 'idle', targetTaskId: null, secondsLeft: 0, totalSeconds: 0, sessionsCompleted: 0, endTimestampMs: null },
  gamificacao: { xp: 0, xp_total: 0, streak_days: 0, streak_atual: 0, nivel: 0, ultima_sessao_foco: null, ultima_sessao_data: null },
  labels: [] as Label[],
  habitosStreaks: [] as HabitoStreak[],
  palavrasChave: [] as PalavraChave[],
  searchResults: null,
  searchLoading: false,

  fetchDashboard: async () => {
    set({ dashboardLoading: true });
    try {
      const res = await fetch(`${API}/dashboard/resumo`, { headers: authHeaders() });
      if (res.status === 401) { get().logout(); return; }
      if (!res.ok) throw new Error('Falha ao buscar dashboard');
      const data = await res.json();
      set({ dashboardResumo: data, dashboardLoading: false });
    } catch (e) {
      console.error('fetchDashboard:', e);
      set({ dashboardLoading: false });
    }
  },

  fetchNotificacoes: async () => {
    try {
      const res = await fetch(`${API}/notificacoes`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Falha ao buscar notificações');
      const data = await res.json();
      set({ notificacoes: data });
    } catch (e) {
      console.error('fetchNotificacoes:', e);
    }
  },

  markNotificacaoRead: async (id: number) => {
    try {
      await fetch(`${API}/notificacoes/${id}/lida`, { method: 'PATCH', headers: authHeaders() });
      set({ notificacoes: get().notificacoes.map(n => n.id === id ? { ...n, lida: true } : n) });
    } catch (e) {
      console.error('markNotificacaoRead:', e);
    }
  },

  markAllNotificacoesRead: async () => {
    try {
      await fetch(`${API}/notificacoes/marcar-todas-lidas`, { method: 'PATCH', headers: authHeaders() });
      set({ notificacoes: get().notificacoes.map(n => ({ ...n, lida: true })) });
    } catch (e) {
      console.error('markAllNotificacoesRead:', e);
    }
  },

  fetchTarefas: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API}/tarefas`, { headers: authHeaders() });
      if (!response.ok) throw new Error('Falha ao buscar tarefas');
      
      const data = await response.json();
      set({ tarefas: data.tarefas, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createTarefa: async (titulo, notas) => {
    try {
      const res = await fetch(`${API}/tarefas`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ titulo, notas_locais: notas || null }),
      });
      if (!res.ok) throw new Error('Falha ao criar tarefa');
      const data = await res.json();
      set((s) => ({ tarefas: [data.tarefa, ...s.tarefas] }));
    } catch (e) {
      console.error('createTarefa:', e);
    }
  },

  updateTarefa: async (id, dados) => {
    try {
      const res = await fetch(`${API}/tarefas/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(dados),
      });
      if (!res.ok) throw new Error('Falha ao atualizar tarefa');
      const data = await res.json();
      set((s) => ({
        tarefas: s.tarefas.map((t) => (t.id === id ? { ...t, ...data.tarefa } : t)),
      }));
    } catch (e) {
      console.error('updateTarefa:', e);
    }
  },

  deleteTarefa: async (id) => {
    try {
      const res = await fetch(`${API}/tarefas/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Falha ao deletar tarefa');
      set((s) => ({ tarefas: s.tarefas.filter((t) => t.id !== id) }));
    } catch (e) {
      console.error('deleteTarefa:', e);
    }
  },

  moveTask: (taskId, newStatus) => {
    set((state) => ({
      tarefas: state.tarefas.map((t) =>
        t.id === taskId ? { ...t, status: newStatus as TarefaUnificada['status'] } : t
      ),
    }));
    // Persist to backend
    fetch(`${API}/tarefas/${taskId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status: newStatus }),
    }).catch((e) => console.error('moveTask sync:', e));
  },

  setActiveView: (view) => set({ activeView: view }),

  setQuickCaptureOpen: (isOpen) => set({ isQuickCaptureOpen: isOpen }),
  setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),

  fetchAnotacoes: async () => {
    try {
      const response = await fetch(`${API}/anotacoes`, { headers: authHeaders() });
      if (!response.ok) throw new Error('Falha ao buscar anotações');
      const data = await response.json();
      set({ anotacoes: data.anotacoes });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  addAnotacao: async (conteudo, titulo) => {
    const response = await fetch(`${API}/anotacoes`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ conteudo, titulo: titulo || null }),
    });
    if (!response.ok) throw new Error('Falha ao salvar anotação');
    await get().fetchAnotacoes();
  },

  setTimerConfig: (key, value) => {
    set((state) => ({
      timerConfig: { ...state.timerConfig, [key]: value },
    }));
  },

  fetchDespesas: async () => {
    try {
      const response = await fetch(`${API}/despesas`, { headers: authHeaders() });
      if (!response.ok) throw new Error('Falha ao buscar despesas');
      const data = await response.json();
      set({ despesas: data.despesas });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  addDespesa: async (dados) => {
    const response = await fetch(`${API}/despesas`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(dados),
    });
    if (!response.ok) throw new Error('Falha ao salvar despesa');
    const data = await response.json();
    set((state) => ({ despesas: [data.despesa, ...state.despesas] }));
  },

  fetchMedicamentos: async () => {
    try {
      const response = await fetch(`${API}/medicamentos`, { headers: authHeaders() });
      if (!response.ok) throw new Error('Falha ao buscar medicamentos');
      const data = await response.json();
      set({ medicamentos: data.medicamentos });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  addMedicamento: async (med) => {
    try {
      const res = await fetch(`${API}/medicamentos`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ nome: med.nome, horario: med.horario }),
      });
      if (res.ok) {
        const data = await res.json();
        set((state) => ({
          medicamentos: [...state.medicamentos, data.medicamento],
        }));
        return;
      }
    } catch { /* offline fallback */ }
    set((state) => ({
      medicamentos: [
        ...state.medicamentos,
        { id: Date.now(), nome: med.nome, horario: med.horario, tomado: false },
      ],
    }));
  },

  toggleMedicamento: async (id) => {
    // Optimistic update
    set((state) => ({
      medicamentos: state.medicamentos.map((m) =>
        m.id === id ? { ...m, tomado: !m.tomado } : m
      ),
    }));
    try {
      const response = await fetch(`${API}/medicamentos/${id}/toggle`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error('Falha ao atualizar medicamento');
    } catch {
      // Rollback on error
      set((state) => ({
        medicamentos: state.medicamentos.map((m) =>
          m.id === id ? { ...m, tomado: !m.tomado } : m
        ),
      }));
    }
  },

  registerInteraction: (moduleId) => {
    set((state) => ({
      interactionScore: {
        ...state.interactionScore,
        [moduleId]: (state.interactionScore[moduleId] || 0) + 1,
      },
    }));
  },

  concluirHabito: (pontos) => {
    set((state) => ({ scoreDiario: state.scoreDiario + pontos }));
  },

  togglePin: (moduleId) => {
    set((state) => {
      const has = state.pinnedModules.includes(moduleId);
      return {
        pinnedModules: has
          ? state.pinnedModules.filter((m) => m !== moduleId)
          : [...state.pinnedModules, moduleId],
      };
    });
  },

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  login: (email, nome, token) => {
    set({
      isLoggedIn: true,
      userProfile: { nome: nome || email.split('@')[0], email, avatar: '' },
      authToken: token || '',
      activeView: 'dashboard',
    });
  },

  logout: () => {
    set({ isLoggedIn: false, userProfile: { nome: '', email: '', avatar: '' }, authToken: '', activeView: 'login' });
  },

  updateProfile: (profile) => {
    set((state) => ({
      userProfile: { ...state.userProfile, ...profile },
    }));
  },

  setAccessibility: (key, value) => {
    set((state) => ({
      accessibility: { ...state.accessibility, [key]: value },
    }));
    // Apply CSS variable for fontSize
    if (key === 'fontSize') {
      document.documentElement.style.fontSize = `${value}px`;
    }
    if (key === 'highContrast') {
      document.documentElement.classList.toggle('high-contrast', value as boolean);
    }
    if (key === 'reducedMotion') {
      document.documentElement.classList.toggle('reduce-motion', value as boolean);
    }
  },

  setKeywords: (keywords) => set({ keywords }),

  fetchPreferencias: async () => {
    try {
      const res = await fetch(`${API}/preferencias`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const kw = (data.palavras_chave_email || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      set({ keywords: kw });
    } catch { /* backend offline */ }
  },

  saveKeywords: async (palavras) => {
    try {
      set({ keywords: palavras });
      const res = await fetch(`${API}/preferencias`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ palavras_chave_email: palavras.join(',') }),
      });
      if (!res.ok) throw new Error('Falha ao salvar');
      const { toast } = await import('sonner');
      toast.success('Keywords atualizadas!');
    } catch {
      const { toast } = await import('sonner');
      toast.error('Erro ao salvar keywords');
    }
  },

  simularIngestao: async (titulo) => {
    try {
      const res = await fetch(`${API}/webhook/ingestao`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ plataforma: 'gmail', titulo, conteudo: 'Conteúdo simulado para teste de triagem.' }),
      });
      if (!res.ok) throw new Error('Falha na ingestão');
      const { toast } = await import('sonner');
      toast.success('E-mail simulado ingerido com sucesso!');
      // Recarrega tarefas após breve delay para o worker processar
      setTimeout(() => get().fetchTarefas(), 800);
    } catch {
      const { toast } = await import('sonner');
      toast.error('Erro ao simular ingestão');
    }
  },

  fetchTransactions: async () => {
    try {
      const res = await fetch(`${API}/despesas`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Falha');
      const data = await res.json();
      set({ transactions: data.despesas.map((d: Record<string, unknown>) => ({ ...d, tipo: (d.tipo as string) || 'despesa' })) });
    } catch { /* offline */ }
  },

  addTransaction: async (t) => {
    try {
      const res = await fetch(`${API}/despesas`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          descricao: t.descricao,
          categoria: t.categoria,
          valor: t.valor,
          data_gasto: t.data,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        set((state) => ({
          transactions: [{ ...data.despesa, tipo: t.tipo }, ...state.transactions],
        }));
      }
    } catch { /* offline — add locally */ }
    // Always add locally as fallback
    set((state) => {
      const exists = state.transactions.some((tx) => tx.descricao === t.descricao && tx.data === t.data && tx.valor === t.valor);
      if (exists) return state;
      return { transactions: [{ id: Date.now(), ...t }, ...state.transactions] };
    });
  },

  removeTransaction: (id) => {
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },

  setBudgetLimit: (categoria, limite) => {
    set((state) => ({
      budgetLimits: state.budgetLimits.map((b) =>
        b.categoria === categoria ? { ...b, limite } : b
      ),
    }));
  },

  fetchHabitos: async () => {
    try {
      const res = await fetch(`${API}/habitos`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      set({ habitos: data.habitos });
    } catch { /* offline */ }
  },

  addHabito: async (h) => {
    try {
      const res = await fetch(`${API}/habitos`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(h),
      });
      if (res.ok) {
        const data = await res.json();
        set((state) => ({ habitos: [...state.habitos, data.habito] }));
        return;
      }
    } catch { /* offline fallback */ }
    set((state) => ({
      habitos: [...state.habitos, { id: Date.now(), progresso_atual: 0, ...h }],
    }));
  },

  incrementHabito: async (id) => {
    set((state) => ({
      habitos: state.habitos.map((h) =>
        h.id === id ? { ...h, progresso_atual: Math.min(h.progresso_atual + 1, h.meta_diaria) } : h
      ),
    }));
    try {
      await fetch(`${API}/habitos/${id}/incrementar`, { method: 'PATCH', headers: authHeaders() });
    } catch { /* offline — keep optimistic */ }
  },

  decrementHabito: async (id) => {
    set((state) => ({
      habitos: state.habitos.map((h) =>
        h.id === id ? { ...h, progresso_atual: Math.max(h.progresso_atual - 1, 0) } : h
      ),
    }));
    try {
      await fetch(`${API}/habitos/${id}/decrementar`, { method: 'PATCH', headers: authHeaders() });
    } catch { /* offline — keep optimistic */ }
  },

  deleteHabito: async (id) => {
    set((state) => ({ habitos: state.habitos.filter((h) => h.id !== id) }));
    try {
      await fetch(`${API}/habitos/${id}`, { method: 'DELETE', headers: authHeaders() });
    } catch { /* offline — keep optimistic */ }
  },

  fetchCalendarEvents: async () => {
   
    if (get().googleCalendarConnected === false) {
      set({ calendarLoading: false, calendarError: null, calendarEvents: [] });
      return;
    }
    set({ calendarLoading: true, calendarError: null });
    try {
      const res = await fetch(`${API}/integracoes/calendario/hoje`, { headers: authHeaders() });
      if (res.status === 401) { get().logout(); return; }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('[fetchCalendarEvents] Backend error:', res.status, body);
        const detail = typeof body?.detail === 'string' ? body.detail : '';
        if (res.status === 403 || detail.toLowerCase().includes('permission') || detail.toLowerCase().includes('insufficient')) {
          set({ calendarLoading: false, calendarError: '403', googleCalendarConnected: false });
        } else {
          set({ calendarLoading: false });
        }
        return;
      }
      const data = await res.json();
      set({ calendarEvents: data, calendarLoading: false, calendarError: null, googleCalendarConnected: true });
    } catch (err) {
      console.error('[fetchCalendarEvents] Network error:', err);
      set({ calendarLoading: false });
    }
  },

  connectGoogleCalendar: async () => {
    try {
      const res = await fetch(`${API}/integracoes/google/url`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Falha ao obter URL');
      const data = await res.json();
      window.location.href = data.url;
    } catch (e) {
      console.error('connectGoogleCalendar:', e);
    }
  },

  disconnectGoogleCalendar: async () => {
    try {
      const res = await fetch(`${API}/integracoes/google/desconectar`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        set({ googleCalendarConnected: false, calendarEvents: [] });
      }
    } catch (e) {
      console.error('disconnectGoogleCalendar:', e);
    }
  },

  checkGoogleStatus: async () => {
    try {
      const res = await fetch(`${API}/integracoes/google/status`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      set({ googleCalendarConnected: data.connected });
    } catch { /* offline */ }
  },

  processGoogleCallback: async (code: string) => {
    try {
      const res = await fetch(`${API}/integracoes/google/callback`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('[processGoogleCallback] Backend error:', res.status, body);
        return false;
      }
      set({ googleCalendarConnected: true });
      return true;
    } catch (err) {
      console.error('[processGoogleCallback] Network error:', err);
      return false;
    }
  },

  // ── Focus Mode ──────────────────────────────────────────
  startFocusSession: (taskId?: number) => {
    const config = get().timerConfig;
    const durationSecs = config.pomodoroTime * 60;
    set({
      isFocusModeActive: true,
      focusState: {
        phase: 'focus',
        targetTaskId: taskId ?? null,
        secondsLeft: durationSecs,
        totalSeconds: durationSecs,
        sessionsCompleted: get().focusState.sessionsCompleted,
        endTimestampMs: Date.now() + durationSecs * 1000,
      },
    });
  },

  pauseFocusSession: () => {
    const fs = get().focusState;
    set({ isFocusModeActive: fs.phase === 'focus' ? false : get().isFocusModeActive });
  },

  /** Called every second by the component's setInterval; recalculates from wall clock */
  tickFocus: () => {
    const fs = get().focusState;
    if (!fs.endTimestampMs) return;
    const remaining = Math.max(0, Math.round((fs.endTimestampMs - Date.now()) / 1000));
    set({ focusState: { ...fs, secondsLeft: remaining } });
  },

 
  syncFocusFromClock: () => {
    const fs = get().focusState;
    if (!fs.endTimestampMs || !get().isFocusModeActive) return;
    const remaining = Math.max(0, Math.round((fs.endTimestampMs - Date.now()) / 1000));
    set({ focusState: { ...fs, secondsLeft: remaining } });
  },

  completeFocusPhase: async () => {
    const fs = get().focusState;
    const config = get().timerConfig;

    if (fs.phase === 'focus') {
      const newCount = fs.sessionsCompleted + 1;
      // Chama finalizarSessaoFoco que persiste no banco
      await get().finalizarSessaoFoco(Math.round(fs.totalSeconds / 60), fs.targetTaskId);
      const breakTime = newCount % 4 === 0 ? config.longBreak : config.shortBreak;
      const breakSecs = breakTime * 60;
      set({
        focusState: {
          phase: 'break',
          targetTaskId: fs.targetTaskId,
          secondsLeft: breakSecs,
          totalSeconds: breakSecs,
          sessionsCompleted: newCount,
          endTimestampMs: Date.now() + breakSecs * 1000,
        },
      });
    } else if (fs.phase === 'break') {
      set({
        focusState: { ...fs, phase: 'completed', endTimestampMs: null },
        isFocusModeActive: false,
      });
    }
  },

  resetFocus: () => {
    set({
      isFocusModeActive: false,
      focusState: { phase: 'idle', targetTaskId: null, secondsLeft: 0, totalSeconds: 0, sessionsCompleted: 0, endTimestampMs: null },
    });
  },

  fetchGamificacao: async () => {
    try {
      const res = await fetch(`${API}/gamificacao/perfil`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      set({
        gamificacao: {
          xp: data.xp_total ?? data.xp ?? 0,
          xp_total: data.xp_total ?? data.xp ?? 0,
          streak_days: data.streak_atual ?? data.streak_days ?? 0,
          streak_atual: data.streak_atual ?? data.streak_days ?? 0,
          nivel: data.nivel ?? 0,
          ultima_sessao_foco: data.ultima_sessao_foco,
          ultima_sessao_data: data.ultima_sessao_data,
        },
      });
    } catch (e) {
      console.error('fetchGamificacao:', e);
    }
  },

  finalizarSessaoFoco: async (minutos: number, tarefaId?: number | null) => {
    try {
      const res = await fetch(`${API}/gamificacao/finalizar-sessao`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ minutos, tarefa_id: tarefaId ?? null }),
      });
      if (res.ok) {
        const data = await res.json();
        set({
          gamificacao: {
            xp: data.xp_total,
            xp_total: data.xp_total,
            streak_days: data.streak_atual,
            streak_atual: data.streak_atual,
            nivel: data.nivel,
            ultima_sessao_foco: new Date().toISOString(),
            ultima_sessao_data: data.ultima_sessao_data,
          },
        });
      } else if (res.status === 401) {
        get().logout();
      }
    } catch (e) {
      console.error('finalizarSessaoFoco:', e);
    }
  },

  // ── Labels + Subtarefas (Sprint 1) ────────────────────────
  fetchLabels: async () => {
    try {
      const res = await fetch(`${API}/labels`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      set({ labels: data });
    } catch (e) {
      console.error('fetchLabels:', e);
    }
  },

  createLabel: async (nome: string, cor = '#8b5cf6') => {
    try {
      const res = await fetch(`${API}/labels`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ nome, cor }),
      });
      if (res.ok) {
        const nova = await res.json();
        set((s) => ({ labels: [...s.labels, nova] }));
      }
    } catch (e) {
      console.error('createLabel:', e);
    }
  },

  deleteLabel: async (id: number) => {
    try {
      const res = await fetch(`${API}/labels/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        set((s) => ({ labels: s.labels.filter((l) => l.id !== id) }));
      }
    } catch (e) {
      console.error('deleteLabel:', e);
    }
  },

  createSubtarefa: async (tarefaId: number, titulo: string) => {
    try {
      const res = await fetch(`${API}/tarefas/${tarefaId}/subtarefas`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ titulo }),
      });
      if (res.ok) {
        const nova = await res.json();
        set((s) => ({
          tarefas: s.tarefas.map((t) =>
            t.id === tarefaId ? { ...t, subtarefas: [...(t.subtarefas || []), nova] } : t
          ),
        }));
      }
    } catch (e) {
      console.error('createSubtarefa:', e);
    }
  },

  updateSubtarefa: async (id: number, dados: Partial<Subtarefa>) => {
    try {
      const res = await fetch(`${API}/subtarefas/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(dados),
      });
      if (res.ok) {
        const updated = await res.json();
        set((s) => ({
          tarefas: s.tarefas.map((t) => ({
            ...t,
            subtarefas: (t.subtarefas || []).map((sub) =>
              sub.id === id ? { ...sub, ...updated } : sub
            ),
          })),
        }));
      }
    } catch (e) {
      console.error('updateSubtarefa:', e);
    }
  },

  deleteSubtarefa: async (id: number, tarefaId: number) => {
    try {
      const res = await fetch(`${API}/subtarefas/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        set((s) => ({
          tarefas: s.tarefas.map((t) =>
            t.id === tarefaId
              ? { ...t, subtarefas: (t.subtarefas || []).filter((sub) => sub.id !== id) }
              : t
          ),
        }));
      }
    } catch (e) {
      console.error('deleteSubtarefa:', e);
    }
  },

  addLabelToTarefa: async (tarefaId: number, labelId: number) => {
    try {
      const res = await fetch(`${API}/tarefas/${tarefaId}/labels/${labelId}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        // Refresh tarefa to get updated labels
        get().fetchTarefas();
      }
    } catch (e) {
      console.error('addLabelToTarefa:', e);
    }
  },

  removeLabelFromTarefa: async (tarefaId: number, labelId: number) => {
    try {
      const res = await fetch(`${API}/tarefas/${tarefaId}/labels/${labelId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        set((s) => ({
          tarefas: s.tarefas.map((t) =>
            t.id === tarefaId
              ? { ...t, labels: (t.labels || []).filter((l) => l.id !== labelId) }
              : t
          ),
        }));
      }
    } catch (e) {
      console.error('removeLabelFromTarefa:', e);
    }
  },

  // ── Streaks de hábitos (Sprint 1) ─────────────────────────
  fetchHabitosStreaks: async () => {
    try {
      const res = await fetch(`${API}/habitos/streaks`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      set({ habitosStreaks: data });
    } catch (e) {
      console.error('fetchHabitosStreaks:', e);
    }
  },

  // ── Motor de Triagem ──────────────────────────────────────
  fetchPalavrasChave: async () => {
    try {
      const res = await fetch(`${API}/triagem/palavras-chave`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      set({ palavrasChave: data });
    } catch (e) {
      console.error('fetchPalavrasChave:', e);
    }
  },

  addPalavraChave: async (termo: string, peso = 1) => {
    try {
      const res = await fetch(`${API}/triagem/palavras-chave`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ termo, peso }),
      });
      if (res.ok) {
        const nova = await res.json();
        set((s) => ({ palavrasChave: [...s.palavrasChave, nova] }));
      }
    } catch (e) {
      console.error('addPalavraChave:', e);
    }
  },

  removePalavraChave: async (id: number) => {
    try {
      const res = await fetch(`${API}/triagem/palavras-chave/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        set((s) => ({ palavrasChave: s.palavrasChave.filter((p) => p.id !== id) }));
      }
    } catch (e) {
      console.error('removePalavraChave:', e);
    }
  },

  processarMensagem: async (conteudo: string, origem: string, remetente: string) => {
    try {
      const res = await fetch(`${API}/triagem/processar-mensagem`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ conteudo, origem, remetente }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'match' && data.tarefa) {
          // Adiciona a tarefa criada ao store local
          get().fetchTarefas();
        }
        return { status: data.status, termo_detectado: data.termo_detectado, tarefa: data.tarefa };
      }
      return { status: 'ignorado' as const };
    } catch (e) {
      console.error('processarMensagem:', e);
      return { status: 'ignorado' as const };
    }
  },

  // simula um email entrando na caixa e passando pelo motor de triagem
  // dispara post pra /triagem/processar-mensagem com origem 'gmail_mock'
  // se o motor criar tarefa, atualiza o dashboard e a lista de tarefas
  simularEmailRecebido: async (texto: string, remetente: string) =>
  {
    try
    {
      const resultado = await get().processarMensagem(texto, 'gmail_mock', remetente);
      if ( resultado.status === 'match' )
      {
        // recarrega tudo pra refletir a nova tarefa no dashboard
        await Promise.all([get().fetchTarefas(), get().fetchDashboard()]);
      }
    }
    catch (e)
    {
      console.error('simularEmailRecebido:', e);
    }
  },

  // busca global — chama GET /busca?q= e salva resultado no state
  buscar: async (query: string) =>
  {
    if ( !query || query.trim().length < 2 )
    {
      set({ searchResults: null, searchLoading: false });
      return;
    }
    set({ searchLoading: true });
    try
    {
      const res = await fetch(`${API}/busca?q=${encodeURIComponent(query.trim())}&limite=8`, {
        headers: authHeaders(),
      });
      if ( res.ok )
      {
        const data = await res.json();
        set({ searchResults: data, searchLoading: false });
      }
      else
      {
        set({ searchResults: null, searchLoading: false });
      }
    }
    catch (e)
    {
      console.error('buscar:', e);
      set({ searchResults: null, searchLoading: false });
    }
  },

    }),
    {
      name: 'simply-life-store',
      partialize: (state) => ({
        interactionScore: state.interactionScore,
        sidebarCollapsed: state.sidebarCollapsed,
        timerConfig: state.timerConfig,
        scoreDiario: state.scoreDiario,
        pinnedModules: state.pinnedModules,
        isLoggedIn: state.isLoggedIn,
        userProfile: state.userProfile,
        accessibility: state.accessibility,
        keywords: state.keywords,
        transactions: state.transactions,
        budgetLimits: state.budgetLimits,
        habitos: state.habitos,
        authToken: state.authToken,
      }),
    }
  )
);