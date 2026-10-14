import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router';
import estilos from './Botao.module.css';

export type VarianteBotao = 'primario' | 'secundario' | 'perigo' | 'texto';

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao;
  /** Enquanto envia, o botão fica desabilitado (evita envio duplo) e mostra um indicador. */
  carregando?: boolean;
}

export function Botao({ variante = 'primario', carregando = false, disabled, className, children, type = 'button', ...resto }: BotaoProps) {
  return (
    <button
      {...resto}
      type={type}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={`${estilos.botao} ${estilos[variante]} ${className ?? ''}`}
    >
      {carregando && <span className={estilos.indicador} aria-hidden="true" />}
      {children}
    </button>
  );
}

interface BotaoLinkProps {
  para: string;
  variante?: VarianteBotao;
  children: ReactNode;
}

/** Link com aparência de botão (navegação para outra tela). */
export function BotaoLink({ para, variante = 'primario', children }: BotaoLinkProps) {
  return (
    <Link to={para} className={`${estilos.botao} ${estilos[variante]}`}>
      {children}
    </Link>
  );
}
