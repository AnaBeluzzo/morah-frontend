import { useState, type FormEvent } from 'react';
import { ErroApi } from '../../api/ApiClient';
import { Botao } from '../../componentes/Botao';
import { Campo } from '../../componentes/Campo';
import { ErroFormulario } from '../../componentes/Estados';
import type { PrioridadeAviso, TipoPublicoAlvo } from '../../tipos/avisos';
import { ROTULOS_PRIORIDADE_AVISO, ROTULOS_TIPO_PUBLICO_ALVO } from '../../utils/rotulos';

const OPCOES_PRIORIDADE = Object.entries(ROTULOS_PRIORIDADE_AVISO).map(([valor, rotulo]) => ({ valor, rotulo }));
const OPCOES_PUBLICO = Object.entries(ROTULOS_TIPO_PUBLICO_ALVO).map(([valor, rotulo]) => ({ valor, rotulo }));

/** O que a pessoa digita no formulário (tudo texto, como nos inputs). */
export interface ValoresAviso {
  titulo: string;
  conteudo: string;
  categoria: string;
  prioridade: PrioridadeAviso;
  publicoTipo: TipoPublicoAlvo;
  /** ID do bloco ou da unidade, quando o público não é o condomínio todo. */
  publicoId: string;
  /** Valor do <input type="datetime-local">, ou vazio. */
  expiraEm: string;
}

interface FormularioAvisoProps {
  inicial: ValoresAviso;
  /** O público só é escolhido ao criar (o PATCH do contrato não altera o público). */
  comPublico: boolean;
  textoBotao: string;
  enviando: boolean;
  erroServidor: unknown;
  aoEnviar: (valores: ValoresAviso) => void;
}

/** Campos e validação do aviso; quem usa decide o que fazer ao enviar (criar ou editar). */
export function FormularioAviso({ inicial, comPublico, textoBotao, enviando, erroServidor, aoEnviar }: FormularioAvisoProps) {
  const [valores, setValores] = useState(inicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const erroApi = erroServidor instanceof ErroApi ? erroServidor : null;
  // o servidor chama o campo de ID de "publicoAlvo.blocoId" ou "publicoAlvo.unidadeId"
  const campoIdNoServidor = valores.publicoTipo === 'bloco' ? 'publicoAlvo.blocoId' : 'publicoAlvo.unidadeId';

  function mudar(campo: keyof ValoresAviso, valor: string) {
    setValores({ ...valores, [campo]: valor });
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const encontrados: Record<string, string> = {};
    if (!valores.titulo.trim()) encontrados.titulo = 'Informe o título.';
    if (!valores.conteudo.trim()) encontrados.conteudo = 'Informe o conteúdo.';
    if (comPublico && valores.publicoTipo !== 'condominio' && !(Number(valores.publicoId) >= 1)) {
      encontrados.publicoId = valores.publicoTipo === 'bloco' ? 'Informe o ID do bloco.' : 'Informe o ID da unidade.';
    }
    setErros(encontrados);
    if (Object.keys(encontrados).length === 0) {
      aoEnviar(valores);
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <Campo id="titulo" rotulo="Título" valor={valores.titulo} aoMudar={(v) => mudar('titulo', v)} erro={erros.titulo ?? erroApi?.erroDoCampo('titulo')} obrigatorio />
      <Campo
        id="conteudo"
        rotulo="Conteúdo"
        como="textarea"
        valor={valores.conteudo}
        aoMudar={(v) => mudar('conteudo', v)}
        erro={erros.conteudo ?? erroApi?.erroDoCampo('conteudo')}
        obrigatorio
      />
      <Campo id="categoria" rotulo="Categoria" valor={valores.categoria} aoMudar={(v) => mudar('categoria', v)} erro={erroApi?.erroDoCampo('categoria')} placeholder="ex.: manutencao" />
      <Campo id="prioridade" rotulo="Prioridade" como="select" opcoes={OPCOES_PRIORIDADE} valor={valores.prioridade} aoMudar={(v) => mudar('prioridade', v)} />
      {comPublico && (
        <Campo
          id="publicoTipo"
          rotulo="Público"
          como="select"
          opcoes={OPCOES_PUBLICO}
          valor={valores.publicoTipo}
          aoMudar={(v) => mudar('publicoTipo', v)}
          erro={erroApi?.erroDoCampo('publicoAlvo.tipo')}
        />
      )}
      {comPublico && valores.publicoTipo !== 'condominio' && (
        <Campo
          id="publicoId"
          rotulo={valores.publicoTipo === 'bloco' ? 'ID do bloco' : 'ID da unidade'}
          tipo="number"
          inputMode="numeric"
          min="1"
          valor={valores.publicoId}
          aoMudar={(v) => mudar('publicoId', v)}
          erro={erros.publicoId ?? erroApi?.erroDoCampo(campoIdNoServidor)}
          ajuda="O app não tem lista de blocos e unidades: informe o número de identificação (ID)."
          obrigatorio
        />
      )}
      <Campo
        id="expiraEm"
        rotulo="Expira em"
        tipo="datetime-local"
        valor={valores.expiraEm}
        aoMudar={(v) => mudar('expiraEm', v)}
        erro={erroApi?.erroDoCampo('expiraEm')}
        ajuda="Opcional. Sem data, o aviso fica no mural até ser expirado."
      />
      {/* erros sem campo (404, 409...) aparecem aqui; os de campo, embaixo de cada campo */}
      <ErroFormulario erro={erroApi && erroApi.erros.length === 0 ? erroApi : null} />
      <Botao type="submit" carregando={enviando}>
        {textoBotao}
      </Botao>
    </form>
  );
}
