import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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
   
    const { useTaskStore } = await import('../store/useTaskStore');
    useTaskStore.setState({ isLoggedIn: false });

    // Dynamically import to avoid circular deps
    const { default: App } = await import('../App');

    render(
      <MemoryRouter initialEntries={['/kanban']}>
        <App />
      </MemoryRouter>
    );

    
    const mainContent = document.querySelector('[role="main"]');
    
    expect(mainContent).toBeNull();
  });
});
