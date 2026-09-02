import { useEffect, useState } from 'react'
import { Modal, Pressable, Switch, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import type { FinanceCard } from '@simply-life/shared'
import { Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { CreditCardVisual } from './CreditCardVisual'
import { tabBarScreenPadding } from '../../ui/chrome'

type Prefs = {
  onlinePayments: boolean
  atm: boolean
  contactless: boolean
}

type Props = {
  card: FinanceCard | null
  visible: boolean
  onClose: () => void
}

type ToggleRow = {
  id: keyof Prefs | 'lock'
  label: string
  hint: string
  icon: keyof typeof Ionicons.glyphMap
}

const ROWS: ToggleRow[] = [
  {
    id: 'lock',
    label: 'Bloquear cartão',
    hint: 'Impede novas compras até desbloquear',
    icon: 'lock-closed-outline',
  },
  {
    id: 'onlinePayments',
    label: 'Pagamentos online',
    hint: 'Compras em sites e apps',
    icon: 'globe-outline',
  },
  {
    id: 'atm',
    label: 'Saque em ATM',
    hint: 'Retiradas em caixas eletrônicos',
    icon: 'cash-outline',
  },
  {
    id: 'contactless',
    label: 'Pagamento por aproximação',
    hint: 'Contactless / NFC',
    icon: 'wifi-outline',
  },
]

/**
 * Sheet "My Cards" — cartão em destaque + toggles de controle.
 */
export function FinanceCardDetailSheet({ card, visible, onClose }: Props)
{
  const { colors, space, radius, elevation } = useTheme()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const setStatus = useDataStore((s) => s.setFinanceCardStatus)
  const [prefs, setPrefs] = useState<Prefs>({
    onlinePayments: true,
    atm: true,
    contactless: true,
  })

  useEffect(() =>
  {
    if (!card) return
    // Preferências locais por cartão (demo); bloqueio vem do status
    setPrefs({
      onlinePayments: true,
      atm: true,
      contactless: true,
    })
  }, [card?.id])

  if (!card) return null

  const cardW = Math.min(width - 48, 340)
  const locked = card.status === 'bloqueado'
  const bottomPad = tabBarScreenPadding(insets.bottom)

  const onToggle = (id: ToggleRow['id'], value: boolean) =>
  {
    if (id === 'lock')
    {
      setStatus(card.id, value ? 'bloqueado' : 'ativo')
      return
    }
    setPrefs((p) => ({ ...p, [id]: value }))
  }

  const valueFor = (id: ToggleRow['id']) =>
  {
    if (id === 'lock') return locked
    return prefs[id]
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay }}>
        <Pressable
          accessibilityLabel="Fechar"
          onPress={onClose}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <View
          style={{
            backgroundColor: colors.elevated,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: space.md,
            paddingHorizontal: space.lg,
            paddingBottom: bottomPad,
            gap: space.lg,
            maxHeight: '92%',
            ...elevation.hero,
          }}
        >
          <View style={{ alignItems: 'center', gap: space.sm }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 999,
                backgroundColor: colors.hairlineStrong,
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <Text variant="section">Meu cartão</Text>
              <PressableScale
                onPress={onClose}
                accessibilityLabel="Fechar detalhe"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surface,
                }}
              >
                <Ionicons name="close" size={20} color={colors.inkMuted} />
              </PressableScale>
            </View>
          </View>

          <View style={{ alignItems: 'center' }}>
            <CreditCardVisual card={card} width={cardW} selected />
          </View>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.sheet,
              paddingVertical: space.sm,
              borderWidth: 1,
              borderColor: colors.hairline,
              overflow: 'hidden',
            }}
          >
            {ROWS.map((row, i) =>
            {
              const on = valueFor(row.id)
              return (
                <View
                  key={row.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: 64,
                    paddingHorizontal: space.md,
                    paddingVertical: 10,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: colors.hairline,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: colors.elevated,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name={row.icon}
                      size={18}
                      color={row.id === 'lock' && on ? colors.danger : colors.ink}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong">{row.label}</Text>
                    <Text variant="caption" muted>
                      {row.hint}
                    </Text>
                  </View>
                  <Switch
                    value={on}
                    onValueChange={(v) => onToggle(row.id, v)}
                    trackColor={{
                      false: colors.hairlineStrong,
                      true: colors.axel,
                    }}
                    thumbColor={colors.elevated}
                    accessibilityLabel={row.label}
                  />
                </View>
              )
            })}
          </View>
        </View>
      </View>
    </Modal>
  )
}
