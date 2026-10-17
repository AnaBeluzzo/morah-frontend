// Handlers do MSW: TODAS as respostas simuladas dos testes ficam neste arquivo, seguindo os
// exemplos e schemas do contrato morah-openapi.yaml. Cada teste pode sobrescrever um handler
// com `servidor.use(...)`.
import { http, HttpResponse } from 'msw';
import type { Aviso } from '../tipos/avisos';
import type { Problem } from '../tipos/comum';
import type { DashboardMorador, DashboardPortaria, DashboardSindico } from '../tipos/dashboard';
import type { Encomenda } from '../tipos/encomendas';
import type { Cobranca, DocumentoFinanceiro, InadimplenciaResumo, Taxa } from '../tipos/financeiro';
import type { ContextoAtivo, LoginRequest, MeResponse, Perfil } from '../tipos/login';
import type { SolicitacaoVinculo, Unidade, Veiculo, VinculoUnidade } from '../tipos/minhaUnidade';
import type { Notificacao } from '../tipos/notificacoes';
import type { ModuloCodigo, ModuloCondominio, Personalizacao } from '../tipos/personalizacao';
import type { Acesso, AutorizacaoVisita } from '../tipos/portaria';
import type { AreaComum, HorarioDisponivel, Reserva } from '../tipos/reservas';

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

// ---------------------------------------------------------------- Financeiro

export const COBRANCAS: Cobranca[] = [
  { id: 1, unidadeId: 1, taxaDescricao: 'Taxa condominial', competencia: '2026-09', vencimento: '2026-09-10', valorOriginal: 500, multa: 10, juros: 2.5, valorTotal: 512.5, status: 'atrasado' },
  { id: 3, unidadeId: 1, taxaDescricao: 'Fundo de obras', competencia: '2026-08', vencimento: '2026-08-10', valorOriginal: 150, multa: 0, juros: 0, valorTotal: 150, status: 'pago' },
];

export const DOCUMENTOS: DocumentoFinanceiro[] = [
  { id: 1, tipo: 'prestacao_contas', titulo: 'Prestação de contas de setembro', arquivoUrl: 'https://exemplo.com/contas-09.pdf', competencia: '2026-09-01', publicadoEm: '2026-10-02T12:00:00Z' },
];

export const INADIMPLENCIA: InadimplenciaResumo = { totalUnidades: 2, unidadesInadimplentes: 1, percentualInadimplencia: 50, valorTotalEmAberto: 512.5 };

// ---------------------------------------------------------------- Minha Unidade

export const UNIDADE_1: Unidade = { id: 1, blocoId: 1, blocoNome: 'Bloco A', identificacao: 'Apto 302', tipo: 'apartamento', fracaoIdeal: 0.5, status: 'ocupada' };

export const VINCULOS: VinculoUnidade[] = [
  { id: 1, unidadeId: 1, pessoa: { id: 2, nome: 'Rafael Nunes' }, tipoVinculo: 'proprietario', principal: true, inicio: '2024-01-01' },
  { id: 2, unidadeId: 1, pessoa: { id: 5, nome: 'Bruno Lima' }, tipoVinculo: 'inquilino', inicio: '2026-01-01', fim: '2099-12-31' },
  { id: 3, unidadeId: 1, pessoa: { id: 6, nome: 'Carla Souza' }, tipoVinculo: 'inquilino', inicio: '2025-01-01', fim: '2025-12-31' },
];

export const SOLICITACOES: SolicitacaoVinculo[] = [
  { id: 4, unidadeId: 1, tipoVinculo: 'dependente', nomeSolicitado: 'Lia Nunes', status: 'pendente', solicitadoEm: '2026-10-10T12:00:00Z' },
];

export const VEICULOS: Veiculo[] = [
  { id: 1, unidadeId: 1, placa: 'ABC1D23', modelo: 'Fiat Argo', cor: 'Prata', tipo: 'carro' },
  { id: 2, unidadeId: 1, placa: 'XYZ9A87', modelo: 'Honda CG 160', tipo: 'moto' },
];

// ---------------------------------------------------------------- Portaria

export const AUTORIZACOES: AutorizacaoVisita[] = [
  { id: 1, visitante: { id: 1, nome: 'Marcos Silva', documento: '12.345.678-9' }, unidadeId: 1, motivo: 'Visita', solicitadoEm: '2026-10-14T21:00:00Z', status: 'pendente' },
  { id: 2, visitante: { id: 2, nome: 'Ana Costa' }, unidadeId: 1, motivo: 'Entrega', solicitadoEm: '2026-10-14T18:00:00Z', respondidoEm: '2026-10-14T18:05:00Z', status: 'autorizada' },
  { id: 3, visitante: { id: 3, nome: 'Pedro Reis' }, unidadeId: 2, motivo: 'Serviço', solicitadoEm: '2026-10-13T12:00:00Z', status: 'expirada' },
];

