// Checklist em texto - listas de compras e tarefas leves nas anotações

export interface ChecklistLine
{
  text: string
  checked: boolean
  raw: string
}

const LINE_RE = /^(\s*[-*]\s*)(\[[ xX]\]\s*)?(.*)$/

export function parseChecklist(content: string): ChecklistLine[]
{
  return content.split('\n').map((line) =>
  {
    const match = line.match(LINE_RE)
    if (!match)
    {
      return { text: line, checked: false, raw: line }
    }

    const checked = Boolean(match[2] && /\[x\]/i.test(match[2]))
    const text = match[3]?.trim() ?? ''
    return { text, checked, raw: line }
  })
}

export function isChecklistNote(categoria: string, content: string): boolean
{
  if (categoria === 'lista') return true
  const lines = content.split('\n').filter((l) => l.trim())
  if (lines.length === 0) return false
  const marked = lines.filter((l) => LINE_RE.test(l))
  return marked.length >= Math.max(1, Math.floor(lines.length * 0.5))
}

export function toggleChecklistLine(content: string, lineIndex: number): string
{
  const lines = content.split('\n')
  const target = lines[lineIndex]
  if (!target) return content

  const match = target.match(LINE_RE)
  if (!match)
  {
    lines[lineIndex] = `- [ ] ${target.trim()}`
    return lines.join('\n')
  }

  const prefix = match[1] ?? '- '
  const text = match[3] ?? ''
  const nextChecked = !(match[2] && /\[x\]/i.test(match[2]))
  lines[lineIndex] = `${prefix}[${nextChecked ? 'x' : ' '}] ${text}`
  return lines.join('\n')
}

export function plainTextPreview(content: string, max = 80): string
{
  return content
    .replace(/\[[ xX]\]/g, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}
