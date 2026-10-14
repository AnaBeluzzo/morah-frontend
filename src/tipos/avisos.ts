import type { Pagina, PessoaResumo } from './comum';

// Tipos do módulo Avisos (nomes e campos iguais aos schemas do contrato).

export type PrioridadeAviso = 'normal' | 'urgente';

export type TipoPublicoAlvo = 'condominio' | 'bloco' | 'unidade';

export interface PublicoAlvo {
  tipo: TipoPublicoAlvo;
  blocoId?: number;
  unidadeId?: number;
}

export interface AvisoCreateRequest {
  titulo: string;
  conteudo: string;
  categoria?: string;
  prioridade?: PrioridadeAviso;
  publicoAlvo: PublicoAlvo;
  expiraEm?: string;
}

/** PATCH parcial: só os campos enviados são alterados. */
export interface AvisoUpdateRequest {
  titulo?: string;
  conteudo?: string;
  categoria?: string;
  prioridade?: PrioridadeAviso;
  expiraEm?: string;
}

export interface Aviso {
  id: number;
  titulo: string;
  conteudo: string;
  categoria?: string;
  prioridade?: PrioridadeAviso;
  publicoAlvo?: PublicoAlvo;
  autor?: PessoaResumo;
  publicadoEm: string;
  expiraEm?: string;
  lidoPeloUsuario?: boolean;
}

export type AvisoPage = Pagina<Aviso>;

export interface FiltrosAvisos {
  categoria?: string;
  prioridade?: PrioridadeAviso | '';
}
