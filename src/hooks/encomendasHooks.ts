import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { abrirOcorrencia, autorizarRetiradaTerceiro, buscarEncomenda, buscarEncomendas, confirmarRetirada, registrarEncomenda } from '../api/encomendasApi';
import type { AutorizacaoRetiradaCreateRequest, EncomendaCreateRequest, OcorrenciaCreateRequest, RetiradaConfirmRequest, StatusEncomenda } from '../tipos/encomendas';
import { Logger } from '../utils/logger';
import { proximaPagina, TAMANHO_PAGINA } from './paginacao';

const logger = Logger.getInstance();

/** Depois de mudar uma encomenda: o detalhe, as listas e a tela inicial ficam velhos. */
function atualizarEncomendas(clienteQuery: QueryClient, encomendaId?: number) {
  return Promise.all([
    clienteQuery.invalidateQueries({ queryKey: ['encomendas'] }),
    clienteQuery.invalidateQueries({ queryKey: ['encomenda', encomendaId] }),
    clienteQuery.invalidateQueries({ queryKey: ['dashboard'] }),
  ]);
}

export function useEncomendas(status: StatusEncomenda | '') {
  return useInfiniteQuery({
    queryKey: ['encomendas', status],
    queryFn: ({ pageParam }) => buscarEncomendas({ status, page: pageParam, size: TAMANHO_PAGINA }),
    initialPageParam: 0,
    getNextPageParam: proximaPagina,
  });
}

export function useEncomenda(encomendaId: number) {
  return useQuery({ queryKey: ['encomenda', encomendaId], queryFn: () => buscarEncomenda(encomendaId) });
}

export function useRegistrarEncomenda() {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (dados: EncomendaCreateRequest) => registrarEncomenda(dados),
    onSuccess: (encomenda) => {
      logger.info('Encomendas', `encomenda ${encomenda.id} registrada`);
      return atualizarEncomendas(clienteQuery);
    },
  });
}

export function useAutorizarRetiradaTerceiro(encomendaId: number) {
  return useMutation({ mutationFn: (dados: AutorizacaoRetiradaCreateRequest) => autorizarRetiradaTerceiro(encomendaId, dados) });
}

export function useConfirmarRetirada(encomendaId: number) {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (dados: RetiradaConfirmRequest) => confirmarRetirada(encomendaId, dados),
    onSuccess: () => atualizarEncomendas(clienteQuery, encomendaId),
  });
}

export function useAbrirOcorrencia(encomendaId: number) {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (dados: OcorrenciaCreateRequest) => abrirOcorrencia(encomendaId, dados),
    onSuccess: () => atualizarEncomendas(clienteQuery, encomendaId),
  });
}
