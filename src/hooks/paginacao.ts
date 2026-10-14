import type { InfiniteData } from '@tanstack/react-query';
import type { Pagina } from '../tipos/comum';

// Apoio às listas com "carregar mais" (useInfiniteQuery do TanStack Query).

export const TAMANHO_PAGINA = 20;

/** Próxima página a buscar, ou `undefined` quando a última já chegou. */
export function proximaPagina(ultima: Pagina<unknown>): number | undefined {
  const { page, totalPages } = ultima.page;
  return page + 1 < totalPages ? page + 1 : undefined;
}

/** Junta os itens de todas as páginas já carregadas numa lista só. */
export function itensDasPaginas<T>(dados: InfiniteData<Pagina<T>> | undefined): T[] {
  return dados?.pages.flatMap((pagina) => pagina.content) ?? [];
}
