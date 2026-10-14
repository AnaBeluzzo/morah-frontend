import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alterarModulo, alterarPersonalizacao, buscarModulos, buscarPersonalizacao } from '../api/personalizacaoApi';
import { useSessao } from '../contexto/SessaoContext';
import type { ModuloCodigo, ModuloCondominio, PersonalizacaoUpdateRequest } from '../tipos/personalizacao';
import { Logger } from '../utils/logger';

const logger = Logger.getInstance();

export const CHAVE_PERSONALIZACAO = ['personalizacao'];
export const CHAVE_MODULOS = ['modulos'];

/** Identidade visual do condomínio ativo: buscada logo depois do login (ou ao abrir com sessão). */
export function usePersonalizacao() {
  const { sessao } = useSessao();
  return useQuery({ queryKey: CHAVE_PERSONALIZACAO, queryFn: buscarPersonalizacao, enabled: sessao !== null, staleTime: Infinity });
}

export function useModulos() {
  const { sessao } = useSessao();
  return useQuery({ queryKey: CHAVE_MODULOS, queryFn: buscarModulos, enabled: sessao !== null, staleTime: 60_000 });
}

export function useAlterarPersonalizacao() {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (dados: PersonalizacaoUpdateRequest) => alterarPersonalizacao(dados),
    // a resposta já é a personalização nova: gravar no cache faz o app inteiro mudar na hora
    onSuccess: (personalizacao) => {
      clienteQuery.setQueryData(CHAVE_PERSONALIZACAO, personalizacao);
      logger.info('Personalização', 'identidade visual atualizada');
    },
  });
}

export function useAlterarModulo() {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: ({ modulo, ativo }: { modulo: ModuloCodigo; ativo: boolean }) => alterarModulo(modulo, { ativo }),
    onSuccess: (atualizado) => {
      // troca só o módulo alterado na lista em cache: abas e rotas refletem sem recarregar
      clienteQuery.setQueryData<ModuloCondominio[]>(CHAVE_MODULOS, (lista) =>
        lista?.map((modulo) => (modulo.modulo === atualizado.modulo ? atualizado : modulo)),
      );
      logger.info('Personalização', `módulo ${atualizado.modulo} ${atualizado.ativo ? 'ativado' : 'desativado'}`);
      // a tela inicial esconde/mostra as seções do módulo
      return clienteQuery.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
