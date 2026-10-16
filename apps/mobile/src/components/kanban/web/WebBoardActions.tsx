import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Icon, type IconName } from '../../../ui/Icon'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useBoardReplanStore } from '../../../store/boardReplanStore'
import { useOrchestratorPrefsStore } from '../../../store/orchestratorPrefsStore'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'
import { LEX, useRowHover } from './kanbanWeb'

function ToolbarLink({
  icon,
  label,
  onPress,
  disabled,
  muted,
  hint,
}: {
  icon: IconName
  label: string
  hint?: string
  onPress: () => void
  disabled?: boolean
  muted?: boolean
})
{
  const { colors } = useTheme()
  const hoverBg = useRowHover()
  const ink = muted ? colors.inkMuted : colors.axel
  return (
    <WebHoverable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={hint ?? label}
      style={(hovered) => webStyle({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 34,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: hovered ? hoverBg : 'transparent',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'default' : 'pointer',
      })}
    >
      <Icon name={icon} size={16} color={ink} />
      <Text style={[LEX.medium, { fontSize: 14, lineHeight: 20, color: ink }]}>{label}</Text>
    </WebHoverable>
  )
}

/** Ações do quadro na barra de abas (computador): Axel reorganiza, planejar amanhã, automático. */
export function WebBoardActions()
{
  const { colors } = useTheme()
  const router = useRouter()
  const running = useBoardReplanStore((s) => s.running)
  const run = useBoardReplanStore((s) => s.run)
  const autoReplan = useOrchestratorPrefsStore((s) => s.autoReplan)
  const patchPrefs = useOrchestratorPrefsStore((s) => s.patch)

  return (
    <>
      <ToolbarLink
        icon="sparkles-outline"
        label={running ? 'Reorganizando…' : 'Reorganizar'}
        hint="Reorganizar o quadro com o Axel"
        disabled={running}
        onPress={() => void run('manual')}
      />
      <ToolbarLink icon="moon-outline" label="Planejar amanhã" onPress={() => router.push('/planejar-amanha')} />
      <WebHoverable
        onPress={() => patchPrefs({ autoReplan: !autoReplan })}
        accessibilityLabel="Reorganizar automaticamente"
        style={webStyle({ flexDirection: 'row', alignItems: 'center', gap: 8, height: 34, cursor: 'pointer' })}
      >
        {/* chave pequena: liga e desliga a reorganização automática */}
        <View
          style={{
            width: 30,
            height: 18,
            borderRadius: 9,
            padding: 2,
            backgroundColor: autoReplan ? colors.axelFill : colors.hairlineStrong,
            alignItems: autoReplan ? 'flex-end' : 'flex-start',
          }}
        >
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors.elevated }} />
        </View>
        <Text style={[LEX.regular, { fontSize: 14, lineHeight: 20, color: colors.inkMuted }]}>Automático</Text>
      </WebHoverable>
    </>
  )
}
