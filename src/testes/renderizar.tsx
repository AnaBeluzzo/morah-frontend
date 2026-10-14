import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ToastProvider } from '../componentes/Toast';
import { SessaoProvider } from '../contexto/SessaoContext';
import { TemaProvider } from '../contexto/TemaContext';
import type { Perfil, PerfilDisponivel } from '../tipos/login';
import { CONTEXTOS } from './handlers';

interface OpcoesRenderizar {
  /** URL inicial do roteador em memória. */
  rota?: string;
  /** Padrão da rota (ex.: "/avisos/:avisoId") quando a tela lê parâmetros da URL. */
  caminho?: string;
  /** Perfil logado; `null` = sem sessão. */
  perfil?: Perfil | null;
  perfisDisponiveis?: PerfilDisponivel[];
}

/** Simula uma sessão salva (tokens + contexto), como depois de um login de verdade. */
export function iniciarSessaoDeTeste(perfil: Perfil, perfisDisponiveis: PerfilDisponivel[] = [CONTEXTOS[perfil]]) {
  localStorage.setItem('morah.accessToken', `access-${perfil}`);
  localStorage.setItem('morah.refreshToken', `refresh-${perfil}`);
  localStorage.setItem('morah.sessao', JSON.stringify({ contexto: CONTEXTOS[perfil], perfisDisponiveis }));
}

/** Renderiza com os mesmos provedores do App (Query, roteador, toast, sessão), sem repetir tentativas. */
export function renderizar(ui: ReactElement, { rota = '/', caminho, perfil = 'morador', perfisDisponiveis }: OpcoesRenderizar = {}) {
  if (perfil) {
    iniciarSessaoDeTeste(perfil, perfisDisponiveis);
  }
  const clienteQuery = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const usuario = userEvent.setup();
  const conteudo = caminho ? (
    <Routes>
      <Route path={caminho} element={ui} />
      <Route path="*" element={<p>Outra tela</p>} />
    </Routes>
  ) : (
    ui
  );
  const resultado = render(
    <QueryClientProvider client={clienteQuery}>
      <MemoryRouter initialEntries={[rota]}>
        <ToastProvider>
          <SessaoProvider>
            <TemaProvider>{conteudo}</TemaProvider>
          </SessaoProvider>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...resultado, usuario, clienteQuery };
}
