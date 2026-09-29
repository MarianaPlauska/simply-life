import { useState } from 'react'
import { View } from 'react-native'
import { ACADEMY_WEEK_DAYS, formatSleepHours, validateMedDraft } from '@simply-life/shared'
import { Text, Chip, Field, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { isModuleOn, type AppModuleId } from '../../lib/appModules'
import { OnbBlock } from './OnbStep'
import { OnbNumber } from './OnbNumber'
import type { HealthDraft } from './startDrafts'

type Props = {
  value: HealthDraft
  onChange: (next: HealthDraft) => void
  enabled: AppModuleId[] | undefined
  /** Em Preferências os remédios são editados em Saúde → Cuidados */
  showMeds?: boolean
}

/** Metas de saúde: só os blocos dos módulos escolhidos. */
export function HealthStartForm({ value, onChange, enabled, showMeds = true }: Props)
{
  const { space, colors } = useTheme()
  const set = (p: Partial<HealthDraft>) => onChange({ ...value, ...p })
  const on = (id: AppModuleId) => isModuleOn(enabled, id)
  const [medName, setMedName] = useState('')
  const [medTime, setMedTime] = useState('08:00')
  const [medError, setMedError] = useState('')

  return (
    <View style={{ gap: space.md }}>
      {on('water') ? (
        <OnbBlock title="Água" hint="Quantos copos por dia e o tamanho do seu copo.">
          <OnbNumber
            label="Meta do dia"
            value={value.waterGoal}
            onChange={(v) => set({ waterGoal: v })}
            min={2}
            max={20}
            format={(v) => `${v} copos`}
          />
          <OnbNumber
            label="Tamanho do copo"
            value={value.cupMl}
            onChange={(v) => set({ cupMl: v })}
            step={50}
            min={100}
            max={1000}
            format={(v) => `${v} ml`}
          />
          <Text variant="caption" muted>
            Dá {((value.waterGoal * value.cupMl) / 1000).toFixed(1).replace('.', ',')} litros por dia.
          </Text>
        </OnbBlock>
      ) : null}

      {on('sleep') ? (
        <OnbBlock title="Sono" hint="Quantas horas você quer dormir por noite.">
          <OnbNumber
            label="Meta por noite"
            value={value.sleepGoal}
            onChange={(v) => set({ sleepGoal: v })}
            step={0.5}
            min={5}
            max={11}
            format={formatSleepHours}
          />
        </OnbBlock>
      ) : null}

      {on('food') ? (
        <OnbBlock title="Alimentação" hint="Meta de proteína. Se não souber, 1,6 g por quilo é uma referência comum.">
          <OnbNumber
            label="Proteína por dia"
            value={value.proteinGoal}
            onChange={(v) => set({ proteinGoal: v })}
            step={10}
            min={30}
            max={300}
            format={(v) => `${v} g`}
          />
        </OnbBlock>
      ) : null}

      {on('gym') ? (
        <OnbBlock title="Academia" hint="Em que dias você treina. Os exercícios você ajusta depois.">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {ACADEMY_WEEK_DAYS.map((d) =>
            {
              const active = value.gymDays.includes(d.key)
              return (
                <Chip
                  key={d.key}
                  label={d.label}
                  active={active}
                  onPress={() => set({
                    gymDays: active ? value.gymDays.filter((k) => k !== d.key) : [...value.gymDays, d.key],
                  })}
                />
              )
            })}
          </View>
          <Text variant="caption" muted>
            {value.gymDays.length
              ? `${value.gymDays.length} dia${value.gymDays.length === 1 ? '' : 's'} por semana.`
              : 'Nenhum dia escolhido: a semana fica de folga.'}
          </Text>
        </OnbBlock>
      ) : null}

      {on('meds') && showMeds ? (
        <OnbBlock title="Medicamentos" hint="Nome e horário. O app lembra, se você ligar os alertas.">
          {value.meds.map((m, i) => (
            <View key={`${m.nome}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text variant="body" style={{ flex: 1 }}>
                {m.nome} · {m.horario}
              </Text>
              <PrimaryButton
                label="Tirar"
                variant="link"
                size="sm"
                onPress={() => set({ meds: value.meds.filter((_, j) => j !== i) })}
              />
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
            <View style={{ flex: 2 }}>
              <Field label="Nome" value={medName} onChangeText={setMedName} placeholder="Vitamina D" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Horário" value={medTime} onChangeText={setMedTime} placeholder="08:00" />
            </View>
          </View>
          {medError ? (
            <Text variant="caption" color={colors.danger}>
              {medError}
            </Text>
          ) : null}
          <PrimaryButton
            label="Adicionar remédio"
            variant="secondary"
            size="sm"
            icon="add"
            onPress={() =>
            {
              const err = validateMedDraft({ nome: medName, horario: medTime })
              if (err)
              {
                setMedError(err)
                return
              }
              setMedError('')
              set({ meds: [...value.meds, { nome: medName.trim(), horario: medTime.trim() }] })
              setMedName('')
            }}
          />
        </OnbBlock>
      ) : null}
    </View>
  )
}
