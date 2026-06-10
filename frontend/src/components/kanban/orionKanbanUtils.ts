// Utilitários compartilhados do Kanban ORION

export function cleanTitleForDisplay(titulo: string): string
{
  return titulo
    .replace(/\[(ORION|FRONTEND|CORE|HUB|API|UX|BACKEND|Urgente)\]\s*/gi, '')
    .replace(/^\[Urgente\]\s*/i, '')
    .trim()
}
