import { type ReactNode } from 'react'
import { View } from 'react-native'
import { Card, Text, Icon, type IconName } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'

/** Número grande com legenda: a leitura em 5 segundos do relatório. */
export function ReportStat({ value, label, hint }: { value: string; label: string; hint?: string })
{
  const { colors, space, radius } = useTheme()
  return (
    <View
      style={{
        flex: 1,
        minWidth: 96,
        gap: 4,
        padding: space.md,
        borderRadius: radius.control,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.hairline,
      }}
    >
      <Text variant="hero" style={{ fontSize: 22, lineHeight: 28 }}>
        {value}
      </Text>
      <Text variant="caption" muted>
        {label}
      </Text>
      {hint ? (
        <Text variant="micro" muted>
          {hint}
        </Text>
      ) : null}
    </View>
  )
}

/** Card de seção do relatório (título Lexend, legenda opcional). */
export function ReportCard({ title, hint, children, right }: { title: string; hint?: string; children: ReactNode; right?: ReactNode })
{
  const { space } = useTheme()
  return (
    <Card tone="elevated" style={{ gap: space.md, padding: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="section">{title}</Text>
          {hint ? (
            <Text variant="caption" muted>
              {hint}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </Card>
  )
}

/** Linha de lista com ícone e detalhe à direita. */
export function ReportRow({
  icon,
  tint,
  title,
  detail,
  right,
  last,
}: {
  icon: IconName
  tint: string
  title: string
  detail?: string
  right?: string
  last?: boolean
})
{
  const { colors, space } = useTheme()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingVertical: 10,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.hairline,
      }}
    >
      <Icon name={icon} size={18} color={tint} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text variant="body" numberOfLines={2}>
          {title}
        </Text>
        {detail ? (
          <Text variant="caption" muted>
            {detail}
          </Text>
        ) : null}
      </View>
      {right ? (
        <Text variant="caption" muted>
          {right}
        </Text>
      ) : null}
    </View>
  )
}

export function dayLabel(iso: string, today: string): string
{
  if (iso === today) return 'Hoje'
  const d = new Date(`${iso}T12:00:00`)
  const t = new Date(`${today}T12:00:00`)
  if (Math.round((d.getTime() - t.getTime()) / 86_400_000) === 1) return 'Amanhã'
  const s = d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }).replace('.', '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function shortDate(iso: string): string
{
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')
}
