import { defineConfig } from '@playwright/test';

// Testes de ponta a ponta contra o backend REAL (sem MSW): o Playwright sobe o backend
// numa porta e num banco só dos testes, e o front já compilado com `vite preview`.
const URL_FRONT = 'http://localhost:4173';
const URL_BACKEND = 'http://localhost:8081';

export default defineConfig({
  testDir: './e2e',
  // um worker só: todos os testes usam o mesmo banco
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: URL_FRONT,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      // suíte completa
      name: 'celular-390',
      testIgnore: /fumaca\.spec\.ts/,
      use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
    },
    {
      // subconjunto de fumaça na tela mais estreita
      name: 'celular-360',
      testMatch: /fumaca\.spec\.ts/,
      use: { browserName: 'chromium', viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
    },
  ],
  webServer: [
    {
      command: 'node e2e/iniciar-backend.mjs',
      url: `${URL_BACKEND}/v1/swagger-ui/index.html`,
      timeout: 300_000,
      reuseExistingServer: false,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npm run build && npx vite preview --port 4173 --strictPort',
      url: URL_FRONT,
      env: { API_TARGET: URL_BACKEND },
      timeout: 180_000,
      reuseExistingServer: false,
    },
  ],
});
