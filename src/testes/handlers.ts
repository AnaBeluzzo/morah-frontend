// Handlers do MSW: TODAS as respostas simuladas dos testes ficam neste arquivo, seguindo os
// exemplos e schemas do contrato morah-openapi.yaml. Cada teste pode sobrescrever um handler
// com `servidor.use(...)`.
import { http, HttpResponse } from 'msw';
import type { Problem } from '../tipos/comum';

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

export const handlers = [
  http.post(api('/auth/refresh'), () => HttpResponse.json(TOKENS_RENOVADOS)),
];
