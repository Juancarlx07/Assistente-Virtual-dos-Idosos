import { expect, test } from '@playwright/test';

test.describe('Proteção de rotas (middleware)', () => {
  test('redireciona o painel para entrar quando não há sessão', async ({
    page,
  }) => {
    await page.goto('/painel');
    await expect(page).toHaveURL(/\/entrar$/);
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
  });

  test('redireciona subrotas do painel quando não há sessão', async ({
    page,
  }) => {
    await page.goto('/painel/pessoas/qualquer-id');
    await expect(page).toHaveURL(/\/entrar$/);
  });
});
