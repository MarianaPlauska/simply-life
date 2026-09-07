/**
 * Quebra heurística de tarefas (inspirada em Goblin Tools Magic ToDo).
 * Sem IA: regras locais para sugerir passos editáveis pelo usuário.
 */

const MICRO_TEMPLATES: Record<string, string[]> = {
  estudar: [
    'Abrir material e definir um único tópico',
    'Ler ou assistir um trecho curto (10–15 min)',
    'Fazer anotações do essencial',
    'Revisar em 5 minutos e encerrar',
  ],
  limpar: [
    'Separar o que vai para o lixo ou doação',
    'Limpar uma superfície ou um cômodo pequeno',
    'Guardar o que ficou no lugar',
    'Passar pano rápido e finalizar',
  ],
  email: [
    'Listar quem precisa de resposta',
    'Escrever a resposta mais urgente',
    'Enviar e arquivar',
    'Anotar o que ficou para depois',
  ],
  reuniao: [
    'Confirmar horário e link',
    'Listar 3 pontos que precisa cobrir',
    'Preparar documento ou nota de apoio',
    'Entrar 2 minutos antes e testar áudio',
  ],
  compras: [
    'Listar o que falta (só o essencial)',
    'Verificar saldo ou limite',
    'Fazer a compra principal',
    'Guardar nota ou registrar no app',
  ],
  exercicio: [
    'Vestir roupa e preparar água',
    'Aquecimento de 3–5 minutos',
    'Bloco principal no tempo disponível',
    'Alongar e registrar no diário',
  ],
}

const DEFAULT_MICRO = [
  'Preparar o ambiente (2 minutos)',
  'Fazer só o primeiro pedaço',
  'Revisar o que falta',
  'Encerrar ou marcar próximo passo',
]

function normalizeText(raw: string): string
{
  return raw.trim().replace(/\s+/g, ' ')
}

function splitByLines(text: string): string[]
{
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^[\s\-•*]+/, '').replace(/^\d+[\.\)]\s*/, '').trim())
    .filter((line) => line.length > 1)
}

function splitByPunctuation(text: string): string[]
{
  return text
    .split(/\s*[,;]\s*|\s+e depois\s+|\s+depois\s+|\s+então\s+|\s+em seguida\s+/i)
    .map(normalizeText)
    .filter((part) => part.length > 2)
}

function detectTemplateKey(text: string): string | null
{
  const lower = text.toLowerCase()
  if (/\bestud|prova|aula|ler\b/.test(lower)) return 'estudar'
  if (/\blimp|faxin|organiz|arrumar\b/.test(lower)) return 'limpar'
  if (/\bemail|e-mail|responder\b/.test(lower)) return 'email'
  if (/\breuni|call|zoom|meet\b/.test(lower)) return 'reuniao'
  if (/\bcompr|mercad|farmácia|farmacia\b/.test(lower)) return 'compras'
  if (/\bacadem|trein|corr|exerc/i.test(lower)) return 'exercicio'
  return null
}

function capSteps(steps: string[], max: number): string[]
{
  const seen = new Set<string>()
  const out: string[] = []
  for (const step of steps)
  {
    const key = step.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(step)
    if (out.length >= max) break
  }
  return out
}

/**
 * Sugere passos a partir do título e descrição.
 * O usuário sempre pode editar antes de salvar.
 */
export function suggestTaskSteps(title: string, description = '', max = 8): string[]
{
  const titulo = normalizeText(title)
  const desc = normalizeText(description)
  const combined = [titulo, desc].filter(Boolean).join('\n')
  if (!combined) return []

  const fromLines = splitByLines(combined)
  if (fromLines.length > 1)
  {
    return capSteps(fromLines, max)
  }

  const fromPunct = splitByPunctuation(combined)
  if (fromPunct.length > 1)
  {
    return capSteps(fromPunct, max)
  }

  if (titulo.includes(' e ') && titulo.length > 28)
  {
    const andParts = titulo.split(/\s+e\s+/i).map(normalizeText).filter(Boolean)
    if (andParts.length > 1 && andParts.length <= max)
    {
      return capSteps(andParts, max)
    }
  }

  const templateKey = detectTemplateKey(combined)
  if (templateKey && MICRO_TEMPLATES[templateKey])
  {
    const first = `Começar: ${titulo.slice(0, 72)}${titulo.length > 72 ? '…' : ''}`
    return capSteps([first, ...MICRO_TEMPLATES[templateKey]], max)
  }

  if (titulo.length > 0)
  {
    return capSteps(
      [
        `Primeiro passo: ${titulo.slice(0, 64)}${titulo.length > 64 ? '…' : ''}`,
        ...DEFAULT_MICRO,
      ],
      max,
    )
  }

  return capSteps(DEFAULT_MICRO, max)
}

/** Converte strings em itens de checklist com id estável o suficiente para UI local. */
export function stepsToChecklistItems(steps: string[]): { id: string; texto: string; feito: boolean }[]
{
  const stamp = Date.now()
  return steps.map((texto, i) => ({
    id: `step-${stamp}-${i}`,
    texto,
    feito: false,
  }))
}
