import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  alterarVeiculo,
  buscarMinhaUnidade,
  buscarSolicitacoesVinculo,
  buscarUnidade,
  buscarVeiculos,
  buscarVinculosMinhaUnidade,
  criarInquilino,
  criarVeiculo,
  decidirSolicitacaoVinculo,
  deletarInquilino,
  deletarVeiculo,
  solicitarVinculo,
} from '../api/minhaUnidadeApi';
import type {
  DecisaoSolicitacaoVinculoRequest,
  InquilinoCreateRequest,
  SolicitacaoVinculoCreateRequest,
  VeiculoCreateRequest,
  VeiculoUpdateRequest,
} from '../tipos/minhaUnidade';
import { Logger } from '../utils/logger';

const logger = Logger.getInstance();

export function useMinhaUnidade() {
  return useQuery({ queryKey: ['minhaUnidade'], queryFn: buscarMinhaUnidade });
}

export function useVinculosMinhaUnidade() {
  return useQuery({ queryKey: ['vinculos'], queryFn: buscarVinculosMinhaUnidade });
}

export function useSolicitarVinculo() {
  return useMutation({
    mutationFn: (dados: SolicitacaoVinculoCreateRequest) => solicitarVinculo(dados),
    onSuccess: (solicitacao) => logger.info('Minha Unidade', `solicitação ${solicitacao.id} enviada`),
  });
}

export function useCriarInquilino() {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (dados: InquilinoCreateRequest) => criarInquilino(dados),
    onSuccess: () => clienteQuery.invalidateQueries({ queryKey: ['vinculos'] }),
  });
}

export function useDeletarInquilino() {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (vinculoId: number) => deletarInquilino(vinculoId),
    onSuccess: () => clienteQuery.invalidateQueries({ queryKey: ['vinculos'] }),
  });
}

/** Unidade buscada pelo síndico (não há listagem de unidades: ele informa o ID). */
export function useUnidade(unidadeId: number | null) {
  return useQuery({ queryKey: ['unidade', unidadeId], queryFn: () => buscarUnidade(unidadeId!), enabled: unidadeId !== null });
}

export function useSolicitacoesVinculo(unidadeId: number | null) {
  return useQuery({ queryKey: ['solicitacoes', unidadeId], queryFn: () => buscarSolicitacoesVinculo(unidadeId!), enabled: unidadeId !== null });
}

export function useDecidirSolicitacaoVinculo(unidadeId: number) {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: ({ solicitacaoId, ...dados }: DecisaoSolicitacaoVinculoRequest & { solicitacaoId: number }) =>
      decidirSolicitacaoVinculo(unidadeId, solicitacaoId, dados),
    onSuccess: () =>
      Promise.all([
        clienteQuery.invalidateQueries({ queryKey: ['solicitacoes', unidadeId] }),
        clienteQuery.invalidateQueries({ queryKey: ['dashboard'] }),
      ]),
  });
}

// ---------------------------------------------------------------- veículos

export function useVeiculos() {
  return useQuery({ queryKey: ['veiculos'], queryFn: buscarVeiculos });
}

export function useCriarVeiculo() {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (dados: VeiculoCreateRequest) => criarVeiculo(dados),
    onSuccess: () => clienteQuery.invalidateQueries({ queryKey: ['veiculos'] }),
  });
}

export function useAlterarVeiculo(veiculoId: number) {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (dados: VeiculoUpdateRequest) => alterarVeiculo(veiculoId, dados),
    onSuccess: () => clienteQuery.invalidateQueries({ queryKey: ['veiculos'] }),
  });
}

export function useDeletarVeiculo() {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (veiculoId: number) => deletarVeiculo(veiculoId),
    onSuccess: () => clienteQuery.invalidateQueries({ queryKey: ['veiculos'] }),
  });
}
