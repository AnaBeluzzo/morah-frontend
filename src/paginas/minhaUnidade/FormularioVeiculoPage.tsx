import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ErroApi } from '../../api/ApiClient';
import { Botao } from '../../componentes/Botao';
import { Campo } from '../../componentes/Campo';
import { ErroFormulario, EstadoConsulta, EstadoVazio } from '../../componentes/Estados';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useAlterarVeiculo, useCriarVeiculo, useVeiculos } from '../../hooks/minhaUnidadeHooks';
import type { TipoVeiculo, Veiculo, VeiculoCreateRequest } from '../../tipos/minhaUnidade';
import { camposAlterados } from '../../utils/alteracoes';
import { ROTULOS_TIPO_VEICULO } from '../../utils/rotulos';

// mesmo padrão do contrato: placa antiga (ABC1234) ou Mercosul (ABC1D23), com ou sem hífen
const PADRAO_PLACA = /^[A-Za-z]{3}-?[0-9][A-Za-z0-9][0-9]{2}$/;
const OPCOES_TIPO = Object.entries(ROTULOS_TIPO_VEICULO).map(([valor, rotulo]) => ({ valor, rotulo }));

interface Valores {
  placa: string;
  modelo: string;
  cor: string;
  tipo: TipoVeiculo;
}

const VAZIO: Valores = { placa: '', modelo: '', cor: '', tipo: 'carro' };

/** Corpo no formato do contrato; cor vazia vai como "" (no PATCH, apaga a cor). */
function paraCorpo(valores: Valores): Required<VeiculoCreateRequest> {
  return { placa: valores.placa.trim(), modelo: valores.modelo.trim(), cor: valores.cor.trim(), tipo: valores.tipo };
}

function valoresDo(veiculo: Veiculo): Valores {
  return { placa: veiculo.placa, modelo: veiculo.modelo, cor: veiculo.cor ?? '', tipo: veiculo.tipo };
}

interface FormularioVeiculoProps {
  inicial: Valores;
  textoBotao: string;
  enviando: boolean;
  erroServidor: unknown;
  aoEnviar: (valores: Valores) => void;
}

/** Campos e validação do veículo; quem usa decide se cria ou altera. */
function FormularioVeiculo({ inicial, textoBotao, enviando, erroServidor, aoEnviar }: FormularioVeiculoProps) {
  const [valores, setValores] = useState(inicial);
  const [erros, setErros] = useState<Partial<Record<keyof Valores, string>>>({});
  const erroApi = erroServidor instanceof ErroApi ? erroServidor : null;

  function mudar(campo: keyof Valores, valor: string) {
    setValores({ ...valores, [campo]: valor });
  }

  function erroDe(campo: keyof Valores) {
    return erros[campo] ?? erroApi?.erroDoCampo(campo);
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const encontrados: Partial<Record<keyof Valores, string>> = {};
    if (!PADRAO_PLACA.test(valores.placa.trim())) encontrados.placa = 'Informe a placa no formato ABC1234 ou ABC1D23.';
    if (!valores.modelo.trim()) encontrados.modelo = 'Informe o modelo.';
    setErros(encontrados);
    if (Object.keys(encontrados).length === 0) {
      aoEnviar(valores);
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <Campo id="placa" rotulo="Placa" valor={valores.placa} aoMudar={(v) => mudar('placa', v)} erro={erroDe('placa')} maxLength={8} placeholder="ABC1D23" obrigatorio />
      <Campo id="modelo" rotulo="Modelo" valor={valores.modelo} aoMudar={(v) => mudar('modelo', v)} erro={erroDe('modelo')} maxLength={60} placeholder="ex.: Fiat Argo" obrigatorio />
      <Campo id="cor" rotulo="Cor" valor={valores.cor} aoMudar={(v) => mudar('cor', v)} erro={erroDe('cor')} maxLength={30} ajuda="Opcional." />
      <Campo id="tipo" rotulo="Tipo" como="select" opcoes={OPCOES_TIPO} valor={valores.tipo} aoMudar={(v) => mudar('tipo', v)} erro={erroDe('tipo')} obrigatorio />
      {/* erros sem campo (409 de placa repetida, 404...) aparecem aqui; os de campo, embaixo de cada campo */}
      <ErroFormulario erro={erroApi && erroApi.erros.length === 0 ? erroApi : null} />
      <Botao type="submit" carregando={enviando}>
        {textoBotao}
      </Botao>
    </form>
  );
}

export function NovoVeiculoPage() {
  const navigate = useNavigate();
  const { mostrarToast } = useToast();
  const criar = useCriarVeiculo();

  function salvar(valores: Valores) {
    const corpo = paraCorpo(valores);
    criar.mutate(
      { ...corpo, cor: corpo.cor || undefined },
      {
        onSuccess: () => {
          mostrarToast('Veículo cadastrado');
          navigate('/unidade/veiculos', { replace: true });
        },
      },
    );
  }

  return (
    <Tela titulo="Cadastrar veículo" voltarPara="/unidade/veiculos">
      <FormularioVeiculo inicial={VAZIO} textoBotao="Cadastrar" enviando={criar.isPending} erroServidor={criar.error} aoEnviar={salvar} />
    </Tela>
  );
}

/** O PATCH leva só os campos que mudaram; os dados vêm da lista (não há GET de um veículo). */
export function EditarVeiculoPage() {
  const veiculoId = Number(useParams().veiculoId);
  const navigate = useNavigate();
  const { mostrarToast } = useToast();
  const consulta = useVeiculos();
  const alterar = useAlterarVeiculo(veiculoId);

  function salvar(veiculo: Veiculo, valores: Valores) {
    const alteracoes = camposAlterados(paraCorpo(valoresDo(veiculo)), paraCorpo(valores));
    if (Object.keys(alteracoes).length === 0) {
      mostrarToast('Nada foi alterado.');
      return;
    }
    alterar.mutate(alteracoes, {
      onSuccess: () => {
        mostrarToast('Veículo atualizado');
        navigate('/unidade/veiculos', { replace: true });
      },
    });
  }

  return (
    <Tela titulo="Editar veículo" voltarPara="/unidade/veiculos">
      <EstadoConsulta consulta={consulta}>
        {(lista) => {
          const veiculo = lista.find((item) => item.id === veiculoId);
          if (!veiculo) {
            return <EstadoVazio mensagem="Veículo não encontrado nesta unidade." />;
          }
          return (
            <FormularioVeiculo
              inicial={valoresDo(veiculo)}
              textoBotao="Salvar alterações"
              enviando={alterar.isPending}
              erroServidor={alterar.error}
              aoEnviar={(valores) => salvar(veiculo, valores)}
            />
          );
        }}
      </EstadoConsulta>
    </Tela>
  );
}
