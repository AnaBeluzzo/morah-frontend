import type { Page } from '@playwright/test';
import { abrirNoMais, entrar, expect, sufixoUnico, test, titulo } from './apoio';

/** Na tela "Unidades" do síndico, busca uma unidade pelo ID. */
async function buscarUnidade(pagina: Page, unidadeId: string) {
  await pagina.getByLabel('ID da unidade').fill(unidadeId);
  await pagina.getByRole('button', { name: 'Buscar' }).click();
}

test.describe('Minha Unidade', () => {
  test('proprietarioCadastraEEncerraInquilino', async ({ page }) => {
    const sufixo = sufixoUnico();
    const nome = `Inquilino ${sufixo}`;
    await entrar(page, 'proprietario');
    await abrirNoMais(page, 'Minha unidade');
    await expect(page.getByRole('heading', { name: 'Apto 302' })).toBeVisible();
    await page.getByRole('link', { name: 'Inquilinos' }).click();
    await page.getByRole('link', { name: 'Cadastrar inquilino' }).click();

    await page.getByLabel('Nome').fill(nome);
    await page.getByLabel('CPF').fill(`9${sufixo}000`);
    await page.getByLabel('E-mail').fill(`inquilino.${sufixo}@exemplo.com`);
    await page.getByLabel('Início do contrato').fill('2026-10-01');
    await page.getByRole('button', { name: 'Cadastrar' }).click();
    await expect(page.getByText('Inquilino cadastrado e convite enviado')).toBeVisible();

    const inquilino = page.getByRole('region', { name: nome });
    await expect(inquilino.getByText('Ativo', { exact: true })).toBeVisible();
    await inquilino.getByRole('button', { name: 'Encerrar contrato' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Encerrar' }).click();
    await expect(page.getByText('Contrato encerrado')).toBeVisible();
    await expect(inquilino.getByText('Encerrado', { exact: true })).toBeVisible();
    await expect(inquilino.getByRole('button', { name: 'Encerrar contrato' })).toHaveCount(0);
  });

  test('moradoraSolicitaVinculoSindicoAprovaESegundaDecisaoMostraOConflito', async ({ page, novaPagina, monitor }) => {
    monitor.esperarErroHttp(409, '/vinculos/solicitacoes/');
    const nome = `Dependente ${sufixoUnico()}`;

    const moradora = await novaPagina();
    await entrar(moradora, 'morador');
    await abrirNoMais(moradora, 'Minha unidade');
    await moradora.getByRole('link', { name: 'Solicitar vínculo' }).click();
    await moradora.getByLabel('Tipo de vínculo').selectOption('dependente');
    await moradora.getByLabel('Nome').fill(nome);
    await moradora.getByRole('button', { name: 'Enviar solicitação' }).click();
    await expect(moradora.getByText('Aguardando aprovação do síndico')).toBeVisible();

    // síndica abre a mesma unidade em duas abas (a segunda fica com a lista antiga)
    await entrar(page, 'sindico');
    await abrirNoMais(page, 'Unidades');
    await buscarUnidade(page, '2');
    const outraAba = await page.context().newPage();
    await monitor.monitorar(outraAba);
    await outraAba.goto('/unidades');
    await buscarUnidade(outraAba, '2');
    await expect(outraAba.getByRole('region', { name: nome })).toBeVisible();

    await page.getByRole('region', { name: nome }).getByRole('button', { name: 'Aprovar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Aprovar' }).click();
    await expect(page.getByText('Solicitação aprovada')).toBeVisible();
    await expect(page.getByRole('region', { name: nome })).toHaveCount(0);

    // decidir de novo a mesma solicitação: o servidor responde 409
    await outraAba.getByRole('region', { name: nome }).getByRole('button', { name: 'Rejeitar' }).click();
    await outraAba.getByRole('dialog').getByRole('button', { name: 'Rejeitar' }).click();
    await expect(outraAba.getByRole('alert')).toContainText('Solicitação já decidida');

    // aprovada, a pessoa vira um vínculo da unidade
    await moradora.goto('/unidade');
    await expect(moradora.getByRole('region', { name: nome })).toBeVisible();
  });

  test('sindicoBuscaUnidadeInexistenteEVeUnidadeNaoEncontrada', async ({ page, monitor }) => {
    monitor.esperarErroHttp(404, '/v1/unidades/999');
    await entrar(page, 'sindico');
    await abrirNoMais(page, 'Unidades');
    await buscarUnidade(page, '999');
    await expect(page.getByText('Unidade não encontrada.')).toBeVisible();
  });

  test('moradoraNaoVeNemAbreATelaDeInquilinos', async ({ page }) => {
    await entrar(page, 'morador');
    await abrirNoMais(page, 'Minha unidade');
    await expect(titulo(page)).toHaveText('Minha unidade');
    await expect(page.getByRole('heading', { name: 'Apto 502' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Inquilinos' })).toHaveCount(0);

    await page.goto('/unidade/inquilinos');
    await expect(page.getByText('Esta tela não está disponível para o seu perfil.')).toBeVisible();
  });
});
