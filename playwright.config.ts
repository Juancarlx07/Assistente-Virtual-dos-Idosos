import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração dos testes e2e de UI.
 *
 * Os testes cobrem os fluxos que NÃO dependem de um backend real (navegação,
 * formulários, proteção de rota via middleware e o portal com token inválido).
 * O servidor sobe com valores de ambiente fictícios só para inicializar — essas
 * telas não fazem chamadas ao Supabase.
 *
 * Para e2e autenticados (painel/portal com dados), use um Supabase local e
 * defina E2E_FULL=1 (ver README e e2e/autenticado.spec.ts).
 */

const PORTA = 3100;
const BASE_URL = `http://localhost:${PORTA}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['line']],
  use: {
    baseURL: BASE_URL,
    trace: 'off',
    launchOptions: { args: ['--no-sandbox'] },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORTA}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://exemplo.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-fake-para-e2e',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-fake-para-e2e',
      NEXT_PUBLIC_APP_URL: BASE_URL,
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
});
