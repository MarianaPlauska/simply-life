/**
 * Retrospectiva curta de domingo. Só entra quadro com fato da semana.
 * Compartilhar é escolha da pessoa. Não compara com outra conta.
 */

import { localTodayIso, mondayOfLocalWeek } from './dates'

export type WeekSlide = {
  id: string
  kicker: string
  title: string
  body: string
}

export type WeekStoryInput = {
  bestDay: string | null
  moodLine: string | null
  spent: string | null
  level: number
  xpInLevel: number
  xpPerLevel: number
}

export function buildWeekStory(input: WeekStoryInput): WeekSlide[]
{
  const slides: WeekSlide[] = []
  if (input.bestDay)
  {
    slides.push({
      id: 'melhor',
      kicker: 'Sua semana',
      title: 'O melhor dia',
      body: input.bestDay,
    })
  }
  if (input.moodLine)
  {
    slides.push({
      id: 'humor',
      kicker: 'O que mexeu',
      title: 'Seu humor',
      body: input.moodLine,
    })
  }
  if (input.spent)
  {
    slides.push({
      id: 'gasto',
      kicker: 'Dinheiro',
      title: 'O que saiu',
      body: input.spent,
    })
  }
  slides.push({
    id: 'nivel',
    kicker: 'Placar',
    title: `Nível ${input.level}`,
    body: `${input.xpInLevel} de ${input.xpPerLevel} pontos neste nível. O que você já ganhou continua com você.`,
  })
  return slides
}

export function weekStoryShareText(slides: WeekSlide[]): string
{
  const lines = slides.map((s) => `${s.title}: ${s.body}`)
  return ['Minha semana no SunFy', ...lines].join('\n')
}

function sundayId(ref: Date): string
{
  const day = ref.getDay()
  const back = day === 0 ? 0 : day === 1 ? 1 : -1
  if (back < 0) return ''
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - back)
  return localTodayIso(d)
}

/** Domingo, ou segunda se ainda não dispensou o domingo que passou. */
export function weekStoryWindow(ref: Date, dismissedSunday: string | null): boolean
{
  const id = sundayId(ref)
  if (!id) return false
  if (dismissedSunday === id) return false
  // segunda só mostra se a semana civil já começou (o domingo é o dia anterior)
  if (ref.getDay() === 1)
  {
    const monday = localTodayIso(mondayOfLocalWeek(ref))
    return id < monday
  }
  return ref.getDay() === 0
}

export function storySundayId(ref: Date): string
{
  return sundayId(ref)
}
