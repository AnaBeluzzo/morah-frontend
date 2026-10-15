import { abrirAba, entrar, expect, test, titulo, type PerfilDemo } from './apoio';

const NEGADO = 'Esta tela não está disponível para o seu perfil.';

// Telas que cada perfil NÃO pode abrir, nem digitando a URL.
const PROIBIDAS: Record<PerfilDemo, string[]> = {
  morador: ['/financeiro/taxas', '/financeiro/inadimplencia', '/condominio', '/unidades', '/acessos', '/visitantes/novo', '/encomendas/nova', '/avisos/novo', '/unidade/inquilinos'],
  proprietario: ['/financeiro/taxas', '/condominio/modulos', '/unidades', '/acessos', '/encomendas/nova'],
  sindico: ['/financeiro/cobrancas/1/pix', '/visitantes', '/unidade', '/reservas/areas/1/reservar', '/encomendas/nova'],
  portaria: ['/financeiro', '/condominio/identidade', '/unidade', '/unidades', '/reservas/areas/1/reservar', '/avisos/novo'],
};

// Itens da aba "Mais" que NÃO podem aparecer para o perfil.
const FORA_DO_MAIS: Record<PerfilDemo, string[]> = {
  morador: ['Unidades', 'Histórico de acessos'],
  proprietario: ['Unidades', 'Histórico de acessos'],
  sindico: ['Minha unidade', 'Visitantes'],
  portaria: ['Minha unidade', 'Unidades', 'Encomendas'],
};

test.describe('Perfis', () => {
  for (const perfil of Object.keys(PROIBIDAS) as PerfilDemo[]) {
    test(`${perfil}NaoVeNemAbrePelaUrlOQueNaoESeu`, async ({ page }) => {
      await entrar(page, perfil);
      await abrirAba(page, 'Mais');
      const mais = page.getByRole('navigation', { name: 'Mais opções' });
      await expect(mais.getByRole('link', { name: 'Perfil' })).toBeVisible();
      for (const item of FORA_DO_MAIS[perfil]) {
        await expect(mais.getByRole('link', { name: item, exact: true })).toHaveCount(0);
      }
      for (const url of PROIBIDAS[perfil]) {
        await page.goto(url);
        await expect(page.getByText(NEGADO), `${perfil} em ${url}`).toBeVisible();
      }
    });
  }

  test('proprietarioAcessaAsTelasDeMoradorEAsDeProprietario', async ({ page }) => {
    await entrar(page, 'proprietario');
    const telas: [string, string][] = [
      ['/unidade', 'Minha unidade'],
      ['/unidade/solicitar-vinculo', 'Solicitar vínculo'],
      ['/unidade/inquilinos', 'Inquilinos'],
      ['/visitantes', 'Visitantes'],
      ['/reservas/areas/1/reservar', 'Salão de festas'],
      ['/financeiro/documentos', 'Documentos'],
      ['/encomendas', 'Encomendas'],
    ];
    for (const [url, nomeDaTela] of telas) {
      await page.goto(url);
      await expect(titulo(page), url).toHaveText(nomeDaTela);
      await expect(page.getByText(NEGADO)).toHaveCount(0);
    }
  });
});
