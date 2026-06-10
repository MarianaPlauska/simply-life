// activeOrchestratorService.ts
// Cérebro do Orquestrador Ativo de Contexto.
// Contém lógica pura (sem UI) para verificar vencimentos,
// medicamentos e gerar/remover tarefas fantasma automaticamente.
import { supabase } from '../lib/supabase';

/* ── Helpers ───────────────────────────────────────── */

function getDaysUntilDue(diaVencimento: number): number
{
  const today = new Date();
  const currentDay = today.getDate();
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  let diff = diaVencimento - currentDay;
  if (diff < 0) diff += daysInMonth;
  return diff;
}

function calcMedScore(horario: string): number
{
  const [h, m] = horario.split(':').map(Number);
  const now = new Date();
  const scheduled = new Date();
  scheduled.setHours(h, m, 0, 0);
  const diffMinutes = (now.getTime() - scheduled.getTime()) / 60000;
  // Saúde = prioridade máxima (spec 200+). Escala após 1h de atraso.
  if (diffMinutes <= 0) return 0;
  if (diffMinutes <= 60) return Math.min(Math.round(80 + diffMinutes), 120);
  return Math.min(Math.round(200 + (diffMinutes - 60) / 5), 250);
}

/* ── Interfaces ────────────────────────────────────── */

interface PhantomCard
{
  id: string;
  nome: string;
  dia_vencimento: number | null;
  limite: number;
}

interface PhantomContaFixa
{
  id: number;
  nome: string;
  valor: number;
  dia_vencimento: number;
  ativa: boolean;
}

interface PhantomMedicamento
{
  id: number;
  nome: string;
  horario: string;
  tomado: boolean;
}

/* ── Vencimentos Financeiros ──────────────────────── */

export async function checkVencimentosFinanceiros(
  userId: string,
  cards: PhantomCard[],
  contasFixas: PhantomContaFixa[],
): Promise<number>
{
  let created = 0;

  // Check card due dates
  for (const card of cards)
  {
    if (!card.dia_vencimento) continue;
    const daysUntil = getDaysUntilDue(card.dia_vencimento);

    if (daysUntil <= 3)
    {
      const phantomKey = `phantom_fin_card_${card.id}`;
      // Check if phantom already exists
      const { data: existing } = await supabase
        .from('tarefas_unificadas')
        .select('id')
        .eq('user_id', userId)
        .eq('snippet_100_char', phantomKey)
        .eq('status', 'pendente')
        .maybeSingle();

      if (!existing)
      {
        const prioridade = daysUntil <= 1 ? 'critica' : 'alta';
        const scoreUrgencia = daysUntil === 0 ? 110 : daysUntil === 1 ? 95 : 75;
        const diaTxt = daysUntil === 0
          ? 'vence hoje'
          : daysUntil === 1
            ? 'vence amanhã'
            : `vence em ${daysUntil} dias`;

        const { error } = await supabase
          .from('tarefas_unificadas')
          .insert({
            user_id: userId,
            titulo: `💳 Fatura ${card.nome} ${diaTxt}`,
            descricao: `Fatura do cartão ${card.nome} com limite de R$ ${card.limite.toLocaleString('pt-BR')}. Dia de vencimento: ${card.dia_vencimento}.`,
            snippet_100_char: phantomKey,
            score_urgencia: scoreUrgencia,
            status: 'pendente',
            prioridade,
            origem: 'financeiro',
          });

        if (!error) created++;
      }
    }
  }

  // Check fixed bills
  for (const conta of contasFixas)
  {
    if (!conta.ativa) continue;
    const daysUntil = getDaysUntilDue(conta.dia_vencimento);

    if (daysUntil <= 3)
    {
      const phantomKey = `phantom_fin_conta_${conta.id}`;
      const { data: existing } = await supabase
        .from('tarefas_unificadas')
        .select('id')
        .eq('user_id', userId)
        .eq('snippet_100_char', phantomKey)
        .eq('status', 'pendente')
        .maybeSingle();

      if (!existing)
      {
        const prioridade = daysUntil <= 1 ? 'critica' : 'alta';
        const scoreUrgencia = daysUntil === 0 ? 105 : daysUntil === 1 ? 90 : 70;
        const diaTxt = daysUntil === 0
          ? 'vence hoje'
          : daysUntil === 1
            ? 'vence amanhã'
            : `vence em ${daysUntil} dias`;
        const valorFmt = conta.valor.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        });

        const { error } = await supabase
          .from('tarefas_unificadas')
          .insert({
            user_id: userId,
            titulo: `📄 ${conta.nome} ${diaTxt} — ${valorFmt}`,
            descricao: `Conta fixa: ${conta.nome}. Valor: ${valorFmt}. Vencimento dia ${conta.dia_vencimento}.`,
            snippet_100_char: phantomKey,
            score_urgencia: scoreUrgencia,
            status: 'pendente',
            prioridade,
            origem: 'financeiro',
          });

        if (!error) created++;
      }
    }
  }

  return created;
}

/* ── Medicamentos Pendentes ───────────────────────── */

