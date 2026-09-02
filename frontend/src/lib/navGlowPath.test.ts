import { describe, expect, it } from 'vitest'
import { navGlowPath, navSlotCenterPct } from './navGlowPath'

describe('navSlotCenterPct', () =>
{
  it('coloca a primeira aba no meio do primeiro quinto', () =>
  {
    expect(navSlotCenterPct(0, 5)).toBe(10)
  })

  it('coloca a aba do meio no centro', () =>
  {
    expect(navSlotCenterPct(2, 5)).toBe(50)
  })
})

describe('navGlowPath', () =>
{
  it('gera um arco sob o centro', () =>
  {
    const d = navGlowPath(50)
    expect(d).toContain('M 0 9')
    expect(d).toContain('L 100 9')
    expect(d).toContain(' 3.2')
  })
})
