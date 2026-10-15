import { abrirAba, apiComo, barraDeAbas, entrar, expect, sufixoUnico, test, titulo } from './apoio';

// A identidade visual e os módulos são do condomínio inteiro: cada teste devolve o que mudou.
test.describe('Personalização', () => {
  let original: Record<string, unknown>;

  test.beforeEach(async ({ request }) => {
    original = await (await apiComo(request, 'sindico')).get('/condominio/personalizacao');
  });

  test.afterEach(async ({ request }) => {
    const sindica = await apiComo(request, 'sindico');
    const { nomeExibicao, logoUrl, corPrimaria, corSecundaria, corDestaque } = original;
    await sindica.patch('/condominio/personalizacao', { nomeExibicao, logoUrl, corPrimaria, corSecundaria, corDestaque });
    for (const modulo of ['financeiro', 'portaria', 'avisos', 'reservas', 'minha_unidade', 'encomendas']) {
      await sindica.patch(`/condominio/modulos/${modulo}`, { ativo: true });
    }
  });

  test('sindicoMudaCoresENomeEOAppRefleteNaHoraEPersisteAoRecarregar', async ({ page }) => {
    const nome = `Residencial ${sufixoUnico()}`;
    await entrar(page, 'sindico');
    await abrirAba(page, 'Condomínio');
    await page.getByRole('link', { name: 'Identidade visual' }).click();

    await page.getByLabel('Nome de exibição').fill(nome);
    await page.getByLabel('Cor primária', { exact: true }).fill('#0F766E');
    await page.getByLabel('Cor de destaque', { exact: true }).fill('#F97316');
    // prévia ao vivo antes de salvar
    await expect(page.getByLabel('Prévia da identidade visual')).toContainText(nome);
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Identidade visual salva')).toBeVisible();

    // o app inteiro muda na hora, sem recarregar
    const topo = page.getByRole('banner');
    await expect(topo).toHaveCSS('background-color', 'rgb(15, 118, 110)');
    await expect(topo).toContainText(nome);
    await abrirAba(page, 'Início');
    await expect(page.getByRole('banner')).toContainText(nome);
    await expect(page.getByRole('banner')).toHaveCSS('background-color', 'rgb(15, 118, 110)');

    await page.reload();
    await expect(page.getByRole('banner')).toContainText(nome);
    await expect(page.getByRole('banner')).toHaveCSS('background-color', 'rgb(15, 118, 110)');
  });

  test('corInvalidaDeveMostrarOErro', async ({ page }) => {
    await entrar(page, 'sindico');
    await page.goto('/condominio/identidade');
    let enviou = false;
    page.on('request', (requisicao) => {
      if (requisicao.method() === 'PATCH' && requisicao.url().includes('/condominio/personalizacao')) enviou = true;
    });
    await page.getByLabel('Cor secundária', { exact: true }).fill('azul');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Use o formato #RRGGBB (ex.: #1F4E79).')).toBeVisible();
    expect(enviou).toBe(false);
  });

  test('removerALogoDeveFuncionar', async ({ page, baseURL }) => {
    await entrar(page, 'sindico');
    await page.goto('/condominio/identidade');
    await page.getByLabel('URL da logo').fill(`${baseURL}/favicon.svg`);
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Identidade visual salva')).toBeVisible();
    await abrirAba(page, 'Condomínio');
    await expect(page.getByRole('banner').getByRole('img', { name: /^Logo de/ })).toBeVisible();

    await page.getByRole('link', { name: 'Identidade visual' }).click();
    await page.getByRole('button', { name: 'Remover logo' }).click();
    const patch = page.waitForRequest((r) => r.method() === 'PATCH' && r.url().includes('/condominio/personalizacao'));
    await page.getByRole('button', { name: 'Salvar' }).click();
    // remover = `"logoUrl": null` explícito (e nenhum outro campo)
    expect((await patch).postDataJSON()).toEqual({ logoUrl: null });
    await expect(page.getByText('Identidade visual salva')).toBeVisible();
    await abrirAba(page, 'Condomínio');
    await expect(page.getByRole('banner').getByRole('img')).toHaveCount(0);
  });

  test('desativarEncomendasSomeAAbaARotaMostraModuloIndisponivelEReativarVolta', async ({ page, novaPagina }) => {
    const portaria = await novaPagina();
    await entrar(portaria, 'portaria');
    await expect(barraDeAbas(portaria).getByRole('link', { name: 'Encomendas' })).toBeVisible();

    await entrar(page, 'sindico');
    await page.goto('/condominio/modulos');
    await page.getByRole('switch', { name: /Encomendas/ }).click();
    await expect(page.getByText('Encomendas desativado')).toBeVisible();

    // a portaria abre o app de novo: a aba sumiu e a rota direta avisa que o módulo está desligado
    await portaria.goto('/');
    await expect(barraDeAbas(portaria).getByRole('link', { name: 'Encomendas' })).toHaveCount(0);
    await expect(barraDeAbas(portaria).getByRole('link')).toHaveText(['Início', 'Visitantes', 'Reservas', 'Mais']);
    await portaria.goto('/encomendas');
    await expect(portaria.getByRole('heading', { name: 'Módulo indisponível', level: 2 })).toBeVisible();

    await page.getByRole('switch', { name: /Encomendas/ }).click();
    await expect(page.getByText('Encomendas ativado')).toBeVisible();
    await portaria.goto('/encomendas');
    await expect(titulo(portaria)).toHaveText('Encomendas');
    await expect(barraDeAbas(portaria).getByRole('link', { name: 'Encomendas' })).toBeVisible();
  });

  test('desativarEReativarModuloDeveRefletirNaHoraEPersistir', async ({ page }) => {
    await entrar(page, 'sindico');
    await abrirAba(page, 'Condomínio');
    await page.getByRole('link', { name: 'Módulos' }).click();
    await expect(titulo(page)).toHaveText('Módulos');

    const chave = page.getByRole('switch', { name: /Encomendas/ });
    await expect(chave).toBeChecked();
    await chave.click();
    await expect(page.getByText('Encomendas desativado')).toBeVisible();
    await expect(chave).not.toBeChecked();

    await page.reload();
    await expect(page.getByRole('switch', { name: /Encomendas/ })).not.toBeChecked();

    await page.getByRole('switch', { name: /Encomendas/ }).click();
    await expect(page.getByText('Encomendas ativado')).toBeVisible();
    await expect(page.getByRole('switch', { name: /Encomendas/ })).toBeChecked();
  });
});
