import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icone } from './Icone';
import estilos from './Cartao.module.css';

interface CartaoProps {
  /** Se informado, o cartão inteiro vira um link (alvo de toque grande). */
  para?: string;
  /** Realce na borda (ex.: aviso urgente, notificação não lida). */
  destaque?: boolean;
  rotulo?: string;
  children: ReactNode;
}

export function Cartao({ para, destaque = false, rotulo, children }: CartaoProps) {
  const classe = `${estilos.cartao} ${destaque ? estilos.destaque : ''}`;
  if (para) {
    return (
      <Link to={para} className={`${classe} ${estilos.link}`} aria-label={rotulo}>
        <div className={estilos.conteudo}>{children}</div>
        <Icone nome="seta" />
      </Link>
    );
  }
  return (
    <section className={classe} aria-label={rotulo}>
      <div className={estilos.conteudo}>{children}</div>
    </section>
  );
}

/** Lista vertical de cartões. */
export function ListaCartoes({ children, rotulo }: { children: ReactNode; rotulo?: string }) {
  return (
    <ul className={estilos.lista} aria-label={rotulo}>
      {children}
    </ul>
  );
}

/** Linha "rótulo: valor" usada nos detalhes. */
export function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className={estilos.dado}>
      <dt>{rotulo}</dt>
      <dd>{children}</dd>
    </div>
  );
}