export const ACESSOS: Acesso[] = [
  { id: 1, autorizacaoId: 2, visitante: { id: 2, nome: 'Ana Costa' }, entrada: '2026-10-14T18:10:00Z', tipo: 'entrada', status: 'no_condominio' },
  { id: 2, visitante: { id: 4, nome: 'Lucas Prado' }, entrada: '2026-10-13T10:00:00Z', saida: '2026-10-13T11:00:00Z', tipo: 'saida', status: 'saiu' },
];

// ---------------------------------------------------------------- Reservas

export const AREAS_COMUNS: AreaComum[] = [
  { id: 1, nome: 'Salão de festas', descricao: 'Com cozinha e churrasqueira', capacidade: 80, taxa: 150, requerReserva: true, status: 'disponivel' },
];

/** Os 14 horários de 20/10/2026 (08:00 às 22:00 em São Paulo); os de `ocupados` ficam indisponíveis. */
export function horariosDoDia(...ocupados: number[]): HorarioDisponivel[] {
  return Array.from({ length: 14 }, (_, indice) => {
    const hora = 11 + indice; // 08:00 em São Paulo = 11:00 UTC
    const instante = (h: number) => new Date(Date.UTC(2026, 9, 20, h)).toISOString().replace('.000', '');
    return { inicio: instante(hora), fim: instante(hora + 1), disponivel: !ocupados.includes(indice) };
  });
}

export const RESERVAS: Reserva[] = [
  { id: 1, areaComumId: 1, areaComumNome: 'Salão de festas', unidadeId: 2, solicitante: { id: 3, nome: 'Camila Duarte' }, inicio: '2026-10-20T13:00:00Z', fim: '2026-10-20T15:00:00Z', status: 'confirmada', valor: 150 },
  { id: 2, areaComumId: 1, areaComumNome: 'Salão de festas', unidadeId: 2, inicio: '2026-10-10T13:00:00Z', fim: '2026-10-10T14:00:00Z', status: 'concluida', valor: 150 },
];

// ---------------------------------------------------------------- Encomendas

export const ENCOMENDAS: Encomenda[] = [
  { id: 1, unidadeId: 1, transportadora: 'Correios', remetente: 'Loja X', codigoRetirada: '482913', recebidaEm: '2026-10-14T21:59:55Z', status: 'aguardando_retirada' },
  { id: 2, unidadeId: 1, transportadora: 'Jadlog', codigoRetirada: '111222', recebidaEm: '2026-10-10T12:00:00Z', retiradaEm: '2026-10-10T18:00:00Z', status: 'retirada' },
];

// ---------------------------------------------------------------- Tela inicial

export const PAINEL_MORADOR: DashboardMorador = {
  perfil: 'proprietario',
  unidade: UNIDADE_1,
  proximosBoletos: [COBRANCAS[0]],
  avisosRecentes: [AVISOS[0]],
  encomendasPendentes: [ENCOMENDAS[0]],
  autorizacoesPendentes: [AUTORIZACOES[0]],
  proximasReservas: [RESERVAS[0]],
};

export const PAINEL_SINDICO: DashboardSindico = {
  perfil: 'sindico',
  inadimplencia: INADIMPLENCIA,
  avisosPublicadosRecentes: [AVISOS[1]],
  solicitacoesVinculoPendentes: 3,
  ocorrenciasAbertas: 1,
};

