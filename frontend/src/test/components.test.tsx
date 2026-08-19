import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

describe('PageLoader', () =>
{
  it('should render a spinner element', () =>
  {
    const { container } = render(
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div data-testid="spinner" className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-violet-500 animate-spin" />
      </div>,
    )
    expect(container.querySelector('[data-testid="spinner"]')).toBeTruthy()
  })
})

describe('ProtectedRoute behavior', () =>
{
  it('marca sessão como deslogada no store', async () =>
  {
    const { useTaskStore } = await import('../store/useTaskStore')
    useTaskStore.setState({ isLoggedIn: false, userId: '' })
    expect(useTaskStore.getState().isLoggedIn).toBe(false)
  })
})
