import { useConfirmStore } from '../store/confirmStore'

/** Confirma ação irreversível no diálogo do app (web e nativo), sem alert do navegador. */
export function confirmDestructive(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel?: string,
): void
{
  useConfirmStore.getState().ask({ title, message, onConfirm, confirmLabel })
}
