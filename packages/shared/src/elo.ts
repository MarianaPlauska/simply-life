/**
 * Elo (a "ofensiva" do código): o único contador de dias seguidos do app.
 * Todas as telas leem daqui; nada de contador próprio por tela.
 *
 * Regras (simples e gentis, ver docs/METAS_JUNTOS.md "Ofensiva sem culpa"):
 * - Dia cumprido: pelo menos uma ação de verdade no dia, no horário local
 *   (tarefa concluída, rotina marcada, foco terminado, humor, água, refeição,
 *   gasto ou anotação). Só abrir o app não cumpre o dia.
 * - Descanso: em cada semana (segunda a domingo, local) o PRIMEIRO dia sem
 *   registro vira descanso automático e não quebra o elo. O segundo dia sem
 *   registro na mesma semana quebra.
 * - Hoje, enquanto não cumprido, fica pendente e nunca quebra o elo.
 * - O elo conta só os dias cumpridos; o descanso segura a sequência, não soma.
 * - Recorde: o maior elo de todo o histórico (sem janela de 90 dias) e nunca
 *   menor que o recorde já guardado.
 */
import { localTodayIso } from './dates'
import type { PlanRecord } from './planInsights'

/** Ações que cumprem o dia (mesma lista do banco, migração 076). */
export const ELO_ACOES = ['task', 'note', 'mood', 'finance', 'water', 'focus', 'meal'] as const
export type EloAcao = (typeof ELO_ACOES)[number]

export const ELO_ACAO_LABEL: Record<EloAcao, string> = {
  task: 'tarefas e rotinas',
  note: 'anotações',
  mood: 'humor',
  finance: 'gastos',
  water: 'água',
  focus: 'foco',
  meal: 'refeições',
}

export function isEloAcao(value: unknown): value is EloAcao
{
  return typeof value === 'string' && (ELO_ACOES as readonly string[]).includes(value)
}

export type EloStatus = 'cumprido' | 'descanso' | 'perdido' | 'pendente' | 'futuro'

export type EloResumo = {
  /** dias cumpridos na sequência atual */
  atual: number
  /** maior sequência de todos os tempos */
  recorde: number
  cumpridoHoje: boolean
  /** hoje ainda aberto e o descanso da semana já foi usado */
  emRisco: boolean
  descansoUsadoNestaSemana: boolean
  /** dias cumpridos na semana atual (segunda a domingo) */
  cumpridosNaSemana: number
  hoje: string
  /** primeiro dia cumprido do histórico */
  inicio: string | null
  /** do primeiro dia cumprido até o domingo desta semana */
  dias: Record<string, EloStatus>
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/

function isoParaData(iso: string): Date
{
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0)
}

/** Soma dias no calendário local. */
export function eloSomarDias(iso: string, dias: number): string
{
  const d = isoParaData(iso)
  d.setDate(d.getDate() + dias)
  return localTodayIso(d)
}

/** Segunda-feira (ISO local) da semana do dia. */
export function eloSegundaDe(iso: string): string
{
  const d = isoParaData(iso)
  const dow = d.getDay()
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow))
  return localTodayIso(d)
}

