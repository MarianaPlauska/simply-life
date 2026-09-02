import { View } from 'react-native'
import { Card, PrimaryButton, CheckRow, EmptyState } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useDataStore } from '../../../store/dataStore'
import { useAuthStore } from '../../../store/authStore'
import { useCaptureStore } from '../../../store/captureStore'

export function MedicamentosPanel()
{
  const { space } = useTheme()
  const medicamentos = useDataStore((s) => s.medicamentos)
  const toggleMedicamento = useDataStore((s) => s.toggleMedicamento)
  const isGuest = useAuthStore((s) => s.isGuest)
  const openCapture = useCaptureStore((s) => s.openCapture)
  const pillBtn = { borderRadius: 999 as const }

  return (
    <View style={{ gap: space.md }}>
      <Card tone="elevated" style={{ gap: space.sm, paddingVertical: space.sm }}>
        {medicamentos.length === 0 ? (
          <EmptyState
            title="Nenhum remédio listado"
            body="Cadastre na web ou use nota de medicação."
            icon="medical-outline"
          />
        ) : (
          medicamentos.map((med, i) => (
            <CheckRow
              key={med.id}
              title={med.nome}
              subtitle={`${med.horario} · dose`}
              done={med.tomado}
              onToggle={() => void toggleMedicamento(med.id, isGuest)}
              showSeparator={i < medicamentos.length - 1}
            />
          ))
        )}
      </Card>
      <PrimaryButton
        label="Nota de medicação"
        variant="secondary"
        onPress={() => openCapture('note')}
        style={pillBtn}
      />
    </View>
  )
}
