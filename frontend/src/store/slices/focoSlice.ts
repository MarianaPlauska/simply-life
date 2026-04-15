// slice de foco — timer pomodoro, gamificação, sessões
import type { StateCreator } from 'zustand';
import type { FocusState, GamificacaoProfile } from '../storeTypes';
import { apiFetch } from '../api';

export interface FocoSlice {
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
}

// precisa acessar timerConfig do ui slice — resolve via cast do get()
type FullGet = () => FocoSlice & { timerConfig: { pomodoroTime: number; shortBreak: number; longBreak: number }; logout: () => void };

export const createFocoSlice: StateCreator<FocoSlice, [], [], FocoSlice> = (set, get) => ({
  isFocusModeActive: false,
  focusState: { phase: 'idle', targetTaskId: null, secondsLeft: 0, totalSeconds: 0, sessionsCompleted: 0, endTimestampMs: null },
  gamificacao: { xp: 0, xp_total: 0, streak_days: 0, streak_atual: 0, nivel: 0, ultima_sessao_foco: null, ultima_sessao_data: null },

  startFocusSession: (taskId) =>
  {
    const config = (get as unknown as FullGet)().timerConfig;
    const secs = config.pomodoroTime * 60;
    set({
      isFocusModeActive: true,
      focusState: {
        phase: 'focus',
        targetTaskId: taskId ?? null,
        secondsLeft: secs,
        totalSeconds: secs,
        sessionsCompleted: get().focusState.sessionsCompleted,
        endTimestampMs: Date.now() + secs * 1000,
      },
    });
  },

  pauseFocusSession: () =>
  {
    const fs = get().focusState;
    set({ isFocusModeActive: fs.phase === 'focus' ? false : get().isFocusModeActive });
  },

  tickFocus: () =>
  {
    const fs = get().focusState;
    if ( !fs.endTimestampMs ) return;
    const remaining = Math.max(0, Math.round((fs.endTimestampMs - Date.now()) / 1000));
    set({ focusState: { ...fs, secondsLeft: remaining } });
  },

  syncFocusFromClock: () =>
  {
    const fs = get().focusState;
    if ( !fs.endTimestampMs || !get().isFocusModeActive ) return;
    const remaining = Math.max(0, Math.round((fs.endTimestampMs - Date.now()) / 1000));
    set({ focusState: { ...fs, secondsLeft: remaining } });
  },

  completeFocusPhase: async () =>
  {
    const fs = get().focusState;
    const config = (get as unknown as FullGet)().timerConfig;

    if ( fs.phase === 'focus' )
    {
      const newCount = fs.sessionsCompleted + 1;
      await get().finalizarSessaoFoco(Math.round(fs.totalSeconds / 60), fs.targetTaskId);
      const breakTime = newCount % 4 === 0 ? config.longBreak : config.shortBreak;
      const breakSecs = breakTime * 60;
      set({
        focusState: {
          phase: 'break', targetTaskId: fs.targetTaskId,
          secondsLeft: breakSecs, totalSeconds: breakSecs,
          sessionsCompleted: newCount, endTimestampMs: Date.now() + breakSecs * 1000,
        },
      });
    }
    else if ( fs.phase === 'break' )
    {
      set({
        focusState: { ...fs, phase: 'completed', endTimestampMs: null },
        isFocusModeActive: false,
      });
    }
  },

  resetFocus: () =>
  {
    set({
      isFocusModeActive: false,
      focusState: { phase: 'idle', targetTaskId: null, secondsLeft: 0, totalSeconds: 0, sessionsCompleted: 0, endTimestampMs: null },
    });
  },

  fetchGamificacao: async () =>
  {
    try
    {
      const res = await apiFetch('/gamificacao/perfil');
      if ( !res.ok ) return;
      const data = await res.json();
      set({
        gamificacao: {
          xp: data.xp_total ?? data.xp ?? 0, xp_total: data.xp_total ?? data.xp ?? 0,
          streak_days: data.streak_atual ?? data.streak_days ?? 0,
          streak_atual: data.streak_atual ?? data.streak_days ?? 0,
          nivel: data.nivel ?? 0,
          ultima_sessao_foco: data.ultima_sessao_foco, ultima_sessao_data: data.ultima_sessao_data,
        },
      });
    }
    catch (e) { console.error('fetchGamificacao:', e); }
  },

  finalizarSessaoFoco: async (minutos, tarefaId) =>
  {
    try
    {
      const res = await apiFetch('/gamificacao/finalizar-sessao', {
        method: 'POST',
        body: JSON.stringify({ minutos, tarefa_id: tarefaId ?? null }),
      });
      if ( res.ok )
      {
        const data = await res.json();
        set({
          gamificacao: {
            xp: data.xp_total, xp_total: data.xp_total,
            streak_days: data.streak_atual, streak_atual: data.streak_atual,
            nivel: data.nivel,
            ultima_sessao_foco: new Date().toISOString(), ultima_sessao_data: data.ultima_sessao_data,
          },
        });
      }
      else if ( res.status === 401 )
      {
        (get as unknown as FullGet)().logout();
      }
    }
    catch (e) { console.error('finalizarSessaoFoco:', e); }
  },
});
