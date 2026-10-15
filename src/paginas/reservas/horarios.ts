import type { HorarioDisponivel } from '../../tipos/reservas';

/** Horários escolhidos: posições na lista de 14 horários (o fim entra na reserva). */
export interface Selecao {
  inicio: number;
  fim: number;
}

/**
 * O primeiro toque escolhe o horário de início; o segundo, um horário depois dele, escolhe o fim
 * — desde que todos os horários do intervalo estejam livres (uma ou mais horas seguidas).
 * Qualquer outro toque recomeça a escolha a partir do horário tocado.
 */
export function tocarHorario(selecao: Selecao | null, indice: number, horarios: HorarioDisponivel[]): Selecao {
  const esperandoFim = selecao !== null && selecao.inicio === selecao.fim && indice > selecao.inicio;
  if (esperandoFim && horarios.slice(selecao.inicio, indice + 1).every((horario) => horario.disponivel)) {
    return { inicio: selecao.inicio, fim: indice };
  }
  return { inicio: indice, fim: indice };
}
