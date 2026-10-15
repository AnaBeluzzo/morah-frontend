import type { VinculoUnidade } from '../../tipos/minhaUnidade';
import { hojeIso } from '../../utils/formatadores';

/** Vínculo encerrado: o servidor grava `fim` = hoje ao encerrar o contrato de um inquilino. */
export function vinculoEncerrado(vinculo: VinculoUnidade): boolean {
  return vinculo.fim !== undefined && vinculo.fim <= hojeIso();
}
