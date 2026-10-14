import { Link } from 'react-router';
import { Icone } from '../../componentes/Icone';
import { Tela } from '../../componentes/Tela';
import { useContextoAtivo, useSessao } from '../../contexto/SessaoContext';
import { ITENS_MAIS_POR_PERFIL } from '../../rotas/navegacao';
import estilos from './MaisPage.module.css';

/** Aba "Mais": o que não cabe nas abas inferiores do perfil. */
export function MaisPage() {
  const contexto = useContextoAtivo();
  const { sessao } = useSessao();
  const itens = [...ITENS_MAIS_POR_PERFIL[contexto.perfil]];
  if ((sessao?.perfisDisponiveis.length ?? 0) > 1) {
    itens.push({ rotulo: 'Trocar perfil', caminho: '/perfil/trocar', icone: 'pessoa' });
  }

  return (
    <Tela titulo="Mais">
      <nav aria-label="Mais opções">
        <ul className={estilos.lista}>
          {itens.map((item) => (
            <li key={item.caminho}>
              <Link to={item.caminho} className={estilos.item}>
                <Icone nome={item.icone} />
                <span>{item.rotulo}</span>
                <Icone nome="seta" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Tela>
  );
}
