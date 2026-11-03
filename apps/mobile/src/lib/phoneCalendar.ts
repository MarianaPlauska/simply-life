/** No navegador a tarefa já aparece no calendário do app. A agenda do aparelho é no app instalado. */
export async function addPhoneCalendarEvent(_input: {
  title: string
  date: string
  horaMinutos: number | null
  minutes: number
}): Promise<boolean>
{
  return false
}
