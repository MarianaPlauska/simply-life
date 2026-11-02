import { describe, expect, it } from 'vitest'
import { buildDayCard, deliveryPause } from '../dayCard'
import { missionDone, missionsComplete, pickDailyMissions } from '../dailyMissions'
import { beatPersonalRecord, mergeRecordBoard } from '../personalRecords'
import { buildWeekStory, weekStoryWindow } from '../weekStory'
import { axelFace, pickChestPrize } from '../axelFace'
import { endOfDayDip, fillEnergy, morningReset, settleAxelEnergy } from '../axelEnergy'

describe('carta do dia', () =>
{
  it('repete a mesma carta no mesmo dia', () =>
  {
    const facts = { today: '2026-11-02', patternText: 'Nos dias com treino, seu humor sobe.', eloRecord: 9 }
    expect(buildDayCard(facts)).toEqual(buildDayCard(facts))
  })

  it('sem histórico não inventa número', () =>
  {
    const card = buildDayCard({ today: '2026-11-02' })
    expect(card.kind).toBe('welcome')
    expect(card.text).not.toMatch(/R\$/)
  })

  it('estima o delivery só com pedidos anteriores', () =>
  {
    const pause = deliveryPause([
      { date: '2026-10-01', title: 'iFood', amount: 40 },
      { date: '2026-10-20', title: 'rappi', amount: 60 },
    ], '2026-11-02')
    expect(pause.days).toBeGreaterThanOrEqual(2)
    expect(pause.saved).toBeGreaterThan(0)
    expect(deliveryPause([{ date: '2026-11-01', title: 'pão', amount: 5 }], '2026-11-02').saved).toBeNull()
  })
})

describe('missões', () =>
{
  it('não pede 2 copos para quem quase não bebe', () =>
  {
    const list = pickDailyMissions({ waterDays: 1, usualCups: 1, finishesBeforeTen: false })
    const water = list.find((m) => m.id === 'water')
    expect(water?.target).toBe(1)
    expect(water?.title).not.toContain('2 copos')
  })

  it('as três feitas abrem o baú e uma faltando não', () =>
  {
    const list = pickDailyMissions({ waterDays: 4, usualCups: 3, finishesBeforeTen: false })
    const done = { waterCups: 2, tasksDone: 1, moodLogged: true, taskDoneBeforeTen: false }
    expect(missionsComplete(list, done)).toBe(true)
    expect(missionDone(list[0], { ...done, moodLogged: false })).toBe(list[0].id !== 'mood')
  })
})

describe('recorde e domingo', () =>
{
  it('não festeja o primeiro número guardado como se fosse novo', () =>
  {
    expect(beatPersonalRecord({ elo: 4, tasksDay: 2, waterWeek: 10 }, { elo: 4, tasksDay: 2, waterWeek: 10 })).toBeNull()
    const beat = beatPersonalRecord({ elo: 5, tasksDay: 2, waterWeek: 10 }, { elo: 4, tasksDay: 2, waterWeek: 10 })
    expect(beat?.kind).toBe('elo')
    expect(mergeRecordBoard({ elo: 5, tasksDay: 1, waterWeek: 3 }, { elo: 4, tasksDay: 2, waterWeek: 10 }).tasksDay).toBe(2)
  })

  it('domingo aparece e a segunda some depois de dispensar', () =>
  {
    const sunday = new Date(2026, 10, 1)
    expect(weekStoryWindow(sunday, null)).toBe(true)
    expect(weekStoryWindow(sunday, '2026-11-01')).toBe(false)
    const slides = buildWeekStory({
      bestDay: null,
      moodLine: null,
      spent: null,
      level: 2,
      xpInLevel: 40,
      xpPerLevel: 500,
    })
    expect(slides.map((s) => s.id)).toEqual(['nivel'])
  })
})

describe('energia do AXEL', () =>
{
  it('enche sem passar de 100 e não mexe no piso da manhã', () =>
  {
    expect(fillEnergy(90, 12)).toBe(100)
    expect(fillEnergy(40, 8)).toBe(48)
    expect(morningReset()).toBe(100)
  })

  it('à noite sem registro desce no máximo 15 e não passa de 20', () =>
  {
    expect(endOfDayDip(100, false)).toBe(85)
    expect(endOfDayDip(30, false)).toBe(20)
    expect(endOfDayDip(40, true)).toBe(40)
  })

  it('de manhã a energia volta ao máximo e o mesmo dia não desce duas vezes', () =>
  {
    const morning = settleAxelEnergy(
      { energy: 40, day: '2026-11-01', dippedOn: '2026-11-01' },
      { today: '2026-11-02', hour: 9, actedToday: false },
    )
    expect(morning.energy).toBe(100)
    const night = settleAxelEnergy(morning, { today: '2026-11-02', hour: 22, actedToday: false })
    expect(night.energy).toBe(85)
    const again = settleAxelEnergy(night, { today: '2026-11-02', hour: 23, actedToday: false })
    expect(again.energy).toBe(85)
  })
})

describe('AXEL', () =>
{
  it('fica sonolento à noite e feliz quando registra', () =>
  {
    expect(axelFace({ hour: 23, moodLevel: 5, loggedToday: true, celebrating: false })).toBe('sleepy')
    expect(axelFace({ hour: 10, moodLevel: 3, loggedToday: true, celebrating: false })).toBe('happy')
    expect(axelFace({ hour: 10, moodLevel: 1, loggedToday: true, celebrating: false })).toBe('care')
  })

  it('o baú não devolve um acessório que ela já tem', () =>
  {
    const prize = pickChestPrize('2026-11-02', ['laco', 'cachecol', 'oculos'])
    expect(prize.kind).toBe('gold')
  })
})
