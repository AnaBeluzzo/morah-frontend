import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { buscarAreasComuns, buscarDisponibilidade, buscarReserva, buscarReservas, criarReserva, deletarReserva, registrarVistoria } from '../api/reservasApi';
import type { ReservaCreateRequest, VistoriaRequest } from '../tipos/reservas';
import { Logger } from '../utils/logger';
import { proximaPagina, TAMANHO_PAGINA } from './paginacao';

const logger = Logger.getInstance();

/** Depois de gravar: listas de reservas, horários livres e a tela inicial ficam velhos. */
function atualizarReservas(clienteQuery: QueryClient) {
  return Promise.all([
    clienteQuery.invalidateQueries({ queryKey: ['reservas'] }),
    clienteQuery.invalidateQueries({ queryKey: ['disponibilidade'] }),
    clienteQuery.invalidateQueries({ queryKey: ['dashboard'] }),
  ]);
}

export function useAreasComuns() {
  return useQuery({ queryKey: ['areasComuns'], queryFn: buscarAreasComuns });
}

export function useDisponibilidade(areaComumId: number, data: string) {
  return useQuery({
    queryKey: ['disponibilidade', areaComumId, data],
    queryFn: () => buscarDisponibilidade(areaComumId, data),
    enabled: data !== '',
  });
}

export function useReservas(data: string) {
  return useInfiniteQuery({
    queryKey: ['reservas', data],
    queryFn: ({ pageParam }) => buscarReservas({ data: data || undefined, page: pageParam, size: TAMANHO_PAGINA }),
    initialPageParam: 0,
    getNextPageParam: proximaPagina,
  });
}

export function useReserva(reservaId: number) {
  return useQuery({ queryKey: ['reserva', reservaId], queryFn: () => buscarReserva(reservaId) });
}

export function useCriarReserva() {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (dados: ReservaCreateRequest) => criarReserva(dados),
    onSuccess: (reserva) => {
      logger.info('Reservas', `reserva ${reserva.id} confirmada`);
      return atualizarReservas(clienteQuery);
    },
    // 409: alguém reservou antes; os horários são buscados de novo para mostrar o ocupado
    onError: () => clienteQuery.invalidateQueries({ queryKey: ['disponibilidade'] }),
  });
}

export function useCancelarReserva(reservaId: number) {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: () => deletarReserva(reservaId),
    onSuccess: () => Promise.all([clienteQuery.invalidateQueries({ queryKey: ['reserva', reservaId] }), atualizarReservas(clienteQuery)]),
  });
}

export function useRegistrarVistoria(reservaId: number) {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (dados: VistoriaRequest) => registrarVistoria(reservaId, dados),
    onSuccess: (reserva) => {
      clienteQuery.setQueryData(['reserva', reservaId], reserva);
      return atualizarReservas(clienteQuery);
    },
  });
}
