import { expect, test } from '@playwright/test';

test.describe('Tela de entrar / cadastrar', () => {
  test('mostra os formulários de login e de criação de conta', async ({
    page,
  }) => {
    await page.goto('/entrar');

    // Formulário de login.
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
    await expect(page.locator('#email-login')).toBeVisible();
    await expect(page.locator('#senha-login')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();

    // Formulário de cadastro.
    await expect(
      page.getByRole('heading', { name: 'Criar conta' }),
    ).toBeVisible();
    await expect(page.locator('#nome-cad')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Criar conta' })).toBeVisible();
  });

  test('a senha de cadastro exige no mínimo 6 caracteres', async ({ page }) => {
    await page.goto('/entrar');
    await expect(page.locator('#senha-cad')).toHaveAttribute('minlength', '6');
    await expect(page.locator('#email-login')).toHaveAttribute('type', 'email');
  });

  test('mostra o aviso de erro vindo da query string', async ({ page }) => {
    await page.goto('/entrar?erro=' + encodeURIComponent('Credenciais inválidas'));
    await expect(page.getByText('Credenciais inválidas')).toBeVisible();
  });

  test('mostra o aviso de confirmação de e-mail', async ({ page }) => {
    await page.goto('/entrar?msg=confirme');
    await expect(page.getByText(/Confirme seu e-mail/i)).toBeVisible();
  });

  test('o link do topo volta para a página inicial', async ({ page }) => {
    await page.goto('/entrar');
    await page.getByRole('link', { name: 'Gestos de Carinho' }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
