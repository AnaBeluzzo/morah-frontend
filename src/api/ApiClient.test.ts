import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, problema, TOKENS_RENOVADOS } from '../testes/handlers';
import { servidor } from '../testes/servidor';
import { ApiClient, ErroApi } from './ApiClient';

const cliente = ApiClient.getInstance();

/** Rota de teste que só aceita o access token renovado (simula o token velho expirado). */
function rotaQueExigeTokenRenovado(contador?: { chamadas: number }) {
  return http.get(api('/avisos'), ({ request }) => {
    if (contador) contador.chamadas++;
    return request.headers.get('Authorization') === `Bearer ${TOKENS_RENOVADOS.accessToken}`
      ? HttpResponse.json({ ok: true })
      : problema(401, 'Token ausente, expirado, inválido ou de sessão encerrada');
  });
}

describe('ApiClient', () => {
  beforeEach(() => {
    cliente.definirTokens({ accessToken: 'access-velho', refreshToken: 'refresh-velho' });
    cliente.definirAoExpirarSessao(() => {});
  });

  it('getInstanceDeveDevolverSempreOMesmoObjeto', () => {
    expect(ApiClient.getInstance()).toBe(cliente);
    expect(ApiClient.getInstance()).toBe(ApiClient.getInstance());
  });

  it('deveInjetarOBearerEPrefixoV1', async () => {
    let autorizacao: string | null = null;
    let caminho = '';
    servidor.use(
      http.get(api('/auth/me'), ({ request }) => {
        autorizacao = request.headers.get('Authorization');
        caminho = new URL(request.url).pathname;
        return HttpResponse.json({ pessoa: { id: 1 } });
      }),
    );
    await cliente.get('/auth/me');
    expect(autorizacao).toBe('Bearer access-velho');
    expect(caminho).toBe('/v1/auth/me');
  });

  it('deveInterpretarOProblemaRfc9457ComDetailEErros', async () => {
    servidor.use(
      http.post(api('/avisos'), () =>
        problema(400, 'Um ou mais campos são inválidos', [{ campo: 'titulo', mensagem: 'não deve estar em branco' }]),
      ),
    );
    const erro = await cliente.post('/avisos', {}).catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ErroApi);
    const erroApi = erro as ErroApi;
    expect(erroApi.status).toBe(400);
    expect(erroApi.detail).toBe('Um ou mais campos são inválidos');
    expect(erroApi.erros).toEqual([{ campo: 'titulo', mensagem: 'não deve estar em branco' }]);
    expect(erroApi.erroDoCampo('titulo')).toBe('não deve estar em branco');
    expect(erroApi.erroDoCampo('conteudo')).toBeUndefined();
  });

  it('deveReconhecerO403DeModuloDesativado', async () => {
    servidor.use(http.get(api('/encomendas'), () => problema(403, 'Módulo Encomendas desativado neste condomínio')));
    const erro = (await cliente.get('/encomendas').catch((e: unknown) => e)) as ErroApi;
    expect(erro.status).toBe(403);
    expect(erro.moduloDesativado).toBe(true);
    expect(new ErroApi(403, 'Recurso de outra unidade').moduloDesativado).toBe(false);
  });

  it('deveRepetirAChamadaUmaVezAposRenovarOToken', async () => {
    const contador = { chamadas: 0 };
    let corpoDoRefresh: unknown;
    servidor.use(
      rotaQueExigeTokenRenovado(contador),
      http.post(api('/auth/refresh'), async ({ request }) => {
        corpoDoRefresh = await request.json();
        return HttpResponse.json(TOKENS_RENOVADOS);
      }),
    );
    await expect(cliente.get('/avisos')).resolves.toEqual({ ok: true });
    expect(contador.chamadas).toBe(2);
    expect(corpoDoRefresh).toEqual({ refreshToken: 'refresh-velho' });
    // o refresh é rotativo: o par novo substitui o antigo
    expect(localStorage.getItem('morah.accessToken')).toBe('access-renovado');
    expect(localStorage.getItem('morah.refreshToken')).toBe('refresh-renovado');
  });

  it('deveFazerUmUnicoRefreshQuandoVariasChamadasRecebem401AoMesmoTempo', async () => {
    let refreshes = 0;
    servidor.use(
      rotaQueExigeTokenRenovado(),
      http.post(api('/auth/refresh'), async ({ request }) => {
        refreshes++;
        const { refreshToken } = (await request.json()) as { refreshToken: string };
        await delay(50);
        // um segundo refresh com o token já consumido falharia (rotação)
        return refreshToken === 'refresh-velho' ? HttpResponse.json(TOKENS_RENOVADOS) : problema(401, 'Refresh token inválido');
      }),
    );
    const resultados = await Promise.all([cliente.get('/avisos'), cliente.get('/avisos'), cliente.get('/avisos')]);
    expect(resultados).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
    expect(refreshes).toBe(1);
  });

  it('deveLimparASessaoQuandoORefreshFalha', async () => {
    const aoExpirar = vi.fn();
    cliente.definirAoExpirarSessao(aoExpirar);
    servidor.use(
      rotaQueExigeTokenRenovado(),
      http.post(api('/auth/refresh'), () => problema(401, 'Refresh token inválido ou expirado')),
    );
    const erro = (await cliente.get('/avisos').catch((e: unknown) => e)) as ErroApi;
    expect(erro.status).toBe(401);
    expect(aoExpirar).toHaveBeenCalledOnce();
    expect(localStorage.getItem('morah.accessToken')).toBeNull();
    expect(cliente.temSessao()).toBe(false);
  });

  it('naoDeveTentarRefreshEmRotaPublica', async () => {
    let refreshes = 0;
    servidor.use(
      http.post(api('/auth/login'), () => problema(401, 'E-mail ou senha inválidos')),
      http.post(api('/auth/refresh'), () => {
        refreshes++;
        return HttpResponse.json(TOKENS_RENOVADOS);
      }),
    );
    const erro = (await cliente.post('/auth/login', { email: 'a@b.com', senha: 'x' }, { publica: true }).catch((e: unknown) => e)) as ErroApi;
    expect(erro.detail).toBe('E-mail ou senha inválidos');
    expect(refreshes).toBe(0);
  });

  it('deveEnviarNullExplicitoEOmitirCamposUndefinedNoCorpo', async () => {
    let corpoRecebido = '';
    servidor.use(
      http.patch(api('/condominio/personalizacao'), async ({ request }) => {
        corpoRecebido = await request.text();
        return HttpResponse.json({});
      }),
    );
    await cliente.patch('/condominio/personalizacao', { nomeExibicao: undefined, logoUrl: null });
    expect(corpoRecebido).toBe('{"logoUrl":null}');
  });

  it('deveIgnorarFiltrosVaziosNaUrl', async () => {
    let busca = '';
    servidor.use(
      http.get(api('/financeiro/cobrancas'), ({ request }) => {
        busca = new URL(request.url).search;
        return HttpResponse.json({});
      }),
    );
    await cliente.get('/financeiro/cobrancas', { status: '', competencia: undefined, page: 0, size: 20 });
    expect(busca).toBe('?page=0&size=20');
  });

  it('deveDevolverUndefinedEm204', async () => {
    servidor.use(http.post(api('/auth/logout'), () => new HttpResponse(null, { status: 204 })));
    await expect(cliente.post('/auth/logout')).resolves.toBeUndefined();
  });

  it('deveTransformarFalhaDeRedeEmErroApiComStatusZero', async () => {
    servidor.use(http.get(api('/avisos'), () => HttpResponse.error()));
    const erro = (await cliente.get('/avisos').catch((e: unknown) => e)) as ErroApi;
    expect(erro.status).toBe(0);
    expect(erro.detail).toMatch(/servidor/);
  });
});
