import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useModulos, usePersonalizacao } from '../hooks/personalizacaoHooks';
import type { ModuloCodigo, Personalizacao } from '../tipos/personalizacao';
import { aplicarCores, limparCores } from '../utils/cores';

interface TemaApi {
  personalizacao: Personalizacao | undefined;
  /** Lista de módulos já chegou (as guardas de rota esperam por ela). */
  modulosCarregados: boolean;
  moduloAtivo: (modulo: ModuloCodigo) => boolean;
}

const TemaContexto = createContext<TemaApi | null>(null);

/**
 * Identidade visual e módulos ativos do condomínio. Os dados vêm do cache do TanStack Query,
 * então quando o síndico salva uma mudança o cache é atualizado e o app inteiro reflete na hora.
 */
export function TemaProvider({ children }: { children: ReactNode }) {
  const { data: personalizacao } = usePersonalizacao();
  const modulos = useModulos();

  // cores do condomínio viram variáveis CSS na raiz; sem sessão volta o tema padrão
  useEffect(() => {
    if (!personalizacao) {
      return;
    }
    aplicarCores(personalizacao);
    return () => limparCores();
  }, [personalizacao]);

  const lista = modulos.data;
  const moduloAtivo = useCallback(
    // enquanto não chegou (ou se falhou) o módulo conta como ativo: o backend ainda bloqueia com 403
    (codigo: ModuloCodigo) => lista?.find((modulo) => modulo.modulo === codigo)?.ativo ?? true,
    [lista],
  );

  // isLoading = primeira busca em andamento (sem sessão a busca nem começa)
  const modulosCarregados = !modulos.isLoading;
  const api = useMemo(() => ({ personalizacao, modulosCarregados, moduloAtivo }), [personalizacao, modulosCarregados, moduloAtivo]);
  return <TemaContexto.Provider value={api}>{children}</TemaContexto.Provider>;
}

export function useTema(): TemaApi {
  const api = useContext(TemaContexto);
  if (!api) {
    throw new Error('useTema precisa estar dentro de <TemaProvider>');
  }
  return api;
}
