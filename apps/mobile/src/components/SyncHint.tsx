import { Text } from '../ui'
import { useTheme } from '../theme/ThemeProvider'
import { useDataStore } from '../store/dataStore'
import { useAuthStore } from '../store/authStore'

export function SyncHint({ color }: { color?: string })
{
  const { colors } = useTheme()
  const source = useDataStore((s) => s.source)
  const error = useDataStore((s) => s.error)
  const loading = useDataStore((s) => s.loading)
  const isGuest = useAuthStore((s) => s.isGuest)

  let label = ''
  if (loading && source === 'idle') label = 'Sincronizando…'
  else if (error) label = error
  else if (isGuest || source === 'demo') label = 'Modo demonstração'

  if (!label) return null

  return (
    <Text variant="micro" color={color ?? (error ? colors.danger : colors.inkMuted)}>
      {label}
    </Text>
  )
}
