// Cores do condomínio aplicadas como variáveis CSS: todo o CSS usa var(--cor-primaria) etc.,
// então trocar a variável na raiz do documento muda o app inteiro na hora.

export const PADRAO_COR = /^#[0-9A-Fa-f]{6}$/;

const TEXTO_CLARO = '#FFFFFF';
const TEXTO_ESCURO = '#111827';

export interface CoresTema {
  corPrimaria: string;
  corSecundaria: string;
  corDestaque: string;
}

export function corValida(cor: string): boolean {
  return PADRAO_COR.test(cor);
}

/** Luminância relativa (WCAG 2): 0 = preto, 1 = branco. */
export function luminancia(cor: string): number {
  const canais = [1, 3, 5].map((inicio) => parseInt(cor.slice(inicio, inicio + 2), 16) / 255);
  const [r, g, b] = canais.map((canal) => (canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste (WCAG 2) entre duas cores: de 1 a 21. */
export function contraste(corA: string, corB: string): number {
  const [clara, escura] = [luminancia(corA), luminancia(corB)].sort((a, b) => b - a);
  return (clara + 0.05) / (escura + 0.05);
}

/** Escolhe texto claro ou escuro, o que tiver mais contraste com o fundo. */
export function corDoTextoSobre(fundo: string): string {
  return contraste(fundo, TEXTO_CLARO) >= contraste(fundo, TEXTO_ESCURO) ? TEXTO_CLARO : TEXTO_ESCURO;
}

/** Grava as três cores (e a cor de texto legível sobre cada uma) como variáveis CSS. */
export function aplicarCores(cores: CoresTema, raiz: HTMLElement = document.documentElement): void {
  const variaveis: [string, string][] = [
    ['--cor-primaria', cores.corPrimaria],
    ['--cor-secundaria', cores.corSecundaria],
    ['--cor-destaque', cores.corDestaque],
  ];
  for (const [variavel, cor] of variaveis) {
    // cor fora do padrão #RRGGBB é ignorada e o tema padrão continua valendo
    if (corValida(cor)) {
      raiz.style.setProperty(variavel, cor);
      raiz.style.setProperty(`${variavel}-texto`, corDoTextoSobre(cor));
    }
  }
}

/** Volta ao tema padrão do global.css (ex.: depois do logout). */
export function limparCores(raiz: HTMLElement = document.documentElement): void {
  for (const variavel of ['--cor-primaria', '--cor-secundaria', '--cor-destaque']) {
    raiz.style.removeProperty(variavel);
    raiz.style.removeProperty(`${variavel}-texto`);
  }
}
