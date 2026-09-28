/**
 * O texto do Simply-Life não usa travessão. Aplicado nas respostas da IA antes de
 * chegarem ao app: intervalo numérico vira "a" (10 a 15), o resto vira vírgula.
 * Também funciona dentro de JSON, porque só troca caracteres dentro das strings.
 */
export function stripDashes(text)
{
  if (typeof text !== 'string') return text
  return text
    .replace(/(\d)\s*[–—]\s*(\d)/g, '$1 a $2')
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/−/g, '-')
    .replace(/,\s*([.,;:!?])/g, '$1')
}
