import { describe, expect, it } from 'vitest'
import {
  coposParaDoisLitros,
  DEFAULT_AGUA_COPOS,
  DEFAULT_ML_POR_COPO,
  formatLiters,
  isLegacyAgua16L,
  META_AGUA_ML,
} from './waterHydration'

describe('meta de 2 L', () =>
{
  it('10 copos de 200 ml somam 2 L', () =>
  {
    expect(DEFAULT_AGUA_COPOS * DEFAULT_ML_POR_COPO).toBe(META_AGUA_ML)
    expect(META_AGUA_ML).toBe(2000)
    expect(coposParaDoisLitros(200)).toBe(10)
    expect(coposParaDoisLitros(250)).toBe(8)
  })

  it('reconhece a meta antiga de 1,6 L', () =>
  {
    expect(isLegacyAgua16L(8, 200)).toBe(true)
    expect(isLegacyAgua16L(10, 200)).toBe(false)
    expect(isLegacyAgua16L(8, 250)).toBe(false)
  })

  it('formata litros para o cartão', () =>
  {
    expect(formatLiters(0)).toBe('0 L')
    expect(formatLiters(2000)).toBe('2 L')
    expect(formatLiters(400)).toBe('0,4 L')
  })
})
