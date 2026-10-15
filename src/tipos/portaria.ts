import type { Pagina } from './comum';

// Tipos do módulo Portaria (nomes e campos iguais aos schemas do contrato).

export interface VisitanteInput {
  nome: string;
  documento?: string;
  telefone?: string;
}

export interface Visitante {
  id: number;
  nome: string;
  documento?: string;
  telefone?: string;
  observacao?: string;
}

/** `expirada` é calculado pelo servidor: pendente sem resposta em 30 minutos. */
export type StatusAutorizacaoVisita = 'pendente' | 'autorizada' | 'recusada' | 'expirada';

export interface AutorizacaoVisitaCreateRequest {
  unidadeId: number;
  visitante: VisitanteInput;
  motivo: string;
  fotoUrl?: string;
}

export interface AutorizacaoVisita {
  id: number;
  visitante: Visitante;
  unidadeId: number;
  motivo: string;
  solicitadoEm: string;
  respondidoEm?: string;
  status: StatusAutorizacaoVisita;
}

export type AutorizacaoVisitaPage = Pagina<AutorizacaoVisita>;

export type DecisaoAutorizacao = 'autorizado' | 'recusado';

export interface DecisaoAutorizacaoRequest {
  decisao: DecisaoAutorizacao;
  justificativa?: string;
}

export type TipoAcesso = 'entrada' | 'saida';

export type StatusAcesso = 'no_condominio' | 'saiu';

export interface AcessoCreateRequest {
  /** Na entrada: a autorização `autorizada` do visitante. Na saída não é preciso. */
  autorizacaoId?: number;
  visitanteId: number;
  tipo: TipoAcesso;
  fotoUrl?: string;
}

export interface Acesso {
  id: number;
  autorizacaoId?: number;
  visitante: Visitante;
  entrada: string;
  saida?: string;
  tipo?: TipoAcesso;
  status: StatusAcesso;
}

export type AcessoPage = Pagina<Acesso>;
