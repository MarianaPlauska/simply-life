// slice de onboarding — checklist de ativação para novos usuários
import type { StateCreator } from 'zustand';

export interface OnboardingSlice
{
  onboardingSteps: string[];
  onboardingDismissed: boolean;
  completeOnboardingStep: (step: string) => void;
  dismissOnboarding: () => void;
  resetOnboarding: () => void;
}

export const ONBOARDING_STEPS = [
  { id: 'create_task',       label: 'Criar primeira tarefa',   emoji: '✅', path: '/kanban' },
  { id: 'add_expense',       label: 'Registrar uma despesa',   emoji: '💰', path: '/planner' },
  { id: 'add_habit',         label: 'Registrar um hábito',     emoji: '💊', path: '/saude' },
  { id: 'activate_focus',    label: 'Ativar modo foco',        emoji: '🎯', path: '/foco' },
  { id: 'customize_sidebar', label: 'Personalizar sidebar',    emoji: '📌', path: '/configuracoes' },
] as const;

export const createOnboardingSlice: StateCreator<OnboardingSlice> = (set) => ({
  onboardingSteps: [],
  onboardingDismissed: false,

  completeOnboardingStep: (step) =>
    set((state) =>
    {
      if ( state.onboardingSteps.includes(step) ) return state;
      return { onboardingSteps: [...state.onboardingSteps, step] };
    }),

  dismissOnboarding: () => set({ onboardingDismissed: true }),

  resetOnboarding: () => set({ onboardingSteps: [], onboardingDismissed: false }),
});
