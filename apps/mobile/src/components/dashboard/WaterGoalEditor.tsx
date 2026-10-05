import { useState } from 'react'
import { View } from 'react-native'
import {
  AGUA_ML_OPTIONS,
  AGUA_LITROS_OPTIONS,
  aguaMlPorCopo,
  aguaMetaCopos,
  aguaMetaMl,
  findHabit,
} from '@simply-life/shared'
import { Text, PressableScale, Field, PrimaryButton, CloseButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'

const ML_MIN = 50
const ML_MAX = 1000
const LITROS_MIN = 0.5
const LITROS_MAX = 6

const litrosLabel = (l: number) => `${String(Math.round(l * 100) / 100).replace('.', ',')} L`

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void })
{
  const { colors } = useTheme()
  return (
    <PressableScale
      onPress={onPress}
      accessibilityState={{ selected: active }}
      style={{
        minHeight: 40,
        paddingHorizontal: 12,
        borderRadius: 999,
        justifyContent: 'center',
        backgroundColor: active ? colors.health : colors.elevated,
      }}
    >
      <Text variant="caption" style={{ fontWeight: '700', color: active ? colors.canvas : colors.ink }}>
        {label}
      </Text>
    </PressableScale>
  )
}

/** Campo "Outro valor": aparece ao tocar no chip e salva com "Usar". */
function CustomValue({
  label,
  placeholder,
  hint,
  parse,
  onSave,
  onCancel,
}: {
  label: string
  placeholder: string
  hint: string
  parse: (text: string) => number | null
  onSave: (value: number) => void
  onCancel: () => void
})
{
  const { colors } = useTheme()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const save = () =>
  {
    const v = parse(text)
    if (v == null) return setError(hint)
    onSave(v)
  }
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <Field
            label={label}
            placeholder={placeholder}
            keyboardType="decimal-pad"
            value={text}
            onChangeText={(t) =>
            {
              setText(t)
              setError(null)
            }}
            onSubmitEditing={save}
          />
        </View>
        <PrimaryButton label="Usar" size="sm" disabled={!text.trim()} onPress={save} />
        <PrimaryButton label="Cancelar" size="sm" variant="ghost" onPress={onCancel} />
      </View>
      <Text variant="micro" color={error ? colors.danger : colors.inkMuted}>{error ?? hint}</Text>
    </View>
  )
}

const num = (t: string) =>
{
  const n = Number(t.replace(/[^\d,.]/g, '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Tamanho do copo e meta do dia (casa / Saúde): opções prontas ou um valor seu. */
export function WaterGoalEditor({ onClose }: { onClose?: () => void })
{
  const isGuest = useAuthStore((s) => s.isGuest)
  const habits = useDataStore((s) => s.habits) ?? []
  const patchAguaHabit = useDataStore((s) => s.patchAguaHabit)
  const [customMl, setCustomMl] = useState(false)
  const [customLitros, setCustomLitros] = useState(false)
  const agua = findHabit(habits, 'agua')
  const ml = aguaMlPorCopo(agua)
  const litrosAtuais = aguaMetaMl(agua) / 1000

  // a meta fica em ml, do jeito que a pessoa escolheu; o copo só muda quantos copos ela tem
  const setMl = (next: number) =>
    void patchAguaHabit({
      mlPorCopo: next,
      metaDiaria: aguaMetaCopos(litrosAtuais, next),
      metaMl: Math.round(litrosAtuais * 1000),
    }, isGuest)
  const setLitros = (l: number) =>
    void patchAguaHabit({ metaDiaria: aguaMetaCopos(l, ml), metaMl: Math.round(l * 1000) }, isGuest)

  const mlIsPreset = (AGUA_ML_OPTIONS as readonly number[]).includes(ml)
  const litrosIsPreset = AGUA_LITROS_OPTIONS.some((l) => Math.abs(litrosAtuais - l) < 0.05)

  return (
    <View style={{ gap: 12 }}>
      {onClose ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text variant="bodyStrong" style={{ flex: 1 }}>Ajustar hidratação</Text>
          <CloseButton onPress={onClose} label="Fechar ajustes da água" size={32} />
        </View>
      ) : null}

      <Text variant="caption" muted>
        Tamanho do copo
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {AGUA_ML_OPTIONS.map((opt) => (
          <Chip key={opt} label={`${opt} ml`} active={ml === opt} onPress={() => setMl(opt)} />
        ))}
        <Chip
          label={mlIsPreset ? 'Outro' : `${ml} ml`}
          active={!mlIsPreset || customMl}
          onPress={() => setCustomMl(true)}
        />
      </View>
      {customMl ? (
        <CustomValue
          label="Seu copo (ml)"
          placeholder="Ex.: 350"
          hint={`De ${ML_MIN} a ${ML_MAX} ml.`}
          parse={(t) =>
          {
            const v = num(t)
            return v != null && v >= ML_MIN && v <= ML_MAX ? Math.round(v) : null
          }}
          onSave={(v) =>
          {
            setMl(v)
            setCustomMl(false)
          }}
          onCancel={() => setCustomMl(false)}
        />
      ) : null}

      <Text variant="caption" muted>
        Meta do dia
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {AGUA_LITROS_OPTIONS.map((l) => (
          <Chip key={l} label={litrosLabel(l)} active={Math.abs(litrosAtuais - l) < 0.05} onPress={() => setLitros(l)} />
        ))}
        <Chip
          label={litrosIsPreset ? 'Outra' : litrosLabel(litrosAtuais)}
          active={!litrosIsPreset || customLitros}
          onPress={() => setCustomLitros(true)}
        />
      </View>
      {customLitros ? (
        <CustomValue
          label="Sua meta (litros)"
          placeholder="Ex.: 2,2"
          hint={`De ${String(LITROS_MIN).replace('.', ',')} a ${LITROS_MAX} litros. Com copo de ${ml} ml, o app conta os copos arredondando.`}
          parse={(t) =>
          {
            const v = num(t)
            return v != null && v >= LITROS_MIN && v <= LITROS_MAX ? v : null
          }}
          onSave={(v) =>
          {
            setLitros(v)
            setCustomLitros(false)
          }}
          onCancel={() => setCustomLitros(false)}
        />
      ) : null}
    </View>
  )
}