export function calcularElo(
  diasCumpridos: Iterable<string>,
  opts: { ref?: Date; recordeSalvo?: number } = {},
): EloResumo
{
  const hoje = localTodayIso(opts.ref ?? new Date())
  const set = new Set<string>()
  for (const raw of diasCumpridos)
  {
    const iso = String(raw ?? '').slice(0, 10)
    // dia no futuro (relógio adiantado, outro fuso) não conta
    if (ISO_RE.test(iso) && iso <= hoje) set.add(iso)
  }

  const dias: Record<string, EloStatus> = {}
  const inicio = set.size ? [...set].sort()[0]! : null
  let recorde = 0
  let run = 0
  if (inicio)
  {
    let semana = ''
    let descansoNaSemana = false
    for (let iso = inicio; iso <= hoje; iso = eloSomarDias(iso, 1))
    {
      const seg = eloSegundaDe(iso)
      if (seg !== semana)
      {
        semana = seg
        descansoNaSemana = false
      }
      let st: EloStatus
      if (set.has(iso))
      {
        st = 'cumprido'
        run += 1
      }
      else if (iso === hoje)
      {
        st = 'pendente'
      }
      else if (!descansoNaSemana)
      {
        st = 'descanso'
        descansoNaSemana = true
      }
      else
      {
        st = 'perdido'
        run = 0
      }
      dias[iso] = st
      if (run > recorde) recorde = run
    }
  }

  const segunda = eloSegundaDe(hoje)
  const domingo = eloSomarDias(segunda, 6)
  for (let iso = eloSomarDias(hoje, 1); iso <= domingo; iso = eloSomarDias(iso, 1))
  {
    dias[iso] = 'futuro'
  }

  let cumpridosNaSemana = 0
  let descansoUsadoNestaSemana = false
  for (let iso = segunda; iso <= hoje; iso = eloSomarDias(iso, 1))
  {
    if (dias[iso] === 'cumprido') cumpridosNaSemana += 1
    if (dias[iso] === 'descanso') descansoUsadoNestaSemana = true
  }

  const atual = run
  const cumpridoHoje = set.has(hoje)
  return {
    atual,
    recorde: Math.max(recorde, atual, Math.max(0, Math.floor(opts.recordeSalvo ?? 0))),
    cumpridoHoje,
    emRisco: atual > 0 && !cumpridoHoje && descansoUsadoNestaSemana,
    descansoUsadoNestaSemana,
    cumpridosNaSemana,
    hoje,
    inicio,
    dias,
  }
}

/** Status de qualquer dia, inclusive antes do primeiro registro. */
export function eloStatusDoDia(elo: EloResumo, iso: string): EloStatus
{
  const hit = elo.dias[iso]
  if (hit) return hit
  if (iso > elo.hoje) return 'futuro'
  if (iso === elo.hoje) return 'pendente'
  return 'perdido'
}

/** Frase curta e gentil sobre o elo (sem culpa). */
export function eloFrase(elo: EloResumo): string
{
  if (elo.atual <= 0)
  {
    return elo.cumpridoHoje
      ? 'Dia cumprido. O elo começa aqui.'
      : 'Uma ação hoje já começa o seu elo.'
  }
  if (elo.cumpridoHoje) return 'Dia cumprido. Amanhã tem mais, no seu ritmo.'
  if (elo.emRisco) return 'Uma ação pequena hoje segura o elo.'
  return 'Hoje ainda está aberto. Se não der, o descanso da semana cobre.'
}

// ----- mapa de dias (heatmap) -----

export type EloNivel = 0 | 1 | 2 | 3 | 4

export type EloMapaCelula = {
  iso: string
  status: EloStatus
  nivel: EloNivel
  /** tarefas no plano do dia (inclui essenciais) */
  planejadas: number
  feitasDoPlano: number
  essenciais: number
  essenciaisFeitas: number
  /** tipos de ação registrados no dia */
  acoes: number
}

export type EloMapa = {
  /** colunas = semanas (segunda a domingo), a última é a semana atual */
  colunas: EloMapaCelula[][]
  de: string
  ate: string
}

/**
 * Intensidade de 0 a 4. Com plano: quanto do planejado foi feito, e os
 * essenciais pesam o dobro. Sem plano: quantos tipos de ação o dia teve.
 * Dia cumprido nunca fica em 0.
 */
