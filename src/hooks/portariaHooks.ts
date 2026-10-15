import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  buscarAcessos,
  buscarAutorizacao,
  buscarAutorizacoes,
  decidirAutorizacao,
  reenviarAutorizacao,
  registrarAcesso,
  registrarVisitante,
} from '../api/portariaApi';
import type { AcessoCreateRequest, AutorizacaoVisitaCreateRequest, DecisaoAutorizacaoRequest, StatusAutorizacaoVisita } from '../tipos/portaria';
import { Logger } from '../utils/logger';
import { proximaPagina, TAMANHO_PAGINA } from './paginacao';

const logger = Logger.getInstance();

/** Depois de gravar: recarrega as listas de autorizações e a tela inicial. */
function atualizarAutorizacoes(clienteQuery: QueryClient) {
  return Promise.all([clienteQuery.invalidateQueries({ queryKey: ['autorizacoes'] }), clienteQuery.invalidateQueries({ queryKey: ['dashboard'] })]);
}

export function useAutorizacoes(status: StatusAutorizacaoVisita | '') {
  return useInfiniteQuery({
    queryKey: ['autorizacoes', status],
    queryFn: ({ pageParam }) => buscarAutorizacoes({ status, page: pageParam, size: TAMANHO_PAGINA }),
    initialPageParam: 0,
    getNextPageParam: proximaPagina,
  });
}

export function useAutorizacao(autorizacaoId: number) {
  return useQuery({ queryKey: ['autorizacao', autorizacaoId], queryFn: () => buscarAutorizacao(autorizacaoId) });
}

export function useRegistrarVisitante() {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (dados: AutorizacaoVisitaCreateRequest) => registrarVisitante(dados),
    onSuccess: (autorizacao) => {
      logger.info('Portaria', `visitante registrado (autorização ${autorizacao.id})`);
      return atualizarAutorizacoes(clienteQuery);
    },
  });
}

export function useDecidirAutorizacao(autorizacaoId: number) {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (dados: DecisaoAutorizacaoRequest) => decidirAutorizacao(autorizacaoId, dados),
    onSuccess: (autorizacao) => {
      clienteQuery.setQueryData(['autorizacao', autorizacaoId], autorizacao);
      return atualizarAutorizacoes(clienteQuery);
    },
  });
}

export function useReenviarAutorizacao(autorizacaoId: number) {
  return useMutation({ mutationFn: () => reenviarAutorizacao(autorizacaoId) });
}

export function useAcessos(data: string) {
  return useInfiniteQuery({
    queryKey: ['acessos', data],
    queryFn: ({ pageParam }) => buscarAcessos({ data: data || undefined, page: pageParam, size: TAMANHO_PAGINA }),
    initialPageParam: 0,
    getNextPageParam: proximaPagina,
  });
}

export function useRegistrarAcesso() {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (dados: AcessoCreateRequest) => registrarAcesso(dados),
    onSuccess: (acesso) => {
      logger.info('Portaria', `${acesso.status === 'saiu' ? 'saída' : 'entrada'} de ${acesso.visitante.nome}`);
      return clienteQuery.invalidateQueries({ queryKey: ['acessos'] });
    },
  });
}
