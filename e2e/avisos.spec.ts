import type { Page } from '@playwright/test';
import { abrirAba, entrar, expect, sufixoUnico, test, titulo } from './apoio';

async function publicarAviso(pagina: Page, dados: { titulo: string; conteudo: string; prioridade?: string; unidadeId?: string }) {
  await abrirAba(pagina, 'Avisos');
  await pagina.getByRole('link', { name: 'Novo aviso' }).click();
  await pagina.getByLabel('Título').fill(dados.titulo);
  await pagina.getByLabel('Conteúdo').fill(dados.conteudo);
  if (dados.prioridade) {
    await pagina.getByLabel('Prioridade').selectOption(dados.prioridade);
  }
  if (dados.unidadeId) {
    await pagina.getByLabel('Público').selectOption('unidade');
    await pagina.getByLabel('ID da unidade').fill(dados.unidadeId);
  }
  await pagina.getByRole('button', { name: 'Publicar' }).click();
  await expect(pagina.getByText('Aviso publicado')).toBeVisible();
  await expect(pagina.getByRole('heading', { name: dados.titulo })).toBeVisible();
}

test.describe('Avisos', () => {
  test('publicarLerEditarSoOTituloEExpirarAteOMoradorReceberForaDeVigencia', async ({ page, novaPagina, monitor }) => {
    const tituloAviso = `Manutenção do elevador ${sufixoUnico()}`;
    monitor.esperarErroHttp(410, '/v1/avisos/');

    // síndica publica um aviso urgente para o condomínio
    await entrar(page, 'sindico');
    await publicarAviso(page, { titulo: tituloAviso, conteudo: 'O elevador do bloco A para amanhã.', prioridade: 'urgente' });
    const urlAviso = page.url();

    // moradora vê na lista como não lido, com destaque de urgente
    const moradora = await novaPagina();
    await entrar(moradora, 'morador');
    await abrirAba(moradora, 'Avisos');
    const cartao = moradora.getByRole('link', { name: tituloAviso });
    await expect(cartao.getByText('Não lido')).toBeVisible();
    await expect(cartao.getByText('Urgente')).toBeVisible();

    // filtro por prioridade mantém o aviso urgente
    await moradora.getByText('Filtros').click();
    await moradora.getByLabel('Prioridade').selectOption('urgente');
    await expect(cartao).toBeVisible();

    // abrir marca como lido
    await cartao.click();
    await expect(moradora.getByRole('heading', { name: tituloAviso })).toBeVisible();
    await moradora.getByRole('button', { name: 'Voltar' }).click();
    await expect(moradora.getByRole('link', { name: tituloAviso }).getByText('Lido')).toBeVisible();

    // síndica edita só o título (PATCH parcial)
    const novoTitulo = `${tituloAviso} (adiado)`;
    await page.getByRole('link', { name: 'Editar' }).click();
    await page.getByLabel('Título').fill(novoTitulo);
    const patch = page.waitForRequest((r) => r.method() === 'PATCH' && r.url().includes('/v1/avisos/'));
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    expect((await patch).postDataJSON()).toEqual({ titulo: novoTitulo });
    await expect(page.getByText('Aviso atualizado')).toBeVisible();
    await expect(page.getByRole('heading', { name: novoTitulo })).toBeVisible();

    // síndica expira (com confirmação)
    await page.getByRole('button', { name: 'Expirar aviso' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Expirar' }).click();
    await expect(page.getByText('Aviso expirado')).toBeVisible();
    await expect(titulo(page)).toHaveText('Avisos');
    await expect(page.getByRole('link', { name: novoTitulo })).toHaveCount(0);

    // a moradora tenta abrir de novo: fora de vigência (410)
    await moradora.goto(new URL(urlAviso).pathname);
    await expect(moradora.getByText('Este aviso não está mais em vigência.')).toBeVisible();
  });

  test('avisoParaAUnidade1NaoApareceParaAMoradoraDaUnidade2', async ({ page, novaPagina }) => {
    const tituloAviso = `Vazamento no Apto 302 ${sufixoUnico()}`;
    await entrar(page, 'sindico');
    await publicarAviso(page, { titulo: tituloAviso, conteudo: 'Vistoria na sua unidade.', unidadeId: '1' });

    const proprietario = await novaPagina();
    await entrar(proprietario, 'proprietario');
    await abrirAba(proprietario, 'Avisos');
    await expect(proprietario.getByRole('link', { name: tituloAviso })).toBeVisible();

    const moradora = await novaPagina();
    await entrar(moradora, 'morador');
    await abrirAba(moradora, 'Avisos');
    await expect(moradora.getByRole('link', { name: /Bem-vindos ao Morah/ })).toBeVisible();
    await expect(moradora.getByRole('link', { name: tituloAviso })).toHaveCount(0);
  });

  test('portariaDeveVerOMuralPelaAbaMaisSemGerenciar', async ({ page }) => {
    await entrar(page, 'portaria');
    await abrirAba(page, 'Mais');
    await page.getByRole('navigation', { name: 'Mais opções' }).getByRole('link', { name: 'Avisos' }).click();
    await expect(titulo(page)).toHaveText('Avisos');
    await expect(page.getByRole('link', { name: /Bem-vindos ao Morah/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Novo aviso' })).toHaveCount(0);
  });
});
