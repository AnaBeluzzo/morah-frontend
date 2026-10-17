import type {
  DecisaoSolicitacaoVinculoRequest,
  InquilinoCreateRequest,
  SolicitacaoVinculo,
  SolicitacaoVinculoCreateRequest,
  Unidade,
  Veiculo,
  VeiculoCreateRequest,
  VeiculoUpdateRequest,
  VinculoUnidade,
} from '../tipos/minhaUnidade';
import { ApiClient } from './ApiClient';

const cliente = ApiClient.getInstance();

// ---------------------------------------------------------------- unidade do contexto ativo (morador/proprietário)

export function buscarMinhaUnidade(): Promise<Unidade> {
  return cliente.get<Unidade>('/unidades/minha');
}

export function buscarVinculosMinhaUnidade(): Promise<VinculoUnidade[]> {
  return cliente.get<VinculoUnidade[]>('/unidades/minha/vinculos');
}

/** Pedido de novo vínculo (ex.: dependente): fica pendente até o síndico decidir (202). */
export function solicitarVinculo(dados: SolicitacaoVinculoCreateRequest): Promise<SolicitacaoVinculo> {
  return cliente.post<SolicitacaoVinculo>('/unidades/minha/vinculos/solicitacoes', dados);
}

/** Só proprietário. */
export function criarInquilino(dados: InquilinoCreateRequest): Promise<VinculoUnidade> {
  return cliente.post<VinculoUnidade>('/unidades/minha/inquilinos', dados);
}

/** Só proprietário: encerra o contrato (fim = hoje) e revoga o acesso do inquilino. */
export function deletarInquilino(vinculoId: number): Promise<void> {
  return cliente.delete(`/unidades/minha/inquilinos/${vinculoId}`);
}

// ---------------------------------------------------------------- administração (síndico)

export function buscarUnidade(unidadeId: number): Promise<Unidade> {
  return cliente.get<Unidade>(`/unidades/${unidadeId}`);
}

export function buscarSolicitacoesVinculo(unidadeId: number): Promise<SolicitacaoVinculo[]> {
  return cliente.get<SolicitacaoVinculo[]>(`/unidades/${unidadeId}/vinculos/solicitacoes`);
}

export function decidirSolicitacaoVinculo(unidadeId: number, solicitacaoId: number, dados: DecisaoSolicitacaoVinculoRequest): Promise<SolicitacaoVinculo> {
  return cliente.patch<SolicitacaoVinculo>(`/unidades/${unidadeId}/vinculos/solicitacoes/${solicitacaoId}`, dados);
}

// ---------------------------------------------------------------- veículos da unidade (morador/proprietário)

export function buscarVeiculos(): Promise<Veiculo[]> {
  return cliente.get<Veiculo[]>('/unidades/minha/veiculos');
}

export function criarVeiculo(dados: VeiculoCreateRequest): Promise<Veiculo> {
  return cliente.post<Veiculo>('/unidades/minha/veiculos', dados);
}

export function alterarVeiculo(veiculoId: number, dados: VeiculoUpdateRequest): Promise<Veiculo> {
  return cliente.patch<Veiculo>(`/unidades/minha/veiculos/${veiculoId}`, dados);
}

export function deletarVeiculo(veiculoId: number): Promise<void> {
  return cliente.delete(`/unidades/minha/veiculos/${veiculoId}`);
}
