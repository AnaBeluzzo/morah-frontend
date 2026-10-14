import { expect, test } from './apoio';

test('semSessaoDeveAbrirOLoginSemRolagemHorizontal', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();

  const larguras = await page.evaluate(() => ({ conteudo: document.documentElement.scrollWidth, tela: window.innerWidth }));
  expect(larguras.conteudo).toBeLessThanOrEqual(larguras.tela);
});

test('oProxyDeveRepassarV1ParaOBackendDosTestes', async ({ request }) => {
  const resposta = await request.post('/v1/auth/login', { data: { email: 'portaria@demo.com.br', senha: 'demo123' } });
  expect(resposta.status()).toBe(200);
});
