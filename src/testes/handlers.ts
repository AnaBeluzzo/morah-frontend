// Handlers do MSW: TODAS as respostas simuladas dos testes ficam neste arquivo, seguindo os
// exemplos e schemas do contrato morah-openapi.yaml. Cada teste pode sobrescrever um handler
// com `servidor.use(...)`.
import { http, HttpResponse } from 'msw';
import type { Aviso } from '../tipos/avisos';
import type { Problem } from '../tipos/comum';
import type { ContextoAtivo, LoginRequest, MeResponse, Perfil } from '../tipos/login';
import type { Notificacao } from '../tipos/notificacoes';
import type { ModuloCodigo, ModuloCondominio, Personalizacao } from '../tipos/personalizacao';

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

// ---------------------------------------------------------------- Notificações

export const NOTIFICACOES: Notificacao[] = [
  { id: 3, tipo: 'aviso', titulo: 'Novo aviso: Manutenção da piscina', mensagem: 'A piscina fecha na segunda.', referenciaId: 1, enviadaEm: '2026-10-05T12:00:00Z' },
  // convite de inquilino: chega sem `tipo`
  { id: 2, titulo: 'Convite de acesso', mensagem: 'Você foi cadastrado como inquilino.', enviadaEm: '2026-10-04T12:00:00Z' },
  { id: 1, tipo: 'financeiro', titulo: 'Nova cobrança', referenciaId: 1, enviadaEm: '2026-10-01T12:00:00Z', lidaEm: '2026-10-02T12:00:00Z' },
];

// ---------------------------------------------------------------- Personalização

export const PERSONALIZACAO: Personalizacao = {
  condominioId: 1,
  nomeExibicao: 'Condomínio Demo',
  logoUrl: null,
  corPrimaria: '#1F4E79',
  corSecundaria: '#F2F4F7',
  corDestaque: '#F59E0B',
  atualizadoEm: '2026-10-01T12:00:00Z',
};

const NOMES_MODULOS: Record<ModuloCodigo, string> = {
  financeiro: 'Financeiro',
  portaria: 'Portaria',
  avisos: 'Avisos',
  reservas: 'Reservas',
  minha_unidade: 'Minha Unidade',
  encomendas: 'Encomendas',
};

/** Os seis módulos; os passados em `desativados` vêm com `ativo: false`. */
export function modulos(...desativados: ModuloCodigo[]): ModuloCondominio[] {
  return (Object.keys(NOMES_MODULOS) as ModuloCodigo[]).map((modulo) => ({
    modulo,
    nome: NOMES_MODULOS[modulo],
    ativo: !desativados.includes(modulo),
    atualizadoEm: '2026-10-01T12:00:00Z',
  }));
}

// ---------------------------------------------------------------- Avisos

export const AVISOS: Aviso[] = [
  {
    id: 2,
    titulo: 'Falta de água',
    conteudo: 'Manutenção na caixa d\'água das 8h às 12h.',
    categoria: 'manutencao',
    prioridade: 'urgente',
    publicoAlvo: { tipo: 'condominio' },
    autor: { id: 1, nome: 'Helena Prado' },
    publicadoEm: '2026-10-05T12:00:00Z',
    lidoPeloUsuario: false,
  },
  {
    id: 1,
    titulo: 'Bem-vindos ao Morah',
    conteudo: 'Este é o novo canal de comunicação do condomínio.',
    categoria: 'geral',
    prioridade: 'normal',
    publicoAlvo: { tipo: 'condominio' },
    autor: { id: 1, nome: 'Helena Prado' },
    publicadoEm: '2026-10-01T12:00:00Z',
    lidoPeloUsuario: true,
  },
];

/** Aviso que já saiu de vigência: o GET responde 410. */
export const ID_AVISO_EXPIRADO = 99;

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

  http.get(api('/notificacoes'), ({ request }) => {
    const page = Number(new URL(request.url).searchParams.get('page') ?? 0);
    return HttpResponse.json(page === 0 ? NOTIFICACOES : []);
  }),
  http.get(api('/avisos'), () => HttpResponse.json(pagina(AVISOS))),
  http.get(api('/avisos/:avisoId'), ({ params }) => {
    const id = Number(params.avisoId);
    if (id === ID_AVISO_EXPIRADO) return problema(410, 'Aviso fora de vigência');
    const aviso = AVISOS.find((item) => item.id === id);
    return aviso ? HttpResponse.json({ ...aviso, lidoPeloUsuario: true }) : problema(404, 'Aviso não encontrado');
  }),
  http.post(api('/avisos'), async ({ request }) => {
    const dados = (await request.json()) as Partial<Aviso>;
    return HttpResponse.json({ ...AVISOS[1], ...dados, id: 10, publicadoEm: '2026-10-14T12:00:00Z' }, { status: 201 });
  }),
  http.patch(api('/avisos/:avisoId'), async ({ params, request }) => {
    const aviso = AVISOS.find((item) => item.id === Number(params.avisoId)) ?? AVISOS[0];
    return HttpResponse.json({ ...aviso, ...((await request.json()) as object) });
  }),
  http.delete(api('/avisos/:avisoId'), () => new HttpResponse(null, { status: 204 })),
  http.get(api('/condominio/personalizacao'), () => HttpResponse.json(PERSONALIZACAO)),
  http.patch(api('/condominio/personalizacao'), async ({ request }) => {
    const alteracoes = (await request.json()) as Partial<Personalizacao>;
    return HttpResponse.json({ ...PERSONALIZACAO, ...alteracoes, atualizadoEm: '2026-10-14T12:00:00Z' });
  }),
  http.get(api('/condominio/modulos'), () => HttpResponse.json(modulos())),
  http.patch(api('/condominio/modulos/:modulo'), async ({ params, request }) => {
    const { ativo } = (await request.json()) as { ativo: boolean };
    const modulo = params.modulo as ModuloCodigo;
    return HttpResponse.json({ modulo, nome: NOMES_MODULOS[modulo], ativo, atualizadoEm: '2026-10-14T12:00:00Z' });
  }),
  http.patch(api('/notificacoes/:notificacaoId/lida'), ({ params }) => {
    const notificacao = NOTIFICACOES.find((item) => item.id === Number(params.notificacaoId));
    return notificacao ? HttpResponse.json({ ...notificacao, lidaEm: '2026-10-14T12:00:00Z' }) : problema(404, 'Notificação não encontrada');
  }),
];
