import type { ParametrosPagina } from '../tipos/comum';
import type { AreaComum, Disponibilidade, Reserva, ReservaCreateRequest, ReservaPage, VistoriaRequest } from '../tipos/reservas';
import { ApiClient } from './ApiClient';

const cliente = ApiClient.getInstance();

export function buscarAreasComuns(): Promise<AreaComum[]> {
  return cliente.get<AreaComum[]>('/areas-comuns');
}

/** Os 14 horários (08:00 às 22:00) de uma data, cada um disponível ou não. */
export function buscarDisponibilidade(areaComumId: number, data: string): Promise<Disponibilidade> {
  return cliente.get<Disponibilidade>(`/areas-comuns/${areaComumId}/disponibilidade`, { data });
}

/** Morador: as da unidade; portaria: as do dia (padrão hoje); síndico: todas. */
export function buscarReservas(filtros: { data?: string } & ParametrosPagina): Promise<ReservaPage> {
  return cliente.get<ReservaPage>('/reservas', { ...filtros });
}

/** Nasce confirmada; 409 se o horário já foi reservado. */
export function criarReserva(dados: ReservaCreateRequest): Promise<Reserva> {
  return cliente.post<Reserva>('/reservas', dados);
}

export function buscarReserva(reservaId: number): Promise<Reserva> {
  return cliente.get<Reserva>(`/reservas/${reservaId}`);
}

/** Cancela (não apaga): a reserva passa a `cancelada`; 409 se não estava confirmada. */
export function deletarReserva(reservaId: number): Promise<void> {
  return cliente.delete(`/reservas/${reservaId}`);
}

/** Portaria: vistoria de entrada ou saída (a de saída conclui a reserva). */
export function registrarVistoria(reservaId: number, dados: VistoriaRequest): Promise<Reserva> {
  return cliente.post<Reserva>(`/reservas/${reservaId}/vistoria`, dados);
}
