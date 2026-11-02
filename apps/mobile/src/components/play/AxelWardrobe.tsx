import { Pressable, View } from 'react-native'
import {
  AXEL_ACCESSORIES,
  axelForm,
  axelFormLabel,
  axelFormNext,
  type AxelForm,
} from '@simply-life/shared'
import { Text } from '../../ui'
import { AxelSun } from '../AxelSun'
import { useTheme } from '../../theme/ThemeProvider'
import { usePrefsStore } from '../../store/prefsStore'
import { gamificationLevel, useGamificationStore } from '../../store/gamificationStore'

const FORMS: AxelForm[] = ['broto', 'flor', 'girassol']

/** As três formas e as roupas. Comprar continua na loja, com as mesmas regras. */
export function AxelWardrobe()
{
  const { colors } = useTheme()
  const totalXp = useGamificationStore((s) => s.totalXp)
  const owned = useGamificationStore((s) => s.owned)
  const gold = useGamificationStore((s) => s.gold)
  const buyItem = useGamificationStore((s) => s.buyItem)
  const accessory = usePrefsStore((s) => s.prefs.axel_accessory)
  const patch = usePrefsStore((s) => s.patch)
  const { level } = gamificationLevel(totalXp)
  const current = axelForm(level)

  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 6 }}>
        <Text variant="caption" muted>Formas do AXEL</Text>
        <Text variant="body">
          Agora ele é {axelFormLabel(current).toLowerCase()}. {axelFormNext(level)}
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          {FORMS.map((form) =>
          {
            const on = form === current
            return (
              <View key={form} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
                <AxelSun
                  size={form === 'girassol' ? 86 : form === 'flor' ? 68 : 54}
                  form={form}
                  mood="calm"
                  label={axelFormLabel(form)}
                />
                <Text variant="caption" style={{ color: on ? colors.health : colors.inkMuted }}>
                  {axelFormLabel(form)}
                </Text>
              </View>
            )
          })}
        </View>
      </View>
      <View style={{ gap: 8, borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: 16 }}>
        <Text variant="caption" muted>Roupas</Text>
        <Text variant="caption" muted>{gold} moedas. Cada peça custa 40 e não sai depois de comprada.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {AXEL_ACCESSORIES.map((item) =>
          {
            const has = owned.includes(item.id)
            const worn = accessory === item.id
            return (
              <Pressable
                key={item.id}
                onPress={() =>
                {
                  if (!has)
                  {
                    void buyItem(item.id, item.coins)
                    return
                  }
                  void patch({ axel_accessory: worn ? null : item.id })
                }}
                accessibilityRole="button"
                accessibilityLabel={has ? item.label : `${item.label}, 40 moedas`}
                style={{ width: 88, alignItems: 'center', gap: 4, minHeight: 44 }}
              >
                <AxelSun size={64} form={current} accessory={item.id} mood="happy" label={item.label} />
                <Text variant="caption" style={{ color: worn ? colors.health : colors.ink, textAlign: 'center' }}>
                  {worn ? 'Usando' : has ? item.label : '40 moedas'}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    </View>
  )
}
