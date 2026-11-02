import { describe, expect, it } from 'vitest'
import { findLifePatterns, type LifeSeries } from '../lifePatterns'

function empty(): LifeSeries
{
  return { sleep: {}, water: {}, workout: {}, mood: {}, spend: {}, tasksDone: {} }
}

function day(i: number): string
{
  return `2026-10-${String(i + 1).padStart(2, '0')}`
}

describe('findLifePatterns', () =>
{
  it('acha gasto maior depois de noite curta', () =>
  {
    const s = empty()
    for (let i = 0; i < 20; i++)
    {
      const short = i % 2 === 0
      s.sleep[day(i)] = short ? 5 : 8
      s.spend[day(i)] = short ? 140 : 100
    }
    const p = findLifePatterns(s).find((x) => x.id === 'sono-curto:spend')
    expect(p?.text).toBe('Nos dias depois de dormir menos de 6h, você gasta 40% mais.')
    expect(p?.strength).toBe('forte')
  })

  it('usa "vezes" quando a diferença passa do dobro', () =>
  {
    const s = empty()
    for (let i = 0; i < 12; i++)
    {
      const trained = i < 6
      s.workout[day(i)] = trained ? 1 : 0
      s.tasksDone[day(i)] = trained ? 4 : 2
    }
    const p = findLifePatterns(s).find((x) => x.id === 'treino:tasksDone')
    expect(p?.text).toBe('Nos dias com treino, você conclui 2 vezes mais tarefas.')
    expect(p?.strength).toBe('inicial')
  })

  it('não mostra nada com poucos dias ou diferença pequena', () =>
  {
    const s = empty()
    for (let i = 0; i < 6; i++)
    {
      s.sleep[day(i)] = i < 3 ? 5 : 8
      s.spend[day(i)] = 100
    }
    expect(findLifePatterns(s)).toEqual([])
  })

  it('humor em pontos', () =>
  {
    const s = empty()
    for (let i = 0; i < 16; i++)
    {
      s.water[day(i)] = i % 2 ? 8 : 3
      s.mood[day(i)] = i % 2 ? 4 : 3
    }
    const p = findLifePatterns(s).find((x) => x.id === 'agua:mood')
    expect(p?.text).toBe('Nos dias em que você bebe 6 copos de água ou mais, seu humor fica 1,0 ponto acima do normal.')
  })
})
