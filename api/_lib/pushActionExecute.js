import { snoozePushReminder } from './pushSnooze.js';

const SNOOZE_MINUTES = {
  med: 30,
  task: 30,
  bill: 24 * 60,
  mood: 120,
};

export async function executePushAction(supabase, payload, action)
{
  const { userId, kind, snoozeKey } = payload;

  if (action === 'snooze')
  {
    const minutes = SNOOZE_MINUTES[kind] ?? 30;
    const until = await snoozePushReminder(supabase, userId, snoozeKey, minutes);

    if (kind === 'med' && snoozeKey)
    {
      await supabase
        .from('push_medication_deliveries')
        .delete()
        .eq('user_id', userId)
        .eq('dose_key', snoozeKey);
    }

    if (kind === 'mood' && payload.nudgeKey)
    {
      await supabase
        .from('push_wellbeing_deliveries')
        .delete()
        .eq('user_id', userId)
        .eq('nudge_key', payload.nudgeKey);
    }

    return {
      ok: true,
      action: 'snooze',
      message: `Lembrete adiado · ${minutes >= 60 ? `${Math.round(minutes / 60)}h` : `${minutes} min`}`,
      until,
    };
  }

  if (action !== 'done')
  {
    return { ok: false, error: 'Ação inválida' };
  }

  if (kind === 'med')
  {
    const medicamentoId = payload.medicamentoId;
    const horario = payload.horario;
    if (!medicamentoId || !horario)
    {
      return { ok: false, error: 'Dose inválida' };
    }

    const { error } = await supabase.from('medicamento_tomadas').insert({
      user_id: userId,
      medicamento_id: medicamentoId,
      horario_previsto: horario,
    });

    if (error)
    {
      return { ok: false, error: error.message };
    }

    await supabase
      .from('medicamentos')
      .update({ tomado_hoje: 1 })
      .eq('id', medicamentoId)
      .eq('user_id', userId);

    return { ok: true, action: 'done', message: 'Dose registrada' };
  }

  if (kind === 'task')
  {
    const taskId = payload.taskId;
    if (!taskId)
    {
      return { ok: false, error: 'Tarefa inválida' };
    }

    const { error } = await supabase
      .from('tarefas_unificadas')
      .update({ status: 'concluida' })
      .eq('id', taskId)
      .eq('user_id', userId);

    if (error)
    {
      return { ok: false, error: error.message };
    }

    return { ok: true, action: 'done', message: 'Tarefa concluída' };
  }

  if (kind === 'bill')
  {
    if (payload.billKey)
    {
      await supabase.from('push_bill_deliveries').upsert({
        user_id: userId,
        bill_key: payload.billKey,
        sent_at: new Date().toISOString(),
      });
    }

    // Etapa 2: "Feito" = já paguei. Fixa → lança o gasto e marca o mês pago; despesa agendada → marca paga.
    const billId = String(payload.billId || '');
    if (billId.startsWith('fixa-'))
    {
      const paid = await settleFixaFromPush(supabase, userId, Number(billId.slice(5)), payload.billDue);
      return { ok: true, action: 'done', message: paid };
    }
    if (billId.startsWith('tx-'))
    {
      await supabase
        .from('despesas')
        .update({ status_pagamento: 'pago' })
        .eq('id', Number(billId.slice(3)))
        .eq('user_id', userId);
      return { ok: true, action: 'done', message: 'Conta marcada como paga' };
    }

    return { ok: true, action: 'done', message: 'Conta anotada para depois' };
  }

  if (kind === 'mood')
  {
    if (payload.nudgeKey)
    {
      await supabase.from('push_wellbeing_deliveries').upsert({
        user_id: userId,
        nudge_key: payload.nudgeKey,
        sent_at: new Date().toISOString(),
      });
    }

    return { ok: true, action: 'done', message: 'Tudo bem - quando quiser, registre o humor no app' };
  }

  return { ok: false, error: 'Tipo de lembrete desconhecido' };
}

/**
 * Conta fixa paga pela notificação: registra o "pago" do mês (mesma chave do app:
 * fixa:<id>:<AAAA-MM>) e lança o gasto ligado à fixa. Se já estava paga, não repete.
 */
async function settleFixaFromPush(supabase, userId, fixaId, dueIso)
{
  if (!fixaId) return 'Conta anotada'
  const { data: fixa } = await supabase
    .from('fin_contas_fixas')
    .select('id, nome, valor, categoria')
    .eq('id', fixaId)
    .eq('user_id', userId)
    .maybeSingle()
  if (!fixa) return 'Conta anotada'

  const today = new Date().toISOString().slice(0, 10)
  const ym = String(dueIso || today).slice(0, 7)
  const billKey = `fixa:${fixa.id}:${ym}`
  const { data: already } = await supabase
    .from('finance_bill_settlements')
    .select('id')
    .eq('user_id', userId)
    .eq('bill_id', billKey)
    .maybeSingle()
  if (already) return `${fixa.nome} já estava paga`

  const despesa = {
    user_id: userId,
    descricao: fixa.nome,
    valor: Number(fixa.valor) || 0,
    categoria: fixa.categoria || 'habitacao',
    data_gasto: today,
    tipo: 'despesa',
    forma_pagamento: 'debito',
    status_pagamento: 'pago',
    fixa_id: fixa.id,
  }
  let { error } = await supabase.from('despesas').insert(despesa)
  if (error && /fixa_id/i.test(error.message))
  {
    // migração 061 pendente
    delete despesa.fixa_id
    ;({ error } = await supabase.from('despesas').insert(despesa))
  }
  if (error) return 'Não consegui lançar: abra o app para marcar'

  await supabase.from('finance_bill_settlements').insert({
    user_id: userId,
    bill_id: billKey,
    titulo: fixa.nome,
    valor: Number(fixa.valor) || 0,
    origem: 'push',
  })
  return `${fixa.nome} paga e lançada no app`
}
