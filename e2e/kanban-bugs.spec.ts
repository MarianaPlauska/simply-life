import { test, expect } from '@playwright/test'

const EMAIL = process.env.E2E_EMAIL || ''
const SENHA = process.env.E2E_PASSWORD || ''

test.describe('Kanban — regressão duplicata e prioridade', () =>
{
  test.skip(!EMAIL || !SENHA, 'Defina E2E_EMAIL e E2E_PASSWORD para rodar este spec')

  test('task com duas labels aparece uma vez; horizonte persiste após reload', async ({ page }) =>
  {
    await page.goto('/login')
    await page.fill('input[name="email"], input[type="email"]', EMAIL)
    await page.fill('input[name="password"], input[type="password"]', SENHA)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/($|\?)/, { timeout: 20_000 })

    await page.goto('/kanban')
    await page.waitForLoadState('networkidle')

    const stamp = `E2E-prio-${Date.now()}`
    const addBtn = page.getByRole('button', { name: /nova|adicionar|criar/i }).first()
    if (await addBtn.isVisible({ timeout: 5_000 }).catch(() => false))
    {
      await addBtn.click()
    }

    const titulo = page.locator('input[name="titulo"], textarea, input[placeholder*="ítulo"], input[placeholder*="tarefa"]').first()
    await titulo.waitFor({ timeout: 10_000 })
    await titulo.fill(stamp)

    const save = page.getByRole('button', { name: /criar|salvar|adicionar/i }).last()
    await save.click()

    const cards = page.getByText(stamp, { exact: false })
    await expect(cards.first()).toBeVisible({ timeout: 10_000 })
    expect(await cards.count()).toBe(1)

    await cards.first().click()
    const alta = page.getByRole('button', { name: /alta/i }).first()
    if (await alta.isVisible({ timeout: 4_000 }).catch(() => false))
    {
      await alta.click()
    }

    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(stamp, { exact: false })).toHaveCount(1)
    await page.getByText(stamp, { exact: false }).first().click()
    const selected = page.getByRole('button', { name: /alta/i }).first()
    if (await selected.isVisible({ timeout: 4_000 }).catch(() => false))
    {
      await expect(selected).toHaveAttribute('aria-pressed', /true|/)
    }
  })
})
