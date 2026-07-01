// Estimativa local de proteína a partir de texto livre (PT-BR)

import { ALIMENTOS_PROTEINA, type RefeicaoId } from '../constants/proteinFoods'

export interface ProteinParseMatch
{
  label: string
  gramas: number
}

export interface ProteinParseResult
{
  gramas: number
  matches: ProteinParseMatch[]
  confianca: 'alta' | 'media' | 'baixa'
}

/** Palavras-chave → gramas por porção típica */
const KEYWORDS: { re: RegExp; gramas: number; label: string }[] = [
  { re: /whey|shake\s*de\s*prote[ií]na/i, gramas: 24, label: 'whey' },
  { re: /frango|peito\s*de\s*frango|galinha/i, gramas: 42, label: 'frango' },
  { re: /carne|bife|patinho|alcatra|maminha/i, gramas: 38, label: 'carne' },
  { re: /peixe|salm[aã]o|til[aá]pia|atum|sardinha/i, gramas: 32, label: 'peixe' },
  { re: /ovo[s]?|omelete|ovos?\s*mexidos?/i, gramas: 12, label: 'ovos' },
  { re: /feij[aã]o|lentilha|gr[aã]o[\s-]*de[\s-]*bico/i, gramas: 12, label: 'leguminosa' },
  { re: /iogurte|grego/i, gramas: 14, label: 'iogurte' },
  { re: /queijo|cottage|ricota/i, gramas: 16, label: 'queijo' },
  { re: /leite/i, gramas: 8, label: 'leite' },
  { re: /tofu/i, gramas: 18, label: 'tofu' },
  { re: /atum/i, gramas: 25, label: 'atum' },
  { re: /barra\s*de\s*prote[ií]na/i, gramas: 20, label: 'barra proteína' },
  { re: /arroz\s*e\s*feij[aã]o|pf\b|prato\s*feito/i, gramas: 18, label: 'arroz e feijão' },
  { re: /salada\s*com\s*frango/i, gramas: 35, label: 'salada com frango' },
  { re: /sopa/i, gramas: 15, label: 'sopa' },
]

/** Quantidade explícita em gramas: "30g", "30 g de proteína" */
const GRAMAS_EXPLICIT = /(\d{1,3})\s*g(?:\s+de\s+prote[ií]na)?/gi

function matchCatalogFoods(text: string, refeicao: RefeicaoId): ProteinParseMatch[]
{
  const lower = text.toLowerCase()
  const found: ProteinParseMatch[] = []
  const allFoods = [
    ...ALIMENTOS_PROTEINA[refeicao],
    ...Object.values(ALIMENTOS_PROTEINA).flat(),
  ]

  for (const food of allFoods)
  {
    const tokens = food.nome.toLowerCase().split(/[\s(,]+/).filter((t) => t.length > 3)
    const hit = tokens.some((t) => lower.includes(t))
    if (hit && !found.some((f) => f.label === food.nome))
    {
      found.push({ label: food.nome, gramas: food.gramas })
    }
  }

  return found
}

export function estimateProteinFromText(text: string, refeicao: RefeicaoId): ProteinParseResult
{
  const trimmed = text.trim()
  if (!trimmed)
  {
    return { gramas: 0, matches: [], confianca: 'baixa' }
  }

  let explicitTotal = 0
  const explicitMatches: ProteinParseMatch[] = []
  let m: RegExpExecArray | null
  const re = new RegExp(GRAMAS_EXPLICIT.source, 'gi')
  while ((m = re.exec(trimmed)) !== null)
  {
    const g = parseInt(m[1], 10)
    if (g > 0 && g <= 200)
    {
      explicitTotal += g
      explicitMatches.push({ label: `${g}g informados`, gramas: g })
    }
  }

  if (explicitTotal > 0)
  {
    return {
      gramas: explicitTotal,
      matches: explicitMatches,
      confianca: 'alta',
    }
  }

  const catalog = matchCatalogFoods(trimmed, refeicao)
  const keywordHits: ProteinParseMatch[] = []

  for (const kw of KEYWORDS)
  {
    if (kw.re.test(trimmed) && !keywordHits.some((h) => h.label === kw.label))
    {
      keywordHits.push({ label: kw.label, gramas: kw.gramas })
    }
  }

  const matches = [...catalog, ...keywordHits.filter((k) => !catalog.some((c) => c.label.includes(k.label)))]
  const gramas = matches.reduce((sum, x) => sum + x.gramas, 0)

  if (gramas === 0)
  {
    // Refeição genérica sem detalhe — estimativa conservadora por tipo
    const fallback: Record<RefeicaoId, number> = {
      cafe: 12,
      almoco: 28,
      jantar: 24,
      lanche: 10,
    }
    return {
      gramas: fallback[refeicao],
      matches: [{ label: 'estimativa da refeição', gramas: fallback[refeicao] }],
      confianca: 'baixa',
    }
  }

  return {
    gramas,
    matches,
    confianca: matches.length >= 2 ? 'alta' : 'media',
  }
}
