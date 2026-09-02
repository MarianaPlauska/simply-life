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

    return { ok: true, action: 'done', message: 'Tudo bem — quando quiser, registre o humor no app' };
  }

  return { ok: false, error: 'Tipo de lembrete desconhecido' };
}
