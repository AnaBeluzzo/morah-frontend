// Gera as capturas de tela do README (docs/telas/) num celular de 390×844.
// Só roda quando pedido, para o e2e normal não reescrever as imagens a cada execução:
//   PowerShell: $env:CAPTURAS=1; npx playwright test e2e/capturas.spec.ts
//   bash:       CAPTURAS=1 npx playwright test e2e/capturas.spec.ts
import type { Page } from '@playwright/test';
import { abrirAba, abrirNoMais, apiComo, diaDaquiA, entrar, expect, test } from './apoio';

test.skip(!process.env.CAPTURAS, 'capturas só com CAPTURAS=1');

async function capturar(pagina: Page, nome: string) {
  await expect(pagina.getByText('Carregando...')).toHaveCount(0);
  await pagina.waitForTimeout(400);
  await pagina.screenshot({ path: `docs/telas/${nome}.png` });
}

test('capturasDoMoradorEDoProprietario', async ({ page, request }) => {
  // dados para as telas não ficarem vazias
  const portaria = await apiComo(request, 'portaria');
  await portaria.post('/portaria/visitantes', { unidadeId: 1, visitante: { nome: 'Marina Alves' }, motivo: 'Visita' });
  const proprietario = await apiComo(request, 'proprietario');
  const { horarios } = await proprietario.get(`/areas-comuns/1/disponibilidade?data=${diaDaquiA(3)}`);
  await proprietario.post('/reservas', { areaComumId: 1, inicio: horarios[10].inicio, fim: horarios[11].fim });

  await page.goto('/login');
  await capturar(page, '01-login');

  await entrar(page, 'proprietario');
  await capturar(page, '02-proprietario-inicio');
  await abrirAba(page, 'Financeiro');
  await page.getByRole('link', { name: /Cobrança 09\/2026/ }).first().click();
  await capturar(page, '03-proprietario-cobranca');
  await page.getByRole('link', { name: 'Pagar com PIX' }).click();
  await capturar(page, '04-proprietario-pix');
  await abrirAba(page, 'Avisos');
  await capturar(page, '05-proprietario-avisos');
  await page.goto('/reservas/areas/1/reservar');
  await page.getByLabel('Data').fill(diaDaquiA(3));
  await page.getByRole('list', { name: 'Horários do dia' }).getByRole('button', { name: /^14:00/ }).click();
  await capturar(page, '06-proprietario-nova-reserva');
  await abrirNoMais(page, 'Minha unidade');
  await capturar(page, '07-proprietario-minha-unidade');
  await page.goto('/encomendas/1');
  await capturar(page, '08-proprietario-encomenda');
  await page.goto('/visitantes');
  await page.getByRole('link', { name: 'Marina Alves' }).click();
  await capturar(page, '09-proprietario-visita');
});

test('capturasDaSindica', async ({ page }) => {
  await entrar(page, 'sindico');
  await capturar(page, '10-sindica-inicio');
  await page.goto('/financeiro/taxas');
  await capturar(page, '11-sindica-taxas');
  await page.goto('/condominio/identidade');
  await capturar(page, '12-sindica-identidade-visual');
  await page.goto('/condominio/modulos');
  await capturar(page, '13-sindica-modulos');
  await page.goto('/unidades');
  await page.getByLabel('ID da unidade').fill('1');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await capturar(page, '14-sindica-unidades');
});

test('capturasDaPortaria', async ({ page }) => {
  await entrar(page, 'portaria');
  await capturar(page, '15-portaria-inicio');
  await abrirAba(page, 'Visitantes');
  await capturar(page, '16-portaria-visitantes');
  await abrirAba(page, 'Encomendas');
  await capturar(page, '17-portaria-encomendas');
  await abrirAba(page, 'Reservas');
  await capturar(page, '18-portaria-reservas');
  await abrirAba(page, 'Mais');
  await capturar(page, '19-portaria-mais');
  await page.goto('/notificacoes');
  await capturar(page, '20-notificacoes');
});
