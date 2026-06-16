// Perfil de renda — salário base para cálculo de hora extra (localStorage)

const STORAGE_KEY = 'simply-life-finance-income-profile'

export interface FinanceIncomeProfile
{
  salarioBruto: number
  updatedAt: string
}

export function loadIncomeProfile(): FinanceIncomeProfile | null
{
  try
  {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FinanceIncomeProfile
    if (typeof parsed.salarioBruto !== 'number') return null
    return parsed
  }
  catch
  {
    return null
  }
}

export function saveIncomeProfile(salarioBruto: number): FinanceIncomeProfile
{
  const profile: FinanceIncomeProfile = {
    salarioBruto,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  return profile
}
