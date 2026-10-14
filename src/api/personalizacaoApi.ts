import type { ModuloCodigo, ModuloCondominio, ModuloUpdateRequest, Personalizacao, PersonalizacaoUpdateRequest } from '../tipos/personalizacao';
import { ApiClient } from './ApiClient';

const cliente = ApiClient.getInstance();

export function buscarPersonalizacao(): Promise<Personalizacao> {
  return cliente.get<Personalizacao>('/condominio/personalizacao');
}

/** PATCH parcial: só os campos presentes no objeto vão no corpo. */
export function alterarPersonalizacao(dados: PersonalizacaoUpdateRequest): Promise<Personalizacao> {
  return cliente.patch<Personalizacao>('/condominio/personalizacao', dados);
}

export function buscarModulos(): Promise<ModuloCondominio[]> {
  return cliente.get<ModuloCondominio[]>('/condominio/modulos');
}

export function alterarModulo(modulo: ModuloCodigo, dados: ModuloUpdateRequest): Promise<ModuloCondominio> {
  return cliente.patch<ModuloCondominio>(`/condominio/modulos/${modulo}`, dados);
}
