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
    });
  });

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
        { id: 1, usuario_id: 1, titulo: 'Test', snippet_100_char: 'Test', score_urgencia: 50, status: 'pendente', notas_locais: null },
      ],
    });
    useTaskStore.getState().moveTask(1, 'hoje');
    expect(useTaskStore.getState().tarefas[0].status).toBe('hoje');
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
});
