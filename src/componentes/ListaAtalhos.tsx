import { Link } from 'react-router';
import { Icone, type NomeIcone } from './Icone';
import estilos from './ListaAtalhos.module.css';

export interface Atalho {
  rotulo: string;
  caminho: string;
  icone: NomeIcone;
}

/** Lista de links para outras telas (aba Mais, atalhos do financeiro, do condomínio...). */
export function ListaAtalhos({ itens, rotulo }: { itens: Atalho[]; rotulo: string }) {
  return (
    <nav aria-label={rotulo}>
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
  );
}
