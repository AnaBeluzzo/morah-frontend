import type { ParametrosPagina } from '../tipos/comum';
import type {
  Acesso,
  AcessoCreateRequest,
  AcessoPage,
  AutorizacaoVisita,
  AutorizacaoVisitaCreateRequest,
  AutorizacaoVisitaPage,
  DecisaoAutorizacaoRequest,
  StatusAutorizacaoVisita,
} from '../tipos/portaria';
import { ApiClient } from './ApiClient';

const cliente = ApiClient.getInstance();

/** Portaria registra o visitante: nasce uma autorização `pendente` e a unidade é notificada. */
export function registrarVisitante(dados: AutorizacaoVisitaCreateRequest): Promise<AutorizacaoVisita> {
  return cliente.post<AutorizacaoVisita>('/portaria/visitantes', dados);
}

/** Portaria vê as do condomínio; morador/proprietário só as da própria unidade. */
export function buscarAutorizacoes(filtros: { status?: StatusAutorizacaoVisita | '' } & ParametrosPagina): Promise<AutorizacaoVisitaPage> {
  return cliente.get<AutorizacaoVisitaPage>('/portaria/autorizacoes', { ...filtros });
}

export function buscarAutorizacao(autorizacaoId: number): Promise<AutorizacaoVisita> {
  return cliente.get<AutorizacaoVisita>(`/portaria/autorizacoes/${autorizacaoId}`);
}

/** Morador/proprietário autoriza ou recusa (409 se já decidida ou expirada). */
export function decidirAutorizacao(autorizacaoId: number, dados: DecisaoAutorizacaoRequest): Promise<AutorizacaoVisita> {
  return cliente.patch<AutorizacaoVisita>(`/portaria/autorizacoes/${autorizacaoId}/decisao`, dados);
}

/** Reenvia a notificação para a unidade (só enquanto pendente; 409 depois). */
export function reenviarAutorizacao(autorizacaoId: number): Promise<void> {
  return cliente.post<void>(`/portaria/autorizacoes/${autorizacaoId}/reenviar`);
}

export function buscarAcessos(filtros: { data?: string } & ParametrosPagina): Promise<AcessoPage> {
  return cliente.get<AcessoPage>('/portaria/acessos', { ...filtros });
}

/** Entrada (com a autorização) ou saída (só o visitante) efetiva na portaria. */
export function registrarAcesso(dados: AcessoCreateRequest): Promise<Acesso> {
  return cliente.post<Acesso>('/portaria/acessos', dados);
}
