/**
 * Relatório de um período (de/até): humor, gastos, alimentação, água, sono, treino e tarefas.
 * Lógica pura: o app junta os dados dos stores e esta função resume. O HTML sai pronto para PDF.
 */
import type { FinanceTx } from './finance'
import { FINANCE_CATEGORY_LABELS, formatBRL } from './finance'
import { moodLabel, type HumorRegistro } from './mood'
import { foodKcalOfDay, FOOD_MEAL_LABELS, type FoodMealType } from './foodLog'
import { addDaysIso } from './taskPrompt'

export type PeriodReportInput = {
  from: string
  to: string
  humor: HumorRegistro[]
  finance: FinanceTx[]
  meals: {
    data: string
    tipo: FoodMealType
    itens: { nome: string; kcal?: number | null; proteina?: number | null; acucar?: number | null; fonte?: string | null }[]
  }[]
  /** copos por dia (AAAA-MM-DD → copos) */
  waterCups: Record<string, number>
  mlPorCopo: number
  metaMl: number
  sleepHours: Record<string, number>
  workouts: { data: string; titulo: string }[]
  tasksDone: { titulo: string; concluidoEm: string }[]
}

export type PeriodReport = {
  from: string
  to: string
  dias: number
  humor: {
    registros: number
    media: number | null
    porHumor: { humor: number; label: string; dias: number }[]
    notas: { data: string; humor: string; nota: string }[]
  }
  financas: {
    despesas: number
    receitas: number
    saldo: number
    lancamentos: number
    porCategoria: { categoria: string; total: number }[]
    maiores: { titulo: string; valor: number; data: string }[]
  }
  alimentacao: {
    refeicoes: number
    diasComRegistro: number
    kcalMediaDia: number | null
    proteinaMediaDia: number | null
    porTipo: { tipo: string; vezes: number }[]
  }
  agua: { diasComRegistro: number; mediaMlDia: number | null; diasNaMeta: number; metaMl: number }
  sono: { noites: number; mediaHoras: number | null }
  treino: { sessoes: number; dias: number }
  tarefas: { concluidas: number; lista: string[] }
}

const round1 = (n: number) => Math.round(n * 10) / 10
const iso10 = (s: string | null | undefined) => String(s ?? '').slice(0, 10)

function inRange(iso: string, from: string, to: string): boolean
{
  return iso.length === 10 && iso >= from && iso <= to
}

export function daysBetween(from: string, to: string): number
{
  let n = 0
  for (let d = from; d <= to && n < 400; d = addDaysIso(d, 1)) n += 1
  return n
}

