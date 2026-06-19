// Agenda de medicamentos — espelho isomórfico do frontend (cron push)

const JANELA_ANTES_MIN = 30;
const JANELA_DEPOIS_MIN = 120;

function localTodayIso(now = new Date())
{
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseHorarioMin(horario)
{
  const parts = String(horario || '').trim().split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function horariosDoMedicamento(med)
{
  const cfg = med.config && typeof med.config === 'object' ? med.config : {};
  const fromConfig = Array.isArray(cfg.horarios) ? cfg.horarios.filter(Boolean) : [];
  if (fromConfig.length > 0)
  {
    return [...fromConfig].sort((a, b) => (parseHorarioMin(a) ?? 0) - (parseHorarioMin(b) ?? 0));
  }
  if (med.horario?.trim())
  {
    return [med.horario.trim()];
  }
  return [];
}

function medicamentoAtivoHoje(med, today, dayOfWeek)
{
  const cfg = med.config && typeof med.config === 'object' ? med.config : {};
  const dias = Array.isArray(cfg.dias_semana) ? cfg.dias_semana : [];
  if (dias.length > 0 && !dias.includes(dayOfWeek))
  {
    return false;
  }
  const inicio = cfg.inicio_tratamento;
  if (inicio && today < inicio)
  {
    return false;
  }
  const fim = cfg.fim_tratamento;
  if (fim && today > fim)
  {
    return false;
  }
  return true;
}

export function tomadaParaDose(tomadas, medicamentoId, horario, today)
{
  return (tomadas || []).find((t) =>
    t.medicamento_id === medicamentoId
    && t.horario_previsto === horario
    && String(t.tomado_em || '').slice(0, 10) === today,
  ) ?? null;
}

function statusDose(minutos, nowMin, tomada)
{
  if (tomada) return 'tomado';
  if (nowMin < minutos - JANELA_ANTES_MIN) return 'futuro';
  if (nowMin <= minutos + JANELA_DEPOIS_MIN) return 'janela';
  return 'atrasado';
}

export function buildDosesHoje(medicamentos, tomadas, now = new Date())
{
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = localTodayIso(now);
  const dayOfWeek = now.getDay();
  const doses = [];

  for (const med of medicamentos || [])
  {
    if (!medicamentoAtivoHoje(med, today, dayOfWeek))
    {
      continue;
    }
    for (const horario of horariosDoMedicamento(med))
    {
      const minutos = parseHorarioMin(horario);
      if (minutos === null) continue;
      const tomada = tomadaParaDose(tomadas, med.id, horario, today);
      doses.push({
        medicamentoId: med.id,
        nome: med.nome,
        horario: horario.trim().slice(0, 5),
        minutos,
        tomada,
        status: statusDose(minutos, nowMin, tomada),
      });
    }
  }

  return doses.sort((a, b) => a.minutos - b.minutos);
}

export function proximaDosePendente(doses)
{
  return doses.find((d) => d.status !== 'tomado' && d.status !== 'futuro') ?? null;
}

export function mensagemGentilDose(dose)
{
  if (dose.status === 'janela')
  {
    return `Já tomou ${dose.nome} (${dose.horario})? Um toque registra — sem julgamento.`;
  }
  return `Passou do horário de ${dose.nome} (${dose.horario}). Quando puder, registre aqui.`;
}

export function doseDeliveryKey(medicamentoId, horario, today)
{
  return `${medicamentoId}:${horario}:${today}`;
}
