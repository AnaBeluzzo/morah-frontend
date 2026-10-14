import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router';
import { ErroApi } from '../../api/ApiClient';
import { Botao, BotaoLink } from '../../componentes/Botao';
import { BottomSheet } from '../../componentes/BottomSheet';
import { Campo } from '../../componentes/Campo';
import { Cartao, Dado } from '../../componentes/Cartao';
import { ErroFormulario, EstadoConsulta } from '../../componentes/Estados';
import { Selo } from '../../componentes/Selo';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useContextoAtivo } from '../../contexto/SessaoContext';
import { useBaixarCobrancaManualmente, useCobranca } from '../../hooks/financeiroHooks';
import type { Cobranca } from '../../tipos/financeiro';
import { deDataHoraLocal, formatarCompetencia, formatarData, formatarMoeda, paraDataHoraLocal } from '../../utils/formatadores';
import { ROTULOS_MEIO_PAGAMENTO, ROTULOS_STATUS_COBRANCA, TOM_STATUS_COBRANCA } from '../../utils/rotulos';
import estilos from '../paginas.module.css';

const OPCOES_MEIO = Object.entries(ROTULOS_MEIO_PAGAMENTO).map(([valor, rotulo]) => ({ valor, rotulo }));

/** Cobrança ainda pode ser paga (PIX ou baixa) só enquanto pendente ou atrasada. */
function emAberto(cobranca: Cobranca): boolean {
  return cobranca.status === 'pendente' || cobranca.status === 'atrasado';
}

interface ErrosBaixa {
  meio?: string;
  valor?: string;
  pagoEm?: string;
}

/** Baixa manual (síndico): meio, valor e pagoEm são obrigatórios no contrato. */
function FormularioBaixa({ cobranca, aoConcluir }: { cobranca: Cobranca; aoConcluir: () => void }) {
  const baixa = useBaixarCobrancaManualmente(cobranca.id);
  const { mostrarToast } = useToast();
  const [meio, setMeio] = useState('transferencia');
  const [valor, setValor] = useState(String(cobranca.valorTotal));
  const [pagoEm, setPagoEm] = useState(() => paraDataHoraLocal(new Date().toISOString()));
  const [observacao, setObservacao] = useState('');
  const [erros, setErros] = useState<ErrosBaixa>({});
  const erroServidor = baixa.error instanceof ErroApi ? baixa.error : null;

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const encontrados: ErrosBaixa = {};
    if (!meio) encontrados.meio = 'Informe o meio de pagamento.';
    if (!(Number(valor) > 0)) encontrados.valor = 'Informe um valor maior que zero.';
    if (!pagoEm) encontrados.pagoEm = 'Informe quando foi pago.';
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      return;
    }
    baixa.mutate(
      { meio, valor: Number(valor), pagoEm: deDataHoraLocal(pagoEm), observacao: observacao.trim() || undefined },
      {
        onSuccess: () => {
          mostrarToast('Baixa registrada: cobrança paga');
          aoConcluir();
        },
      },
    );
  }

  return (
    <form onSubmit={enviar} noValidate>
      <Campo id="meio" rotulo="Meio de pagamento" como="select" opcoes={OPCOES_MEIO} valor={meio} aoMudar={setMeio} erro={erros.meio ?? erroServidor?.erroDoCampo('meio')} obrigatorio />
      <Campo
        id="valor"
        rotulo="Valor pago (R$)"
        tipo="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        valor={valor}
        aoMudar={setValor}
        erro={erros.valor ?? erroServidor?.erroDoCampo('valor')}
        obrigatorio
      />
      <Campo id="pagoEm" rotulo="Pago em" tipo="datetime-local" valor={pagoEm} aoMudar={setPagoEm} erro={erros.pagoEm ?? erroServidor?.erroDoCampo('pagoEm')} obrigatorio />
      <Campo id="observacao" rotulo="Observação" como="textarea" valor={observacao} aoMudar={setObservacao} erro={erroServidor?.erroDoCampo('observacao')} />
      <ErroFormulario erro={erroServidor && erroServidor.erros.length === 0 ? erroServidor : null} />
      <Botao type="submit" carregando={baixa.isPending}>
        Confirmar baixa
      </Botao>
    </form>
  );
}

export function DetalheCobrancaPage() {
  const cobrancaId = Number(useParams().cobrancaId);
  const { perfil } = useContextoAtivo();
  const consulta = useCobranca(cobrancaId);
  const [baixando, setBaixando] = useState(false);

  return (
    <Tela titulo="Cobrança" voltarPara="/financeiro">
      <EstadoConsulta consulta={consulta}>
        {(cobranca) => (
          <>
            <Cartao destaque={cobranca.status === 'atrasado'}>
              <div className={estilos.linha}>
                <h2>{cobranca.taxaDescricao ?? 'Cobrança'}</h2>
                <Selo tom={TOM_STATUS_COBRANCA[cobranca.status]}>{ROTULOS_STATUS_COBRANCA[cobranca.status]}</Selo>
              </div>
              <p className={estilos.valor}>{formatarMoeda(cobranca.valorTotal)}</p>
              <dl>
                <Dado rotulo="Valor original">{formatarMoeda(cobranca.valorOriginal)}</Dado>
                <Dado rotulo="Multa">{formatarMoeda(cobranca.multa)}</Dado>
                <Dado rotulo="Juros">{formatarMoeda(cobranca.juros)}</Dado>
                <Dado rotulo="Total">{formatarMoeda(cobranca.valorTotal)}</Dado>
                <Dado rotulo="Competência">{formatarCompetencia(cobranca.competencia)}</Dado>
                <Dado rotulo="Vencimento">{formatarData(cobranca.vencimento)}</Dado>
                <Dado rotulo="Unidade (ID)">{cobranca.unidadeId}</Dado>
              </dl>
            </Cartao>
            {emAberto(cobranca) && perfil !== 'sindico' && <BotaoLink para={`/financeiro/cobrancas/${cobranca.id}/pix`}>Pagar com PIX</BotaoLink>}
            {emAberto(cobranca) && perfil === 'sindico' && <Botao onClick={() => setBaixando(true)}>Dar baixa manual</Botao>}
            <BottomSheet aberto={baixando} titulo="Baixa manual" aoFechar={() => setBaixando(false)}>
              <FormularioBaixa cobranca={cobranca} aoConcluir={() => setBaixando(false)} />
            </BottomSheet>
          </>
        )}
      </EstadoConsulta>
    </Tela>
  );
}
