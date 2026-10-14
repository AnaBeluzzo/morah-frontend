import type { Perfil } from '../tipos/login';

// Rótulos em português dos enums do contrato: um mapa por enum, com o valor do contrato como
// chave. O tipo Record<Enum, string> obriga (em tempo de compilação) a ter rótulo para todo valor.
// Cada status também tem um tom de selo (cor + texto, nunca só cor).

export type TomSelo = 'sucesso' | 'alerta' | 'perigo' | 'info' | 'neutro';

/** Rótulo de um valor; se o servidor mandar um valor desconhecido, mostra o próprio valor. */
export function rotular(mapa: Record<string, string>, valor: string | undefined): string {
  if (valor === undefined) {
    return '';
  }
  return mapa[valor] ?? valor;
}

// ---------------------------------------------------------------- Login

export const ROTULOS_PERFIL: Record<Perfil, string> = {
  morador: 'Morador',
  proprietario: 'Proprietário',
  sindico: 'Síndico',
  portaria: 'Portaria',
};
