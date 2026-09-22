import { useFocusStore } from '../store/focusStore'

/** Abre o timer de foco já vinculado a uma tarefa do Kanban. */
export function openFocusForTask(router: { push: (href: never) => void }, taskId: string): void
{
  useFocusStore.getState().setTargetTask(taskId)
  router.push(`/foco?taskId=${encodeURIComponent(taskId)}` as never)
}
