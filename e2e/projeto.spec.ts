import { expect, test } from '@playwright/test';

test('deveAbrirOAppCompiladoComOBackendDePe', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Morah' })).toBeVisible();

  // o proxy do `vite preview` repassa /v1 para o backend dos testes
  const resposta = await request.post('/v1/auth/login', { data: { email: 'portaria@demo.com.br', senha: 'demo123' } });
  expect(resposta.status()).toBe(200);
});
