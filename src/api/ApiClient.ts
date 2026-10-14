import type { ErroCampo, Problem } from '../tipos/comum';
import { Logger } from '../utils/logger';

// O backend fica em /v1; no navegador o Vite repassa esse caminho para ele (proxy).
const PREFIXO_API = '/v1';
const CHAVE_ACCESS_TOKEN = 'morah.accessToken';
const CHAVE_REFRESH_TOKEN = 'morah.refreshToken';

export type ValorParametro = string | number | boolean | undefined | null;

export interface OpcoesRequisicao {
  corpo?: unknown;
  parametros?: Record<string, ValorParametro>;
  /** Rota sem token (login e refresh): não envia Bearer nem tenta renovar em 401. */
  publica?: boolean;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

/** Erro de uma chamada à API, montado a partir do corpo RFC 9457 (`Problem`). */
export class ErroApi extends Error {
  readonly status: number;
  readonly detail: string;
  readonly erros: ErroCampo[];

  constructor(status: number, detail: string, erros: ErroCampo[] = []) {
    super(detail);
    this.name = 'ErroApi';
    this.status = status;
    this.detail = detail;
    this.erros = erros;
  }

  /** Mensagem do servidor para um campo (nome igual ao do contrato, ex.: "visitante.nome"). */
  erroDoCampo(campo: string): string | undefined {
    return this.erros.find((erro) => erro.campo === campo)?.mensagem;
  }

  /** 403 de módulo desligado pelo síndico ("Módulo X desativado neste condomínio"). */
  get moduloDesativado(): boolean {
    return this.status === 403 && /^Módulo .+ desativado/.test(this.detail);
  }
}

/** Texto para mostrar ao usuário: o `detail` do servidor já vem em português e amigável. */
export function mensagemDoErro(erro: unknown): string {
  return erro instanceof ErroApi ? erro.detail : 'Algo deu errado. Tente de novo.';
}

/**
 * Padrão Singleton: uma única instância guarda os tokens, monta as requisições e faz o refresh.
 * Problema que resolve: o refresh é rotativo (cada refresh invalida o anterior). Se cada parte
 * do app tivesse seu próprio cliente, dois refresh simultâneos invalidariam um ao outro; aqui
 * todas as requisições que recebem 401 ao mesmo tempo esperam a MESMA chamada de refresh.
 */
export class ApiClient {
  private static instancia: ApiClient | undefined;

  private readonly logger = Logger.getInstance();
  /** Refresh em andamento, compartilhado por todas as requisições que receberam 401. */
  private renovacaoEmAndamento: Promise<boolean> | null = null;
  private aoExpirarSessao: () => void = () => {};

  private constructor() {}

  static getInstance(): ApiClient {
    if (!ApiClient.instancia) {
      ApiClient.instancia = new ApiClient();
    }
    return ApiClient.instancia;
  }

  // ---------------------------------------------------------------- tokens
  // O localStorage é a única cópia dos tokens: recarregar a página (ou outra aba) enxerga o mesmo par.

  definirTokens(tokens: Tokens): void {
    localStorage.setItem(CHAVE_ACCESS_TOKEN, tokens.accessToken);
    localStorage.setItem(CHAVE_REFRESH_TOKEN, tokens.refreshToken);
  }

  limparTokens(): void {
    localStorage.removeItem(CHAVE_ACCESS_TOKEN);
    localStorage.removeItem(CHAVE_REFRESH_TOKEN);
  }

  /** Há sessão enquanto existir um refresh token (o access token pode ser renovado). */
  temSessao(): boolean {
    return localStorage.getItem(CHAVE_REFRESH_TOKEN) !== null;
  }

  /** Chamado quando a sessão acaba sem volta (refresh recusado): o app volta para o login. */
  definirAoExpirarSessao(callback: () => void): void {
    this.aoExpirarSessao = callback;
  }

  // ---------------------------------------------------------------- atalhos por método

  get<T>(caminho: string, parametros?: Record<string, ValorParametro>): Promise<T> {
    return this.requisitar<T>('GET', caminho, { parametros });
  }

  post<T>(caminho: string, corpo?: unknown, opcoes: Omit<OpcoesRequisicao, 'corpo'> = {}): Promise<T> {
    return this.requisitar<T>('POST', caminho, { ...opcoes, corpo });
  }

  patch<T>(caminho: string, corpo?: unknown): Promise<T> {
    return this.requisitar<T>('PATCH', caminho, { corpo });
  }

