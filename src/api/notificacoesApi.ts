import type { ParametrosPagina } from '../tipos/comum';
import type { Notificacao } from '../tipos/notificacoes';
import { ApiClient } from './ApiClient';

const cliente = ApiClient.getInstance();

/** GET /notificacoes devolve SÓ o array da página pedida (sem totais). */
export function buscarNotificacoes(parametros: ParametrosPagina): Promise<Notificacao[]> {
  return cliente.get<Notificacao[]>('/notificacoes', { ...parametros });
}

export function marcarNotificacaoLida(notificacaoId: number): Promise<Notificacao> {
  return cliente.patch<Notificacao>(`/notificacoes/${notificacaoId}/lida`);
}
