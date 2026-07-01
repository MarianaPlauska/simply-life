// Estimativa local de proteína (espelha frontend/src/lib/proteinMealParser.ts)

const KEYWORDS = [
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
  { re: /barra\s*de\s*prote[ií]na/i, gramas: 20, label: 'barra proteína' },
  { re: /arroz\s*e\s*feij[aã]o|pf\b|prato\s*feito/i, gramas: 18, label: 'arroz e feijão' },
]

const FALLBACK = { cafe: 12, almoco: 28, jantar: 24, lanche: 10 }
const FALLBACK_KCAL = { cafe: 280, almoco: 580, jantar: 520, lanche: 220 }

export function estimateKcalLocal(texto, refeicao, gramasProtein)
{
  const explicitKcal = /(\d{3,4})\s*kcal/i.exec(String(texto || ''))
  if (explicitKcal)
  {
    return Math.min(2500, parseInt(explicitKcal[1], 10))
  }

  if (gramasProtein > 0)
  {
    const base = FALLBACK_KCAL[refeicao] ?? 400
    return Math.round(base * (0.55 + gramasProtein / 70))
  }

  return FALLBACK_KCAL[refeicao] ?? 400
}

export function estimateProteinLocal(texto, refeicao = 'almoco')
{
  const trimmed = String(texto || '').trim()
  if (!trimmed)
  {
    return { gramas: 0, matches: [], confianca: 'baixa' }
  }

  const explicitRe = /(\d{1,3})\s*g(?:\s+de\s+prote[ií]na)?/gi
  let explicitTotal = 0
  const explicitMatches = []
  let m
  while ((m = explicitRe.exec(trimmed)) !== null)
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
    return { gramas: explicitTotal, matches: explicitMatches, confianca: 'alta' }
  }

  const keywordHits = []
  for (const kw of KEYWORDS)
  {
    if (kw.re.test(trimmed) && !keywordHits.some((h) => h.label === kw.label))
    {
      keywordHits.push({ label: kw.label, gramas: kw.gramas })
    }
  }

  const gramas = keywordHits.reduce((s, x) => s + x.gramas, 0)
  if (gramas === 0)
  {
    const fb = FALLBACK[refeicao] ?? 20
    return {
      gramas: fb,
      matches: [{ label: 'estimativa da refeição', gramas: fb }],
      confianca: 'baixa',
    }
  }

  return {
    gramas,
    matches: keywordHits,
    confianca: keywordHits.length >= 2 ? 'alta' : 'media',
  }
}
