import { ListaAtalhos } from '../../componentes/ListaAtalhos';
import { Tela } from '../../componentes/Tela';
import { useContextoAtivo, useSessao } from '../../contexto/SessaoContext';
import { useTema } from '../../contexto/TemaContext';
import { itensVisiveis, ITENS_MAIS_POR_PERFIL } from '../../rotas/navegacao';

/** Aba "Mais": o que não cabe nas abas inferiores do perfil. */
export function MaisPage() {
  const contexto = useContextoAtivo();
  const { sessao } = useSessao();
  const { moduloAtivo } = useTema();
  const itens = itensVisiveis(ITENS_MAIS_POR_PERFIL[contexto.perfil], moduloAtivo);
  // "Trocar perfil" só aparece quando a pessoa tem mais de um vínculo
  if ((sessao?.perfisDisponiveis.length ?? 0) > 1) {
    itens.push({ rotulo: 'Trocar perfil', caminho: '/perfil/trocar', icone: 'pessoa' });
  }

  return (
    <Tela titulo="Mais">
      <ListaAtalhos itens={itens} rotulo="Mais opções" />
    </Tela>
  );
}
