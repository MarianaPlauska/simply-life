import { useState } from 'react'
import { View } from 'react-native'
import {
  PrimaryButton,
  CheckRow,
  EmptyState,
  Field,
  Text,
} from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useDataStore } from '../../../store/dataStore'
import { useAuthStore } from '../../../store/authStore'
import { medsTakenCount, sortMedsByTime, validateMedDraft } from '@simply-life/shared'
import { HealthPanelHero } from '../HealthPanelHero'
import { HealthScreenSection } from '../HealthScreenSection'

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
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const pillBtn = { borderRadius: 999 as const }
  const sorted = sortMedsByTime(medicamentos)
  const taken = medsTakenCount(sorted)
  const total = sorted.length
  const done = total > 0 && taken >= total

  return (
    <View style={{ gap: space.md }}>
      <HealthPanelHero
        icon="medical"
        kicker="Medicamentos"
        headline={total ? `${taken}/${total} doses` : 'Nenhum cadastrado'}
        detail="Doses de hoje"
        pillLabel={total ? (done ? 'Tudo tomado' : 'Pendente') : 'Nenhum ainda'}
        pillColor={done ? colors.health : colors.axel}
      />

      {total === 0 ? (
        <EmptyState
          title="Nenhum remédio listado"
          body="Cadastre com nome e horário para marcar as doses do dia."
          icon="medical-outline"
        />
      ) : (
        <View>
          {sorted.map((med, i) => (
            <View key={med.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <CheckRow
                  title={med.nome}
                  subtitle={`${med.horario} · dose`}
                  done={med.tomado}
                  onToggle={() => void toggleMedicamento(med.id, isGuest)}
                  showSeparator={i < sorted.length - 1}
                />
              </View>
              {/* Remover só no modo editar: a lista do dia fica limpa para marcar doses */}
              {editing ? (
                <PrimaryButton
                  label="Remover"
                  variant="link"
                  size="sm"
                  onPress={() => void removeMedicamento(med.id, isGuest)}
                />
              ) : null}
            </View>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        {!adding && total > 0 ? (
          <PrimaryButton
            label="Adicionar medicamento"
            variant="secondary"
            size="sm"
            icon="add"
            onPress={() => setAdding(true)}
            style={pillBtn}
          />
        ) : null}
        {total > 0 ? (
          <PrimaryButton
            label={editing ? 'Pronto' : 'Editar lista'}
            variant="link"
            size="sm"
            onPress={() => setEditing((v) => !v)}
          />
        ) : null}
      </View>

      {adding || total === 0 ? (
      <HealthScreenSection dividerTop title="Novo medicamento">
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
            setAdding(false)
          }}
        />
        {adding ? (
          <PrimaryButton label="Cancelar" variant="ghost" onPress={() => { setAdding(false); setError('') }} style={pillBtn} />
        ) : null}
      </HealthScreenSection>
      ) : null}
    </View>
  )
}
