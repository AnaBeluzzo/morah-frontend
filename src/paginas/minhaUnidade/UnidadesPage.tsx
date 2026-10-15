import { useState, type FormEvent } from 'react';
import { ErroApi } from '../../api/ApiClient';
import { Botao } from '../../componentes/Botao';
import { DialogoConfirmacao } from '../../componentes/BottomSheet';
import { Campo } from '../../componentes/Campo';
import { Cartao, ListaCartoes } from '../../componentes/Cartao';
import { ErroFormulario, EstadoConsulta, EstadoVazio } from '../../componentes/Estados';
import { Secao, Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useDecidirSolicitacaoVinculo, useSolicitacoesVinculo, useUnidade } from '../../hooks/minhaUnidadeHooks';
import type { DecisaoSolicitacaoVinculo, SolicitacaoVinculo } from '../../tipos/minhaUnidade';
import { formatarDataHora } from '../../utils/formatadores';
import { ROTULOS_TIPO_VINCULO } from '../../utils/rotulos';
import estilos from '../paginas.module.css';
import { DadosUnidade } from './MinhaUnidadePage';

interface Decisao {
  solicitacao: SolicitacaoVinculo;
  decisao: DecisaoSolicitacaoVinculo;
}

function SolicitacoesDaUnidade({ unidadeId }: { unidadeId: number }) {
  const consulta = useSolicitacoesVinculo(unidadeId);
  const decidir = useDecidirSolicitacaoVinculo(unidadeId);
  const { mostrarToast } = useToast();
  const [decisao, setDecisao] = useState<Decisao | null>(null);
  const [justificativa, setJustificativa] = useState('');

  function confirmar() {
    if (!decisao) return;
    decidir.mutate(
      { solicitacaoId: decisao.solicitacao.id, decisao: decisao.decisao, justificativa: justificativa.trim() || undefined },
      {
        onSuccess: (resultado) => mostrarToast(resultado.status === 'aprovada' ? 'Solicitação aprovada' : 'Solicitação rejeitada'),
        // 409 (já decidida em outro lugar): a mensagem do servidor aparece acima da lista
        onSettled: () => {
          setDecisao(null);
          setJustificativa('');
        },
      },
    );
  }

  return (
    <Secao titulo="Solicitações de vínculo pendentes">
      <ErroFormulario erro={decidir.error} />
      <EstadoConsulta consulta={consulta} vazio={(lista) => lista.length === 0} mensagemVazio="Nenhuma solicitação pendente nesta unidade.">
        {(lista) => (
          <ListaCartoes rotulo="Solicitações">
            {lista.map((solicitacao) => (
              <li key={solicitacao.id}>
                <Cartao rotulo={solicitacao.nomeSolicitado}>
                  <strong>{solicitacao.nomeSolicitado}</strong>
                  <p className={estilos.suave}>
                    {ROTULOS_TIPO_VINCULO[solicitacao.tipoVinculo]}, pedido em {formatarDataHora(solicitacao.solicitadoEm)}
                  </p>
                  <div className={estilos.grade}>
                    <Botao onClick={() => setDecisao({ solicitacao, decisao: 'aprovada' })}>Aprovar</Botao>
                    <Botao variante="secundario" onClick={() => setDecisao({ solicitacao, decisao: 'rejeitada' })}>
                      Rejeitar
                    </Botao>
                  </div>
                </Cartao>
              </li>
            ))}
          </ListaCartoes>
        )}
      </EstadoConsulta>
      <DialogoConfirmacao
        aberto={decisao !== null}
        titulo={decisao?.decisao === 'aprovada' ? 'Aprovar solicitação?' : 'Rejeitar solicitação?'}
        mensagem={
          <Campo id="justificativa" rotulo="Justificativa" como="textarea" valor={justificativa} aoMudar={setJustificativa} ajuda={`Opcional. Pedido de ${decisao?.solicitacao.nomeSolicitado ?? ''}.`} />
        }
        textoConfirmar={decisao?.decisao === 'aprovada' ? 'Aprovar' : 'Rejeitar'}
        perigo={decisao?.decisao === 'rejeitada'}
        enviando={decidir.isPending}
        aoConfirmar={confirmar}
        aoCancelar={() => setDecisao(null)}
      />
    </Secao>
  );
}

/**
 * Administração de unidades (síndico). O contrato não tem listagem de unidades, então o síndico
 * informa o ID da unidade; 404 vira "Unidade não encontrada".
 */
export function UnidadesPage() {
  const [idDigitado, setIdDigitado] = useState('');
  const [erroId, setErroId] = useState<string>();
  const [unidadeId, setUnidadeId] = useState<number | null>(null);
  const unidade = useUnidade(unidadeId);
  const naoEncontrada = unidade.error instanceof ErroApi && unidade.error.status === 404;

  function buscar(evento: FormEvent) {
    evento.preventDefault();
    const id = Number(idDigitado);
    if (!Number.isInteger(id) || id < 1) {
      setErroId('Informe um ID de unidade válido.');
      return;
    }
    setErroId(undefined);
    setUnidadeId(id);
  }

  return (
    <Tela titulo="Unidades" voltarPara="/mais">
      <form onSubmit={buscar} noValidate role="search" aria-label="Buscar unidade">
        <Campo
          id="unidadeId"
          rotulo="ID da unidade"
          tipo="number"
          inputMode="numeric"
          min="1"
          valor={idDigitado}
          aoMudar={setIdDigitado}
          erro={erroId}
          ajuda="O app não tem lista de unidades: informe o número de identificação (ID)."
        />
        <Botao type="submit" variante="secundario">
          Buscar
        </Botao>
      </form>
      {unidadeId !== null &&
        (naoEncontrada ? (
          <EstadoVazio mensagem="Unidade não encontrada." />
        ) : (
          <EstadoConsulta consulta={unidade}>
            {(dados) => (
              <>
                <DadosUnidade unidade={dados} />
                <SolicitacoesDaUnidade key={dados.id} unidadeId={dados.id} />
              </>
            )}
          </EstadoConsulta>
        ))}
    </Tela>
  );
}
