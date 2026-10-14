import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from '../api/ApiClient';
import { api } from '../testes/handlers';
import { servidor } from '../testes/servidor';
import { Logger, ocultarSegredos } from './logger';

const logger = Logger.getInstance();

describe('Logger', () => {
  afterEach(() => {
    logger.definirNivelMinimo('error');
    vi.restoreAllMocks();
  });

  it('getInstanceDeveDevolverSempreOMesmoObjeto', () => {
    expect(Logger.getInstance()).toBe(logger);
  });

  it('deveRespeitarONivelMinimo', () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.definirNivelMinimo('warn');

    logger.debug('Teste', 'detalhe');
    logger.info('Teste', 'informação');
    logger.warn('Teste', 'atenção');
    logger.error('Teste', 'falha');

    expect(debug).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith('[WARN] Teste: atenção');
    expect(error).toHaveBeenCalledWith('[ERROR] Teste: falha');
  });

  it('naoDeveRegistrarTokensNemSenhas', () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    logger.definirNivelMinimo('debug');

    logger.debug('Teste', 'cabeçalho Bearer eyJhbGciOi.abc.def', { accessToken: 'segredo1', refreshToken: 'segredo2', senha: 'demo123', email: 'a@b.com' });

    const saida = JSON.stringify(debug.mock.calls);
    expect(saida).not.toContain('segredo1');
    expect(saida).not.toContain('segredo2');
    expect(saida).not.toContain('demo123');
    expect(saida).not.toContain('eyJhbGciOi');
    expect(saida).toContain('a@b.com');
  });

  it('ocultarSegredosDeveTrocarValoresSecretosEmObjetosAninhados', () => {
    expect(ocultarSegredos({ contexto: { perfil: 'sindico' }, tokens: [{ accessToken: 'x' }] })).toEqual({
      contexto: { perfil: 'sindico' },
      tokens: '***',
    });
    expect(ocultarSegredos('Authorization: Bearer abc.def')).toBe('Authorization: Bearer ***');
  });

  it('oApiClientNaoDeveVazarOTokenNoLog', async () => {
    const espioes = (['debug', 'info', 'warn', 'error'] as const).map((nivel) => vi.spyOn(console, nivel).mockImplementation(() => {}));
    logger.definirNivelMinimo('debug');
    ApiClient.getInstance().definirTokens({ accessToken: 'token-secreto-123', refreshToken: 'refresh-secreto-456' });
    servidor.use(http.get(api('/auth/me'), () => HttpResponse.json({})));

    await ApiClient.getInstance().get('/auth/me');

    const saida = JSON.stringify(espioes.map((espiao) => espiao.mock.calls));
    expect(saida).toContain('GET /auth/me');
    expect(saida).not.toContain('token-secreto-123');
    expect(saida).not.toContain('refresh-secreto-456');
  });
});
