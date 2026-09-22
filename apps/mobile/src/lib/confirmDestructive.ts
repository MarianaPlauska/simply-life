import { Alert, Platform } from 'react-native'

/** Confirma ação irreversível (web e nativo). */
export function confirmDestructive(
  title: string,
  message: string,
  onConfirm: () => void,
): void
{
  if (Platform.OS === 'web')
  {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`))
    {
      onConfirm()
    }
    return
  }
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: onConfirm },
  ])
}
