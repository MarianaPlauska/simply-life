import { useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  describeDayPt,
  formatBRL,
  formatMinutesPt,
  parseBrlNumber,
  parseOvertimeText,
  type OvertimeKind,
} from '@simply-life/shared'
import { Card, Text, Field, PrimaryButton, SectionHeader } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { SelectChip } from '../CaptureTaskForm'
import { competenciaLabel, emptySalary, scheduleSummary, useSalaryStore } from '../../store/salaryStore'
import type { StoredSalary } from '../../lib/sync/salary'

const KIND_LABEL: Record<OvertimeKind, string> = {
  util: 'Dia útil',
  folga: 'Domingo/feriado',
  noturno: 'Noturna',
}

const num = (t: string) => parseBrlNumber(t) ?? (Number(t.replace(',', '.')) || 0)

/**
 * Contas → Salário: salário base + horário (o divisor sai do horário),
 * horas extras do período, previsão aberta e histórico do que caiu de verdade.
 */
export function FinanceSalaryPane()
{
  const { colors, space } = useTheme()
  const salary = useSalaryStore((s) => s.salary)
  const entries = useSalaryStore((s) => s.entries)
  const confirmations = useSalaryStore((s) => s.confirmations)
  const hydrate = useSalaryStore((s) => s.hydrate)
  const forecastFn = useSalaryStore((s) => s.forecast)
  const addOvertime = useSalaryStore((s) => s.addOvertime)
  const removeOvertime = useSalaryStore((s) => s.removeOvertime)
  const error = useSalaryStore((s) => s.error)
  const [editing, setEditing] = useState(false)
  const [heText, setHeText] = useState('')
  const [heMsg, setHeMsg] = useState<string | null>(null)

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  const forecast = useMemo(() => forecastFn(), [forecastFn, salary, entries])
  const periodEntries = useMemo(
    () => (forecast ? entries.filter((e) => e.data >= forecast.periodo.inicio && e.data <= forecast.periodo.fim) : []),
    [entries, forecast],
  )

  if (!salary || editing)
  {
    return <SalaryForm initial={salary ?? emptySalary()} onDone={() => setEditing(false)} canCancel={Boolean(salary)} />
  }

  const addFromText = async () =>
  {
    const e = parseOvertimeText(heText)
    if (!e) return setHeMsg('Não entendi as horas. Ex.: "fiz 2h30 ontem" ou "3h domingo".')
    const ok = await addOvertime(e)
    if (ok)
    {
      setHeText('')
      setHeMsg(`${formatMinutesPt(e.minutos)} em ${describeDayPt(e.data).toLowerCase()} (${KIND_LABEL[e.tipo].toLowerCase()}) anotadas.`)
    }
  }

  const sched = scheduleSummary(salary)

  return (
    <View style={{ gap: space.md }}>
      <Card tone="elevated" style={{ gap: space.sm }}>
        <SectionHeader
          title={salary.titulo}
          subtitle={`${sched.semanais ?? salary.horasSemanais}h por semana · divisor ${sched.divisor ?? '-'} · sua hora vale ${sched.valorHora ? formatBRL(sched.valorHora) : '-'}`}
          action={<PrimaryButton label="Editar" variant="link" size="sm" onPress={() => setEditing(true)} />}
        />
        <Text variant="caption" muted>
          Base {formatBRL(salary.base)} · HE {salary.heUtilPct}% em dia útil, {salary.heFolgaPct}% em domingo/feriado
          {salary.noturnoPct ? ` · noturno ${salary.noturnoPct}%` : ''} · {salary.quintoDiaUtil ? 'paga no 5º dia útil' : `paga dia ${salary.diaRecebimento}`}
        </Text>
      </Card>

      {forecast ? (
        <Card tone="elevated" style={{ gap: space.sm }}>
          <Text variant="section">Previsão de {competenciaLabel(forecast.competencia)}</Text>
          <Text variant="caption" muted>
            Horas de {describeDayPt(forecast.periodo.inicio)} a {describeDayPt(forecast.periodo.fim)} · pagamento {describeDayPt(forecast.pagamento).toLowerCase()}
          </Text>
          <Row label="Salário base" value={formatBRL(salary.base)} />
          {forecast.horas.util ? <Row label={`HE dia útil · ${forecast.horas.util}h`} value={formatBRL(forecast.valores.heUtil)} /> : null}
          {forecast.horas.folga ? <Row label={`HE domingo/feriado · ${forecast.horas.folga}h`} value={formatBRL(forecast.valores.heFolga)} /> : null}
          {forecast.horas.noturno ? <Row label={`Adicional noturno · ${forecast.horas.noturno}h`} value={formatBRL(forecast.valores.noturno)} /> : null}
          {forecast.valores.dsr ? (
            <Row label={`DSR sobre HE (${forecast.descansos} descansos / ${forecast.diasUteis} dias úteis)`} value={formatBRL(forecast.valores.dsr)} />
          ) : null}
          <Row label="Bruto previsto" value={formatBRL(forecast.bruto)} strong />
          <Row
            label={forecast.liquido != null ? 'Líquido estimado' : 'Líquido: informe em Editar para estimar'}
            value={forecast.liquido != null ? formatBRL(forecast.liquido) : '—'}
            strong={forecast.liquido != null}
          />
          <Text variant="micro" muted>
            Estimativa. Convenção coletiva, faltas e descontos podem mudar o valor; no dia você confirma o que caiu de verdade.
          </Text>
        </Card>
      ) : null}

      <Card tone="elevated" style={{ gap: space.sm }}>
        <Text variant="section">Horas extras</Text>
        <Field
          tone="sand"
          label="Anotar horas"
          placeholder='Ex.: "fiz 2h30 ontem", "3h domingo", "1h noturna"'
          value={heText}
          onChangeText={setHeText}
          onSubmitEditing={() => void addFromText()}
        />
        <PrimaryButton label="Anotar" size="sm" disabled={heText.trim().length < 2} onPress={() => void addFromText()} />
        {heMsg ? <Text variant="caption" muted>{heMsg}</Text> : null}
        {error ? <Text variant="caption" color={colors.danger}>{error}</Text> : null}
        {periodEntries.length === 0 ? (
          <Text variant="caption" muted>Nenhuma hora extra neste período.</Text>
        ) : (
          periodEntries.map((e) => (
            <View key={String(e.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text variant="body" style={{ flex: 1, fontSize: 14 }}>
                {describeDayPt(e.data)} · {formatMinutesPt(e.minutos)} · {KIND_LABEL[e.tipo]}
              </Text>
              <Pressable onPress={() => void removeOvertime(e.id!)} accessibilityRole="button" accessibilityLabel="Remover hora extra" hitSlop={8}>
                <Ionicons name="close" size={18} color={colors.inkMuted} />
              </Pressable>
            </View>
          ))
        )}
      </Card>

      {confirmations.length ? (
        <Card tone="elevated" style={{ gap: 6 }}>
          <Text variant="section">O que caiu</Text>
          {confirmations.slice(0, 6).map((c) => (
            <Row
              key={c.competencia}
              label={`${competenciaLabel(c.competencia)} · previsto ${formatBRL(c.valorPrevisto)}`}
              value={c.valorReal != null ? formatBRL(c.valorReal) : '—'}
            />
          ))}
          {salary.taxaDesconto != null ? (
            <Text variant="micro" muted>
              Desconto médio aprendido: {(salary.taxaDesconto * 100).toFixed(1).replace('.', ',')}% do bruto.
            </Text>
          ) : null}
        </Card>
      ) : null}
    </View>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean })
{
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <Text variant={strong ? 'bodyStrong' : 'body'} style={{ flex: 1, fontSize: 14 }}>{label}</Text>
      <Text variant={strong ? 'bodyStrong' : 'body'} style={{ fontSize: 14 }}>{value}</Text>
    </View>
  )
}

function SalaryForm({ initial, onDone, canCancel }: { initial: StoredSalary; onDone: () => void; canCancel: boolean })
{
  const { colors, space } = useTheme()
  const save = useSalaryStore((s) => s.save)
  const saving = useSalaryStore((s) => s.saving)
  const error = useSalaryStore((s) => s.error)
  const [f, setF] = useState(() => ({
    titulo: initial.titulo,
    base: initial.base ? String(initial.base).replace('.', ',') : '',
    entrada: initial.entrada,
    saida: initial.saida,
    intervalo: String(initial.intervaloMin),
    dias: String(initial.diasSemana),
    heUtil: initial.heUtilPct,
    heFolga: initial.heFolgaPct,
    noturno: initial.noturnoPct,
    dsr: initial.dsrSobreHe,
    quinto: initial.quintoDiaUtil,
    diaPag: String(initial.diaRecebimento),
    fechamento: initial.diaFechamento ? String(initial.diaFechamento) : '',
    liquido: '',
  }))
  const patch = (p: Partial<typeof f>) => setF({ ...f, ...p })

  const draft: StoredSalary = {
    ...initial,
    titulo: f.titulo.trim() || 'Salário',
    base: num(f.base),
    entrada: f.entrada.trim(),
    saida: f.saida.trim(),
    intervaloMin: Math.max(0, Math.round(num(f.intervalo))),
    diasSemana: Math.min(7, Math.max(1, Math.round(num(f.dias)) || 5)),
    heUtilPct: f.heUtil,
    heFolgaPct: f.heFolga,
    noturnoPct: f.noturno,
    dsrSobreHe: f.dsr,
    quintoDiaUtil: f.quinto,
    diaRecebimento: Math.min(31, Math.max(1, Math.round(num(f.diaPag)) || 5)),
    diaFechamento: f.fechamento.trim() ? Math.min(31, Math.max(1, Math.round(num(f.fechamento)))) : null,
    // líquido de um mês sem HE → taxa de desconto (substitui a aprendida só se preenchido)
    taxaDesconto: f.liquido.trim() && num(f.base) > 0
      ? Math.max(0, Math.min(0.6, 1 - num(f.liquido) / num(f.base)))
      : initial.taxaDesconto,
  }
  const sched = scheduleSummary(draft)

  return (
    <Card tone="elevated" style={{ gap: space.sm }}>
      <Text variant="section">{canCancel ? 'Editar salário' : 'Cadastrar salário'}</Text>
      <Text variant="caption" muted>
        O salário entra previsto todo mês. Você anota as horas extras e, no dia do pagamento, confirma o valor que caiu.
      </Text>
      <Field label="Nome" value={f.titulo} onChangeText={(v) => patch({ titulo: v })} />
      <Field label="Salário base, sem horas extras (bruto)" placeholder="Ex.: 3500" keyboardType="decimal-pad" value={f.base} onChangeText={(v) => patch({ base: v })} />

      <Text variant="caption" muted>Seu horário</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><Field label="Entrada" placeholder="08:00" value={f.entrada} onChangeText={(v) => patch({ entrada: v })} /></View>
        <View style={{ flex: 1 }}><Field label="Saída" placeholder="17:00" value={f.saida} onChangeText={(v) => patch({ saida: v })} /></View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><Field label="Almoço (min)" keyboardType="number-pad" value={f.intervalo} onChangeText={(v) => patch({ intervalo: v })} /></View>
        <View style={{ flex: 1 }}><Field label="Dias por semana" keyboardType="number-pad" value={f.dias} onChangeText={(v) => patch({ dias: v })} /></View>
      </View>
      <View style={{ padding: 10, borderRadius: 12, backgroundColor: colors.hairline }}>
        <Text variant="bodyStrong" style={{ fontSize: 14 }}>
          {sched.semanais != null
            ? `${sched.semanais}h por semana → divisor ${sched.divisor}${sched.valorHora ? ` · sua hora vale ${formatBRL(sched.valorHora)}` : ''}`
            : 'Confira entrada e saída (formato 08:00)'}
        </Text>
        <Text variant="micro" muted>Regra da CLT: divisor = horas semanais ÷ 6 × 30. 44h → 220 · 40h → 200.</Text>
      </View>

      <Text variant="caption" muted>Adicional de hora extra em dia útil</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[50, 60, 70, 100].map((p) => <SelectChip key={p} label={`${p}%`} active={f.heUtil === p} onPress={() => patch({ heUtil: p })} />)}
      </View>
      <Text variant="caption" muted>Em domingo e feriado</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[100, 150].map((p) => <SelectChip key={p} label={`${p}%`} active={f.heFolga === p} onPress={() => patch({ heFolga: p })} />)}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <SelectChip label={f.noturno ? 'Adicional noturno 20%' : 'Sem adicional noturno'} active={Boolean(f.noturno)} onPress={() => patch({ noturno: f.noturno ? null : 20 })} />
        <SelectChip label={f.dsr ? 'Com DSR sobre HE' : 'Sem DSR sobre HE'} active={f.dsr} onPress={() => patch({ dsr: !f.dsr })} />
      </View>

      <Text variant="caption" muted>Quando o salário cai</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <SelectChip label="5º dia útil" active={f.quinto} onPress={() => patch({ quinto: true })} />
        <SelectChip label="Dia fixo" active={!f.quinto} onPress={() => patch({ quinto: false })} />
      </View>
      {!f.quinto ? <Field label="Dia do mês" keyboardType="number-pad" value={f.diaPag} onChangeText={(v) => patch({ diaPag: v })} /> : null}
      <Field
        label="Fechamento do ponto (dia, opcional)"
        placeholder="Vazio = mês inteiro. Ex.: 20"
        keyboardType="number-pad"
        value={f.fechamento}
        onChangeText={(v) => patch({ fechamento: v })}
      />
      <Field
        label="Seu líquido num mês sem hora extra (opcional)"
        placeholder={initial.taxaDesconto != null ? `Desconto atual: ${(initial.taxaDesconto * 100).toFixed(1)}%` : 'Ex.: 2980 — para estimar o líquido'}
        keyboardType="decimal-pad"
        value={f.liquido}
        onChangeText={(v) => patch({ liquido: v })}
      />
      {error ? <Text variant="caption" color={colors.danger}>{error}</Text> : null}
      <PrimaryButton label="Salvar salário" loading={saving} onPress={() => void save(draft).then((ok) => ok && onDone())} />
      {canCancel ? <PrimaryButton label="Cancelar" variant="ghost" onPress={onDone} /> : null}
    </Card>
  )
}
