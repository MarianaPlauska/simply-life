import { signPushActionToken } from './pushActionToken.js';

/** Enriquece payload de push com token para ações inline no SW */
export function enrichPushPayload(base, ctx)
{
  const {
    userId,
    kind,
    snoozeKey,
    medicamentoId,
    horario,
    taskId,
    billKey,
    nudgeKey,
  } = ctx;

  const actionToken = signPushActionToken({
    userId,
    kind,
    snoozeKey: snoozeKey || base.tag,
    medicamentoId,
    horario,
    taskId,
    billKey,
    nudgeKey,
  });

  return {
    ...base,
    kind,
    snoozeKey: snoozeKey || base.tag,
    actionToken,
    interactive: true,
  };
}
