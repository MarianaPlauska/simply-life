import { type ReactNode } from 'react'
import { View } from 'react-native'
import { Text, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  step: number
  total: number
  kicker?: string
  title: string
  subtitle?: string
  children: ReactNode
  onNext: () => void
  nextLabel?: string
  canNext?: boolean
  loading?: boolean
  onSkip?: () => void
  skipLabel?: string
  onBack?: () => void
}

/**
 * Moldura de cada passo das boas-vindas: progresso fino, título Fraunces,
 * conteúdo e rodapé fixo (Continuar em coral, Pular e Voltar discretos).
 */
export function OnbStep({
  step,
  total,
  kicker,
  title,
  subtitle,
  children,
  onNext,
  nextLabel = 'Continuar',
  canNext = true,
  loading,
  onSkip,
  skipLabel = 'Pular',
  onBack,
}: Props)
{
  const { colors, space, radius, mode } = useTheme()
  const done = mode === 'dark' ? colors.brandInk : colors.brand

  return (
    <View style={{ gap: space.lg }}>
      <View style={{ gap: space.sm }}>
        <View
          style={{ flexDirection: 'row', gap: 4 }}
          accessibilityRole="progressbar"
          accessibilityValue={{ now: step + 1, min: 1, max: total }}
        >
          {Array.from({ length: total }).map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: radius.pill,
                backgroundColor: i < step ? done : i === step ? colors.axelFill : colors.hairline,
              }}
            />
          ))}
        </View>
        <Text variant="caption" muted>
          {kicker ? `${kicker} · ` : ''}Passo {step + 1} de {total}
        </Text>
      </View>

      <View style={{ gap: space.xs }}>
        <Text variant="hero" style={{ fontSize: 26, lineHeight: 34, letterSpacing: -0.25 }}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="body" muted>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={{ gap: space.md }}>{children}</View>

      <View style={{ gap: space.sm, marginTop: space.sm }}>
        <PrimaryButton label={nextLabel} disabled={!canNext} loading={loading} onPress={onNext} />
        <View style={{ flexDirection: 'row', justifyContent: onBack ? 'space-between' : 'center', alignItems: 'center' }}>
          {onBack ? <PrimaryButton label="Voltar" variant="link" size="sm" icon="chevron-back" onPress={onBack} /> : null}
          {onSkip ? <PrimaryButton label={skipLabel} variant="link" size="sm" onPress={onSkip} /> : null}
        </View>
      </View>
    </View>
  )
}

/** Título de bloco dentro de um passo (Lexend, nível "section"). */
export function OnbBlock({ title, hint, children }: { title: string; hint?: string; children: ReactNode })
{
  const { space, colors } = useTheme()
  return (
    <View
      style={{
        gap: space.sm,
        padding: space.md,
        borderRadius: 20,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.hairline,
      }}
    >
      <View style={{ gap: 2 }}>
        <Text variant="bodyStrong">{title}</Text>
        {hint ? (
          <Text variant="caption" muted>
            {hint}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  )
}
