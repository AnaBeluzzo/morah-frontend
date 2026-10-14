import type { Page } from '@playwright/test';
import { abrirAba, apiComo, competenciaUnica, entrar, expect, sufixoUnico, test, titulo } from './apoio';

function rotuloCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split('-');
  return `${mes}/${ano}`;
}

/** Na aba Financeiro, filtra pela competência (e unidade, para o síndico). */
async function filtrarCobrancas(pagina: Page, competencia: string, unidadeId?: string) {
  await abrirAba(pagina, 'Financeiro');
  await pagina.getByText('Filtros').click();
  await pagina.getByLabel('Competência').fill(competencia);
  if (unidadeId) {
    await pagina.getByLabel('ID da unidade').fill(unidadeId);
  }
  await pagina.getByRole('button', { name: 'Filtrar' }).click();
}

/** Monta o cenário pela API: uma taxa igualitária da competência, já com as cobranças geradas. */
async function criarCobrancasPelaApi(request: Parameters<typeof apiComo>[0], competencia: string, valor = 600) {
  const sindica = await apiComo(request, 'sindico');
  const taxa = await sindica.post('/financeiro/taxas', { descricao: `Taxa ${competencia}`, competencia, valor, tipoRateio: 'igualitario', vencimentoDia: 10 });
  await sindica.post(`/financeiro/taxas/${taxa.id}/gerar-cobrancas`);
  const pagina = await sindica.get(`/financeiro/cobrancas?competencia=${competencia}&unidadeId=1`);
  return pagina.content[0].id as number;
}

async function criarTaxaNaTela(pagina: Page, dados: { descricao: string; competencia: string; valor: string; rateio: string }) {
  await pagina.getByLabel('Descrição').fill(dados.descricao);
  await pagina.getByLabel('Competência').fill(dados.competencia);
  await pagina.getByLabel('Valor total (R$)').fill(dados.valor);
  await pagina.getByLabel('Rateio').selectOption(dados.rateio);
  await pagina.getByRole('button', { name: 'Criar taxa' }).click();
  await expect(pagina.getByText('Taxa criada')).toBeVisible();
  return pagina.getByRole('region', { name: dados.descricao });
}

