// slice de onboarding - checklist de ativação para novos usuários
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
  { id: 'dump_vida',         label: 'Despejar a cabeça',         path: '/' },
  { id: 'recompensa_irl',    label: 'Criar recompensa da vida real', path: '/' },
  { id: 'create_task',       label: 'Criar primeira tarefa',   path: '/kanban' },
  { id: 'add_expense',       label: 'Registrar uma despesa',   path: '/financeiro' },
  { id: 'register_mood',     label: 'Registrar como está hoje', path: '/saude#diario' },
  { id: 'add_habit',         label: 'Registrar um hábito',     path: '/saude' },
  { id: 'activate_focus',    label: 'Iniciar um treino',       path: '/saude#academia' },
  { id: 'customize_sidebar', label: 'Personalizar sidebar',    path: '/configuracoes' },
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
