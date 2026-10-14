/**
 * PATCH parcial: devolve só os campos de `atual` que mudaram em relação a `original`.
 * Um campo que passou a `null` entra como `null` (ex.: remover a logo); campo igual fica de fora.
 */
export function camposAlterados<T extends object>(original: T, atual: T): Partial<T> {
  const alterados: Partial<T> = {};
  for (const chave of Object.keys(atual) as (keyof T)[]) {
    if (atual[chave] !== original[chave]) {
      alterados[chave] = atual[chave];
    }
  }
  return alterados;
}
