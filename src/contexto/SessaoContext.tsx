import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiClient } from '../api/ApiClient';
import { useToast } from '../componentes/Toast';
import type { ContextoAtivo, ContextoAtivoResponse, LoginResponse, PerfilDisponivel } from '../tipos/login';

const CHAVE_SESSAO = 'morah.sessao';

/** O que o app precisa saber da sessão: o contexto ativo (perfil, condomínio, unidade) e as opções de troca. */
export interface Sessao {
  contexto: ContextoAtivo;
  perfisDisponiveis: PerfilDisponivel[];
}

interface SessaoApi {
  sessao: Sessao | null;
  /** Depois do login: guarda os tokens (no ApiClient) e o contexto. */
  iniciarSessao: (resposta: LoginResponse) => void;
  /** Depois de POST /auth/contexto: novos tokens e novo contexto, com o cache limpo. */
  trocarSessao: (resposta: ContextoAtivoResponse) => void;
  /** Logout ou sessão expirada: apaga tokens, contexto e todo o cache de dados. */
  encerrarSessao: () => void;
}

const SessaoContexto = createContext<SessaoApi | null>(null);
const cliente = ApiClient.getInstance();

function lerSessaoSalva(): Sessao | null {
  // sem refresh token não há como continuar a sessão
  if (!cliente.temSessao()) {
    return null;
  }
  try {
    const salva = localStorage.getItem(CHAVE_SESSAO);
    return salva ? (JSON.parse(salva) as Sessao) : null;
  } catch {
    return null;
  }
}

function salvar(sessao: Sessao | null) {
  if (sessao) {
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
  } else {
    localStorage.removeItem(CHAVE_SESSAO);
  }
}

export function SessaoProvider({ children }: { children: ReactNode }) {
  const clienteQuery = useQueryClient();
  const { mostrarToast } = useToast();
  // a sessão sobrevive ao recarregar a página porque fica no localStorage
  const [sessao, setSessao] = useState<Sessao | null>(lerSessaoSalva);

  const atualizar = useCallback((nova: Sessao | null) => {
    salvar(nova);
    setSessao(nova);
  }, []);

  const encerrarSessao = useCallback(() => {
    cliente.limparTokens();
    atualizar(null);
    // dados de uma pessoa nunca podem aparecer para a próxima
    clienteQuery.clear();
  }, [atualizar, clienteQuery]);

  const iniciarSessao = useCallback(
    (resposta: LoginResponse) => {
      cliente.definirTokens(resposta);
      atualizar({ contexto: resposta.contexto, perfisDisponiveis: resposta.perfisDisponiveis });
    },
    [atualizar],
  );

  const trocarSessao = useCallback(
    (resposta: ContextoAtivoResponse) => {
      cliente.definirTokens(resposta);
      // o cache é do contexto anterior (outro perfil/condomínio): começa do zero
      clienteQuery.removeQueries();
      // as opções de troca continuam as mesmas do login; só o contexto ativo muda
      atualizar({ contexto: resposta.contexto, perfisDisponiveis: sessao?.perfisDisponiveis ?? [] });
    },
    [clienteQuery, atualizar, sessao],
  );

  // quando o refresh falha, o ApiClient avisa aqui e o app volta para o login
  useEffect(() => {
    cliente.definirAoExpirarSessao(() => {
      encerrarSessao();
      mostrarToast('Sua sessão terminou. Entre de novo.', 'erro');
    });
    return () => cliente.definirAoExpirarSessao(() => {});
  }, [encerrarSessao, mostrarToast]);

  const api = useMemo(() => ({ sessao, iniciarSessao, trocarSessao, encerrarSessao }), [sessao, iniciarSessao, trocarSessao, encerrarSessao]);
  return <SessaoContexto.Provider value={api}>{children}</SessaoContexto.Provider>;
}

export function useSessao(): SessaoApi {
  const api = useContext(SessaoContexto);
  if (!api) {
    throw new Error('useSessao precisa estar dentro de <SessaoProvider>');
  }
  return api;
}

/** Atalho para telas que só existem logado: devolve o contexto ativo. */
export function useContextoAtivo(): ContextoAtivo {
  const { sessao } = useSessao();
  if (!sessao) {
    throw new Error('useContextoAtivo usado fora de uma rota protegida');
  }
  return sessao.contexto;
}
