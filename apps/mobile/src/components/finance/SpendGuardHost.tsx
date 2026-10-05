import { useEffect, useState } from 'react'
import { Modal, Pressable, View } from 'react-native'
import { formatBRL, monthNamePt, localTodayIso, SPEND_GUARD_FIRM_SECONDS } from '@simply-life/shared'
import { Icon, PrimaryButton, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useSpendGuardStore, type SpendGuardHostId } from '../../store/spendGuardStore'
import { hapticLight } from '../../lib/haptics'

/**
 * Aviso "esse gasto aperta o mês". Um host na raiz e um dentro de cada ficha que lança gasto
 * (Modal dentro de Modal abre por cima no iOS e no Android). Mostra a conta do mês que fica pior.
 */
export function SpendGuardHost({ host = 'root' }: { host?: SpendGuardHostId })
{
  const { colors, space, radius, elevation } = useTheme()
  const request = useSpendGuardStore((s) => s.request)
  const answer = useSpendGuardStore((s) => s.answer)
  const mine = request?.host === host ? request : null
  const [wait, setWait] = useState(0)

  // modo Firme: "Salvar mesmo assim" libera depois de alguns segundos
  useEffect(() =>
  {
    if (!mine) return
    setWait(mine.firme ? SPEND_GUARD_FIRM_SECONDS : 0)
    if (!mine.firme) return
    const id = setInterval(() => setWait((w) => (w > 0 ? w - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [mine])

  if (!mine) return null
  const pior = mine.check.pior
  const thisYm = localTodayIso().slice(0, 7)
  const mes = pior ? (pior.ym === thisYm ? 'Fim deste mês' : `Em ${monthNamePt(pior.ym)}`) : ''

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => answer(false)}>
      <Pressable
        accessibilityLabel="Não gastar agora"
        onPress={() => answer(false)}
        style={{ flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: space.lg }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          accessibilityRole="alert"
          style={{
            width: '100%',
            maxWidth: 380,
            backgroundColor: colors.elevated,
            borderRadius: radius.card,
            borderWidth: 1,
            borderColor: colors.cardRim,
            padding: space.lg,
            gap: space.md,
            ...elevation.fab,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              backgroundColor: `${colors.attention}1F`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="wallet-outline" size={24} color={colors.attention} weight="duotone" />
          </View>
          <View style={{ gap: 6 }}>
            <Text variant="section">{mine.titulo}</Text>
            <Text variant="body" muted>{mine.mensagem}</Text>
          </View>
          {pior ? (
            <View style={{ gap: 8, padding: 12, borderRadius: 12, backgroundColor: colors.hairline }}>
              <Text variant="caption" muted>{mes}</Text>
              <Row label="Sobra prevista" value={formatBRL(pior.sobraAntes)} />
              <Row label="Esse gasto" value={`-${formatBRL(pior.impacto)}`} />
              <Row
                label="Depois dele"
                value={pior.sobraDepois < 0 ? `faltam ${formatBRL(Math.abs(pior.sobraDepois))}` : formatBRL(pior.sobraDepois)}
                strong
                color={pior.sobraDepois < 0 ? colors.attention : undefined}
              />
            </View>
          ) : null}
          <Text variant="micro" muted>
            A conta usa seu saldo, as contas que ainda vencem, as parcelas e o salário previsto. A decisão é sua.
          </Text>
          <View style={{ gap: space.sm }}>
            <PrimaryButton label="Não gastar agora" onPress={() => answer(false)} />
            <PrimaryButton
              label={wait > 0 ? `Salvar mesmo assim (${wait})` : 'Salvar mesmo assim'}
              variant="ghost"
              disabled={wait > 0}
              onPress={() =>
              {
                hapticLight()
                answer(true)
              }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function Row({ label, value, strong, color }: { label: string; value: string; strong?: boolean; color?: string })
{
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text variant={strong ? 'bodyStrong' : 'body'} style={{ flex: 1, fontSize: 14 }}>{label}</Text>
      <Text variant={strong ? 'bodyStrong' : 'body'} style={{ fontSize: 14 }} color={color}>{value}</Text>
    </View>
  )
}
