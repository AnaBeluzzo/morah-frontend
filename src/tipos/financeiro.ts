import type { Pagina } from './comum';

// Tipos do módulo Financeiro (nomes e campos iguais aos schemas do contrato).
// O webhook de pagamentos (PagamentoWebhookPayload) é do gateway e não é usado pelo app.

/** `atrasado` é calculado pelo servidor: cobrança pendente com vencimento já passado. */
export type StatusCobranca = 'pendente' | 'pago' | 'atrasado' | 'cancelado';

export interface Cobranca {
  id: number;
  unidadeId: number;
  taxaDescricao?: string;
  competencia: string;
  vencimento: string;
  valorOriginal: number;
  multa: number;
  juros: number;
  valorTotal: number;
  status: StatusCobranca;
}

export type CobrancaPage = Pagina<Cobranca>;

export interface FiltrosCobrancas {
  status?: StatusCobranca | '';
  competencia?: string;
  /** Só para o síndico (o servidor ignora para morador/proprietário). */
  unidadeId?: number;
}

export interface PixResponse {
  codigoPix: string;
  expiraEm: string;
}

/** Os três primeiros são obrigatórios (o backend valida, mas não guarda). */
export interface BaixaManualRequest {
  meio: string;
  valor: number;
  pagoEm: string;
  observacao?: string;
}

export interface DocumentoFinanceiro {
  id: number;
  tipo: string;
  titulo: string;
  arquivoUrl: string;
  /** Data simples (AAAA-MM-DD). */
  competencia?: string;
  publicadoEm: string;
}

export type DocumentoFinanceiroPage = Pagina<DocumentoFinanceiro>;

export interface DocumentoFinanceiroCreateRequest {
  tipo: string;
  titulo: string;
  arquivoUrl: string;
  competencia?: string;
}

export type TipoRateio = 'igualitario' | 'fracao_ideal';

export interface TaxaCreateRequest {
  descricao: string;
  /** AAAA-MM */
  competencia: string;
  valor: number;
  tipoRateio: TipoRateio;
  /** De 1 a 28. */
  vencimentoDia: number;
}

export interface Taxa {
  id: number;
  descricao: string;
  competencia: string;
  valor: number;
  tipoRateio: TipoRateio;
  vencimentoDia: number;
}

export interface FalhaGeracaoCobranca {
  unidadeId: number;
  motivo: string;
}

export interface GerarCobrancasResponse {
  taxaId: number;
  totalGeradas: number;
  falhas: FalhaGeracaoCobranca[];
}

export interface InadimplenciaResumo {
  totalUnidades: number;
  unidadesInadimplentes: number;
  percentualInadimplencia: number;
  valorTotalEmAberto: number;
}
