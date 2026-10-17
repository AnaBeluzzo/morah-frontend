import type { PessoaResumo } from './comum';

// Tipos do módulo Minha Unidade (nomes e campos iguais aos schemas do contrato).

export interface Unidade {
  id: number;
  blocoId?: number;
  blocoNome?: string;
  identificacao: string;
  tipo?: string;
  areaM2?: number;
  fracaoIdeal?: number;
  status?: string;
}

export type TipoVinculo = 'proprietario' | 'inquilino' | 'dependente';

export interface VinculoUnidade {
  id: number;
  unidadeId: number;
  pessoa: PessoaResumo;
  tipoVinculo: TipoVinculo;
  principal?: boolean;
  /** Datas simples (AAAA-MM-DD). `fim` preenchido = vínculo encerrado (ou com data para acabar). */
  inicio?: string;
  fim?: string;
}

export interface SolicitacaoVinculoCreateRequest {
  tipoVinculo: TipoVinculo;
  nome: string;
  cpf?: string;
  observacao?: string;
}

export type StatusSolicitacaoVinculo = 'pendente' | 'aprovada' | 'rejeitada';

export interface SolicitacaoVinculo {
  id: number;
  unidadeId: number;
  tipoVinculo: TipoVinculo;
  nomeSolicitado: string;
  status: StatusSolicitacaoVinculo;
  solicitadoEm: string;
}

export type DecisaoSolicitacaoVinculo = 'aprovada' | 'rejeitada';

export interface DecisaoSolicitacaoVinculoRequest {
  decisao: DecisaoSolicitacaoVinculo;
  justificativa?: string;
}

export interface InquilinoCreateRequest {
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
  contratoInicio: string;
  contratoFim?: string;
}

export type TipoVeiculo = 'carro' | 'moto';

export interface Veiculo {
  id: number;
  unidadeId: number;
  /** Gravada pelo servidor em maiúsculas e sem hífen (ex.: ABC1D23). */
  placa: string;
  modelo: string;
  cor?: string;
  tipo: TipoVeiculo;
}

export interface VeiculoCreateRequest {
  placa: string;
  modelo: string;
  cor?: string;
  tipo: TipoVeiculo;
}

/** PATCH: só os campos enviados são alterados. */
export type VeiculoUpdateRequest = Partial<VeiculoCreateRequest>;
