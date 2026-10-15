import { useState, type FormEvent } from 'react';
import { ErroApi } from '../../api/ApiClient';
import { Botao, BotaoLink } from '../../componentes/Botao';
import { Campo } from '../../componentes/Campo';
import { Cartao } from '../../componentes/Cartao';
import { ErroFormulario } from '../../componentes/Estados';
import { Selo } from '../../componentes/Selo';
import { Tela } from '../../componentes/Tela';
import { useSolicitarVinculo } from '../../hooks/minhaUnidadeHooks';
import type { TipoVinculo } from '../../tipos/minhaUnidade';
import { ROTULOS_STATUS_SOLICITACAO_VINCULO, ROTULOS_TIPO_VINCULO, TOM_STATUS_SOLICITACAO_VINCULO } from '../../utils/rotulos';
import estilos from '../paginas.module.css';

const OPCOES_TIPO = Object.entries(ROTULOS_TIPO_VINCULO).map(([valor, rotulo]) => ({ valor, rotulo }));

/** Pede a inclusão de um vínculo (ex.: dependente); o síndico aprova ou rejeita depois. */
export function SolicitarVinculoPage() {
  const solicitar = useSolicitarVinculo();
  const [tipoVinculo, setTipoVinculo] = useState<TipoVinculo>('dependente');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erroNome, setErroNome] = useState<string>();
  const erroServidor = solicitar.error instanceof ErroApi ? solicitar.error : null;

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!nome.trim()) {
      setErroNome('Informe o nome.');
      return;
    }
    setErroNome(undefined);
    solicitar.mutate({ tipoVinculo, nome: nome.trim(), cpf: cpf.trim() || undefined, observacao: observacao.trim() || undefined });
  }

  const enviada = solicitar.data;
  if (enviada) {
    return (
      <Tela titulo="Solicitar vínculo" voltarPara="/unidade">
        <Cartao rotulo="Solicitação enviada">
          <h2>Solicitação enviada</h2>
          <p>
            {enviada.nomeSolicitado} ({ROTULOS_TIPO_VINCULO[enviada.tipoVinculo]})
          </p>
          <Selo tom={TOM_STATUS_SOLICITACAO_VINCULO[enviada.status]}>{ROTULOS_STATUS_SOLICITACAO_VINCULO[enviada.status]}</Selo>
        </Cartao>
        <div className={estilos.acoes}>
          <BotaoLink para="/unidade">Voltar para minha unidade</BotaoLink>
          <Botao variante="secundario" onClick={() => solicitar.reset()}>
            Fazer outra solicitação
          </Botao>
        </div>
      </Tela>
    );
  }

  return (
    <Tela titulo="Solicitar vínculo" voltarPara="/unidade">
      <form onSubmit={enviar} noValidate>
        <Campo
          id="tipoVinculo"
          rotulo="Tipo de vínculo"
          como="select"
          opcoes={OPCOES_TIPO}
          valor={tipoVinculo}
          aoMudar={(valor) => setTipoVinculo(valor as TipoVinculo)}
          erro={erroServidor?.erroDoCampo('tipoVinculo')}
          obrigatorio
        />
        <Campo id="nome" rotulo="Nome" autoComplete="name" valor={nome} aoMudar={setNome} erro={erroNome ?? erroServidor?.erroDoCampo('nome')} obrigatorio />
        <Campo id="cpf" rotulo="CPF" inputMode="numeric" valor={cpf} aoMudar={setCpf} erro={erroServidor?.erroDoCampo('cpf')} ajuda="Opcional." />
        <Campo id="observacao" rotulo="Observação" como="textarea" valor={observacao} aoMudar={setObservacao} erro={erroServidor?.erroDoCampo('observacao')} />
        <ErroFormulario erro={erroServidor && erroServidor.erros.length === 0 ? erroServidor : null} />
        <Botao type="submit" carregando={solicitar.isPending}>
          Enviar solicitação
        </Botao>
      </form>
    </Tela>
  );
}