  delete<T = void>(caminho: string): Promise<T> {
    return this.requisitar<T>('DELETE', caminho);
  }

  // ---------------------------------------------------------------- requisição

  async requisitar<T>(metodo: string, caminho: string, opcoes: OpcoesRequisicao = {}): Promise<T> {
    const tokenUsado = opcoes.publica ? null : localStorage.getItem(CHAVE_ACCESS_TOKEN);
    let resposta = await this.enviar(metodo, caminho, opcoes, tokenUsado);

    if (resposta.status === 401 && !opcoes.publica) {
      // Se outra requisição já trocou o token enquanto esta estava no ar, basta repetir com o novo.
      const tokenAtual = localStorage.getItem(CHAVE_ACCESS_TOKEN);
      const renovou = tokenAtual !== null && tokenAtual !== tokenUsado ? true : await this.renovarTokens();
      if (!renovou) {
        this.encerrarSessao();
        throw await this.criarErro(resposta);
      }
      // repete a requisição original UMA vez, já com o token novo
      resposta = await this.enviar(metodo, caminho, opcoes, localStorage.getItem(CHAVE_ACCESS_TOKEN));
      if (resposta.status === 401) {
        this.encerrarSessao();
      }
    }

    if (!resposta.ok) {
      throw await this.criarErro(resposta);
    }
    const texto = await resposta.text();
    return (texto ? JSON.parse(texto) : undefined) as T;
  }

  private async enviar(metodo: string, caminho: string, opcoes: OpcoesRequisicao, token: string | null): Promise<Response> {
    const cabecalhos: Record<string, string> = { Accept: 'application/json, application/problem+json' };
    if (opcoes.corpo !== undefined) {
      cabecalhos['Content-Type'] = 'application/json';
    }
    if (token) {
      cabecalhos.Authorization = `Bearer ${token}`;
    }
    try {
      const resposta = await fetch(this.montarUrl(caminho, opcoes.parametros), {
        method: metodo,
        headers: cabecalhos,
        // JSON.stringify descarta campos `undefined` e mantém `null`: é assim que o PATCH parcial funciona
        body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
      });
      const nivel = resposta.ok || resposta.status === 401 ? 'debug' : 'warn';
      this.logger[nivel]('ApiClient', `${metodo} ${caminho} -> ${resposta.status}`);
      return resposta;
    } catch (erro) {
      this.logger.error('ApiClient', `${metodo} ${caminho} falhou na rede`, String(erro));
      throw new ErroApi(0, 'Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.');
    }
  }

  private montarUrl(caminho: string, parametros: Record<string, ValorParametro> = {}): string {
    const url = new URL(PREFIXO_API + caminho, window.location.origin);
    for (const [nome, valor] of Object.entries(parametros)) {
      // filtros vazios não vão para a URL
      if (valor !== undefined && valor !== null && valor !== '') {
        url.searchParams.set(nome, String(valor));
      }
    }
    return url.toString();
  }

  /** Todas as requisições com 401 simultâneas recebem a mesma Promise: um único refresh. */
  private renovarTokens(): Promise<boolean> {
    if (!this.renovacaoEmAndamento) {
      this.renovacaoEmAndamento = this.executarRefresh().finally(() => {
        this.renovacaoEmAndamento = null;
      });
    }
    return this.renovacaoEmAndamento;
  }

  private async executarRefresh(): Promise<boolean> {
    const refreshToken = localStorage.getItem(CHAVE_REFRESH_TOKEN);
    if (!refreshToken) {
      return false;
    }
    const resposta = await this.enviar('POST', '/auth/refresh', { corpo: { refreshToken } }, null);
    if (!resposta.ok) {
      this.logger.info('ApiClient', 'refresh recusado: sessão encerrada');
      return false;
    }
    // o refresh é rotativo: o par antigo deixou de valer, então guardamos sempre o par novo
    this.definirTokens((await resposta.json()) as Tokens);
    this.logger.info('ApiClient', 'tokens renovados');
    return true;
  }

  private encerrarSessao(): void {
    this.limparTokens();
    this.aoExpirarSessao();
  }

  private async criarErro(resposta: Response): Promise<ErroApi> {
    let problema: Problem = {};
    try {
      problema = (await resposta.json()) as Problem;
    } catch {
      // corpo vazio ou não-JSON: fica só o status
    }
    const detail = problema.detail ?? problema.title ?? `Erro ${resposta.status} ao falar com o servidor`;
    return new ErroApi(resposta.status, detail, problema.erros ?? []);
  }
}