export function buildPeriodReport(input: PeriodReportInput): PeriodReport
{
  const { from, to } = input
  const isIn = (s: string | null | undefined) => inRange(iso10(s), from, to)

  // humor: um valor por dia (o último registro do dia), mais as notas
  const humorRows = input.humor.filter((h) => isIn(h.data)).sort((a, b) => iso10(a.data).localeCompare(iso10(b.data)))
  const porDia = new Map<string, number>()
  for (const h of humorRows) porDia.set(iso10(h.data), h.humor)
  const valores = [...porDia.values()]
  const porHumor = [5, 4, 3, 2, 1]
    .map((m) => ({ humor: m, label: moodLabel(m), dias: valores.filter((v) => v === m).length }))
    .filter((r) => r.dias > 0)
  const notas = humorRows
    .filter((h) => (h.nota || '').trim())
    .map((h) => ({ data: iso10(h.data), humor: moodLabel(h.humor), nota: String(h.nota).trim() }))
    .reverse()

  // gastos
  const txs = input.finance.filter((t) => isIn(t.data))
  const despesas = txs.filter((t) => t.tipo === 'despesa')
  const receitas = txs.filter((t) => t.tipo === 'receita')
  const totalDesp = despesas.reduce((a, t) => a + (Number(t.valor) || 0), 0)
  const totalRec = receitas.reduce((a, t) => a + (Number(t.valor) || 0), 0)
  const cat = new Map<string, number>()
  for (const t of despesas)
  {
    const label = FINANCE_CATEGORY_LABELS[t.categoria as keyof typeof FINANCE_CATEGORY_LABELS] ?? String(t.categoria || 'Outros')
    cat.set(label, (cat.get(label) ?? 0) + (Number(t.valor) || 0))
  }

  // alimentação
  const meals = input.meals.filter((m) => isIn(m.data))
  const diasRefeicao = [...new Set(meals.map((m) => iso10(m.data)))]
  const kcalDias = diasRefeicao.map((d) => foodKcalOfDay(meals, d)).filter((k) => k.comKcal > 0)
  const protDias = diasRefeicao.map((d) => foodKcalOfDay(meals, d)).filter((k) => k.comProteina > 0)
  const tipos = new Map<string, number>()
  for (const m of meals) tipos.set(FOOD_MEAL_LABELS[m.tipo] ?? m.tipo, (tipos.get(FOOD_MEAL_LABELS[m.tipo] ?? m.tipo) ?? 0) + 1)

  // água
  const aguaDias = Object.entries(input.waterCups).filter(([d, c]) => inRange(d, from, to) && c > 0)
  const aguaMl = aguaDias.map(([, c]) => c * input.mlPorCopo)

  // sono e treino
  const sono = Object.entries(input.sleepHours).filter(([d, h]) => inRange(d, from, to) && h > 0).map(([, h]) => h)
  const treinos = input.workouts.filter((w) => isIn(w.data))

  // tarefas
  const tarefas = input.tasksDone
    .filter((t) => isIn(t.concluidoEm))
    .sort((a, b) => iso10(b.concluidoEm).localeCompare(iso10(a.concluidoEm)))

  return {
    from,
    to,
    dias: daysBetween(from, to),
    humor: {
      registros: valores.length,
      media: valores.length ? round1(valores.reduce((a, b) => a + b, 0) / valores.length) : null,
      porHumor,
      notas,
    },
    financas: {
      despesas: Math.round(totalDesp * 100) / 100,
      receitas: Math.round(totalRec * 100) / 100,
      saldo: Math.round((totalRec - totalDesp) * 100) / 100,
      lancamentos: txs.length,
      porCategoria: [...cat.entries()].map(([categoria, total]) => ({ categoria, total: Math.round(total * 100) / 100 })).sort((a, b) => b.total - a.total),
      maiores: [...despesas].sort((a, b) => b.valor - a.valor).slice(0, 5).map((t) => ({ titulo: t.titulo, valor: t.valor, data: iso10(t.data) })),
    },
    alimentacao: {
      refeicoes: meals.length,
      diasComRegistro: diasRefeicao.length,
      kcalMediaDia: kcalDias.length ? Math.round(kcalDias.reduce((a, k) => a + k.total, 0) / kcalDias.length) : null,
      proteinaMediaDia: protDias.length ? Math.round(protDias.reduce((a, k) => a + k.proteina, 0) / protDias.length) : null,
      porTipo: [...tipos.entries()].map(([tipo, vezes]) => ({ tipo, vezes })).sort((a, b) => b.vezes - a.vezes),
    },
    agua: {
      diasComRegistro: aguaDias.length,
      mediaMlDia: aguaMl.length ? Math.round(aguaMl.reduce((a, b) => a + b, 0) / aguaMl.length) : null,
      diasNaMeta: aguaMl.filter((ml) => ml >= input.metaMl).length,
      metaMl: input.metaMl,
    },
    sono: { noites: sono.length, mediaHoras: sono.length ? round1(sono.reduce((a, b) => a + b, 0) / sono.length) : null },
    treino: { sessoes: treinos.length, dias: new Set(treinos.map((w) => iso10(w.data))).size },
    tarefas: { concluidas: tarefas.length, lista: tarefas.map((t) => t.titulo) },
  }
}

