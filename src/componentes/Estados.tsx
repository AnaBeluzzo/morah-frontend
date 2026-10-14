import type { ReactNode } from 'react';
import { ErroApi, mensagemDoErro } from '../api/ApiClient';
import { BotaoLink, Botao } from './Botao';
import { Icone } from './Icone';
import estilos from './Estados.module.css';

// Os 4 estados de toda tela: carregando, vazio, erro e sucesso.

export function EstadoCarregando({ mensagem = 'Carregando...' }: { mensagem?: string }) {
  return (
    <div className={estilos.estado} role="status" aria-live="polite">
      <span className={estilos.spinner} aria-hidden="true" />
      <p>{mensagem}</p>
    </div>
  );
}

export function EstadoVazio({ mensagem, children }: { mensagem: string; children?: ReactNode }) {
  return (
    <div className={estilos.estado}>
      <Icone nome="vazio" tamanho={40} />
      <p>{mensagem}</p>
      {children}
    </div>
  );
}

/** Tela "Módulo indisponível": rota de módulo desligado ou 403 "Módulo X desativado". */
export function ModuloIndisponivel() {
  return (
    <div className={estilos.estado}>
      <Icone nome="bloqueado" tamanho={40} />
      <h2>Módulo indisponível</h2>
      <p>Este módulo foi desativado pelo síndico neste condomínio.</p>
      <BotaoLink para="/" variante="secundario">
        Ir para o início
      </BotaoLink>
    </div>
  );
}

interface EstadoErroProps {
  erro: unknown;
  aoTentarDeNovo?: () => void;
}

export function EstadoErro({ erro, aoTentarDeNovo }: EstadoErroProps) {
  if (erro instanceof ErroApi && erro.moduloDesativado) {
    return <ModuloIndisponivel />;
  }
  return (
    <div className={estilos.estado} role="alert">
      <Icone nome="erro" tamanho={40} />
      <p>{mensagemDoErro(erro)}</p>
      {aoTentarDeNovo && (
        <Botao variante="secundario" onClick={aoTentarDeNovo}>
          Tentar de novo
        </Botao>
      )}
    </div>
  );
}

interface ConsultaLike<T> {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

interface EstadoConsultaProps<T> {
  consulta: ConsultaLike<T>;
  /** Diz se os dados chegaram vazios (lista sem itens). */
  vazio?: (dados: T) => boolean;
  mensagemVazio?: string;
  children: (dados: T) => ReactNode;
}

/** Mostra o estado certo de uma consulta do TanStack Query; `children` só roda no sucesso. */
export function EstadoConsulta<T>({ consulta, vazio, mensagemVazio = 'Nada por aqui ainda.', children }: EstadoConsultaProps<T>) {
  if (consulta.isPending) {
    return <EstadoCarregando />;
  }
  if (consulta.isError || consulta.data === undefined) {
    return <EstadoErro erro={consulta.error} aoTentarDeNovo={() => consulta.refetch()} />;
  }
  if (vazio?.(consulta.data)) {
    return <EstadoVazio mensagem={mensagemVazio} />;
  }
  return <>{children(consulta.data)}</>;
}

/** Erro geral de um formulário (409, 404, 403...): o `detail` do servidor já vem amigável. */
export function ErroFormulario({ erro, mensagem404 }: { erro: unknown; mensagem404?: string }) {
  if (!erro) {
    return null;
  }
  const texto = mensagem404 && erro instanceof ErroApi && erro.status === 404 ? mensagem404 : mensagemDoErro(erro);
  return (
    <p className={estilos.erroFormulario} role="alert">
      {texto}
    </p>
  );
}
