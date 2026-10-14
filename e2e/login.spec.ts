import { ABAS_ESPERADAS, abrirNoMais, barraDeAbas, entrar, expect, test, titulo, USUARIOS, type PerfilDemo } from './apoio';

const PERFIS: PerfilDemo[] = ['sindico', 'proprietario', 'morador', 'portaria'];

test.describe('Login', () => {
  for (const perfil of PERFIS) {
    test(`${perfil}DeveEntrarEVerAsAbasDoSeuPerfil`, async ({ page }) => {
      await entrar(page, perfil);
      await expect(barraDeAbas(page).getByRole('link')).toHaveText(ABAS_ESPERADAS[perfil]);
      await abrirNoMais(page, 'Perfil');
      await expect(page.getByRole('heading', { name: USUARIOS[perfil].nome })).toBeVisible();
    });
  }

  test('senhaErradaDeveMostrarOErro', async ({ page, monitor }) => {
    monitor.esperarErroHttp(401, '/v1/auth/login');
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(USUARIOS.morador.email);
    await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('senha-errada');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('alert')).toHaveText('E-mail ou senha inválidos');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('logoutDeveVoltarAoLoginEOVoltarDoNavegadorNaoReabreTelasProtegidas', async ({ page }) => {
    await entrar(page, 'morador');
    await abrirNoMais(page, 'Perfil');
    await page.getByRole('button', { name: 'Sair' }).click();
    await page.getByRole('dialog', { name: 'Sair do Morah?' }).getByRole('button', { name: 'Sair' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
    await expect(barraDeAbas(page)).toHaveCount(0);
  });

  test('sessaoDevePersistirAoRecarregar', async ({ page }) => {
    await entrar(page, 'portaria');
    await abrirNoMais(page, 'Perfil');
    await page.reload();
    await expect(titulo(page)).toHaveText('Perfil');
    await expect(page.getByRole('heading', { name: USUARIOS.portaria.nome })).toBeVisible();
  });

  test('trocarParaOMesmoContextoDeveResponder200EContinuarLogado', async ({ page }) => {
    await entrar(page, 'sindico');
    // o link "Trocar perfil" só aparece com mais de um vínculo; a tela existe para todos
    await page.goto('/perfil/trocar');
    await page.getByRole('button', { name: /Síndico em Condomínio Demo/ }).click();
    const resposta = page.waitForResponse((r) => r.url().endsWith('/v1/auth/contexto'));
    await page.getByRole('dialog').getByRole('button', { name: 'Trocar' }).click();
    expect((await resposta).status()).toBe(200);
    await expect(page.getByText('Perfil alterado')).toBeVisible();
    await expect(titulo(page)).toHaveText('Início');
    await abrirNoMais(page, 'Perfil');
    await expect(page.getByRole('heading', { name: USUARIOS.sindico.nome })).toBeVisible();
  });
});

test.describe('Sessão', () => {
  test('semAccessTokenAProximaAcaoDeveRenovarSemPedirLogin', async ({ page, monitor }) => {
    monitor.esperarErroHttp(401, '/v1/auth/me');
    await entrar(page, 'morador');
    const refreshAntes = await page.evaluate(() => localStorage.getItem('morah.refreshToken'));
    await page.evaluate(() => localStorage.removeItem('morah.accessToken'));

    await abrirNoMais(page, 'Perfil');

    await expect(page.getByRole('heading', { name: USUARIOS.morador.nome })).toBeVisible();
    const tokens = await page.evaluate(() => [localStorage.getItem('morah.accessToken'), localStorage.getItem('morah.refreshToken')]);
    expect(tokens[0]).toBeTruthy();
    // refresh rotativo: o par novo foi guardado
    expect(tokens[1]).not.toBe(refreshAntes);
  });

  test('comOsDoisTokensInvalidosDeveVoltarAoLogin', async ({ page, monitor }) => {
    monitor.esperarErroHttp(401, '/v1/auth/me');
    monitor.esperarErroHttp(401, '/v1/auth/refresh');
    await entrar(page, 'morador');
    await page.evaluate(() => {
      localStorage.setItem('morah.accessToken', 'token-invalido');
      localStorage.setItem('morah.refreshToken', 'refresh-invalido');
    });

    await abrirNoMais(page, 'Perfil');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Sua sessão terminou. Entre de novo.')).toBeVisible();
  });
});
