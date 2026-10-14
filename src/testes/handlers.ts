// Handlers do MSW: TODAS as respostas simuladas dos testes ficam neste arquivo, seguindo os
// exemplos e schemas do contrato morah-openapi.yaml. Cada teste pode sobrescrever um handler
// com `servidor.use(...)`.
import { http, HttpResponse } from 'msw';
import type { Problem } from '../tipos/comum';
import type { ContextoAtivo, LoginRequest, MeResponse, Perfil } from '../tipos/login';

/** Caminho da API em qualquer origem (o ApiClient monta a URL a partir de window.location). */
export function api(caminho: string): string {
  return `*/v1${caminho}`;
}

/** Resposta de erro no formato RFC 9457. */
export function problema(status: number, detail: string, erros?: Problem['erros']) {
  return HttpResponse.json({ type: 'about:blank', title: 'Erro', status, detail, ...(erros ? { erros } : {}) }, { status, headers: { 'Content-Type': 'application/problem+json' } });
}

/** Página no formato `{ content, page }` das listas paginadas. */
export function pagina<T>(content: T[], page = 0, size = 20, totalElements = content.length) {
  return { content, page: { page, size, totalElements, totalPages: Math.max(1, Math.ceil(totalElements / size)) } };
}

export const TOKENS_RENOVADOS = { accessToken: 'access-renovado', refreshToken: 'refresh-renovado', tokenType: 'Bearer', expiresIn: 3600 };

// ---------------------------------------------------------------- Login (dados de demonstração)

export const CONTEXTOS: Record<Perfil, ContextoAtivo> = {
  sindico: { perfil: 'sindico', condominioId: 1, condominioNome: 'Condomínio Demo' },
  proprietario: { perfil: 'proprietario', condominioId: 1, condominioNome: 'Condomínio Demo', unidadeId: 1 },
  morador: { perfil: 'morador', condominioId: 1, condominioNome: 'Condomínio Demo', unidadeId: 2 },
  portaria: { perfil: 'portaria', condominioId: 1, condominioNome: 'Condomínio Demo' },
};

const PERFIL_POR_EMAIL: Record<string, Perfil> = {
  'helena.prado@demo.com.br': 'sindico',
  'rafael.nunes@demo.com.br': 'proprietario',
  'camila.duarte@demo.com.br': 'morador',
  'portaria@demo.com.br': 'portaria',
};

export const ME_PROPRIETARIO: MeResponse = {
  pessoa: { id: 2, nome: 'Rafael Nunes', email: 'rafael.nunes@demo.com.br' },
  perfisDisponiveis: [CONTEXTOS.proprietario],
  contextoAtivo: CONTEXTOS.proprietario,
};

export const handlers = [
  http.post(api('/auth/refresh'), () => HttpResponse.json(TOKENS_RENOVADOS)),
  http.post(api('/auth/login'), async ({ request }) => {
    const { email, senha } = (await request.json()) as LoginRequest;
    const perfil = PERFIL_POR_EMAIL[email];
    if (!perfil || senha !== 'demo123') {
      return problema(401, 'E-mail ou senha inválidos');
    }
    return HttpResponse.json({
      accessToken: `access-${perfil}`,
      refreshToken: `refresh-${perfil}`,
      tokenType: 'Bearer',
      expiresIn: 3600,
      contexto: CONTEXTOS[perfil],
      perfisDisponiveis: [CONTEXTOS[perfil]],
    });
  }),
  http.get(api('/auth/me'), () => HttpResponse.json(ME_PROPRIETARIO)),
  http.post(api('/auth/contexto'), async ({ request }) => {
    const { perfil } = (await request.json()) as { perfil: Perfil };
    return HttpResponse.json({ accessToken: 'access-contexto', refreshToken: 'refresh-contexto', tokenType: 'Bearer', expiresIn: 3600, contexto: CONTEXTOS[perfil] });
  }),
  http.post(api('/auth/logout'), () => new HttpResponse(null, { status: 204 })),
];
