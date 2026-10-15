import type { ReactNode } from 'react';
import { Link } from 'react-router';
import estilos from './Inicio.module.css';

interface SecaoPainelProps {
  titulo: string;
  /** Tela do módulo: "Ver tudo" leva para lá. */
  para?: string;
  children: ReactNode;
}

/** Uma seção da tela inicial: título, atalho para o módulo e o conteúdo. */
export function SecaoPainel({ titulo, para, children }: SecaoPainelProps) {
  return (
    <section className={estilos.secao} aria-label={titulo}>
      <div className={estilos.cabecalho}>
        <h2>{titulo}</h2>
        {para && (
          <Link to={para} className={estilos.verTudo}>
            Ver tudo
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Mensagem curta quando a seção não tem itens. */
export function NadaPendente({ children }: { children: ReactNode }) {
  return <p className={estilos.nada}>{children}</p>;
}
