import DOMPurify from 'dompurify'

/** HTML de anotações — remove script/event handlers antes de renderizar */
export function sanitizeNoteHtml(html: string): string
{
  if (!html?.trim())
  {
    return ''
  }

  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  })
}
