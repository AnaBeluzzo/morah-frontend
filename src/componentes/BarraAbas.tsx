import { NavLink } from 'react-router';
import { Icone, type NomeIcone } from './Icone';
import estilos from './BarraAbas.module.css';

export interface Aba {
  rotulo: string;
  caminho: string;
  icone: NomeIcone;
}

/** Barra de abas inferior (no máximo 5), ao alcance do polegar. */
export function BarraAbas({ abas }: { abas: Aba[] }) {
  return (
    <nav className={estilos.barra} aria-label="Navegação principal">
      {abas.map((aba) => (
        <NavLink
          key={aba.caminho}
          to={aba.caminho}
          end={aba.caminho === '/'}
          className={({ isActive }) => `${estilos.aba} ${isActive ? estilos.ativa : ''}`}
        >
          <Icone nome={aba.icone} />
          <span>{aba.rotulo}</span>
        </NavLink>
      ))}
    </nav>
  );
}
