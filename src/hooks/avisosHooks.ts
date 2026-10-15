import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { alterarAviso, buscarAviso, buscarAvisos, criarAviso, deletarAviso } from '../api/avisosApi';
import type { AvisoCreateRequest, AvisoUpdateRequest, FiltrosAvisos } from '../tipos/avisos';
import { Logger } from '../utils/logger';
import { proximaPagina, TAMANHO_PAGINA } from './paginacao';

const logger = Logger.getInstance();

// Chaves separadas: invalidar as listas ('avisos') não refaz o detalhe ('aviso').
export function useAvisos(filtros: FiltrosAvisos) {
  return useInfiniteQuery({
    queryKey: ['avisos', filtros],
    queryFn: ({ pageParam }) => buscarAvisos({ ...filtros, page: pageParam, size: TAMANHO_PAGINA }),
    initialPageParam: 0,
    getNextPageParam: proximaPagina,
  });
}

export function useAviso(avisoId: number) {
  const clienteQuery = useQueryClient();
  return useQuery({
    queryKey: ['aviso', avisoId],
    queryFn: async () => {
      const aviso = await buscarAviso(avisoId);
      // abrir o aviso o marca como lido: a lista (lidoPeloUsuario) e o início precisam se atualizar
      void clienteQuery.invalidateQueries({ queryKey: ['avisos'] });
      void clienteQuery.invalidateQueries({ queryKey: ['dashboard'] });
      return aviso;
    },
  });
}

/** Depois de gravar: recarrega as listas de avisos e a tela inicial. */
function atualizarListas(clienteQuery: QueryClient) {
  return Promise.all([clienteQuery.invalidateQueries({ queryKey: ['avisos'] }), clienteQuery.invalidateQueries({ queryKey: ['dashboard'] })]);
}

export function useCriarAviso() {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (dados: AvisoCreateRequest) => criarAviso(dados),
    onSuccess: (aviso) => {
      logger.info('Avisos', `aviso ${aviso.id} publicado`);
      return atualizarListas(clienteQuery);
    },
  });
}

export function useAlterarAviso(avisoId: number) {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (dados: AvisoUpdateRequest) => alterarAviso(avisoId, dados),
    onSuccess: (aviso) => {
      clienteQuery.setQueryData(['aviso', avisoId], aviso);
      return atualizarListas(clienteQuery);
    },
  });
}

export function useDeletarAviso() {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (avisoId: number) => deletarAviso(avisoId),
    onSuccess: (_, avisoId) => {
      // só marca o detalhe como velho (sem buscar agora, o que daria 410): a tela sai em seguida
      void clienteQuery.invalidateQueries({ queryKey: ['aviso', avisoId], refetchType: 'none' });
      logger.info('Avisos', `aviso ${avisoId} expirado`);
      return atualizarListas(clienteQuery);
    },
  });
}
