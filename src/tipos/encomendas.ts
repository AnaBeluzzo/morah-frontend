import type { Pagina } from './comum';

// Tipos do módulo Encomendas (nomes e campos iguais aos schemas do contrato; a Ocorrência fica
// aqui porque o contrato a usa só no extravio de encomenda).

export type StatusEncomenda = 'aguardando_retirada' | 'retirada' | 'extraviada';

export interface EncomendaCreateRequest {
  unidadeId: number;
  remetente?: string;
  transportadora: string;
  codigoRastreio?: string;
  fotoUrl?: string;
}

export interface Encomenda {
  id: number;
  unidadeId: number;
  remetente?: string;
  transportadora: string;
  codigoRastreio?: string;
  /** Código de 6 dígitos que o morador apresenta na portaria. */
  codigoRetirada?: string;
  fotoUrl?: string;
  recebidaEm: string;
  retiradaEm?: string;
  status: StatusEncomenda;
}

export type EncomendaPage = Pagina<Encomenda>;

export interface AutorizacaoRetiradaCreateRequest {
  nomeTerceiro: string;
  documento: string;
  /** Pelo menos 1 (padrão 24 no servidor). */
  validadeHoras?: number;
}

export type StatusAutorizacaoRetirada = 'ativa' | 'utilizada' | 'expirada';

export interface AutorizacaoRetirada {
  id: number;
  encomendaId: number;
  nomeTerceiro: string;
  documento: string;
  codigo: string;
  validade: string;
  status: StatusAutorizacaoRetirada;
}

/** Aceita o código da encomenda OU o de uma autorização de terceiro ativa. */
export interface RetiradaConfirmRequest {
  codigo: string;
  retiradoPorNome?: string;
  retiradoPorDocumento?: string;
}

export interface OcorrenciaCreateRequest {
  titulo: string;
  descricao: string;
}

export type StatusOcorrencia = 'aberta' | 'em_andamento' | 'encerrada';

export interface Ocorrencia {
  id: number;
  titulo: string;
  descricao: string;
  status: StatusOcorrencia;
  abertaEm: string;
  encerradaEm?: string;
}
