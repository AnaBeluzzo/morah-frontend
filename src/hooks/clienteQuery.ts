import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ErroApi } from '../api/ApiClient';
import { Logger } from '../utils/logger';

const logger = Logger.getInstance();

/** Erros 4xx são respostas definitivas do servidor (validação, permissão, conflito): não adianta repetir. */
function deveRepetir(falhas: number, erro: unknown): boolean {
  if (erro instanceof ErroApi && erro.status >= 400 && erro.status < 500) {
    return false;
  }
  return falhas < 2;
}

/** Cliente do TanStack Query (cache, carregando, erro, recarregar) com log centralizado. */
export function criarClienteQuery(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (erro, consulta) => logger.warn('Consulta', `falhou ${JSON.stringify(consulta.queryKey)}: ${String(erro)}`),
    }),
    mutationCache: new MutationCache({
      onError: (erro) => logger.warn('Mutação', `falhou: ${String(erro)}`),
    }),
    defaultOptions: {
      queries: { retry: deveRepetir, staleTime: 30_000, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
}
