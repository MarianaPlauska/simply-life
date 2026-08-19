import { describe, expect, it } from 'vitest'
import { friendlyCallName } from './friendlyCallName'

describe('friendlyCallName', () =>
{
  it('usa o primeiro nome humano', () =>
  {
    expect(friendlyCallName('Mariana Coutinho')).toBe('Mariana')
  })

  it('extrai o nome de um handle colado', () =>
  {
    expect(friendlyCallName('marianaplauska.cf')).toBe('Mariana')
    expect(friendlyCallName('marianaplauska.cf@gmail.com')).toBe('Mariana')
  })

  it('prefere o nome escolhido ao handle', () =>
  {
    expect(friendlyCallName('marianaplauska.cf', 'Mariana')).toBe('Mariana')
  })

  it('extrai o local de um e-mail curto', () =>
  {
    expect(friendlyCallName('ana@empresa.com')).toBe('Ana')
  })

  it('fica vazio se não houver nome humano', () =>
  {
    expect(friendlyCallName('user123', 'x')).toBe('')
  })
})
