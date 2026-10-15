import type { ParametrosPagina } from '../tipos/comum';
import type {
  AutorizacaoRetirada,
  AutorizacaoRetiradaCreateRequest,
  Encomenda,
  EncomendaCreateRequest,
  EncomendaPage,
  Ocorrencia,
  OcorrenciaCreateRequest,
  RetiradaConfirmRequest,
  StatusEncomenda,
} from '../tipos/encomendas';
import { ApiClient } from './ApiClient';

const cliente = ApiClient.getInstance();

/** Morador: as da unidade; portaria e síndico: as do condomínio. */
export function buscarEncomendas(filtros: { status?: StatusEncomenda | '' } & ParametrosPagina): Promise<EncomendaPage> {
  return cliente.get<EncomendaPage>('/encomendas', { ...filtros });
}

/** Portaria registra o recebimento; nasce com código de retirada e a unidade é notificada. */
export function registrarEncomenda(dados: EncomendaCreateRequest): Promise<Encomenda> {
  return cliente.post<Encomenda>('/encomendas', dados);
}

export function buscarEncomenda(encomendaId: number): Promise<Encomenda> {
  return cliente.get<Encomenda>(`/encomendas/${encomendaId}`);
}

/** Morador autoriza outra pessoa a retirar: o servidor gera um código próprio de 6 dígitos. */
export function autorizarRetiradaTerceiro(encomendaId: number, dados: AutorizacaoRetiradaCreateRequest): Promise<AutorizacaoRetirada> {
  return cliente.post<AutorizacaoRetirada>(`/encomendas/${encomendaId}/autorizacoes-retirada`, dados);
}

/** Portaria confirma a retirada com um código válido (409 se inválido, expirado ou já retirada). */
export function confirmarRetirada(encomendaId: number, dados: RetiradaConfirmRequest): Promise<Encomenda> {
  return cliente.post<Encomenda>(`/encomendas/${encomendaId}/retirada`, dados);
}

/** Morador informa o extravio: abre uma ocorrência e a encomenda vira `extraviada`. */
export function abrirOcorrencia(encomendaId: number, dados: OcorrenciaCreateRequest): Promise<Ocorrencia> {
  return cliente.post<Ocorrencia>(`/encomendas/${encomendaId}/ocorrencias`, dados);
}
