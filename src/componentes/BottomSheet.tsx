import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Botao } from './Botao';
import estilos from './BottomSheet.module.css';

interface BottomSheetProps {
  aberto: boolean;
  titulo: string;
  aoFechar: () => void;
  children: ReactNode;
}

/** Painel que sobe da parte de baixo da tela (perto do polegar), usado em decisões e formulários curtos. */
export function BottomSheet({ aberto, titulo, aoFechar, children }: BottomSheetProps) {
  const idTitulo = useId();
  const painel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) {
      return;
    }
    // foco vai para o painel (leitor de tela) e Esc fecha
    painel.current?.focus();
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        aoFechar();
      }
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto, aoFechar]);

  if (!aberto) {
    return null;
  }
  return (
    <div className={estilos.fundo} onClick={aoFechar}>
      <div
        ref={painel}
        className={estilos.painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        onClick={(evento) => evento.stopPropagation()}
      >
        <span className={estilos.alca} aria-hidden="true" />
        <h2 id={idTitulo}>{titulo}</h2>
        {children}
      </div>
    </div>
  );
}

interface DialogoConfirmacaoProps {
  aberto: boolean;
  titulo: string;
  mensagem: ReactNode;
  textoConfirmar: string;
  perigo?: boolean;
  enviando?: boolean;
  aoConfirmar: () => void;
  aoCancelar: () => void;
}

/** Confirmação de ações destrutivas e decisões, sempre num bottom sheet. */
export function DialogoConfirmacao({ aberto, titulo, mensagem, textoConfirmar, perigo, enviando, aoConfirmar, aoCancelar }: DialogoConfirmacaoProps) {
  return (
    <BottomSheet aberto={aberto} titulo={titulo} aoFechar={aoCancelar}>
      <div className={estilos.mensagem}>{mensagem}</div>
      <div className={estilos.acoes}>
        <Botao variante={perigo ? 'perigo' : 'primario'} carregando={enviando} onClick={aoConfirmar}>
          {textoConfirmar}
        </Botao>
        <Botao variante="secundario" onClick={aoCancelar} disabled={enviando}>
          Cancelar
        </Botao>
      </div>
    </BottomSheet>
  );
}
