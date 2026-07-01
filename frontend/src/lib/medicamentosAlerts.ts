// Alertas de renovação e consulta — medicamentos

import type { Medicamento } from '../store/storeTypes'
import { localTodayIso } from './healthDayBoundary'

export interface MedicamentoAlerta
{
  medicamentoId: number
  nome: string
  tipo: 'fim_tratamento' | 'consulta_renovacao'
  data: string
  diasRestantes: number
  mensagem: string
}

function diasEntre(hoje: string, alvo: string): number
{
  const a = new Date(`${hoje}T12:00:00`)
  const b = new Date(`${alvo}T12:00:00`)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

export function buildMedicamentosAlertas(
  medicamentos: Medicamento[],
  hoje = localTodayIso(),
): MedicamentoAlerta[]
{
  const alertas: MedicamentoAlerta[] = []

  for (const med of medicamentos)
  {
    const fim = med.config?.fim_tratamento
    if (fim)
    {
      const dias = diasEntre(hoje, fim)
      if (dias >= 0 && dias <= 14)
      {
        alertas.push({
          medicamentoId: med.id,
          nome: med.nome,
          tipo: 'fim_tratamento',
          data: fim,
          diasRestantes: dias,
          mensagem: dias === 0
            ? `Último dia do tratamento de ${med.nome} — marque consulta para renovar.`
            : dias <= 3
              ? `${med.nome} acaba em ${dias} dia${dias !== 1 ? 's' : ''} — hora de pedir receita nova.`
              : `${med.nome} termina em ${dias} dias (${fim}) — programe a consulta.`,
        })
      }
    }

    const consulta = med.config?.consulta_renovacao
    if (consulta)
    {
      const dias = diasEntre(hoje, consulta)
      if (dias >= -1 && dias <= 7)
      {
        alertas.push({
          medicamentoId: med.id,
          nome: med.nome,
          tipo: 'consulta_renovacao',
          data: consulta,
          diasRestantes: dias,
          mensagem: dias < 0
            ? `Consulta de renovação de ${med.nome} era ${consulta} — reagende se ainda precisar.`
            : dias === 0
              ? `Consulta hoje para renovar ${med.nome}.`
              : `Consulta em ${dias} dia${dias !== 1 ? 's' : ''} — ${med.nome}.`,
        })
      }
    }
  }

  return alertas.sort((a, b) => a.diasRestantes - b.diasRestantes)
}
