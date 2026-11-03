import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Modal } from '../../ui/Modal'
import {
  BALANCE_TONE_LABEL,
  balanceRunway,
  computeSaldoDisponivel,
  formatBRL,
  parseBrlNumber,
  type BalanceTone,
} from '@simply-life/shared'
import { CloseButton, Field, PressableScale, PrimaryButton, ProgressRing, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAccents } from '../../theme/useAccents'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'
import { useWebDesk } from '../dashboard/web/webBox'
import { WebHoverable } from '../dashboard/web/WebHoverable'
import { webStyle } from '../dashboard/web/webStyle'
import { WEB_DISPLAY_FONT } from '../dashboard/web/webTypography'
import { useDeskBigNumber } from './desk/deskLayout'

/**
 * Saldo da conta corrente, separado dos cartões. O estado é medido em dias de
 * folga. Cores da paleta: teal tranquilo, âmbar atenção, rosa só no negativo.
 * Toque para ajustar o saldo de hoje.
 */
export function FinanceBalancePanel()
{
  const { colors, space, radius } = useTheme()
  const accents = useAccents()
  const isGuest = useAuthStore((s) => s.isGuest)
  const txs = useDataStore((s) => s.finance)
  const cash = useDataStore((s) => s.cashAccount)
  const fixas = useDataStore((s) => s.contasFixas)
  const setCurrentBalance = useDataStore((s) => s.setCurrentBalance)
  const pos = computeSaldoDisponivel(cash, txs, fixas)
  const runway = balanceRunway({ disponivel: pos.disponivel, saldoInicial: cash.saldoInicial, txs, fixasMes: pos.fixasMes })
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const desk = useWebDesk()
  const bigNumber = useDeskBigNumber()

  const toneColor: Record<BalanceTone, string> = {
    sem_dados: colors.inkFaint,
    tranquilo: accents.data,
    atencao: colors.attention,
    apertado: colors.attention,
    negativo: colors.danger,
  }
  const tint = toneColor[runway.tone]
  const noData = runway.tone === 'sem_dados'
  const detail = noData
    ? 'Informe quanto tem hoje na conta para o app acompanhar.'
    : runway.tone === 'negativo'
      ? 'O saldo passou do zero. Vale olhar o que pode esperar.'
      : runway.days != null
        ? `Dá para uns ${runway.days} dia${runway.days === 1 ? '' : 's'} no ritmo do mês.`
        : 'Sem gastos no mês ainda.'

  const openSheet = () =>
  {
    setValue(noData ? '' : pos.disponivel.toFixed(2).replace('.', ','))
    setMsg(null)
    setOpen(true)
  }

  const save = async () =>
  {
    const v = parseBrlNumber(value)
    if (v == null)
    {
      setMsg('Digite um valor, por exemplo 1.250,00.')
      return
    }
    setSaving(true)
    const res = await setCurrentBalance(v, isGuest)
    setSaving(false)
    if (!res.ok)
    {
      setMsg(res.error ?? 'Não consegui salvar.')
      return
    }
    setOpen(false)
  }

  // computador: bloco de painel (sem caixa própria), número grande e link para ajustar
  const deskView = (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text variant="section" style={{ fontSize: 19, lineHeight: 26 }}>Saldo da conta</Text>
        <WebHoverable
          onPress={openSheet}
          accessibilityLabel={noData ? 'Informar saldo de hoje' : 'Ajustar saldo de hoje'}
          style={(hovered) => webStyle({ paddingVertical: 4, cursor: 'pointer', opacity: hovered ? 0.8 : 1 })}
        >
          <Text variant="caption" style={{ color: colors.axel, fontFamily: 'Lexend_500Medium' }}>
            {noData ? 'Informar' : 'Ajustar'}
          </Text>
        </WebHoverable>
      </View>
      <Text style={{ fontFamily: WEB_DISPLAY_FONT, ...bigNumber, color: colors.ink, fontVariant: ['tabular-nums'] }}>
        {noData ? 'Informe seu saldo' : formatBRL(pos.disponivel)}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <View style={{ paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999, borderWidth: 1, borderColor: tint }}>
          <Text variant="label" color={tint}>{BALANCE_TONE_LABEL[runway.tone]}</Text>
        </View>
        <Text variant="caption" muted style={{ flexShrink: 1 }}>{detail}</Text>
      </View>
      {!noData ? (
        <View style={{ flexDirection: 'row', columnGap: 32, rowGap: 8, flexWrap: 'wrap', paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.hairline }}>
          <View style={{ gap: 2 }}>
            <Text variant="label" muted>Entrou no mês</Text>
            <Text variant="body" color={colors.health} style={{ fontFamily: 'Lexend_500Medium', fontVariant: ['tabular-nums'] }}>
              {formatBRL(pos.receitas)}
            </Text>
          </View>
          <View style={{ gap: 2 }}>
            <Text variant="label" muted>Saiu da conta</Text>
            <Text variant="body" style={{ fontFamily: 'Lexend_500Medium', fontVariant: ['tabular-nums'] }}>
              {formatBRL(pos.despesas)}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  )

  return (
    <>
      {desk ? deskView : (
        <View style={{ gap: 16 }}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Saldo da conta, ${formatBRL(pos.disponivel)}. Toque para ajustar.`}
            onPress={openSheet}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
          >
            <ProgressRing
              progress={runway.days == null ? (noData ? 0 : 100) : Math.min(100, Math.round((runway.days / 30) * 100))}
              size={64}
              strokeWidth={7}
              color={tint}
              trackColor={colors.fill}
              centerLabel={runway.days == null ? (noData ? '—' : 'ok') : `${Math.min(runway.days, 99)}d`}
              labelColor={colors.ink}
            />
            <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <Text variant="caption" muted>Saldo da conta</Text>
                <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
                  {noData ? 'Informar' : 'Ajustar'}
                </Text>
              </View>
              <Text variant="bodyStrong" style={{ fontSize: 24, lineHeight: 28, fontVariant: ['tabular-nums'] }}>
                {noData ? 'Informe seu saldo' : formatBRL(pos.disponivel)}
              </Text>
              <Text variant="caption" muted numberOfLines={2}>
                {BALANCE_TONE_LABEL[runway.tone]}. {detail}
              </Text>
            </View>
          </PressableScale>
          {!noData ? (
            <View
              style={{
                flexDirection: 'row',
                borderTopWidth: 1,
                borderTopColor: colors.hairline,
                paddingTop: 12,
              }}
            >
              {[
                { label: 'Entrou', value: formatBRL(pos.receitas) },
                { label: 'Saiu', value: formatBRL(pos.despesas) },
              ].map((item, i) => (
                <View
                  key={item.label}
                  style={{
                    flex: 1,
                    gap: 2,
                    paddingLeft: i === 0 ? 0 : 12,
                    borderLeftWidth: i === 0 ? 0 : 1,
                    borderLeftColor: colors.hairline,
                  }}
                >
                  <Text variant="bodyStrong" style={{ fontSize: 16, lineHeight: 22, fontVariant: ['tabular-nums'] }}>
                    {item.value}
                  </Text>
                  <Text variant="micro" muted>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      )}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={() => setOpen(false)} accessibilityLabel="Fechar" />
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            padding: space.lg,
            paddingBottom: space.xl,
            gap: space.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="section">Saldo de hoje</Text>
              <Text variant="caption" muted>
                Quanto tem agora na conta corrente. O app ajusta o ponto de partida para bater.
              </Text>
            </View>
            <CloseButton onPress={() => setOpen(false)} />
          </View>
          <Field
            label="Saldo (R$)"
            keyboardType="decimal-pad"
            value={value}
            onChangeText={setValue}
            placeholder="1.250,00"
            autoFocus
          />
          {msg ? <Text variant="caption" color={colors.danger}>{msg}</Text> : null}
          <PrimaryButton label="Salvar saldo" loading={saving} onPress={() => void save()} />
        </View>
      </Modal>
    </>
  )
}