/** "5 de out. de 2026" */
export function reportDatePt(iso: string): string
{
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function reportPeriodLabel(r: Pick<PeriodReport, 'from' | 'to'>): string
{
  return r.from === r.to ? reportDatePt(r.from) : `${reportDatePt(r.from)} a ${reportDatePt(r.to)}`
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** HTML do relatório para imprimir ou salvar em PDF (claro, uma coluna, cabe em A4). */
export function periodReportToHtml(r: PeriodReport, opts: { nome?: string } = {}): string
{
  const row = (label: string, value: string) => `<tr><td>${esc(label)}</td><td class="v">${esc(value)}</td></tr>`
  const section = (title: string, body: string) => `<section><h2>${esc(title)}</h2>${body}</section>`
  const empty = '<p class="muted">Nada registrado no período.</p>'

  const humor = r.humor.registros
    ? `<table>${row('Dias com registro', String(r.humor.registros))}${row('Média', `${String(r.humor.media).replace('.', ',')} de 5`)}${r.humor.porHumor.map((h) => row(h.label, `${h.dias} dia${h.dias === 1 ? '' : 's'}`)).join('')}</table>`
      + (r.humor.notas.length
        ? `<h3>O que você escreveu</h3><ul>${r.humor.notas.map((n) => `<li><span class="muted">${esc(reportDatePt(n.data))} · ${esc(n.humor)}</span><br>${esc(n.nota)}</li>`).join('')}</ul>`
        : '')
    : empty

  const f = r.financas
  const financas = f.lancamentos
    ? `<table>${row('Gastos', formatBRL(f.despesas))}${row('Receitas', formatBRL(f.receitas))}${row('Saldo do período', formatBRL(f.saldo))}</table>`
      + (f.porCategoria.length ? `<h3>Por categoria</h3><table>${f.porCategoria.map((c) => row(c.categoria, formatBRL(c.total))).join('')}</table>` : '')
      + (f.maiores.length ? `<h3>Maiores gastos</h3><table>${f.maiores.map((m) => row(`${m.titulo} (${reportDatePt(m.data)})`, formatBRL(m.valor))).join('')}</table>` : '')
    : empty

  const a = r.alimentacao
  const alimentacao = a.refeicoes
    ? `<table>${row('Refeições anotadas', String(a.refeicoes))}${row('Dias com registro', String(a.diasComRegistro))}${a.kcalMediaDia != null ? row('Calorias por dia (média)', `${a.kcalMediaDia} kcal`) : ''}${a.proteinaMediaDia != null ? row('Proteína por dia (média)', `${a.proteinaMediaDia} g`) : ''}${a.porTipo.map((t) => row(t.tipo, `${t.vezes}x`)).join('')}</table>`
    : empty

  const saude = `<table>`
    + row('Água: dias com registro', String(r.agua.diasComRegistro))
    + (r.agua.mediaMlDia != null ? row('Água por dia (média)', `${r.agua.mediaMlDia} ml`) : '')
    + row(`Dias na meta de água (${String(r.agua.metaMl / 1000).replace('.', ',')} L)`, String(r.agua.diasNaMeta))
    + row('Noites de sono anotadas', String(r.sono.noites))
    + (r.sono.mediaHoras != null ? row('Sono por noite (média)', `${String(r.sono.mediaHoras).replace('.', ',')} h`) : '')
    + row('Treinos', `${r.treino.sessoes} em ${r.treino.dias} dia${r.treino.dias === 1 ? '' : 's'}`)
    + `</table>`

  const tarefas = r.tarefas.concluidas
    ? `<p>${r.tarefas.concluidas} concluída${r.tarefas.concluidas === 1 ? '' : 's'}.</p><ul>${r.tarefas.lista.slice(0, 30).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>${r.tarefas.lista.length > 30 ? `<p class="muted">E mais ${r.tarefas.lista.length - 30}.</p>` : ''}`
    : empty

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório SunFy</title>
<style>
  body { font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; color: #1F2A2A; margin: 32px; line-height: 1.45; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 0 0 8px; color: #1F3A3D; border-bottom: 2px solid #E8734A; padding-bottom: 4px; }
  h3 { font-size: 13px; margin: 12px 0 4px; color: #4A5856; }
  section { margin: 20px 0; page-break-inside: avoid; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  td { padding: 4px 0; border-bottom: 1px solid #E6E9E7; }
  td.v { text-align: right; font-weight: 600; }
  ul { padding-left: 18px; font-size: 13px; margin: 4px 0; }
  li { margin: 4px 0; }
  .muted { color: #6B7775; font-size: 12px; }
</style></head><body>
<h1>Relatório${opts.nome ? ` de ${esc(opts.nome)}` : ''}</h1>
<p class="muted">${esc(reportPeriodLabel(r))} · ${r.dias} dia${r.dias === 1 ? '' : 's'}</p>
${section('Humor', humor)}
${section('Gastos', financas)}
${section('Alimentação', alimentacao)}
${section('Água, sono e treino', saude)}
${section('Tarefas concluídas', tarefas)}
<p class="muted">Gerado pelo SunFy em ${esc(reportDatePt(new Date().toISOString().slice(0, 10)))}.</p>
</body></html>`
}