test.describe('Financeiro', () => {
  test('sindicoCriaTaxasEGeraCobrancasIgualitarioEFracaoIdealConferindoValoresEFalhas', async ({ page }) => {
    const sufixo = sufixoUnico();
    const igualitaria = competenciaUnica(1);
    const porFracao = competenciaUnica(2);
    await entrar(page, 'sindico');
    await abrirAba(page, 'Financeiro');
    await page.getByRole('link', { name: 'Taxas e cobranças em lote' }).click();
    await expect(titulo(page)).toHaveText('Taxas e cobranças');

    // igualitário: R$ 300 ÷ 2 unidades
    const taxaIgual = await criarTaxaNaTela(page, { descricao: `Pintura ${sufixo}`, competencia: igualitaria, valor: '300', rateio: 'igualitario' });
    await taxaIgual.getByRole('button', { name: 'Gerar cobranças' }).click();
    await expect(taxaIgual.getByLabel('Resultado da geração')).toContainText('2 cobranças geradas');

    // gerar de novo: nenhuma nova, as duas unidades vão para `falhas`
    await taxaIgual.getByRole('button', { name: 'Gerar cobranças' }).click();
    const resultado = taxaIgual.getByLabel('Resultado da geração');
    await expect(resultado).toContainText('0 cobranças geradas');
    await expect(resultado).toContainText('Unidade 1:');
    await expect(resultado).toContainText('Unidade 2:');

    // fração ideal: R$ 1.000 × 0,5 de cada unidade
    const taxaFracao = await criarTaxaNaTela(page, { descricao: `Fachada ${sufixo}`, competencia: porFracao, valor: '1000', rateio: 'fracao_ideal' });
    await taxaFracao.getByRole('button', { name: 'Gerar cobranças' }).click();
    await expect(taxaFracao.getByLabel('Resultado da geração')).toContainText('2 cobranças geradas');

    await filtrarCobrancas(page, igualitaria);
    const cobrancasIguais = page.getByRole('link', { name: new RegExp(`Cobrança ${rotuloCompetencia(igualitaria)}`) });
    await expect(cobrancasIguais).toHaveCount(2);
    for (const cobranca of await cobrancasIguais.all()) {
      await expect(cobranca).toContainText('R$ 150,00');
      await expect(cobranca).toContainText('Pendente');
    }

    await page.getByLabel('Competência').fill(porFracao);
    await page.getByRole('button', { name: 'Filtrar' }).click();
    const cobrancasFracao = page.getByRole('link', { name: new RegExp(`Cobrança ${rotuloCompetencia(porFracao)}`) });
    await expect(cobrancasFracao).toHaveCount(2);
    for (const cobranca of await cobrancasFracao.all()) {
      await expect(cobranca).toContainText('R$ 500,00');
    }
  });

  test('proprietarioVeACobrancaGeraPixECopiaOCodigo', async ({ page, request }) => {
    const competencia = competenciaUnica(3);
    await criarCobrancasPelaApi(request, competencia);
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await entrar(page, 'proprietario');
    await filtrarCobrancas(page, competencia);
    const cobranca = page.getByRole('link', { name: new RegExp(`Cobrança ${rotuloCompetencia(competencia)}`) });
    await expect(cobranca).toHaveCount(1);
    await expect(cobranca).toContainText('R$ 300,00');
    await cobranca.click();

    await expect(titulo(page)).toHaveText('Cobrança');
    await page.getByRole('link', { name: 'Pagar com PIX' }).click();
    const codigo = page.getByLabel('Código PIX');
    await expect(codigo).not.toBeEmpty();
    await expect(page.getByText(/Expira em \d{2}:\d{2}/)).toBeVisible();

    await page.getByRole('button', { name: 'Copiar código' }).click();
    await expect(page.getByText('Código copiado')).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await codigo.textContent());
  });

  test('sindicoDaBaixaManualACobrancaFicaPagaEPixDelaMostraOErro', async ({ page, request, novaPagina, monitor }) => {
    monitor.esperarErroHttp(409, '/pix');
    const competencia = competenciaUnica(4);
    const cobrancaId = await criarCobrancasPelaApi(request, competencia);

    await entrar(page, 'sindico');
    await filtrarCobrancas(page, competencia, '1');
    await page.getByRole('link', { name: new RegExp(`Cobrança ${rotuloCompetencia(competencia)} unidade 1`) }).click();
    await page.getByRole('button', { name: 'Dar baixa manual' }).click();
    const dialogo = page.getByRole('dialog', { name: 'Baixa manual' });
    // valor já vem com o total da cobrança e pagoEm com agora
    await expect(dialogo.getByLabel('Valor pago (R$)')).toHaveValue('300');
    await expect(dialogo.getByLabel('Pago em')).not.toHaveValue('');
    await dialogo.getByLabel('Meio de pagamento').selectOption('pix');
    await dialogo.getByRole('button', { name: 'Confirmar baixa' }).click();
    await expect(page.getByText('Baixa registrada: cobrança paga')).toBeVisible();
    await expect(page.getByText('Pago', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dar baixa manual' })).toHaveCount(0);

    // na lista ela aparece como paga
    await page.getByRole('button', { name: 'Voltar' }).click();
    await expect(page.getByRole('link', { name: `Cobrança ${rotuloCompetencia(competencia)} unidade 1` })).toContainText('Pago');

    // o proprietário não vê mais "Pagar com PIX"; abrindo o PIX direto, o servidor recusa (409)
    const proprietario = await novaPagina();
    await entrar(proprietario, 'proprietario');
    await proprietario.goto(`/financeiro/cobrancas/${cobrancaId}`);
    await expect(proprietario.getByText('Pago', { exact: true })).toBeVisible();
    await expect(proprietario.getByRole('link', { name: 'Pagar com PIX' })).toHaveCount(0);
    await proprietario.goto(`/financeiro/cobrancas/${cobrancaId}/pix`);
    await expect(proprietario.getByRole('alert')).toContainText(/paga/i);
  });

  test('sindicoVeAInadimplencia', async ({ page }) => {
    await entrar(page, 'sindico');
    await abrirAba(page, 'Financeiro');
    await page.getByRole('link', { name: 'Inadimplência' }).click();
    await expect(titulo(page)).toHaveText('Inadimplência');
    await expect(page.getByLabel('Total de unidades')).toContainText('2');
    await expect(page.getByLabel('Percentual de inadimplência')).toContainText('%');
    await expect(page.getByLabel('Valor em aberto')).toContainText('R$');
  });

  test('sindicoPublicaDocumentoEAMoradoraVeNaLista', async ({ page, novaPagina }) => {
    const tituloDocumento = `Balancete ${sufixoUnico()}`;
    await entrar(page, 'sindico');
    await abrirAba(page, 'Financeiro');
    await page.getByRole('link', { name: 'Documentos' }).click();
    await page.getByRole('link', { name: 'Publicar documento' }).click();
    await page.getByLabel('Tipo').selectOption('balancete');
    await page.getByLabel('Título').fill(tituloDocumento);
    await page.getByLabel('URL do arquivo').fill('https://exemplo.com/balancete.pdf');
    await page.getByLabel('Competência').fill('2026-09-30');
    await page.getByRole('button', { name: 'Publicar' }).click();
    await expect(page.getByText('Documento publicado', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: tituloDocumento })).toBeVisible();

    const moradora = await novaPagina();
    await entrar(moradora, 'morador');
    await abrirAba(moradora, 'Financeiro');
    await moradora.getByRole('link', { name: 'Documentos' }).click();
    const documento = moradora.getByRole('region', { name: tituloDocumento });
    await expect(documento).toContainText('Balancete');
    await expect(documento.getByRole('link', { name: 'Abrir arquivo' })).toHaveAttribute('href', 'https://exemplo.com/balancete.pdf');
    await expect(moradora.getByRole('link', { name: 'Publicar documento' })).toHaveCount(0);
  });
});
