// Agrega a semana e monta o texto do resumo (AXEL + 50/30/20 + hábitos)

const TZ = 'America/Sao_Paulo'

export function zonedWeekday(date = new Date(), timeZone = TZ)
{
  const w = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date)
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(w)
}

function weekStartIso(date = new Date())
{
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - 6)
  return d.toISOString()
}

function monthPrefix(date = new Date())
{
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function budgetGroup(name)
{
  const n = String(name || '').toLowerCase()
  if (/moradia|habita|casa|saude|saúde|educa|internet|alimenta|mercado|energia|transporte|luz|agua|água|contas/.test(n))
  {
    return 'necessidades'
  }
  if (/poupan|invest|reserva|poupar/.test(n))
  {
    return 'poupanca'
  }
  return 'desejos'
}

function axelCopy(counts)
{
  const bits = []
  if (counts.deferred_load) bits.push(`adiou ${counts.deferred_load} por carga`)
  if (counts.decay_backlog) bits.push(`${counts.decay_backlog} foram para decay`)
  if (counts.promoted_hoje) bits.push(`promoveu ${counts.promoted_hoje} para Hoje`)
  if (counts.manual_override) bits.push(`respeitou ${counts.manual_override} ajuste(s) seu(s)`)
  if (counts.email_ingest) bits.push(`criou ${counts.email_ingest} via e-mail`)
  if (bits.length === 0) return 'O AXEL ainda não registrou decisões nesta semana.'
  return `Essa semana o AXEL ${bits.join(', ')}.`
}

export async function buildWeeklyDigest(supabase, userId)
{
  const fromIso = weekStartIso()
  const mes = monthPrefix()

  const [
    { data: events },
    { data: tarefas },
    { data: despesas },
    { data: cats },
    { data: habitos },
  ] = await Promise.all([
    supabase.from('axel_decision_events').select('kind').eq('user_id', userId).gte('created_at', fromIso),
    supabase.from('tarefas_unificadas').select('id, status, horizon_override, score_urgencia, deletado_em').eq('user_id', userId).is('deletado_em', null),
    supabase.from('despesas').select('valor, tipo, categoria, categoria_id, data_gasto').eq('user_id', userId),
    supabase.from('fin_categorias').select('id, nome').eq('user_id', userId),
    supabase.from('historico_habitos').select('id').eq('user_id', userId).gte('data', fromIso.slice(0, 10)),
  ])

  const counts = {
    promoted_hoje: 0,
    deferred_load: 0,
    decay_backlog: 0,
    manual_override: 0,
    email_ingest: 0,
  }
  for (const e of events || [])
  {
    if (e.kind in counts) counts[e.kind] += 1
  }

  const open = (tarefas || []).filter((t) => t.status !== 'concluida')
  const done = (tarefas || []).filter((t) => t.status === 'concluida').length
  const hoje = open.filter((t) => t.horizon_override === 'hoje' || (t.score_urgencia ?? 0) >= 70).length

  const catById = new Map((cats || []).map((c) => [c.id, c.nome]))
  const monthTx = (despesas || []).filter((d) => String(d.data_gasto || '').startsWith(mes))
  let receita = 0
  let nec = 0
  let des = 0
  let poup = 0
  for (const t of monthTx)
  {
    const val = Number(t.valor) || 0
    if (t.tipo === 'receita')
    {
      receita += val
      continue
    }
    const g = budgetGroup(catById.get(t.categoria_id) || t.categoria)
    if (g === 'necessidades') nec += val
    else if (g === 'poupanca') poup += val
    else des += val
  }
  const pct = (n) => (receita > 0 ? Math.round((n / receita) * 100) : 0)

  const habitDays = (habitos || []).length

  const title = 'Simply-Life · resumo da semana'
  const body = [
    axelCopy(counts),
    `${done} concluída(s) no quadro · ${hoje} ainda em HOJE.`,
    receita > 0
      ? `50/30/20 do mês: ${pct(nec)}% necessidades, ${pct(des)}% desejos, ${pct(poup)}% reserva (sobre R$ ${receita.toFixed(0)}).`
      : 'Cadastre uma receita do mês para ver o 50/30/20.',
    habitDays > 0
      ? `${habitDays} check(s) de hábito nos últimos 7 dias.`
      : 'Nenhum hábito marcado nesta semana.',
  ].join(' ')

  return { title, body, counts, done, hoje }
}

export function shouldSendDigest(pref, { now = new Date(), force = false } = {})
{
  if (force) return true
  if (!pref || pref.enabled === false) return false
  const weekday = Number(pref.weekday ?? 1)
  if (zonedWeekday(now) !== weekday) return false
  if (pref.last_sent_at)
  {
    const last = new Date(pref.last_sent_at).getTime()
    if (Date.now() - last < 5 * 24 * 60 * 60 * 1000) return false
  }
  return true
}
