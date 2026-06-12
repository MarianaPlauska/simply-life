import type { ReservedBill, ReservedBillItem } from '../store/storeTypes'

export const MOCK_BILL_IDS = {
  aluguel: 900_001,
  internet: 900_002,
  nubank: 900_003,
  ipva: 900_004,
} as const

export interface ReservedBillsMockSnapshot
{
  bills: ReservedBill[]
  items: ReservedBillItem[]
}

function addDays(base: Date, days: number): string
{
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Faturas de demonstração — datas relativas a hoje */
export function buildFinanceReservedBillsMock(reference = new Date()): ReservedBillsMockSnapshot
{
  const bills: ReservedBill[] = [
    {
      id: MOCK_BILL_IDS.aluguel,
      titulo: 'Aluguel',
      valor_alocado: 2_200,
      valor_gasto: 0,
      data_vencimento: addDays(reference, 8),
      status: 'aberta',
    },
    {
      id: MOCK_BILL_IDS.internet,
      titulo: 'Internet Vivo',
      valor_alocado: 119.9,
      valor_gasto: 59.95,
      data_vencimento: addDays(reference, 14),
      card_id: 'card_mock_ocean',
      status: 'aberta',
    },
    {
      id: MOCK_BILL_IDS.nubank,
      titulo: 'Fatura Nubank',
      valor_alocado: 1_850,
      valor_gasto: 1_240,
      data_vencimento: addDays(reference, 21),
      card_id: 'card_mock_nubank',
      status: 'aberta',
    },
    {
      id: MOCK_BILL_IDS.ipva,
      titulo: 'IPVA 2025',
      valor_alocado: 480,
      valor_gasto: 360,
      data_vencimento: addDays(reference, 30),
      status: 'aberta',
    },
  ]

  const items: ReservedBillItem[] = [
    {
      id: 910_001,
      fatura_reserva_id: MOCK_BILL_IDS.internet,
      descricao: 'Mensalidade parcial',
      valor: 59.95,
      created_at: addDays(reference, -3),
    },
    {
      id: 910_002,
      fatura_reserva_id: MOCK_BILL_IDS.nubank,
      descricao: 'Netflix',
      valor: 55.9,
      created_at: addDays(reference, -5),
    },
    {
      id: 910_003,
      fatura_reserva_id: MOCK_BILL_IDS.nubank,
      descricao: 'Compra errada — devolver',
      valor: 389,
      destaque: 'erro',
      created_at: addDays(reference, -2),
    },
    {
      id: 910_004,
      fatura_reserva_id: MOCK_BILL_IDS.nubank,
      descricao: 'Mercado Pão de Açúcar',
      valor: 312.4,
      created_at: addDays(reference, -1),
    },
    {
      id: 910_005,
      fatura_reserva_id: MOCK_BILL_IDS.nubank,
      descricao: 'Notebook parcelado',
      valor: 482.7,
      parcela_atual: 4,
      parcela_total: 10,
      created_at: addDays(reference, -7),
    },
    {
      id: 910_006,
      fatura_reserva_id: MOCK_BILL_IDS.ipva,
      descricao: 'Parcela IPVA',
      valor: 360,
      parcela_atual: 11,
      parcela_total: 12,
      created_at: addDays(reference, -10),
    },
    {
      id: 910_007,
      fatura_reserva_id: MOCK_BILL_IDS.ipva,
      descricao: 'Última parcela IPVA',
      valor: 120,
      parcela_atual: 12,
      parcela_total: 12,
      created_at: addDays(reference, -1),
    },
  ]

  return { bills, items }
}
