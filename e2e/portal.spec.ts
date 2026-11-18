import { expect, test } from '@playwright/test';

test.describe('Portal da pessoa querida', () => {
  test('não é protegido por login (rota pública)', async ({ page }) => {
    await page.goto('/portal/token-inexistente');
    // Não deve redirecionar para /entrar — o portal usa token próprio.
    await expect(page).not.toHaveURL(/\/entrar$/);
    await expect(page.getByText('Gestos de Carinho')).toBeVisible();
  });

  test('mostra mensagem amigável para token inválido/indisponível', async ({
    page,
  }) => {
    await page.goto('/portal/token-inexistente');
    await expect(
      page.getByText(/não é válido ou está indisponível/i),
    ).toBeVisible();
  });
});
