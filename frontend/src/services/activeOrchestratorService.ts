// activeOrchestratorService.ts
// Cérebro do Orquestrador Ativo de Contexto.
// Contém lógica pura (sem UI) para verificar vencimentos,
// medicamentos e gerar/remover tarefas fantasma automaticamente.
import { supabase } from '../lib/supabase';
import { horariosDoMedicamento, tomadaParaDose } from '../lib/medicamentosSchedule';
import { localTodayIso } from '../lib/healthDayBoundary';

/* ── Helpers ───────────────────────────────────────── */

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
  config?: { horarios?: string[] };
}

interface PhantomTomada
{
  medicamento_id: number;
  horario_previsto: string;
  tomado_em: string;
}

/* ── Vencimentos Financeiros ──────────────────────── */

export async function checkVencimentosFinanceiros(
  _userId: string,
  _cards: PhantomCard[],
  _contasFixas: PhantomContaFixa[],
): Promise<number>
{
  // Boletos e faturas no Kanban são criados por useFinanceBillKanbanSync
  // (1 dia antes, mesmo mês, chave phantom_fin_bill_*).
  return 0;
}

/* ── Medicamentos Pendentes ───────────────────────── */

export async function checkMedicamentosPendentes(
  userId: string,
  medicamentos: PhantomMedicamento[],
  tomadas: PhantomTomada[] = [],
): Promise<number>
{
  let created = 0;
  const today = localTodayIso();

  for (const med of medicamentos)
  {
    const horarios = horariosDoMedicamento(med as Parameters<typeof horariosDoMedicamento>[0]);

    for (const horario of horarios)
    {
      if (tomadaParaDose(tomadas as Parameters<typeof tomadaParaDose>[0], med.id, horario, today))
      {
        continue;
      }

      const score = calcMedScore(horario);
      if (score === 0) continue;

      const phantomKey = `phantom_saude_med_${med.id}_${horario}_${today}`;
      const { data: existing } = await supabase
        .from('tarefas_unificadas')
        .select('id, score_urgencia')
        .eq('user_id', userId)
        .eq('snippet_100_char', phantomKey)
        .eq('status', 'pendente')
        .maybeSingle();

      if (existing)
      {
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
            titulo: `Tomar ${med.nome} (era às ${horario})`,
            descricao: `Medicamento ${med.nome} - dose das ${horario}. Registre em Saúde quando tomar.`,
            snippet_100_char: phantomKey,
            score_urgencia: score,
            status: 'pendente',
            prioridade,
            origem: 'saude',
          });

        if (!error) created++;
      }
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
    const todayStr = localTodayIso();
    await supabase
      .from('tarefas_unificadas')
      .update({ status: 'concluida' })
      .eq('user_id', userId)
      .eq('origem', 'saude')
      .like('snippet_100_char', `phantom_saude_med_${itemId}_%_${todayStr}`);
    return;
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
