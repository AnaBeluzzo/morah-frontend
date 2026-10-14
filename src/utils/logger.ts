export type NivelLog = 'debug' | 'info' | 'warn' | 'error';

const ORDEM_NIVEIS: Record<NivelLog, number> = { debug: 0, info: 1, warn: 2, error: 3 };

// chaves cujo valor nunca pode aparecer no log
const CHAVES_SECRETAS = /token|senha|password|authorization/i;

/** Troca por "***" qualquer valor secreto (tokens, senhas, cabeçalho Bearer), em textos e objetos. */
export function ocultarSegredos(valor: unknown): unknown {
  if (typeof valor === 'string') {
    return valor.replace(/Bearer\s+[\w.~+/=-]+/gi, 'Bearer ***');
  }
  if (Array.isArray(valor)) {
    return valor.map(ocultarSegredos);
  }
  if (valor !== null && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor).map(([chave, item]) => [chave, CHAVES_SECRETAS.test(chave) ? '***' : ocultarSegredos(item)]),
    );
  }
  return valor;
}

/**
 * Padrão Singleton: um único ponto para ligar/desligar e formatar os logs do app.
 * Em produção só aparecem `warn` e `error`; nunca registra tokens nem senhas.
 */
export class Logger {
  private static instancia: Logger | undefined;
  private nivelMinimo: NivelLog;

  private constructor() {
    this.nivelMinimo = import.meta.env.PROD ? 'warn' : 'debug';
  }

  static getInstance(): Logger {
    if (!Logger.instancia) {
      Logger.instancia = new Logger();
    }
    return Logger.instancia;
  }

  definirNivelMinimo(nivel: NivelLog): void {
    this.nivelMinimo = nivel;
  }

  debug(origem: string, mensagem: string, dados?: unknown): void {
    this.registrar('debug', origem, mensagem, dados);
  }

  info(origem: string, mensagem: string, dados?: unknown): void {
    this.registrar('info', origem, mensagem, dados);
  }

  warn(origem: string, mensagem: string, dados?: unknown): void {
    this.registrar('warn', origem, mensagem, dados);
  }

  error(origem: string, mensagem: string, dados?: unknown): void {
    this.registrar('error', origem, mensagem, dados);
  }

  private registrar(nivel: NivelLog, origem: string, mensagem: string, dados?: unknown): void {
    if (ORDEM_NIVEIS[nivel] < ORDEM_NIVEIS[this.nivelMinimo]) {
      return;
    }
    const linha = `[${nivel.toUpperCase()}] ${origem}: ${ocultarSegredos(mensagem) as string}`;
    const extras = dados === undefined ? [] : [ocultarSegredos(dados)];
    console[nivel](linha, ...extras);
  }
}
