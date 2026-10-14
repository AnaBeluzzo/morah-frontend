import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useSessao } from '../contexto/SessaoContext';
import { Icone } from './Icone';
import { SinoNotificacoes } from './SinoNotificacoes';
import estilos from './Tela.module.css';

interface TelaProps {
  titulo: string;
  /** Tela "pai": o botão voltar usa o histórico e, se a tela foi aberta direto pela URL, vai para cá. */
  voltarPara?: string;
  children: ReactNode;
}

/** Estrutura de toda tela: barra superior (voltar + título + sino) e o conteúdo. */
export function Tela({ titulo, voltarPara, children }: TelaProps) {
  const navigate = useNavigate();
  const { sessao } = useSessao();

  useEffect(() => {
    document.title = `${titulo} · Morah`;
  }, [titulo]);

  function voltar() {
    // o React Router guarda a posição no histórico em history.state.idx
    const posicao = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (posicao > 0) {
      navigate(-1);
    } else if (voltarPara) {
      navigate(voltarPara, { replace: true });
    }
  }

  return (
    <>
      <header className={estilos.topo}>
        {voltarPara && (
          <button type="button" className={estilos.botaoIcone} onClick={voltar} aria-label="Voltar">
            <Icone nome="voltar" />
          </button>
        )}
        <h1 className={estilos.titulo}>{titulo}</h1>
        {sessao && <SinoNotificacoes />}
      </header>
      <main className={estilos.conteudo}>{children}</main>
    </>
  );
}

/** Seção de uma tela, com título opcional. */
export function Secao({ titulo, children, acao }: { titulo?: string; children: ReactNode; acao?: ReactNode }) {
  return (
    <section className={estilos.secao}>
      {(titulo || acao) && (
        <div className={estilos.cabecalhoSecao}>
          {titulo && <h2>{titulo}</h2>}
          {acao}
        </div>
      )}
      {children}
    </section>
  );
}
