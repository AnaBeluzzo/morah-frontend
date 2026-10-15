import type { Aviso } from './avisos';
import type { Encomenda } from './encomendas';
import type { Cobranca, InadimplenciaResumo } from './financeiro';
import type { Unidade } from './minhaUnidade';
import type { AutorizacaoVisita } from './portaria';
import type { Reserva } from './reservas';

// Tela inicial: o formato depende do perfil ativo (campo discriminador `perfil`).
// Seções de módulos desativados chegam vazias ([] ou 0) ou ausentes.

export interface DashboardMorador {
  perfil: 'morador' | 'proprietario';
  unidade?: Unidade;
  proximosBoletos?: Cobranca[];
  avisosRecentes?: Aviso[];
  encomendasPendentes?: Encomenda[];
  autorizacoesPendentes?: AutorizacaoVisita[];
  proximasReservas?: Reserva[];
}

export interface DashboardSindico {
  perfil: 'sindico';
  inadimplencia?: InadimplenciaResumo;
  avisosPublicadosRecentes?: Aviso[];
  solicitacoesVinculoPendentes?: number;
  ocorrenciasAbertas?: number;
}

export interface DashboardPortaria {
  perfil: 'portaria';
  autorizacoesPendentes?: AutorizacaoVisita[];
  reservasDoDia?: Reserva[];
  encomendasRecebidasHoje?: number;
}

/** O TypeScript separa os três formatos pelo valor de `perfil`. */
export type Dashboard = DashboardMorador | DashboardSindico | DashboardPortaria;
