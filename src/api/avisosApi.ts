import type { Aviso, AvisoCreateRequest, AvisoPage, AvisoUpdateRequest, FiltrosAvisos } from '../tipos/avisos';
import type { ParametrosPagina } from '../tipos/comum';
import { ApiClient } from './ApiClient';

const cliente = ApiClient.getInstance();

export function buscarAvisos(filtros: FiltrosAvisos & ParametrosPagina): Promise<AvisoPage> {
  return cliente.get<AvisoPage>('/avisos', { ...filtros });
}

/** Atenção: o GET de um aviso o marca como lido para a pessoa (e responde 410 se expirou). */
export function buscarAviso(avisoId: number): Promise<Aviso> {
  return cliente.get<Aviso>(`/avisos/${avisoId}`);
}

export function criarAviso(dados: AvisoCreateRequest): Promise<Aviso> {
  return cliente.post<Aviso>('/avisos', dados);
}

export function alterarAviso(avisoId: number, dados: AvisoUpdateRequest): Promise<Aviso> {
  return cliente.patch<Aviso>(`/avisos/${avisoId}`, dados);
}

/** Não apaga: o servidor só expira o aviso (expiraEm = agora). */
export function deletarAviso(avisoId: number): Promise<void> {
  return cliente.delete(`/avisos/${avisoId}`);
}
