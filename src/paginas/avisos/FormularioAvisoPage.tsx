import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ErroApi } from '../../api/ApiClient';
import { Botao } from '../../componentes/Botao';
import { Campo } from '../../componentes/Campo';
import { ErroFormulario, EstadoConsulta } from '../../componentes/Estados';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useAlterarAviso, useAviso, useCriarAviso } from '../../hooks/avisosHooks';
import type { Aviso, AvisoCreateRequest, PrioridadeAviso, TipoPublicoAlvo } from '../../tipos/avisos';
import { camposAlterados } from '../../utils/alteracoes';
import { deDataHoraLocal, paraDataHoraLocal } from '../../utils/formatadores';
import { ROTULOS_PRIORIDADE_AVISO, ROTULOS_TIPO_PUBLICO_ALVO } from '../../utils/rotulos';

const OPCOES_PRIORIDADE = Object.entries(ROTULOS_PRIORIDADE_AVISO).map(([valor, rotulo]) => ({ valor, rotulo }));
const OPCOES_PUBLICO = Object.entries(ROTULOS_TIPO_PUBLICO_ALVO).map(([valor, rotulo]) => ({ valor, rotulo }));

interface Valores {
  titulo: string;
  conteudo: string;
  categoria: string;
  prioridade: PrioridadeAviso;
  publicoTipo: TipoPublicoAlvo;
  publicoId: string;
  expiraEm: string;
}

type Erros = Partial<Record<string, string>>;

function validar(valores: Valores, criando: boolean): Erros {
  const erros: Erros = {};
  if (!valores.titulo.trim()) erros.titulo = 'Informe o título.';
  if (!valores.conteudo.trim()) erros.conteudo = 'Informe o conteúdo.';
  if (criando && valores.publicoTipo !== 'condominio') {
    const id = Number(valores.publicoId);
    if (!Number.isInteger(id) || id < 1) {
      erros.publicoId = valores.publicoTipo === 'bloco' ? 'Informe o ID do bloco.' : 'Informe o ID da unidade.';
    }
  }
  return erros;
}

function valoresIniciais(aviso?: Aviso): Valores {
  return {
    titulo: aviso?.titulo ?? '',
    conteudo: aviso?.conteudo ?? '',
    categoria: aviso?.categoria ?? '',
    prioridade: aviso?.prioridade ?? 'normal',
    publicoTipo: aviso?.publicoAlvo?.tipo ?? 'condominio',
    publicoId: '',
    expiraEm: aviso?.expiraEm ? paraDataHoraLocal(aviso.expiraEm) : '',
  };
}

