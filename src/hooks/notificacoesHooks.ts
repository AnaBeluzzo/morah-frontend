import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buscarNotificacoes, marcarNotificacaoLida } from '../api/notificacoesApi';
import { useSessao } from '../contexto/SessaoContext';
import { Logger } from '../utils/logger';
import { TAMANHO_PAGINA } from './paginacao';

const logger = Logger.getInstance();

/**
 * Lista com "carregar mais". Como o endpoint não devolve totais, consideramos que há
 * próxima página sempre que a última veio cheia.
 */
export function useNotificacoes() {
  return useInfiniteQuery({
    queryKey: ['notificacoes', 'lista'],
    queryFn: ({ pageParam }) => buscarNotificacoes({ page: pageParam, size: TAMANHO_PAGINA }),
    initialPageParam: 0,
    getNextPageParam: (ultima, todas) => (ultima.length === TAMANHO_PAGINA ? todas.length : undefined),
  });
}

/**
 * Selo do sino: não existe contagem total de não lidas no contrato, então contamos
 * as não lidas (`lidaEm` ausente) da primeira página. Atualiza sozinho a cada 30 s.
 */
export function useNaoLidas() {
  const { sessao } = useSessao();
  return useQuery({
    queryKey: ['notificacoes', 'sino'],
    queryFn: () => buscarNotificacoes({ page: 0, size: TAMANHO_PAGINA }),
    select: (notificacoes) => notificacoes.filter((notificacao) => !notificacao.lidaEm).length,
    enabled: sessao !== null,
    refetchInterval: 30_000,
  });
}

export function useMarcarNotificacaoLida() {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (notificacaoId: number) => marcarNotificacaoLida(notificacaoId),
    onSuccess: (notificacao) => {
      logger.debug('Notificações', `notificação ${notificacao.id} lida`);
      return clienteQuery.invalidateQueries({ queryKey: ['notificacoes'] });
    },
  });
}
