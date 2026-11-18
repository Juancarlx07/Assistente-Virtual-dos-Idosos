import { expect, test } from '@playwright/test';

/**
 * Jornada autenticada completa — DESATIVADA por padrão.
 *
 * Exige um Supabase REAL acessível (local via CLI ou cloud), porque as telas do
 * painel/portal leem e escrevem no banco. O Playwright não intercepta as
 * chamadas feitas pelo servidor Next, então não dá para "mockar" o backend.
 *
 * Como rodar (ver README, seção "Testes e2e"):
 *   1. Suba um Supabase e aplique supabase/migrations.
 *   2. Em Authentication → Email, desative a confirmação de e-mail.
 *   3. Rode a app apontando para esse Supabase em http://localhost:3100.
 *   4. E2E_FULL=1 npx playwright test autenticado
 */
test.describe('Jornada autenticada (consentimento → sugestão → gesto)', () => {
  test.skip(
    !process.env.E2E_FULL,
    'Requer Supabase real; defina E2E_FULL=1 para rodar.',
  );

  test('do cadastro ao gesto pronto, com gate de personalização', async ({
    page,
  }) => {
    const sufixo = Date.now();
    const email = `teste+${sufixo}@exemplo.com`;
    const senha = 'senha-forte-123';

    // 1. Cadastro → painel.
    await page.goto('/entrar');
    await page.locator('#nome-cad').fill('Pessoa Teste');
    await page.locator('#email-cad').fill(email);
    await page.locator('#senha-cad').fill(senha);
    await page.getByRole('button', { name: 'Criar conta' }).click();
    await expect(page).toHaveURL(/\/painel$/);

    // 2. Cadastrar pessoa querida.
    await page.locator('#apelido').fill('Alex');
    await page.getByRole('button', { name: 'Adicionar' }).first().click();
    await expect(page).toHaveURL(/\/painel\/pessoas\//);

    // 3. Pegar o link do portal e abri-lo.
    const linkPortal = await page.locator('input[readonly]').inputValue();
    expect(linkPortal).toContain('/portal/');
    await page.goto(linkPortal);

    // 4. Dar consentimento e preencher uma preferência.
    await page.getByRole('button', { name: 'Dar consentimento' }).click();
    await expect(page.getByText('concedido')).toBeVisible();
    await page.locator('#categoria').fill('flores');
    await page.locator('#valor').fill('girassol');
    await page.getByRole('button', { name: 'Adicionar' }).click();
    await expect(page.getByText('girassol')).toBeVisible();

    // 5. Voltar ao painel e gerar sugestões.
    await page.goto('/painel');
    await page.getByRole('button', { name: /Gerar sugestões/ }).click();
    await expect(page.getByRole('link', { name: 'Preparar' }).first()).toBeVisible();

    // 6. Gate de personalização: tentar marcar pronto sem elemento pessoal.
    await page.getByRole('link', { name: 'Preparar' }).first().click();
    await page.getByRole('button', { name: 'Marcar como pronto' }).click();
    await expect(page.getByText(/adicione algo seu/i)).toBeVisible();

    // 7. Adicionar o toque pessoal e marcar como pronto.
    await page.locator('#elemento').fill('Lembra do nosso primeiro café?');
    await page.getByRole('button', { name: 'Marcar como pronto' }).click();
    await expect(page).toHaveURL(/\/painel$/);
    await expect(page.getByText('pronto').first()).toBeVisible();
  });
});
