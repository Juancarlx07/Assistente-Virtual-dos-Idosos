import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Testes unitários da lógica. Os e2e (Playwright) ficam em e2e/ e rodam
    // com `npm run test:e2e`, não pelo Vitest.
    include: ['tests/**/*.test.ts'],
  },
});
