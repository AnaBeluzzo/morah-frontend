import { abrirAba, abrirNoMais, apiComo, entrar, expect, sufixoUnico, test, titulo } from './apoio';

/** Cenário pela API: a portaria registra um visitante para a unidade 1 (autorização pendente). */
async function visitaPendente(request: Parameters<typeof apiComo>[0], nome: string): Promise<number> {
  const portaria = await apiComo(request, 'portaria');
  const autorizacao = await portaria.post('/portaria/visitantes', { unidadeId: 1, visitante: { nome }, motivo: 'Visita' });
  return autorizacao.id as number;
}

test.describe('Portaria', () => {
  test('portariaRegistraVisitanteProprietarioAutorizaEPortariaRegistraEntradaESaida', async ({ page, novaPagina }) => {
    const nome = `Visitante ${sufixoUnico()}`;

    await entrar(page, 'portaria');
    await abrirAba(page, 'Visitantes');
    await page.getByRole('link', { name: 'Registrar visitante' }).click();
    await page.getByLabel('ID da unidade').fill('1');
    await page.getByLabel('Nome do visitante').fill(nome);
    await page.getByLabel('Documento').fill('12.345.678-9');
    await page.getByLabel('Motivo').fill('Visita');
    await page.getByRole('button', { name: 'Registrar e avisar a unidade' }).click();
    await expect(page.getByText('Visitante registrado: aguardando a unidade')).toBeVisible();
    await expect(page.getByRole('heading', { name: nome })).toBeVisible();
    await expect(page.getByText('Pendente', { exact: true })).toBeVisible();

    const proprietario = await novaPagina();
    await entrar(proprietario, 'proprietario');
    await abrirNoMais(proprietario, 'Visitantes');
    await proprietario.getByRole('link', { name: nome }).click();
    await proprietario.getByRole('button', { name: 'Autorizar' }).click();
    await proprietario.getByRole('dialog').getByRole('button', { name: 'Autorizar' }).click();
    await expect(proprietario.getByText('Entrada autorizada')).toBeVisible();
    await expect(proprietario.getByText('Autorizada', { exact: true })).toBeVisible();
    await expect(proprietario.getByRole('button', { name: 'Autorizar' })).toBeDisabled();

    // a portaria vê a autorização e registra a entrada
    await page.reload();
    await expect(page.getByRole('button', { name: 'Reenviar notificação' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Registrar entrada' }).click();
    await expect(page.getByText('Entrada registrada', { exact: true })).toBeVisible();

    // e, no histórico, a saída
    await page.getByRole('link', { name: 'Histórico de acessos' }).click();
    await expect(titulo(page)).toHaveText('Histórico de acessos');
    const acesso = page.getByRole('region', { name: nome });
    await expect(acesso.getByText('No condomínio')).toBeVisible();
    await acesso.getByRole('button', { name: 'Registrar saída' }).click();
    await expect(page.getByText('Saída registrada')).toBeVisible();
    await expect(acesso.getByText('Saiu', { exact: true })).toBeVisible();
    await expect(acesso.getByRole('button', { name: 'Registrar saída' })).toHaveCount(0);
  });

  test('recusarEDecidirDeNovoMostraOConflito', async ({ page, request, monitor }) => {
    monitor.esperarErroHttp(409, '/decisao');
    const nome = `Visitante ${sufixoUnico()}`;
    const id = await visitaPendente(request, nome);

    await entrar(page, 'proprietario');
    await page.goto(`/visitantes/${id}`);
    const outraAba = await page.context().newPage();
    await monitor.monitorar(outraAba);
    await outraAba.goto(`/visitantes/${id}`);
    await expect(outraAba.getByRole('heading', { name: nome })).toBeVisible();

    await page.getByRole('button', { name: 'Recusar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Recusar' }).click();
    await expect(page.getByText('Entrada recusada')).toBeVisible();
    await expect(page.getByText('Recusada', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Autorizar' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Recusar' })).toBeDisabled();

    // a outra aba ainda mostra "pendente"; decidir de novo dá 409
    await outraAba.getByRole('button', { name: 'Autorizar' }).click();
    await outraAba.getByRole('dialog').getByRole('button', { name: 'Autorizar' }).click();
    await expect(outraAba.getByRole('alert')).toContainText('Autorização já decidida');
  });

  test('reenviarSoApareceEnquantoPendente', async ({ page, request }) => {
    const nome = `Visitante ${sufixoUnico()}`;
    const id = await visitaPendente(request, nome);

    await entrar(page, 'portaria');
    await abrirAba(page, 'Visitantes');
    await page.getByLabel('Mostrar').selectOption('pendente');
    await page.getByRole('link', { name: nome }).click();
    await page.getByRole('button', { name: 'Reenviar notificação' }).click();
    await expect(page.getByText('Notificação reenviada')).toBeVisible();

    const proprietario = await apiComo(request, 'proprietario');
    await proprietario.patch(`/portaria/autorizacoes/${id}/decisao`, { decisao: 'recusado' });
    await page.reload();
    await expect(page.getByText('Recusada', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reenviar notificação' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Registrar entrada' })).toHaveCount(0);
  });

  test('visitanteParaUnidadeInexistenteMostraUnidadeNaoEncontrada', async ({ page, monitor }) => {
    monitor.esperarErroHttp(404, '/v1/portaria/visitantes');
    await entrar(page, 'portaria');
    await page.goto('/visitantes/novo');
    await page.getByLabel('ID da unidade').fill('999');
    await page.getByLabel('Nome do visitante').fill('Ninguém');
    await page.getByLabel('Motivo').fill('Visita');
    await page.getByRole('button', { name: 'Registrar e avisar a unidade' }).click();
    await expect(page.getByRole('alert')).toHaveText('Unidade não encontrada');
  });

  test('sindicoConsultaOHistoricoDeAcessosSemRegistrar', async ({ page }) => {
    await entrar(page, 'sindico');
    await abrirNoMais(page, 'Histórico de acessos');
    await expect(titulo(page)).toHaveText('Histórico de acessos');
    await expect(page.getByText('Carregando...')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Registrar saída' })).toHaveCount(0);
  });
});
