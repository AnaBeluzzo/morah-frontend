import type { APIRequestContext } from '@playwright/test';
import { abrirAba, abrirNoMais, apiComo, entrar, expect, sino, sufixoUnico, test, titulo } from './apoio';

/** Cenário pela API: a portaria registra uma encomenda para a unidade 1. */
async function encomendaPelaApi(request: APIRequestContext, transportadora: string): Promise<number> {
  const portaria = await apiComo(request, 'portaria');
  const encomenda = await portaria.post('/encomendas', { unidadeId: 1, transportadora });
  return encomenda.id as number;
}

test.describe('Encomendas', () => {
  test('portariaRegistraMoradorVeOCodigoEPortariaConfirmaAposErrarOCodigo', async ({ page, novaPagina, monitor }) => {
    monitor.esperarErroHttp(409, '/retirada');
    const transportadora = `Transportadora ${sufixoUnico()}`;

    await entrar(page, 'portaria');
    await abrirAba(page, 'Encomendas');
    await page.getByRole('link', { name: 'Registrar encomenda' }).click();
    await page.getByLabel('ID da unidade').fill('1');
    await page.getByLabel('Transportadora').fill(transportadora);
    await page.getByLabel('Remetente').fill('Loja Online');
    await page.getByRole('button', { name: 'Registrar e avisar a unidade' }).click();
    await expect(page.getByText('Encomenda registrada: a unidade foi avisada')).toBeVisible();
    await expect(page.getByRole('heading', { name: transportadora })).toBeVisible();
    const urlEncomenda = new URL(page.url()).pathname;

    // o proprietário recebe a notificação e vê o código
    const proprietario = await novaPagina();
    await entrar(proprietario, 'proprietario');
    await sino(proprietario).click();
    await expect(proprietario.getByRole('button', { name: /Encomenda na portaria/ }).first()).toBeVisible();
    await abrirNoMais(proprietario, 'Encomendas');
    await proprietario.getByRole('link', { name: new RegExp(transportadora) }).click();
    const codigo = (await proprietario.getByLabel('Código de retirada').textContent())?.trim() ?? '';
    expect(codigo).toMatch(/^\d{6}$/);

    // a portaria erra o código (409) e depois acerta
    await page.getByRole('link', { name: 'Confirmar retirada' }).click();
    await page.getByLabel('Código de retirada').fill(codigo === '000000' ? '111111' : '000000');
    await page.getByRole('button', { name: 'Confirmar retirada' }).click();
    await expect(page.getByRole('alert')).toHaveText('Código de retirada inválido ou expirado');
    await page.getByLabel('Código de retirada').fill(codigo);
    await page.getByLabel('Nome de quem retira').fill('Rafael Nunes');
    await page.getByRole('button', { name: 'Confirmar retirada' }).click();
    await expect(page.getByText('Retirada confirmada')).toBeVisible();
    await expect(page.getByText('Retirada', { exact: true })).toBeVisible();

    await proprietario.goto(urlEncomenda);
    await expect(proprietario.getByText('Retirada', { exact: true })).toBeVisible();
    await expect(proprietario.getByLabel('Código de retirada')).toHaveCount(0);
  });

  test('terceiroAutorizadoRetiraComOProprioCodigo', async ({ page, request, novaPagina }) => {
    const transportadora = `Terceiro ${sufixoUnico()}`;
    const id = await encomendaPelaApi(request, transportadora);
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await entrar(page, 'proprietario');
    await page.goto(`/encomendas/${id}`);
    await page.getByRole('link', { name: 'Autorizar outra pessoa a retirar' }).click();
    await page.getByLabel('Nome de quem vai retirar').fill('Joana Lima');
    await page.getByLabel('Documento').fill('RG 12.345');
    await page.getByLabel('Validade (horas)').fill('2');
    await page.getByRole('button', { name: 'Gerar código' }).click();
    const codigoTerceiro = (await page.getByLabel('Código do terceiro').textContent())?.trim() ?? '';
    expect(codigoTerceiro).toMatch(/^\d{6}$/);
    await page.getByRole('button', { name: 'Copiar código' }).click();
    await expect(page.getByText('Código copiado')).toBeVisible();

    const portaria = await novaPagina();
    await entrar(portaria, 'portaria');
    await portaria.goto(`/encomendas/${id}/retirada`);
    await portaria.getByLabel('Código de retirada').fill(codigoTerceiro);
    await portaria.getByLabel('Nome de quem retira').fill('Joana Lima');
    await portaria.getByLabel('Documento de quem retira').fill('RG 12.345');
    await portaria.getByRole('button', { name: 'Confirmar retirada' }).click();
    await expect(portaria.getByText('Retirada confirmada')).toBeVisible();
    await expect(portaria.getByText('Retirada', { exact: true })).toBeVisible();
  });

  test('ocorrenciaDeExtravioMudaOStatus', async ({ page, request }) => {
    const transportadora = `Extravio ${sufixoUnico()}`;
    const id = await encomendaPelaApi(request, transportadora);

    await entrar(page, 'proprietario');
    await page.goto(`/encomendas/${id}`);
    await page.getByRole('link', { name: 'Informar extravio' }).click();
    await expect(titulo(page)).toHaveText('Informar extravio');
    await page.getByLabel('O que aconteceu').fill('A portaria não encontrou o pacote.');
    await page.getByRole('button', { name: 'Abrir ocorrência de extravio' }).click();
    await expect(page.getByText('Ocorrência aberta')).toBeVisible();
    await expect(page.getByText('Extraviada', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Informar extravio' })).toHaveCount(0);
  });

  test('encomendaParaUnidadeInexistenteMostraUnidadeNaoEncontrada', async ({ page, monitor }) => {
    monitor.esperarErroHttp(404, '/v1/encomendas');
    await entrar(page, 'portaria');
    await page.goto('/encomendas/nova');
    await page.getByLabel('ID da unidade').fill('999');
    await page.getByLabel('Transportadora').fill('Correios');
    await page.getByRole('button', { name: 'Registrar e avisar a unidade' }).click();
    await expect(page.getByRole('alert')).toHaveText('Unidade não encontrada');
  });
});
