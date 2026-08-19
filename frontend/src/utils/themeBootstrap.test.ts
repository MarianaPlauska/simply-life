import { beforeEach, describe, expect, it } from 'vitest'
import {
  COLOR_SCHEME_STORAGE_KEY,
  persistColorScheme,
  readDedicatedColorScheme,
} from './applyColorScheme'
import { readPersistedColorScheme } from './themeBootstrap'

describe('persistência do tema', () =>
{
  beforeEach(() =>
  {
    localStorage.clear()
  })

  it('chave dedicada vence o default claro do persist anônimo', () =>
  {
    persistColorScheme('dark')
    localStorage.setItem('simply-life-store:anonymous', JSON.stringify({
      state: { accessibility: { colorScheme: 'light' } },
    }))

    expect(readDedicatedColorScheme()).toBe('dark')
    expect(readPersistedColorScheme()).toBe('dark')
  })

  it('lê o persist Zustand quando ainda não há chave dedicada', () =>
  {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, '')
    localStorage.removeItem(COLOR_SCHEME_STORAGE_KEY)
    localStorage.setItem('simply-life-store:anonymous', JSON.stringify({
      state: { accessibility: { colorScheme: 'light' } },
    }))

    expect(readPersistedColorScheme()).toBe('light')
  })
})
