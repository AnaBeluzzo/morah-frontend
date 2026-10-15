import { entrar, expect, test, titulo } from './apoio';

test.describe('Tela inicial', () => {
  test('moradoraVePainelECadaCartaoLevaATelaDoModulo', async ({ page }) => {
    await entrar(page, 'morador');
    await expect(titulo(page)).toHaveText('Início');

    // a placa da unidade leva para Minha unidade
    await page.getByRole('link', { name: 'Minha unidade: Apto 502' }).click();
    await expect(titulo(page)).toHaveText('Minha unidade');
    await page.getByRole('button', { name: 'Voltar' }).click();

    // o boleto atrasado do seed leva ao detalhe da cobrança
    const boletos = page.getByRole('region', { name: 'Próximos boletos' });
    await boletos.getByRole('link', { name: /Boleto de R\$ 500,00/ }).click();
    await expect(titulo(page)).toHaveText('Cobrança');
    await page.getByRole('button', { name: 'Voltar' }).click();

    // "Ver tudo" leva à tela do módulo
    await page.getByRole('region', { name: 'Avisos recentes' }).getByRole('link', { name: 'Ver tudo' }).click();
    await expect(titulo(page)).toHaveText('Avisos');
    await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Início' }).click();

    for (const secao of ['Visitas aguardando você', 'Encomendas na portaria', 'Próximas reservas']) {
      await expect(page.getByRole('region', { name: secao })).toBeVisible();
    }
  });

  test('sindicaVeInadimplenciaPendenciasEAvisos', async ({ page }) => {
    await entrar(page, 'sindico');
    const inadimplencia = page.getByRole('region', { name: 'Inadimplência' });
    await expect(inadimplencia).toContainText('%');
    await expect(page.getByRole('region', { name: 'Pendências' })).toContainText('ocorrências abertas');
    await expect(page.getByRole('region', { name: 'Avisos publicados' })).toBeVisible();
    await inadimplencia.getByRole('link', { name: 'Ver tudo' }).click();
    await expect(titulo(page)).toHaveText('Inadimplência');
  });

  test('portariaVeVisitasReservasDeHojeEEncomendasRecebidas', async ({ page }) => {
    await entrar(page, 'portaria');
    await expect(page.getByRole('link', { name: /encomendas recebidas hoje/ })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Esperando a unidade responder' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Reservas de hoje' })).toBeVisible();
    await page.getByRole('link', { name: /encomendas recebidas hoje/ }).click();
    await expect(titulo(page)).toHaveText('Encomendas');
  });
});
