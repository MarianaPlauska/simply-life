import type { Category } from '../store/storeTypes'

function categoryKey(c: Category): string
{
  const grupo = c.grupo ?? 'geral'
  const parent = c.parent_id ?? ''
  return `${c.tipo}|${grupo}|${parent}|${c.nome.toLowerCase().trim()}`
}

/** Remove categorias duplicadas - mantém o id menor */
export function dedupeCategories(categories: Category[]): Category[]
{
  const seen = new Map<string, Category>()

  for (const c of categories)
  {
    const key = categoryKey(c)
    const existing = seen.get(key)
    if (!existing || c.id < existing.id)
    {
      seen.set(key, c)
    }
  }

  return Array.from(seen.values())
}

/** Nomes que ainda não existem no banco - evita seed duplicado */
export function missingSeedNames(
  existing: Category[],
  seeds: { nome: string; tipo: string; grupo: string }[],
): typeof seeds
{
  const keys = new Set(existing.map((c) => categoryKey(c)))
  return seeds.filter((s) => !keys.has(`${s.tipo}|${s.grupo}|${s.nome.toLowerCase().trim()}`))
}
