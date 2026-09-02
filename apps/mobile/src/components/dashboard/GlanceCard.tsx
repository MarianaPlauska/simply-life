import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { DashboardGlance } from '@simply-life/shared'
import { Text, Card } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useWorkspace } from '../../layout/useWorkspace'

type Props = {
  glance: DashboardGlance
  tint: string
}

/** Pastas coloridas estilo Drive — fundo lavado com a cor do módulo */
function folderWash(tint: string, dark: boolean): string
{
  // Tint hex → rgba suave; fallback se não for #RRGGBB
  if (!tint.startsWith('#') || tint.length < 7)
  {
    return dark ? 'rgba(255,106,43,0.16)' : 'rgba(160,92,61,0.12)'
  }
  const r = parseInt(tint.slice(1, 3), 16)
  const g = parseInt(tint.slice(3, 5), 16)
  const b = parseInt(tint.slice(5, 7), 16)
  return dark ? `rgba(${r},${g},${b},0.22)` : `rgba(${r},${g},${b},0.18)`
}

/**
 * Nível 2 — Áreas da vida.
 * Desktop: cards “Folders” coloridos; mobile: elevated neutro + barra.
 */
export function GlanceCard({ glance, tint }: Props)
{
  const { colors, space, mode } = useTheme()
  const { showRail } = useWorkspace()
  const pct = Math.max(0, Math.min(100, glance.progress ?? 0))
  const iconName = (glance.icon || 'ellipse-outline') as keyof typeof Ionicons.glyphMap
  const barColor = glance.tone === 'axel' ? colors.inkMuted : tint
  const valueColor = glance.tone === 'axel' ? colors.ink : tint

  if (showRail)
  {
    const wash = folderWash(barColor, mode === 'dark')
    return (
      <View
        style={{
          width: '100%',
          minHeight: 132,
          borderRadius: 18,
          padding: space.md,
          gap: 10,
          backgroundColor: wash,
          borderWidth: 1,
          borderColor: colors.hairline,
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.65)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={iconName} size={18} color={barColor} />
          </View>
          <Text variant="caption" numberOfLines={1} style={{ flex: 1, color: colors.inkMuted }}>
            {glance.label}
          </Text>
        </View>
        <Text
          variant="section"
          color={valueColor}
          numberOfLines={2}
          style={{ fontSize: 22, lineHeight: 26, fontWeight: '700' }}
        >
          {glance.value}
        </Text>
        <Text variant="micro" muted>
          {pct}% · atalho do dia
        </Text>
      </View>
    )
  }

  return (
    <Card
      tone="elevated"
      style={{
        width: '100%',
        gap: 8,
        paddingTop: space.md,
        paddingBottom: space.md + 6,
        paddingHorizontal: space.md,
        minHeight: 118,
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={iconName} size={16} color={barColor} />
        </View>
        <Text variant="caption" muted numberOfLines={1} style={{ flex: 1 }}>
          {glance.label}
        </Text>
      </View>

      <Text
        variant="section"
        color={valueColor}
        numberOfLines={2}
        style={{ fontSize: 20, lineHeight: 24 }}
      >
        {glance.value}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            flex: 1,
            height: 4,
            borderRadius: 999,
            backgroundColor: colors.hairline,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${pct}%`,
              borderRadius: 999,
              backgroundColor: barColor,
            }}
          />
        </View>
        <Text
          variant="caption"
          color={colors.inkMuted}
          style={{ fontSize: 11, minWidth: 28, textAlign: 'right' }}
        >
          {pct}%
        </Text>
      </View>
    </Card>
  )
}
