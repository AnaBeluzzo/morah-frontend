// Fumaça na tela mais estreita (360×800): cada perfil entra e percorre todas as suas abas.
import { ABAS_ESPERADAS, abrirAba, entrar, expect, test, titulo, type PerfilDemo } from './apoio';

const PERFIS: PerfilDemo[] = ['sindico', 'proprietario', 'morador', 'portaria'];

for (const perfil of PERFIS) {
  test(`${perfil}DevePercorrerTodasAsAbas`, async ({ page }) => {
    await entrar(page, perfil);
    for (const aba of ABAS_ESPERADAS[perfil]) {
      await abrirAba(page, aba);
      await expect(titulo(page)).toBeVisible();
      await expect(page.getByText('Carregando...')).toHaveCount(0);
    }
  });
}
