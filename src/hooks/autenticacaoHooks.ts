import { useMutation, useQuery } from '@tanstack/react-query';
import { buscarMe, entrar, sair, trocarContexto } from '../api/autenticacaoApi';
import { useSessao } from '../contexto/SessaoContext';
import type { ContextoRequest, LoginRequest } from '../tipos/login';
import { Logger } from '../utils/logger';

const logger = Logger.getInstance();

export function useEntrar() {
  const { iniciarSessao } = useSessao();
  return useMutation({
    mutationFn: (dados: LoginRequest) => entrar(dados),
    onSuccess: (resposta) => {
      iniciarSessao(resposta);
      logger.info('Sessão', `login como ${resposta.contexto.perfil}`);
    },
  });
}

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: buscarMe });
}

export function useTrocarContexto() {
  const { trocarSessao } = useSessao();
  return useMutation({
    mutationFn: (dados: ContextoRequest) => trocarContexto(dados),
    onSuccess: (resposta) => {
      trocarSessao(resposta);
      logger.info('Sessão', `contexto trocado para ${resposta.contexto.perfil}`);
    },
  });
}

/** Logout: a sessão local é apagada mesmo se a chamada ao servidor falhar. */
export function useSair() {
  const { encerrarSessao } = useSessao();
  return useMutation({
    mutationFn: async () => {
      try {
        await sair();
      } catch (erro) {
        logger.warn('Sessão', `logout no servidor falhou: ${String(erro)}`);
      }
    },
    onSettled: () => encerrarSessao(),
  });
}
