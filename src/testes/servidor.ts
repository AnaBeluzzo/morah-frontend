import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** Servidor MSW que intercepta o `fetch` dos testes (nenhuma chamada sai para a rede). */
export const servidor = setupServer(...handlers);
