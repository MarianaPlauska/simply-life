import { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { rotinaSugestaoTexto, sugerirRotinas, todayIso } from '@simply-life/shared'
import { Icon, PrimaryButton, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useMeuMundoStore } from '../../store/meuMundoStore'

/** "Você colocou Academia às 7h nas últimas 3 segundas. Quer que isso se repita?" */
export function MundoRotinaCard()
{
  const { colors, space } = useTheme()
  const blocos = useMeuMundoStore((s) => s.blocos)
  const rotinasOff = useMeuMundoStore((s) => s.rotinasOff)
  const adoptRotina = useMeuMundoStore((s) => s.adoptRotina)
  const dismissRotina = useMeuMundoStore((s) => s.dismissRotina)
  const [busy, setBusy] = useState(false)
  const sug = useMemo(() => sugerirRotinas(blocos, todayIso(), rotinasOff)[0], [blocos, rotinasOff])
  if (!sug) return null

  const { frase, botao } = rotinaSugestaoTexto(sug)
  return (
    <View
      style={{
        gap: space.sm,
        paddingVertical: space.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: colors.hairline,
      }}
    >
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Icon name="repeat-outline" size={20} color={colors.axel} />
        <Text variant="body" style={{ flex: 1 }}>{frase}</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingLeft: 28 }}>
        <PrimaryButton
          size="sm"
          label={botao}
          disabled={busy}
          onPress={async () =>
          {
            setBusy(true)
            await adoptRotina(sug)
            setBusy(false)
          }}
        />
        <PrimaryButton size="sm" variant="secondary" label="Agora não" onPress={() => void dismissRotina(sug.chave)} />
      </View>
    </View>
  )
}
