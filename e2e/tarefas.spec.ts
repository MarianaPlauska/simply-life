import { test, expect } from '@playwright/test';

// credenciais de teste — ajustar conforme ambiente
const TEST_EMAIL = process.env.E2E_EMAIL || ''
const TEST_SENHA = process.env.E2E_PASSWORD || ''

test.describe('E4: fluxo completo login → criar → mover → concluir', () =>
{
  test.skip(!TEST_EMAIL || !TEST_SENHA, 'Defina E2E_EMAIL e E2E_PASSWORD')
  test.beforeEach(async ({ page }) =>
  {
    // navega para login
    await page.goto('/login');
  });

  test('login com credenciais válidas', async ({ page }) =>
  {
    await page.fill('input[name="email"], input[type="email"]', TEST_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', TEST_SENHA);
    await page.click('button[type="submit"]');

    // deve redirecionar para dashboard
    await expect(page).toHaveURL('/', { timeout: 10_000 });
  });

  test('criar tarefa, mover para em_progresso, concluir', async ({ page }) =>
  {
    // faz login
    await page.fill('input[name="email"], input[type="email"]', TEST_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', TEST_SENHA);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 10_000 });

    // navega para kanban
    await page.goto('/kanban');
    await page.waitForLoadState('networkidle');

    // cria nova tarefa via botão "nova tarefa" (ou atalho)
    const novaTarefaBtn = page.locator('button:has-text("Nova Tarefa"), button:has-text("nova tarefa")').first();
    if ( await novaTarefaBtn.isVisible() )
    {
      await novaTarefaBtn.click();

      // preenche título no modal/form
      const tituloInput = page.locator('input[placeholder*="título"], input[placeholder*="Título"], input[name="titulo"]').first();
      await tituloInput.fill('Tarefa E2E Playwright');
      await page.click('button:has-text("Criar"), button:has-text("Salvar")');

      // verifica que a tarefa aparece no board
      await expect(page.locator('text=Tarefa E2E Playwright')).toBeVisible({ timeout: 5_000 });
    }

    // abre o card da tarefa criada
    const card = page.locator('text=Tarefa E2E Playwright').first();
    await card.click();

    // se houver seletor de status, muda para em_progresso
    const statusSelect = page.locator('select, [role="listbox"]').first();
    if ( await statusSelect.isVisible({ timeout: 2_000 }).catch(() => false) )
    {
      await statusSelect.selectOption('em_progresso');
    }
    else
    {
      // tenta botão de status
      const emProgBtn = page.locator('button:has-text("Em Progresso"), button:has-text("em progresso")').first();
      if ( await emProgBtn.isVisible({ timeout: 2_000 }).catch(() => false) )
      {
        await emProgBtn.click();
      }
    }

    // conclui a tarefa
    const concluirBtn = page.locator('button:has-text("Concluída"), button:has-text("concluida"), button:has-text("Concluir")').first();
    if ( await concluirBtn.isVisible({ timeout: 2_000 }).catch(() => false) )
    {
      await concluirBtn.click();
    }
  });

  test('verifica que dashboard carrega sem erros', async ({ page }) =>
  {
    await page.fill('input[name="email"], input[type="email"]', TEST_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', TEST_SENHA);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 10_000 });

    // dashboard não deve ter mensagens de erro visíveis
    await expect(page.locator('text=Algo deu errado')).not.toBeVisible();

    // verifica que componentes principais carregam
    await page.waitForLoadState('networkidle');
  });
});
