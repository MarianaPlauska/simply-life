import { describe, it, expect, beforeEach } from 'vitest';
import { useTaskStore } from '../store/useTaskStore';

describe('useTaskStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useTaskStore.setState({
      tarefas: [],
      isLoading: false,
      error: null,
      activeView: 'dashboard',
      anotacoes: [],
      keywords: [],
      scoreDiario: 0,
      labels: [],
      habitosStreaks: [],
      isFocusModeActive: false,
      focusState: { phase: 'idle', targetTaskId: null, secondsLeft: 0, totalSeconds: 0, sessionsCompleted: 0, endTimestampMs: null },
      gamificacao: { xp: 0, xp_total: 0, streak_days: 0, streak_atual: 0, nivel: 0, ultima_sessao_foco: null, ultima_sessao_data: null },
    });
  });

  // ── Basic state ─────────────────────────────────────────────

  it('should have initial empty tarefas', () => {
    const { tarefas } = useTaskStore.getState();
    expect(tarefas).toEqual([]);
  });

  it('should set activeView', () => {
    useTaskStore.getState().setActiveView('kanban');
    expect(useTaskStore.getState().activeView).toBe('kanban');
  });

  it('should moveTask optimistically', () => {
    useTaskStore.setState({
      tarefas: [
        { id: 1, user_id: 'test-uuid', titulo: 'Test', snippet_100_char: 'Test', score_urgencia: 50, status: 'pendente', notas_locais: null, descricao: null, prioridade: 'media', origem: 'manual', data_vencimento: null, created_at: null, versao: 1, subtarefas: [], labels: [] },
      ],
    });
    useTaskStore.getState().moveTask(1, 'em_progresso');
    expect(useTaskStore.getState().tarefas[0].status).toBe('em_progresso');
  });

  it('should toggle sidebar', () => {
    const initial = useTaskStore.getState().sidebarCollapsed;
    useTaskStore.getState().toggleSidebar();
    expect(useTaskStore.getState().sidebarCollapsed).toBe(!initial);
  });

  it('should set keywords', () => {
    useTaskStore.getState().setKeywords(['react', 'typescript']);
    expect(useTaskStore.getState().keywords).toEqual(['react', 'typescript']);
  });

  it('should toggle quick capture modal', () => {
    useTaskStore.getState().setQuickCaptureOpen(true);
    expect(useTaskStore.getState().isQuickCaptureOpen).toBe(true);
    useTaskStore.getState().setQuickCaptureOpen(false);
    expect(useTaskStore.getState().isQuickCaptureOpen).toBe(false);
  });

  // ── Sprint 1: New tests ─────────────────────────────────────

  it('should concluirHabito (sum points)', () => {
    useTaskStore.setState({ scoreDiario: 0 });
    useTaskStore.getState().concluirHabito(10);
    expect(useTaskStore.getState().scoreDiario).toBe(10);
    useTaskStore.getState().concluirHabito(5);
    expect(useTaskStore.getState().scoreDiario).toBe(15);
  });

  it('should togglePin (add/remove modules)', () => {
    useTaskStore.setState({ pinnedModules: ['dashboard'] });
    useTaskStore.getState().togglePin('kanban');
    expect(useTaskStore.getState().pinnedModules).toContain('kanban');
    useTaskStore.getState().togglePin('kanban');
    expect(useTaskStore.getState().pinnedModules).not.toContain('kanban');
  });

  it('should login and set user state', () => {
    useTaskStore.getState().login('test@test.com', 'Testador');
    const state = useTaskStore.getState();
    expect(state.isLoggedIn).toBe(true);
    expect(state.userProfile.email).toBe('test@test.com');
    expect(state.userProfile.nome).toBe('Testador');
    expect(state.activeView).toBe('dashboard');
  });

  it('should logout and clear user state', async () => {
    useTaskStore.getState().login('test@test.com', 'Testador');
    await useTaskStore.getState().logout();
    const state = useTaskStore.getState();
    expect(state.userProfile.email).toBe('');
  });

  it('should setBudgetLimit for a category', async () => {
    useTaskStore.setState({
      budgetLimits: [
        { categoria: 'alimentacao', limite: 1200 },
        { categoria: 'transporte', limite: 800 },
      ],
    });
    await useTaskStore.getState().setBudgetLimit('alimentacao', 1500);
    const limit = useTaskStore.getState().budgetLimits
      .filter((b) => b.categoria === 'alimentacao')
      .at(-1);
    expect(limit?.limite).toBe(1500);
  });

  it('should setAccessibility correctly', () => {
    useTaskStore.getState().setAccessibility('fontSize', 18);
    expect(useTaskStore.getState().accessibility.fontSize).toBe(18);

    useTaskStore.getState().setAccessibility('highContrast', true);
    expect(useTaskStore.getState().accessibility.highContrast).toBe(true);
  });

  it('should resetFocus to idle state', () => {
    useTaskStore.setState({
      isFocusModeActive: true,
      focusState: { phase: 'focus', targetTaskId: 1, secondsLeft: 300, totalSeconds: 1500, sessionsCompleted: 2, endTimestampMs: Date.now() + 300000 },
    });
    useTaskStore.getState().resetFocus();
    const state = useTaskStore.getState();
    expect(state.isFocusModeActive).toBe(false);
    expect(state.focusState.phase).toBe('idle');
    expect(state.focusState.secondsLeft).toBe(0);
    expect(state.focusState.sessionsCompleted).toBe(0);
  });

  it('should toggle command palette', () => {
    useTaskStore.getState().setCommandPaletteOpen(true);
    expect(useTaskStore.getState().isCommandPaletteOpen).toBe(true);
    useTaskStore.getState().setCommandPaletteOpen(false);
    expect(useTaskStore.getState().isCommandPaletteOpen).toBe(false);
  });

  it('should have initial empty labels', () => {
    expect(useTaskStore.getState().labels).toEqual([]);
  });

  it('should have initial empty habitosStreaks', () => {
    expect(useTaskStore.getState().habitosStreaks).toEqual([]);
  });

  it('should set timer config', () => {
    useTaskStore.getState().setTimerConfig('pomodoroTime', 50);
    expect(useTaskStore.getState().timerConfig.pomodoroTime).toBe(50);
    useTaskStore.getState().setTimerConfig('shortBreak', 10);
    expect(useTaskStore.getState().timerConfig.shortBreak).toBe(10);
  });

  it('should startFocusSession with correct duration', () => {
    useTaskStore.setState({ timerConfig: { pomodoroTime: 25, shortBreak: 5, longBreak: 15 } });
    useTaskStore.getState().startFocusSession(42);
    const state = useTaskStore.getState();
    expect(state.isFocusModeActive).toBe(true);
    expect(state.focusState.phase).toBe('focus');
    expect(state.focusState.targetTaskId).toBe(42);
    expect(state.focusState.totalSeconds).toBe(25 * 60);
    expect(state.focusState.endTimestampMs).not.toBeNull();
  });

  it('should removeTransaction from list', () => {
    useTaskStore.setState({
      transactions: [
        { id: 1, descricao: 'Café', categoria: 'alimentacao', valor: 5, tipo: 'despesa', data: '2026-04-14' },
        { id: 2, descricao: 'Salário', categoria: 'renda', valor: 5000, tipo: 'receita', data: '2026-04-01' },
      ],
    });
    useTaskStore.getState().removeTransaction(1);
    expect(useTaskStore.getState().transactions).toHaveLength(1);
    expect(useTaskStore.getState().transactions[0].id).toBe(2);
  });
});
