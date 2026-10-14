import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { ToastProvider } from '../componentes/Toast';

interface OpcoesRenderizar {
  /** URL inicial do roteador em memória. */
  rota?: string;
}

/** Renderiza com os mesmos provedores do App (Query, roteador, toast), sem repetir tentativas. */
export function renderizar(ui: ReactElement, { rota = '/' }: OpcoesRenderizar = {}) {
  const clienteQuery = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const usuario = userEvent.setup();
  const resultado = render(
    <QueryClientProvider client={clienteQuery}>
      <MemoryRouter initialEntries={[rota]}>
        <ToastProvider>{ui}</ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...resultado, usuario, clienteQuery };
}
