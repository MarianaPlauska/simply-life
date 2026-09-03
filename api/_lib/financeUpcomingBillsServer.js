// Boletos próximos - versão servidor para cron de push (contas fixas + despesas pendentes)

const WINDOW_HOURS = 48;
const HORIZON_DAYS = 45;

function fmtDay(d)
{
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBetween(from, to)
{
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.ceil((b.getTime() - a.getTime()) / 86_400_000);
}

function monthKey(ref = new Date())
{
  return `${ref.getFullYear()}-${ref.getMonth()}`;
}

export function billDeliveryKey(billId, ref = new Date())
{
  return `${billId}:${monthKey(ref)}`;
}

function nextContaFixaDate(conta, reference = new Date())
{
  const y = reference.getFullYear();
  const m = reference.getMonth();
  const day = Math.min(28, Math.max(1, conta.dia_vencimento || 10));
  let candidate = new Date(y, m, day);
  if (candidate.getTime() < reference.getTime())
  {
    candidate = new Date(y, m + 1, day);
  }
  return fmtDay(candidate);
}

/**
 * @param {{ contasFixas: object[], despesas: object[], reference?: Date }} input
 */
export function buildUpcomingBillsServer(input)
{
  const reference = input.reference ?? new Date();
  const bills = [];

  for (const conta of (input.contasFixas || []).filter((c) => c.ativa !== false))
  {
    const dueDate = nextContaFixaDate(conta, reference);
    const daysUntil = daysBetween(reference, new Date(`${dueDate}T12:00:00`));
    if (daysUntil < 0 || daysUntil > HORIZON_DAYS) continue;

    bills.push({
      id: `fixa-${conta.id}`,
      label: conta.nome,
      valor: Number(conta.valor) || 0,
      dueDate,
      daysUntil,
    });
  }

  for (const d of input.despesas || [])
  {
    const tipo = d.tipo || 'despesa';
    if (tipo !== 'despesa') continue;

    const status = d.status_pagamento || 'pendente';
    if (status !== 'agendado' && status !== 'pendente') continue;

    const dueDate = String(d.data_gasto || '').slice(0, 10);
    if (!dueDate) continue;

    const daysUntil = daysBetween(reference, new Date(`${dueDate}T12:00:00`));
    if (daysUntil < 0 || daysUntil > HORIZON_DAYS) continue;

    bills.push({
      id: `tx-${d.id}`,
      label: d.descricao || 'Despesa',
      valor: Number(d.valor) || 0,
      dueDate,
      daysUntil,
    });
  }

  return bills.sort((a, b) => a.daysUntil - b.daysUntil);
}

/** Boletos dentro da janela de push (≤48h) */
export function billsForPushWindow(bills)
{
  return bills.filter((b) => b.daysUntil * 24 <= WINDOW_HOURS);
}

export function formatBillPushPayload(bill)
{
  const title = bill.daysUntil === 0
    ? 'Uma conta vence hoje'
    : `Uma conta em ${bill.daysUntil} dia(s)`;

  const valor = bill.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const body = `${bill.label} - ${valor}. Quando fizer sentido, dá uma olhada.`;

  return {
    title,
    body,
    url: '/financeiro?aba=faturas',
    tag: `bill-${bill.id}`,
  };
}
