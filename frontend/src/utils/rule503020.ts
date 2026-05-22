import type { Category, Transaction } from '../store/storeTypes';

export type BudgetGroup = 'necessidades' | 'desejos' | 'poupanca';

export function getCategoryBudgetGroup(categoryName: string): BudgetGroup
{
  const name = categoryName.toLowerCase();
  if (
    name.includes('moradia') ||
    name.includes('habita') ||
    name.includes('casa') ||
    name.includes('saude') ||
    name.includes('saúde') ||
    name.includes('educa') ||
    name.includes('internet') ||
    name.includes('alimenta') ||
    name.includes('mercado') ||
    name.includes('energia') ||
    name.includes('transporte') ||
    name.includes('luz') ||
    name.includes('agua') ||
    name.includes('água') ||
    name.includes('contas')
  )
  {
    return 'necessidades';
  }

  if (
    name.includes('poupan') ||
    name.includes('invest') ||
    name.includes('reserva') ||
    name.includes('poupar') ||
    name.includes('acoes') ||
    name.includes('ações') ||
    name.includes('fundos')
  )
  {
    return 'poupanca';
  }

  return 'desejos';
}

export interface Rule503020Input
{
  receita: number;
  despesas: number;
  monthTx: Transaction[];
  activeCategories: Category[];
  tolerancePct?: number;
}

export interface Rule503020Result
{
  realNecessidades: number;
  realDesejos: number;
  realPoupanca: number;
  pctNecessidades: number;
  pctDesejos: number;
  pctPoupanca: number;
  isCompliant: boolean;
  reasons: string[];
}

export function computeRule503020({
  receita,
  despesas,
  monthTx,
  activeCategories,
  tolerancePct = 5,
}: Rule503020Input): Rule503020Result
{
  const sumGroup = (group: BudgetGroup) =>
    monthTx
      .filter((t) => t.tipo === 'despesa')
      .filter((t) =>
      {
        const cat = activeCategories.find((c) => c.id === t.categoria_id);
        const catName = cat ? cat.nome : (t.categoria || '');
        return getCategoryBudgetGroup(catName) === group;
      })
      .reduce((sum, t) => sum + t.valor, 0);

  const realNecessidades = sumGroup('necessidades');
  const realDesejos = sumGroup('desejos');
  const realPoupancaExplicito = sumGroup('poupanca');
  const leftOver = receita - despesas;
  const realPoupanca = realPoupancaExplicito + (leftOver > 0 ? leftOver : 0);

  const pctDenom = receita > 0 ? receita : (despesas > 0 ? despesas : 1);
  const pctNecessidades = (realNecessidades / pctDenom) * 100;
  const pctDesejos = (realDesejos / pctDenom) * 100;
  const pctPoupanca = (realPoupanca / pctDenom) * 100;

  const reasons: string[] = [];

  if (receita <= 0)
  {
    reasons.push('Cadastre receitas do mês para avaliar a regra 50-30-20.');
    return {
      realNecessidades,
      realDesejos,
      realPoupanca,
      pctNecessidades,
      pctDesejos,
      pctPoupanca,
      isCompliant: false,
      reasons,
    };
  }

  const maxNec = 50 + tolerancePct;
  const maxDes = 30 + tolerancePct;
  const minPoup = 20 - tolerancePct;

  if (pctNecessidades > maxNec)
  {
    reasons.push(`Necessidades em ${pctNecessidades.toFixed(1)}% (meta ≤ ${maxNec}%).`);
  }
  if (pctDesejos > maxDes)
  {
    reasons.push(`Desejos em ${pctDesejos.toFixed(1)}% (meta ≤ ${maxDes}%).`);
  }
  if (pctPoupanca < minPoup)
  {
    reasons.push(`Poupança em ${pctPoupanca.toFixed(1)}% (meta ≥ ${minPoup}%).`);
  }

  const isCompliant = reasons.length === 0;

  return {
    realNecessidades,
    realDesejos,
    realPoupanca,
    pctNecessidades,
    pctDesejos,
    pctPoupanca,
    isCompliant,
    reasons,
  };
}

export function getCurrentMonthKey(date = new Date()): string
{
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function filterTransactionsForMonth(
  transactions: Transaction[],
  monthKey = getCurrentMonthKey(),
): Transaction[]
{
  return transactions.filter((t) => t.data && t.data.startsWith(monthKey));
}