export async function checkMedicamentosPendentes(
  userId: string,
  medicamentos: PhantomMedicamento[],
): Promise<number>
{
  let created = 0;

  for (const med of medicamentos)
  {
    if (med.tomado) continue;

    const score = calcMedScore(med.horario);
    if (score === 0) continue; // Ainda não chegou na hora

    const phantomKey = `phantom_saude_med_${med.id}_${new Date().toISOString().slice(0, 10)}`;
    const { data: existing } = await supabase
      .from('tarefas_unificadas')
      .select('id, score_urgencia')
      .eq('user_id', userId)
      .eq('snippet_100_char', phantomKey)
      .eq('status', 'pendente')
      .maybeSingle();

    if (existing)
    {
      // Update score if it increased
      if (score > (existing.score_urgencia || 0))
      {
        await supabase
          .from('tarefas_unificadas')
          .update({ score_urgencia: score })
          .eq('id', existing.id);
      }
    }
    else
    {
      const prioridade = score >= 200 ? 'critica' : score >= 90 ? 'critica' : score >= 70 ? 'alta' : 'media';
      const { error } = await supabase
        .from('tarefas_unificadas')
        .insert({
          user_id: userId,
          titulo: `Tomar ${med.nome} (era às ${med.horario})`,
          descricao: `Medicamento ${med.nome} com horário previsto às ${med.horario} ainda não foi tomado. Score de urgência crescente.`,
          snippet_100_char: phantomKey,
          score_urgencia: score,
          status: 'pendente',
          prioridade,
          origem: 'saude',
        });

      if (!error) created++;
    }
  }

  return created;
}

/* ── Cleanup Phantoms ─────────────────────────────── */

export async function cleanupResolvedPhantoms(
  userId: string,
  tipo: 'saude' | 'financeiro',
  itemId?: number | string,
): Promise<void>
{
  let phantomKeyPattern: string;

  if (tipo === 'saude' && itemId)
  {
    const todayStr = new Date().toISOString().slice(0, 10);
    phantomKeyPattern = `phantom_saude_med_${itemId}_${todayStr}`;
  }
  else if (tipo === 'financeiro' && itemId)
  {
    phantomKeyPattern = `phantom_fin_%_${itemId}`;
  }
  else
  {
    return;
  }

  if (phantomKeyPattern.includes('%'))
  {
    await supabase
      .from('tarefas_unificadas')
      .update({ status: 'concluida' })
      .eq('user_id', userId)
      .eq('origem', tipo)
      .like('snippet_100_char', phantomKeyPattern);
  }
  else
  {
    await supabase
      .from('tarefas_unificadas')
      .update({ status: 'concluida' })
      .eq('user_id', userId)
      .eq('snippet_100_char', phantomKeyPattern);
  }
}

/* ── Detecção de Contexto por Keywords ────────────── */

export async function detectContextGroups(
  userId: string,
): Promise<number>
{
  // MVP: substring matching entre títulos de tarefas ativas
  const { data: tarefas } = await supabase
    .from('tarefas_unificadas')
    .select('id, titulo, origem, categoria_id')
    .eq('user_id', userId)
    .neq('status', 'concluida')
    .order('score_urgencia', { ascending: false })
    .limit(50);

  if (!tarefas || tarefas.length < 2) return 0;

  let groupsCreated = 0;

  // Extrai palavras significativas (>= 4 chars) de cada título
  const keywordMap = new Map<string, number[]>();
  for (const t of tarefas)
  {
    const words = t.titulo
      .toLowerCase()
      .replace(/[^\w\sáéíóúàãõçê]/g, '')
      .split(/\s+/)
      .filter((w: string) => w.length >= 4);

    for (const word of words)
    {
      // Skip common Portuguese words
      const stopWords = ['para', 'como', 'esse', 'essa', 'este', 'esta', 'cada', 'mais', 'onde', 'qual', 'quem', 'quando', 'todos', 'todas', 'muito', 'sobre'];
      if (stopWords.includes(word)) continue;

      const ids = keywordMap.get(word) || [];
      if (!ids.includes(t.id))
      {
        ids.push(t.id);
        keywordMap.set(word, ids);
      }
    }
  }

  // Find groups where >= 2 tasks share the same keyword
  for (const [keyword, taskIds] of keywordMap)
  {
    if (taskIds.length < 2) continue;

    // Check if context already exists for this keyword
    const { data: existingCtx } = await supabase
      .from('contextos')
      .select('id')
      .eq('user_id', userId)
      .eq('titulo', keyword)
      .maybeSingle();

    if (existingCtx) continue;

    // Create context group
    const { data: ctx, error } = await supabase
      .from('contextos')
      .insert({
        user_id: userId,
        titulo: keyword,
        cor: '#8b5cf6',
      })
      .select('id')
      .single();

    if (error || !ctx) continue;

    // Link tasks to context
    const inserts = taskIds.map((tarefa_id) => ({
      contexto_id: ctx.id,
      tarefa_id,
      tipo_item: 'tarefa',
    }));

    await supabase.from('contexto_itens').insert(inserts);
    groupsCreated++;
  }

  return groupsCreated;
}