export const PAINEL_PORTARIA: DashboardPortaria = {
  perfil: 'portaria',
  autorizacoesPendentes: [AUTORIZACOES[0]],
  reservasDoDia: [RESERVAS[0]],
  encomendasRecebidasHoje: 4,
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
  http.get(api('/financeiro/cobrancas'), () => HttpResponse.json(pagina(COBRANCAS))),
  http.get(api('/financeiro/cobrancas/:cobrancaId'), ({ params }) => {
    const cobranca = COBRANCAS.find((item) => item.id === Number(params.cobrancaId));
    return cobranca ? HttpResponse.json(cobranca) : problema(404, 'Cobrança não encontrada');
  }),
  http.get(api('/financeiro/cobrancas/:cobrancaId/pix'), ({ params }) => {
    const cobranca = COBRANCAS.find((item) => item.id === Number(params.cobrancaId));
    if (cobranca?.status === 'pago') return problema(409, 'Cobrança já está paga ou cancelada');
    return HttpResponse.json({ codigoPix: '00020126580014br.gov.bcb.pix0136morah-cobranca-1520400005303986', expiraEm: new Date(Date.now() + 30 * 60 * 1000).toISOString() });
  }),
  http.post(api('/financeiro/cobrancas/:cobrancaId/baixa-manual'), ({ params }) => {
    const cobranca = COBRANCAS.find((item) => item.id === Number(params.cobrancaId)) ?? COBRANCAS[0];
    return HttpResponse.json({ ...cobranca, status: 'pago' });
  }),
  http.get(api('/financeiro/documentos'), () => HttpResponse.json(pagina(DOCUMENTOS))),
  http.post(api('/financeiro/documentos'), async ({ request }) =>
    HttpResponse.json({ id: 2, publicadoEm: '2026-10-14T12:00:00Z', ...((await request.json()) as object) }, { status: 201 }),
  ),
  http.post(api('/financeiro/taxas'), async ({ request }) => HttpResponse.json({ id: 7, ...((await request.json()) as Omit<Taxa, 'id'>) }, { status: 201 })),
  http.post(api('/financeiro/taxas/:taxaId/gerar-cobrancas'), ({ params }) =>
    HttpResponse.json({ taxaId: Number(params.taxaId), totalGeradas: 2, falhas: [] }, { status: 202 }),
  ),
  http.get(api('/financeiro/inadimplencia'), () => HttpResponse.json(INADIMPLENCIA)),
  http.get(api('/unidades/minha'), () => HttpResponse.json(UNIDADE_1)),
  http.get(api('/unidades/minha/vinculos'), () => HttpResponse.json(VINCULOS)),
  http.post(api('/unidades/minha/vinculos/solicitacoes'), async ({ request }) => {
    const dados = (await request.json()) as { tipoVinculo: string; nome: string };
    return HttpResponse.json({ id: 9, unidadeId: 1, tipoVinculo: dados.tipoVinculo, nomeSolicitado: dados.nome, status: 'pendente', solicitadoEm: '2026-10-14T12:00:00Z' }, { status: 202 });
  }),
  http.post(api('/unidades/minha/inquilinos'), async ({ request }) => {
    const dados = (await request.json()) as { nome: string; contratoInicio: string };
    return HttpResponse.json({ id: 10, unidadeId: 1, pessoa: { id: 11, nome: dados.nome }, tipoVinculo: 'inquilino', inicio: dados.contratoInicio }, { status: 201 });
  }),
  http.delete(api('/unidades/minha/inquilinos/:vinculoId'), () => new HttpResponse(null, { status: 204 })),
  http.get(api('/unidades/minha/veiculos'), () => HttpResponse.json(VEICULOS)),
  http.post(api('/unidades/minha/veiculos'), async ({ request }) => {
    const dados = (await request.json()) as Omit<Veiculo, 'id' | 'unidadeId'>;
    return HttpResponse.json({ id: 9, unidadeId: 1, ...dados, placa: dados.placa.replace('-', '').toUpperCase() }, { status: 201 });
  }),
  http.patch(api('/unidades/minha/veiculos/:veiculoId'), async ({ params, request }) => {
    const veiculo = VEICULOS.find((item) => item.id === Number(params.veiculoId));
    if (!veiculo) return problema(404, 'Veículo não encontrado');
    return HttpResponse.json({ ...veiculo, ...((await request.json()) as object) });
  }),
  http.delete(api('/unidades/minha/veiculos/:veiculoId'), () => new HttpResponse(null, { status: 204 })),
  http.get(api('/unidades/:unidadeId'), ({ params }) => (Number(params.unidadeId) === 1 ? HttpResponse.json(UNIDADE_1) : problema(404, 'Unidade não encontrada'))),
  http.get(api('/unidades/:unidadeId/vinculos/solicitacoes'), () => HttpResponse.json(SOLICITACOES)),
  http.patch(api('/unidades/:unidadeId/vinculos/solicitacoes/:solicitacaoId'), async ({ request }) => {
    const { decisao } = (await request.json()) as { decisao: string };
    return HttpResponse.json({ ...SOLICITACOES[0], status: decisao });
  }),
  http.post(api('/portaria/visitantes'), async ({ request }) => {
    const dados = (await request.json()) as { unidadeId: number; visitante: { nome: string }; motivo: string };
    if (dados.unidadeId !== 1 && dados.unidadeId !== 2) return problema(404, 'Unidade não encontrada');
    return HttpResponse.json({ id: 9, visitante: { id: 9, ...dados.visitante }, unidadeId: dados.unidadeId, motivo: dados.motivo, solicitadoEm: '2026-10-14T21:30:00Z', status: 'pendente' }, { status: 201 });
  }),
  http.get(api('/portaria/autorizacoes'), () => HttpResponse.json(pagina(AUTORIZACOES))),
  http.get(api('/portaria/autorizacoes/:autorizacaoId'), ({ params }) => {
    const autorizacao = AUTORIZACOES.find((item) => item.id === Number(params.autorizacaoId));
    return autorizacao ? HttpResponse.json(autorizacao) : problema(404, 'Autorização não encontrada');
  }),
  http.patch(api('/portaria/autorizacoes/:autorizacaoId/decisao'), async ({ request }) => {
    const { decisao } = (await request.json()) as { decisao: string };
    return HttpResponse.json({ ...AUTORIZACOES[0], status: decisao === 'autorizado' ? 'autorizada' : 'recusada', respondidoEm: '2026-10-14T21:05:00Z' });
  }),
  http.post(api('/portaria/autorizacoes/:autorizacaoId/reenviar'), () => new HttpResponse(null, { status: 202 })),
  http.get(api('/portaria/acessos'), () => HttpResponse.json(pagina(ACESSOS))),
  http.post(api('/portaria/acessos'), async ({ request }) => {
    const dados = (await request.json()) as { visitanteId: number; tipo: string };
    const saida = dados.tipo === 'saida';
    return HttpResponse.json(
      { id: 5, visitante: { id: dados.visitanteId, nome: 'Ana Costa' }, entrada: '2026-10-14T18:10:00Z', saida: saida ? '2026-10-14T19:00:00Z' : undefined, tipo: dados.tipo, status: saida ? 'saiu' : 'no_condominio' },
      { status: 201 },
    );
  }),
  http.get(api('/areas-comuns'), () => HttpResponse.json(AREAS_COMUNS)),
  http.get(api('/areas-comuns/:areaComumId/disponibilidade'), ({ request }) =>
    HttpResponse.json({ data: new URL(request.url).searchParams.get('data'), horarios: horariosDoDia(5) }),
  ),
  http.get(api('/reservas'), () => HttpResponse.json(pagina(RESERVAS))),
  http.post(api('/reservas'), async ({ request }) => {
    const dados = (await request.json()) as { inicio: string; fim: string };
    return HttpResponse.json({ ...RESERVAS[0], id: 7, ...dados }, { status: 201 });
  }),
  http.get(api('/reservas/:reservaId'), ({ params }) => {
    const reserva = RESERVAS.find((item) => item.id === Number(params.reservaId));
    return reserva ? HttpResponse.json(reserva) : problema(404, 'Reserva não encontrada');
  }),
  http.delete(api('/reservas/:reservaId'), () => new HttpResponse(null, { status: 204 })),
  http.post(api('/reservas/:reservaId/vistoria'), async ({ request }) => {
    const { momento } = (await request.json()) as { momento: string };
    return HttpResponse.json({ ...RESERVAS[0], status: momento === 'saida' ? 'concluida' : 'confirmada' });
  }),
  http.get(api('/encomendas'), () => HttpResponse.json(pagina(ENCOMENDAS))),
  http.post(api('/encomendas'), async ({ request }) => {
    const dados = (await request.json()) as { unidadeId: number; transportadora: string };
    if (dados.unidadeId > 2) return problema(404, 'Unidade não encontrada');
    return HttpResponse.json({ id: 8, ...dados, codigoRetirada: '654321', recebidaEm: '2026-10-14T22:00:00Z', status: 'aguardando_retirada' }, { status: 201 });
  }),
  http.get(api('/encomendas/:encomendaId'), ({ params }) => {
    const encomenda = ENCOMENDAS.find((item) => item.id === Number(params.encomendaId));
    return encomenda ? HttpResponse.json(encomenda) : problema(404, 'Encomenda não encontrada');
  }),
  http.post(api('/encomendas/:encomendaId/autorizacoes-retirada'), async ({ request, params }) => {
    const dados = (await request.json()) as { nomeTerceiro: string; documento: string };
    return HttpResponse.json({ id: 3, encomendaId: Number(params.encomendaId), ...dados, codigo: '777888', validade: '2026-10-15T22:00:00Z', status: 'ativa' }, { status: 201 });
  }),
  http.post(api('/encomendas/:encomendaId/retirada'), async ({ request }) => {
    const { codigo } = (await request.json()) as { codigo: string };
    if (codigo !== '482913') return problema(409, 'Código de retirada inválido ou expirado');
    return HttpResponse.json({ ...ENCOMENDAS[0], status: 'retirada', retiradaEm: '2026-10-14T23:00:00Z' });
  }),
  http.post(api('/encomendas/:encomendaId/ocorrencias'), async ({ request }) =>
    HttpResponse.json({ id: 1, ...((await request.json()) as object), status: 'aberta', abertaEm: '2026-10-14T23:00:00Z' }, { status: 201 }),
  ),
  // o formato depende do perfil: nos testes, o token de acesso é "access-<perfil>"
  http.get(api('/home/dashboard'), ({ request }) => {
    const token = request.headers.get('Authorization') ?? '';
    if (token.endsWith('sindico')) return HttpResponse.json(PAINEL_SINDICO);
    if (token.endsWith('portaria')) return HttpResponse.json(PAINEL_PORTARIA);
    return HttpResponse.json(PAINEL_MORADOR);
  }),
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
