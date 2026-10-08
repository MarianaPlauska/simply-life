import { useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Icon } from '../../ui/Icon'
import {
  describeDayPt,
  formatBRL,
  futureCommitments,
  localTodayIso,
  type MonthProjection,
  parseBrlNumber,
  projectionMessage,
} from '@simply-life/shared'
import { Card, Text, Field, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'
import { useDuePaidStore } from '../../store/duePaidStore'
import { useSalaryStore } from '../../store/salaryStore'
import { useBillAnswersStore } from '../../store/billAnswersStore'
import { currentMonthProjection } from '../../lib/monthProjection'
import { useWebDesk } from '../dashboard/web/webBox'
import { WEB_DISPLAY_FONT } from '../dashboard/web/webTypography'
import { useDeskBigNumber } from './desk/deskLayout'

const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** "Seu salário de setembro caiu?" — aparece no dia do pagamento até ser confirmado. */
export function SalaryConfirmCard()
{
  const { colors, space } = useTheme()
  const hydrate = useSalaryStore((s) => s.hydrate)
  const pendingFn = useSalaryStore((s) => s.pending)
  const confirm = useSalaryStore((s) => s.confirm)
  const snooze = useSalaryStore((s) => s.snooze)
  // assina o estado para recalcular quando salário/horas/confirmações mudam
  const salary = useSalaryStore((s) => s.salary)
  const confirmations = useSalaryStore((s) => s.confirmations)
  const snoozedDay = useSalaryStore((s) => s.snoozedDay)
  const [valor, setValor] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  const pending = useMemo(() => pendingFn(), [pendingFn, salary, confirmations, snoozedDay])
  useEffect(() =>
  {
    if (pending) setValor(pending.previsto.toFixed(2).replace('.', ','))
  }, [pending?.competencia, pending?.previsto])

  if (!pending) return null

  return (
    <Card tone="elevated" accentTop="finance" style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Icon name="cash-outline" size={20} color={colors.finance} />
        <Text variant="section" style={{ flex: 1 }}>Seu salário de {pending.label.split(' de ')[0]} caiu?</Text>
      </View>
      <Text variant="caption" muted>
        Previsto {formatBRL(pending.previsto)}{pending.forecast.totalHe > 0 ? ` (com ${formatBRL(pending.forecast.totalHe)} de horas extras)` : ''}.
        Ajuste se o valor que caiu for diferente.
      </Text>
      <Field label="Valor que caiu" keyboardType="decimal-pad" value={valor} onChangeText={setValor} />
      {msg ? <Text variant="caption" color={colors.danger}>{msg}</Text> : null}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <PrimaryButton label="Ainda não caiu" variant="ghost" size="sm" onPress={snooze} style={{ flex: 1 }} />
        <PrimaryButton
          label="Confirmar"
          size="sm"
          loading={busy}
          style={{ flex: 2 }}
          onPress={async () =>
          {
            const v = parseBrlNumber(valor)
            if (v == null) return setMsg('Valor inválido. Ex.: 3505,04')
            setBusy(true)
            const res = await confirm(v)
            setBusy(false)
            setMsg(res.ok ? null : res.error ?? 'Não consegui confirmar')
          }}
        />
      </View>
    </Card>
  )
}

/** Projeção do fim do mês a partir dos stores (Carteira e aba Coach). */
export function useMonthProjection(): MonthProjection
{
  const txs = useDataStore((s) => s.finance)
  const fixas = useDataStore((s) => s.contasFixas)
  const cards = useDataStore((s) => s.financeCards)
  const cash = useDataStore((s) => s.cashAccount)
  const paidKeys = useDuePaidStore((s) => s.keys)
  const hydratePaid = useDuePaidStore((s) => s.hydrate)
  const salary = useSalaryStore((s) => s.salary)
  const entries = useSalaryStore((s) => s.entries)
  const confirmations = useSalaryStore((s) => s.confirmations)
  const forecastFn = useSalaryStore((s) => s.forecast)
  const hydrateSalary = useSalaryStore((s) => s.hydrate)
  const emAberto = useBillAnswersStore((s) => s.emAberto)
  const hydrateAnswers = useBillAnswersStore((s) => s.hydrate)

  useEffect(() =>
  {
    hydratePaid()
    void hydrateSalary()
    void hydrateAnswers()
  }, [hydratePaid, hydrateSalary, hydrateAnswers])

  // os valores acima só assinam os stores: a conta lê o estado atual
  return useMemo(() => currentMonthProjection(), [cash, txs, fixas, cards, paidKeys, salary, entries, confirmations, forecastFn, emAberto])
}

/** Fim do mês: um número calmo ("deve sobrar R$ X"), com a conta aberta ao tocar. */
export function MonthProjectionCard()
{
  const { colors, space } = useTheme()
  const isGuest = useAuthStore((s) => s.isGuest)
  const txs = useDataStore((s) => s.finance)
  const fixas = useDataStore((s) => s.contasFixas)
  const settleFixa = useDataStore((s) => s.settleFixa)
  const markUnpaid = useBillAnswersStore((s) => s.markUnpaid)
  const clearUnpaid = useBillAnswersStore((s) => s.clear)
  const [open, setOpen] = useState(false)
  const [paying, setPaying] = useState<number | null>(null)
  const projection = useMonthProjection()
  const ym = localTodayIso().slice(0, 7)

  const future = useMemo(() => futureCommitments(txs), [txs])
  const tone = projection.tom === 'apertado' ? colors.attention : projection.tom === 'atencao' ? colors.finance : colors.health
  const desk = useWebDesk()
  const bigNumber = useDeskBigNumber()

  return (
    <Card tone="elevated" style={{ gap: space.sm }}>
      <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityLabel="Ver a conta do fim do mês" style={{ gap: desk ? 12 : 6 }}>
        {desk ? (
          // computador: mesmo cabeçalho dos outros blocos da grade
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text variant="section" style={{ flex: 1, fontSize: 18, lineHeight: 26 }}>Fim do mês</Text>
            <Text variant="caption" muted>dia {projection.fimDoMes.slice(8, 10)}</Text>
            <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.inkMuted} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text variant="caption" muted style={{ flex: 1 }}>Fim do mês (dia {projection.fimDoMes.slice(8, 10)})</Text>
            <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.inkMuted} />
          </View>
        )}
        <Text
          variant="title"
          style={desk ? { fontFamily: WEB_DISPLAY_FONT, ...bigNumber, fontVariant: ['tabular-nums'] } : { fontSize: 26 }}
          color={tone}
        >
          {projection.sobra >= 0 ? `Sobra ~${formatBRL(projection.sobra)}` : `Faltam ~${formatBRL(Math.abs(projection.sobra))}`}
        </Text>
        <Text variant={desk ? 'caption' : 'body'} muted={desk} style={desk ? undefined : { fontSize: 14 }}>
          {projectionMessage(projection, formatBRL)}
        </Text>
        {desk && !open ? (
          <Text variant="caption" style={{ color: colors.axel, fontFamily: 'Lexend_500Medium' }}>Ver a conta</Text>
        ) : null}
      </Pressable>

      {projection.vencidas.map((v) => (
        <View key={v.fixaId} style={{ gap: 8, padding: 12, borderRadius: 12, backgroundColor: colors.hairline }}>
          <Text variant="body" style={{ fontSize: 14 }}>
            {v.nome} venceu dia {v.data.slice(8, 10)} ({formatBRL(v.valor)}). Você já pagou?
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <PrimaryButton
              label="Já paguei"
              size="sm"
              loading={paying === v.fixaId}
              style={{ flex: 1 }}
              onPress={async () =>
              {
                setPaying(v.fixaId)
                await settleFixa(v.fixaId, isGuest)
                setPaying(null)
              }}
            />
            <PrimaryButton label="Ainda não" size="sm" variant="ghost" style={{ flex: 1 }} onPress={() => markUnpaid(ym, v.fixaId)} />
          </View>
        </View>
      ))}

      {open ? (
        <View style={{ gap: 8, paddingTop: 4 }}>
          {projection.lines.map((l, i) =>
          {
            const fixa = l.kind === 'fixa' ? fixas.find((f) => f.id === l.refId) ?? null : null
            return (
              <View key={`${l.kind}-${l.label}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 32 }}>
                <Text variant="body" style={{ flex: 1, fontSize: 14 }} numberOfLines={2}>
                  {l.label}{l.data ? ` · ${describeDayPt(l.data).toLowerCase()}` : ''}
                </Text>
                <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                  {l.valor >= 0 ? '+' : '-'}{formatBRL(Math.abs(l.valor))}
                </Text>
                {fixa ? (
                  <PrimaryButton
                    label="Já paguei"
                    size="sm"
                    variant="ghost"
                    loading={paying === fixa.id}
                    onPress={async () =>
                    {
                      setPaying(fixa.id)
                      await settleFixa(fixa.id, isGuest)
                      clearUnpaid(ym, fixa.id)
                      setPaying(null)
                    }}
                  />
                ) : null}
              </View>
            )
          })}
          {future.length ? (
            <View style={{ gap: 6, paddingTop: 6 }}>
              <Text variant="caption" muted>Já comprometido nos próximos meses (parcelas)</Text>
              <Text variant="body" style={{ fontSize: 14 }}>
                {future.map((f) => `${MONTHS_SHORT[Number(f.ym.slice(5, 7)) - 1]} ${formatBRL(f.total)}`).join(' · ')}
              </Text>
            </View>
          ) : null}
          <Text variant={desk ? 'label' : 'micro'} muted>
            Como calculamos: o saldo de hoje, menos as contas que ainda vencem e as faturas, mais o que ainda vai entrar, menos o gasto médio do dia a dia.
          </Text>
        </View>
      ) : null}
    </Card>
  )
}
