import type { Pagina, PessoaResumo } from './comum';

// Tipos do módulo Reservas (nomes e campos iguais aos schemas do contrato).

export interface AreaComum {
  id: number;
  nome: string;
  descricao?: string;
  capacidade?: number;
  taxa?: number;
  requerReserva?: boolean;
  status?: string;
}

/** Um horário de 1 hora (08:00 às 22:00 = 14 horários por dia). */
export interface HorarioDisponivel {
  inicio: string;
  fim: string;
  disponivel: boolean;
}

export interface Disponibilidade {
  data: string;
  horarios: HorarioDisponivel[];
}

/** `inicio` e `fim` são enviados exatamente como vieram da disponibilidade. */
export interface ReservaCreateRequest {
  areaComumId: number;
  inicio: string;
  fim: string;
}

export type StatusReserva = 'confirmada' | 'cancelada' | 'concluida' | 'nao_compareceu';

export interface Reserva {
  id: number;
  areaComumId: number;
  areaComumNome?: string;
  unidadeId: number;
  solicitante?: PessoaResumo;
  inicio: string;
  fim: string;
  status: StatusReserva;
  valor?: number;
}

export type ReservaPage = Pagina<Reserva>;

export type MomentoVistoria = 'entrada' | 'saida';

export interface VistoriaRequest {
  momento: MomentoVistoria;
  observacao?: string;
  /** Com dano, o servidor abre uma ocorrência. */
  dano?: boolean;
  fotosUrl?: string[];
}
