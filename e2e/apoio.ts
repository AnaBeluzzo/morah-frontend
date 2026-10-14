// Apoio aos testes de ponta a ponta: verificações automáticas em TODAS as telas visitadas.
// - sem rolagem horizontal (document.documentElement.scrollWidth <= window.innerWidth);
// - sem erro no console nem exceção de JavaScript;
// - sem requisição com falha inesperada (o 4xx esperado é declarado no próprio teste).
import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';

export { expect };

interface ErroHttpEsperado {
  status: number;
  url: string | RegExp;
}

declare global {
  interface Window {
    __registrarRolagemHorizontal?: (mensagem: string) => void;
  }
}

export class Monitor {
  private readonly problemas: string[] = [];
  private readonly esperados: ErroHttpEsperado[] = [];

  /** Declara um erro HTTP esperado neste teste (ex.: o 409 de um conflito). */
  esperarErroHttp(status: number, url: string | RegExp): void {
    this.esperados.push({ status, url });
  }

  async monitorar(pagina: Page): Promise<void> {
    await pagina.exposeFunction('__registrarRolagemHorizontal', (mensagem: string) => this.problemas.push(mensagem));
    await pagina.addInitScript(() => {
      const vistos = new Set<string>();
      setInterval(() => {
        const raiz = document.documentElement;
        const largura = Math.min(window.innerWidth, raiz.clientWidth);
        if (raiz.scrollWidth > largura) {
          const mensagem = `rolagem horizontal em ${location.pathname}: ${raiz.scrollWidth}px > ${largura}px`;
          if (!vistos.has(mensagem)) {
            vistos.add(mensagem);
            window.__registrarRolagemHorizontal?.(mensagem);
          }
        }
      }, 150);
    });
    pagina.on('console', (mensagem) => {
      // "Failed to load resource" é o log do navegador para respostas 4xx/5xx: já checado abaixo
      if (mensagem.type() === 'error' && !mensagem.text().startsWith('Failed to load resource')) {
        this.problemas.push(`erro no console: ${mensagem.text()}`);
      }
    });
    pagina.on('pageerror', (erro) => this.problemas.push(`exceção na página: ${erro.message}`));
    pagina.on('requestfailed', (requisicao) => {
      const motivo = requisicao.failure()?.errorText ?? '';
      // requisições canceladas por troca de página não são falhas do app
      if (!motivo.includes('ERR_ABORTED')) {
        this.problemas.push(`falha de rede: ${requisicao.method()} ${requisicao.url()} (${motivo})`);
      }
    });
    pagina.on('response', (resposta) => {
      const status = resposta.status();
      const url = resposta.url();
      if (status >= 400 && !this.esperado(status, url)) {
        this.problemas.push(`HTTP ${status} inesperado: ${resposta.request().method()} ${url}`);
      }
    });
  }

  verificar(): void {
    expect(this.problemas, 'problemas encontrados nas telas visitadas').toEqual([]);
  }

  private esperado(status: number, url: string): boolean {
    return this.esperados.some((erro) => erro.status === status && (typeof erro.url === 'string' ? url.includes(erro.url) : erro.url.test(url)));
  }
}

export const test = base.extend<{ monitor: Monitor; novaPagina: () => Promise<Page> }>({
  // `auto`: roda em todo teste, mesmo que ele não peça o monitor
  monitor: [
    async ({ page }, use) => {
      const monitor = new Monitor();
      await monitor.monitorar(page);
      await use(monitor);
      monitor.verificar();
    },
    { auto: true },
  ],
  /** Outra "pessoa" no mesmo teste: um navegador separado (sessão própria), com o mesmo celular. */
  novaPagina: async ({ browser, monitor }, use, testInfo) => {
    const contextos: BrowserContext[] = [];
    await use(async () => {
      const { viewport, isMobile, hasTouch, deviceScaleFactor, locale, timezoneId, baseURL } = testInfo.project.use;
      const contexto = await browser.newContext({ viewport, isMobile, hasTouch, deviceScaleFactor, locale, timezoneId, baseURL });
      contextos.push(contexto);
      const pagina = await contexto.newPage();
      await monitor.monitorar(pagina);
      return pagina;
    });
    for (const contexto of contextos) {
      await contexto.close();
    }
  },
});

/** Sufixo único por execução, para os testes criarem os próprios dados sem colidir. */
export function sufixoUnico(): string {
  return `${Date.now()}`.slice(-7);
}
