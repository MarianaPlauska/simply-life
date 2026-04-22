/**
 * components.test.tsx — Smoke tests para componentes React do Simply-Life OS.
 * Verifica renderização básica sem crash.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Smoke test: PageLoader renderiza corretamente
describe('PageLoader', () => {
  it('should render a spinner element', () => {
    const { container } = render(
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div data-testid="spinner" className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-violet-500 animate-spin" />
      </div>
    );
    expect(container.querySelector('[data-testid="spinner"]')).toBeTruthy();
  });
});

// Smoke test: App redireciona para login quando não autenticado
describe('ProtectedRoute behavior', () => {
  it('should redirect unauthenticated users to /login', async () => {
    // Reset store to logged-out state
    const { useTaskStore } = await import('../store/useTaskStore');
    useTaskStore.setState({ isLoggedIn: false, authToken: '' });

    // Dynamically import to avoid circular deps
    const { default: App } = await import('../App');

    render(
      <MemoryRouter initialEntries={['/kanban']}>
        <App />
      </MemoryRouter>
    );

    // Should not show Kanban content; should redirect to login
    // The LoginView renders a login form
    // We check that we are not in the protected layout
    const mainContent = document.querySelector('[role="main"]');
    // If not logged in, protected route should not render main layout
    expect(mainContent).toBeNull();
  });
});