export function eloNivelDoDia(input: {
  status: EloStatus
  planejadas: number
  feitasDoPlano: number
  essenciais: number
  essenciaisFeitas: number
  acoes: number
}): EloNivel
{
  if (input.status === 'futuro') return 0
  const cumprido = input.status === 'cumprido'
  if (input.planejadas > 0)
  {
    const ess = Math.min(input.essenciais, input.planejadas)
    const essFeitas = Math.min(input.essenciaisFeitas, ess)
    const outras = input.planejadas - ess
    const outrasFeitas = Math.max(0, Math.min(outras, input.feitasDoPlano - essFeitas))
    const total = ess * 2 + outras
    const feito = essFeitas * 2 + outrasFeitas
    const ratio = total > 0 ? feito / total : 0
    if (ratio >= 1) return 4
    if (ratio >= 0.67) return 3
    if (ratio >= 0.34) return 2
    if (ratio > 0 || cumprido) return 1
    return 0
  }
  if (!cumprido) return 0
  return Math.max(1, Math.min(4, input.acoes)) as EloNivel
}

/**
 * Grade das últimas `semanas` semanas (segunda a domingo), terminando na
 * semana atual. `concluidas` = id da tarefa para o dia local da conclusão
 * (nunca o vencimento).
 */
export function montarMapaDeDias(input: {
  elo: EloResumo
  semanas: number
  acoesPorDia?: Record<string, readonly string[] | undefined>
  planos?: PlanRecord[]
  concluidas?: Map<string, string>
}): EloMapa
{
  const { elo } = input
  const semanas = Math.max(1, Math.floor(input.semanas))
  const de = eloSomarDias(eloSegundaDe(elo.hoje), -(semanas - 1) * 7)
  const ate = eloSomarDias(eloSegundaDe(elo.hoje), 6)
  const planoPorDia = new Map((input.planos ?? []).map((p) => [p.date, p]))
  const concluidas = input.concluidas ?? new Map<string, string>()

  const colunas: EloMapaCelula[][] = []
  let iso = de
  for (let w = 0; w < semanas; w += 1)
  {
    const col: EloMapaCelula[] = []
    for (let d = 0; d < 7; d += 1)
    {
      const status = eloStatusDoDia(elo, iso)
      const plano = planoPorDia.get(iso)
      let planejadas = 0
      let feitasDoPlano = 0
      let essenciais = 0
      let essenciaisFeitas = 0
      if (plano && status !== 'futuro')
      {
        const limite = eloSomarDias(iso, 1)
        const feita = (id: string) =>
        {
          const dia = concluidas.get(id)
          return Boolean(dia && dia <= limite)
        }
        const ess = new Set(plano.essentialIds)
        const todas = new Set([...plano.plannedIds, ...plano.essentialIds])
        planejadas = todas.size
        essenciais = ess.size
        for (const id of todas)
        {
          if (!feita(id)) continue
          feitasDoPlano += 1
          if (ess.has(id)) essenciaisFeitas += 1
        }
      }
      const acoes = new Set((input.acoesPorDia?.[iso] ?? []).filter(isEloAcao)).size
      const celula = { iso, status, planejadas, feitasDoPlano, essenciais, essenciaisFeitas, acoes }
      col.push({ ...celula, nivel: eloNivelDoDia(celula) })
      iso = eloSomarDias(iso, 1)
    }
    colunas.push(col)
  }
  return { colunas, de, ate }
}

/** Data por extenso para o detalhe da célula: "sex., 2 de out.". */
export function eloDataPt(iso: string): string
{
  return isoParaData(iso).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

/** Texto do detalhe ao tocar numa célula (sem travessão, sem culpa). */
export function eloDetalheDoDia(c: EloMapaCelula): string
{
  if (c.status === 'futuro') return 'Ainda não chegou'
  const plano = c.planejadas > 0
    ? `${c.feitasDoPlano} de ${c.planejadas} planejada${c.planejadas === 1 ? '' : 's'}`
    : null
  if (c.status === 'descanso') return plano ? `Descanso · ${plano}` : 'Descanso'
  if (c.status === 'pendente')
  {
    return plano ? `Hoje · ${plano}` : 'Hoje, ainda em aberto'
  }
  if (c.status === 'cumprido')
  {
    if (plano) return `Dia cumprido · ${plano}`
    return c.acoes > 1 ? `Dia cumprido · ${c.acoes} tipos de registro` : 'Dia cumprido'
  }
  return plano ?? 'Sem registro'
}
