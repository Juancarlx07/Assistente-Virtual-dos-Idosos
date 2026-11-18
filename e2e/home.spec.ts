import { expect, test } from '@playwright/test';

test.describe('Página inicial', () => {
  test('mostra a proposta e os princípios', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Gestos de Carinho/);
    await expect(
      page.getByRole('heading', { name: /Carinho constante/i }),
    ).toBeVisible();
    // Os três princípios aparecem como "pills".
    await expect(page.getByText('Consentimento explícito')).toBeVisible();
    await expect(page.getByText('Sem vigilância')).toBeVisible();
  });

  test('o CTA "Começar" leva para a tela de entrar', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Começar' }).click();
    await expect(page).toHaveURL(/\/entrar$/);
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
  });

  test('o link do topo também leva para entrar', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/entrar$/);
  });
});
