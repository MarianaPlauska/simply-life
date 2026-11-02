import { useEffect, useState } from 'react'
import { View } from 'react-native'
import {
  forgetfulnessReport,
  formatBRL,
  holdIsReady,
  type FinanceCategory,
} from '@simply-life/shared'
import { Text, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'
import { useCareExtrasStore } from '../../store/careExtrasStore'

const THRESHOLDS = [40, 80, 150]

/** Espera de 24h e o relatório do esquecimento. Os dois são opt-in ou só leitura. */
export function FinanceCareMoney()
{
  const { colors, space } = useTheme()
  const hydrate = useCareExtrasStore((s) => s.hydrate)
  const enabled = useCareExtrasStore((s) => s.impulseEnabled)
  const threshold = useCareExtrasStore((s) => s.impulseThreshold)
  const holds = useCareExtrasStore((s) => s.holds)
  const setEnabled = useCareExtrasStore((s) => s.setImpulseEnabled)
  const setThreshold = useCareExtrasStore((s) => s.setImpulseThreshold)
  const removeHold = useCareExtrasStore((s) => s.removeHold)
  const txs = useDataStore((s) => s.finance) ?? []
  const addExpense = useDataStore((s) => s.addExpenseFromText)
  const addCardSpend = useDataStore((s) => s.addCardSpend)
  const isGuest = useAuthStore((s) => s.isGuest)
  const [msg, setMsg] = useState<string | null>(null)
  const report = forgetfulnessReport(txs)

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  const register = async (id: string) =>
  {
    const hold = useCareExtrasStore.getState().holds.find((item) => item.id === id)
    if (!hold) return
    const res = hold.forma === 'cartao' && hold.cardId
      ? await addCardSpend(hold.cardId, hold.valor, hold.titulo, isGuest, {
        data: hold.data,
        categoria: hold.categoria as FinanceCategory,
        somarFatura: true,
        folderId: hold.folderId ?? undefined,
      })
      : await addExpense(hold.titulo, isGuest, {
        lido: { titulo: hold.titulo, valor: hold.valor },
        categoria: hold.categoria as FinanceCategory,
        data: hold.data,
        formaPagamento: hold.forma === 'boleto' ? 'boleto' : 'debito',
        folderId: hold.folderId ?? undefined,
      })
    if (!res.ok)
    {
      setMsg(res.error || 'Não foi possível registrar agora.')
      return
    }
    removeHold(id)
    setMsg(null)
  }

  return (
    <View style={{ gap: space.md, borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: space.md }}>
      <Text variant="section">Espera antes do gasto</Text>
      <Text variant="caption" muted>
        Desligada por padrão. Ligada, um gasto imediato acima do valor fica 24 horas esperando. Conta, parcela e recorrência lançam na hora.
      </Text>
      <PrimaryButton
        label={enabled ? 'Espera ligada' : 'Ligar espera de 24h'}
        variant={enabled ? 'secondary' : 'primary'}
        onPress={() => setEnabled(!enabled)}
      />
      {enabled ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {THRESHOLDS.map((value) => (
            <PrimaryButton
              key={value}
              label={formatBRL(value)}
              size="sm"
              variant={threshold === value ? 'primary' : 'ghost'}
              onPress={() => setThreshold(value)}
            />
          ))}
        </View>
      ) : null}
      {holds.map((hold) =>
      {
        const ready = holdIsReady(hold.liberaEm, new Date())
        return (
          <View key={hold.id} style={{ gap: 4 }}>
            <Text variant="body">{hold.titulo} · {formatBRL(hold.valor)}</Text>
            <Text variant="caption" muted>{ready ? 'Já pode registrar.' : 'Ainda na espera. Dá para registrar agora ou desistir.'}</Text>
            <PrimaryButton label="Registrar" size="sm" onPress={() => void register(hold.id)} />
            <PrimaryButton label="Desistir" size="sm" variant="ghost" onPress={() => removeHold(hold.id)} />
          </View>
        )
      })}
      {msg ? <Text variant="caption">{msg}</Text> : null}
      {report.length > 0 ? (
        <View style={{ gap: space.sm }}>
          <Text variant="section">Custo do esquecimento</Text>
          <Text variant="caption" muted>Só uma leitura. Nada é cancelado daqui.</Text>
          {report.map((item, index) => (
            <View key={`${item.kind}-${index}`} style={{ gap: 2 }}>
              <Text variant="body">{item.titulo}</Text>
              <Text variant="caption" muted>{item.detalhe}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}
