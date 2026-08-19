import { describe, expect, it } from 'vitest'
import { isDemoEmail, demoLoginEmail } from './demoWorkspace'

describe('demoWorkspace', () =>
{
  it('reconhece o e-mail demo padrão', () =>
  {
    expect(isDemoEmail(demoLoginEmail())).toBe(true)
    expect(isDemoEmail('DEMO@simply-life.app')).toBe(true)
    expect(isDemoEmail('outra@pessoa.com')).toBe(false)
    expect(isDemoEmail(null)).toBe(false)
  })
})