function FormularioAviso({ aviso }: { aviso?: Aviso }) {
  const criando = !aviso;
  const navigate = useNavigate();
  const { mostrarToast } = useToast();
  const criar = useCriarAviso();
  const alterar = useAlterarAviso(aviso?.id ?? 0);
  const envio = criando ? criar : alterar;
  const [valores, setValores] = useState<Valores>(() => valoresIniciais(aviso));
  const [erros, setErros] = useState<Erros>({});
  const erroServidor = envio.error instanceof ErroApi ? envio.error : null;
  const campoPublicoId = valores.publicoTipo === 'bloco' ? 'publicoAlvo.blocoId' : 'publicoAlvo.unidadeId';

  function mudar(campo: keyof Valores, valor: string) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }));
  }

  function erroDe(campo: string, campoServidor = campo): string | undefined {
    return erros[campo] ?? erroServidor?.erroDoCampo(campoServidor);
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const encontrados = validar(valores, criando);
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      return;
    }
    const expiraEm = valores.expiraEm ? deDataHoraLocal(valores.expiraEm) : undefined;
    const campos = {
      titulo: valores.titulo.trim(),
      conteudo: valores.conteudo.trim(),
      categoria: valores.categoria.trim() || undefined,
      prioridade: valores.prioridade,
      expiraEm,
    };

    if (criando) {
      const id = Number(valores.publicoId);
      const dados: AvisoCreateRequest = {
        ...campos,
        publicoAlvo: {
          tipo: valores.publicoTipo,
          blocoId: valores.publicoTipo === 'bloco' ? id : undefined,
          unidadeId: valores.publicoTipo === 'unidade' ? id : undefined,
        },
      };
      criar.mutate(dados, {
        onSuccess: (criado) => {
          mostrarToast('Aviso publicado');
          navigate(`/avisos/${criado.id}`, { replace: true });
        },
      });
      return;
    }

    // edição: só o que mudou (PATCH parcial)
    const original = {
      titulo: aviso.titulo,
      conteudo: aviso.conteudo,
      categoria: aviso.categoria,
      prioridade: aviso.prioridade ?? 'normal',
      expiraEm: aviso.expiraEm ? deDataHoraLocal(paraDataHoraLocal(aviso.expiraEm)) : undefined,
    };
    const alteracoes = camposAlterados(original, campos);
    if (Object.keys(alteracoes).length === 0) {
      mostrarToast('Nada foi alterado.');
      return;
    }
    alterar.mutate(alteracoes, {
      onSuccess: () => {
        mostrarToast('Aviso atualizado');
        navigate(`/avisos/${aviso.id}`, { replace: true });
      },
    });
  }

  return (
    <form onSubmit={enviar} noValidate>
      <Campo id="titulo" rotulo="Título" valor={valores.titulo} aoMudar={(valor) => mudar('titulo', valor)} erro={erroDe('titulo')} obrigatorio />
      <Campo
        id="conteudo"
        rotulo="Conteúdo"
        como="textarea"
        valor={valores.conteudo}
        aoMudar={(valor) => mudar('conteudo', valor)}
        erro={erroDe('conteudo')}
        obrigatorio
      />
      <Campo id="categoria" rotulo="Categoria" valor={valores.categoria} aoMudar={(valor) => mudar('categoria', valor)} erro={erroDe('categoria')} placeholder="ex.: manutencao" />
      <Campo
        id="prioridade"
        rotulo="Prioridade"
        como="select"
        opcoes={OPCOES_PRIORIDADE}
        valor={valores.prioridade}
        aoMudar={(valor) => mudar('prioridade', valor)}
        erro={erroDe('prioridade')}
      />
      {criando && (
        <>
          <Campo
            id="publicoTipo"
            rotulo="Público"
            como="select"
            opcoes={OPCOES_PUBLICO}
            valor={valores.publicoTipo}
            aoMudar={(valor) => mudar('publicoTipo', valor)}
            erro={erroDe('publicoTipo', 'publicoAlvo.tipo')}
          />
          {valores.publicoTipo !== 'condominio' && (
            <Campo
              id="publicoId"
              rotulo={valores.publicoTipo === 'bloco' ? 'ID do bloco' : 'ID da unidade'}
              tipo="number"
              inputMode="numeric"
              min="1"
              valor={valores.publicoId}
              aoMudar={(valor) => mudar('publicoId', valor)}
              erro={erroDe('publicoId', campoPublicoId)}
              ajuda="O app não tem lista de blocos e unidades: informe o número de identificação (ID)."
              obrigatorio
            />
          )}
        </>
      )}
      <Campo
        id="expiraEm"
        rotulo="Expira em"
        tipo="datetime-local"
        valor={valores.expiraEm}
        aoMudar={(valor) => mudar('expiraEm', valor)}
        erro={erroDe('expiraEm')}
        ajuda="Opcional. Sem data, o aviso fica no mural até ser expirado."
      />
      <ErroFormulario erro={erroServidor && erroServidor.erros.length === 0 ? erroServidor : null} />
      <Botao type="submit" carregando={envio.isPending}>
        {criando ? 'Publicar' : 'Salvar alterações'}
      </Botao>
    </form>
  );
}

/** Criar (síndico) ou editar um aviso: a mesma tela, conforme a URL. */
export function FormularioAvisoPage() {
  const { avisoId } = useParams();
  if (!avisoId) {
    return (
      <Tela titulo="Novo aviso" voltarPara="/avisos">
        <FormularioAviso />
      </Tela>
    );
  }
  return <EditarAviso avisoId={Number(avisoId)} />;
}

function EditarAviso({ avisoId }: { avisoId: number }) {
  const consulta = useAviso(avisoId);
  return (
    <Tela titulo="Editar aviso" voltarPara={`/avisos/${avisoId}`}>
      <EstadoConsulta consulta={consulta}>{(aviso) => <FormularioAviso aviso={aviso} />}</EstadoConsulta>
    </Tela>
  );
}
