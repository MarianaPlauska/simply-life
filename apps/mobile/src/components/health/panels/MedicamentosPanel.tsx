import { useState } from 'react'
import { View } from 'react-native'
import {
  Card,
  PrimaryButton,
  CheckRow,
  EmptyState,
  IconBadge,
  StatusPill,
  SectionHeader,
  Field,
  Text,
} from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useDataStore } from '../../../store/dataStore'
import { useAuthStore } from '../../../store/authStore'
import { medsTakenCount, sortMedsByTime, validateMedDraft } from '@simply-life/shared'

export function MedicamentosPanel()
{
  const { colors, space } = useTheme()
  const medicamentos = useDataStore((s) => s.medicamentos)
  const toggleMedicamento = useDataStore((s) => s.toggleMedicamento)
  const addMedicamento = useDataStore((s) => s.addMedicamento)
  const removeMedicamento = useDataStore((s) => s.removeMedicamento)
  const isGuest = useAuthStore((s) => s.isGuest)
  const [nome, setNome] = useState('')
  const [horario, setHorario] = useState('08:00')
  const [error, setError] = useState('')
  const pillBtn = { borderRadius: 999 as const }
  const sorted = sortMedsByTime(medicamentos)
  const taken = medsTakenCount(sorted)
  const total = sorted.length
  const done = total > 0 && taken >= total

  return (
    <View style={{ gap: space.md }}>
      <Card tone="elevated" style={{ gap: space.md, borderRadius: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <IconBadge name="medical" color={colors.health} size={44} iconSize={22} />
          <View style={{ flex: 1, gap: 6 }}>
            <SectionHeader title="Medicamentos" subtitle="Doses de hoje" />
            <StatusPill
              label={total ? `${taken}/${total} doses` : 'Pendente'}
              color={done ? colors.health : colors.axel}
            />
          </View>
        </View>

        {total === 0 ? (
          <EmptyState
            title="Nenhum remédio listado"
            body="Cadastre abaixo com nome e horário."
            icon="medical-outline"
          />
        ) : (
          sorted.map((med, i) => (
            <View key={med.id} style={{ gap: 4 }}>
              <CheckRow
                title={med.nome}
                subtitle={`${med.horario} · dose`}
                done={med.tomado}
                onToggle={() => void toggleMedicamento(med.id, isGuest)}
                showSeparator={i < sorted.length - 1}
              />
              <PrimaryButton
                label="Remover"
                variant="link"
                size="sm"
                onPress={() => void removeMedicamento(med.id, isGuest)}
              />
            </View>
          ))
        )}
      </Card>

      <Card tone="elevated" style={{ gap: space.sm, borderRadius: 18 }}>
        <Text variant="section">Novo medicamento</Text>
        <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Vitamina D" />
        <Field
          label="Horário (HH:MM)"
          value={horario}
          onChangeText={setHorario}
          placeholder="08:00"
        />
        {error ? (
          <Text variant="caption" color={colors.danger}>
            {error}
          </Text>
        ) : null}
        <PrimaryButton
          label="Cadastrar"
          style={pillBtn}
          onPress={() =>
          {
            const err = validateMedDraft({ nome, horario })
            if (err)
            {
              setError(err)
              return
            }
            setError('')
            void addMedicamento(nome.trim(), horario.trim(), isGuest)
            setNome('')
          }}
        />
      </Card>
    </View>
  )
}
