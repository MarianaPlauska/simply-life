// Utilitários compartilhados do Kanban AXEL

export function cleanTitleForDisplay(titulo: string): string
{
  return titulo
    .replace(/\[(AXEL|FRONTEND|CORE|HUB|API|UX|BACKEND|Urgente)\]\s*/gi, '')
    .replace(/^\[Urgente\]\s*/i, '')
    .trim()
}
