import { apiComo, entrar, expect, lerTodasAsNotificacoes, sino, sufixoUnico, test, titulo } from './apoio';

test('sinoDeveMostrarOSeloETocarMarcaComoLidaEDiminuiOSelo', async ({ page, request }) => {
  // cenário: a moradora sem pendências e um aviso novo para o condomínio (gera 1 notificação)
  await lerTodasAsNotificacoes(request, 'morador');
  const tituloAviso = `Aviso do sino ${sufixoUnico()}`;
  const sindica = await apiComo(request, 'sindico');
  await sindica.post('/avisos', { titulo: tituloAviso, conteudo: 'Teste do selo de notificações.', publicoAlvo: { tipo: 'condominio' } });

  await entrar(page, 'morador');
  await expect(sino(page)).toHaveAccessibleName('Notificações (1 não lidas)');
  await expect(sino(page)).toHaveText('1');

  await sino(page).click();
  await expect(titulo(page)).toHaveText('Notificações');
  const item = page.getByRole('button', { name: new RegExp(tituloAviso) });
  await expect(item.getByText('Nova')).toBeVisible();

  await item.click();

  await expect(item.getByText('Nova')).toHaveCount(0);
  await expect(sino(page)).toHaveAccessibleName('Notificações');
});

test('listaDeNotificacoesDeveAbrirPelaAbaMais', async ({ page }) => {
  await entrar(page, 'portaria');
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Mais' }).click();
  await page.getByRole('navigation', { name: 'Mais opções' }).getByRole('link', { name: 'Notificações' }).click();
  await expect(titulo(page)).toHaveText('Notificações');
  await expect(page.getByText('Carregando...')).toHaveCount(0);
});
