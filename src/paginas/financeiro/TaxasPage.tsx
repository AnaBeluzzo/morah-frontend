import { useState, type FormEvent } from 'react';
import { ErroApi } from '../../api/ApiClient';
import { Botao } from '../../componentes/Botao';
import { Campo } from '../../componentes/Campo';
import { Cartao, Dado, ListaCartoes } from '../../componentes/Cartao';
import { ErroFormulario } from '../../componentes/Estados';
import { Secao, Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useCriarTaxa, useGerarCobrancas } from '../../hooks/financeiroHooks';
import type { Taxa, TipoRateio } from '../../tipos/financeiro';
import { formatarCompetencia, formatarMoeda } from '../../utils/formatadores';
import { ROTULOS_TIPO_RATEIO } from '../../utils/rotulos';
import estilos from '../paginas.module.css';

const PADRAO_COMPETENCIA = /^\d{4}-\d{2}$/;
const OPCOES_RATEIO = Object.entries(ROTULOS_TIPO_RATEIO).map(([valor, rotulo]) => ({ valor, rotulo }));

type Erros = Partial<Record<'descricao' | 'competencia' | 'valor' | 'tipoRateio' | 'vencimentoDia', string>>;

function FormularioTaxa({ aoCriar }: { aoCriar: (taxa: Taxa) => void }) {
  const criar = useCriarTaxa();
  const { mostrarToast } = useToast();
  const [descricao, setDescricao] = useState('');
  const [competencia, setCompetencia] = useState('');
  const [valor, setValor] = useState('');
  const [tipoRateio, setTipoRateio] = useState<TipoRateio>('igualitario');
  const [vencimentoDia, setVencimentoDia] = useState('10');
  const [erros, setErros] = useState<Erros>({});
  const erroServidor = criar.error instanceof ErroApi ? criar.error : null;

  function erroDe(campo: keyof Erros) {
    return erros[campo] ?? erroServidor?.erroDoCampo(campo);
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const dia = Number(vencimentoDia);
    const encontrados: Erros = {};
    if (!descricao.trim()) encontrados.descricao = 'Informe a descrição.';
    if (!PADRAO_COMPETENCIA.test(competencia)) encontrados.competencia = 'Use o formato AAAA-MM (ex.: 2026-09).';
    if (!(Number(valor) > 0)) encontrados.valor = 'Informe um valor maior que zero.';
    if (!Number.isInteger(dia) || dia < 1 || dia > 28) encontrados.vencimentoDia = 'Escolha um dia de 1 a 28.';
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      return;
    }
    criar.mutate(
      { descricao: descricao.trim(), competencia, valor: Number(valor), tipoRateio, vencimentoDia: dia },
      {
        onSuccess: (taxa) => {
          aoCriar(taxa);
          mostrarToast('Taxa criada');
          setDescricao('');
          setValor('');
        },
      },
    );
  }

  return (
    <form onSubmit={enviar} noValidate aria-label="Nova taxa">
      <Campo id="descricao" rotulo="Descrição" valor={descricao} aoMudar={setDescricao} erro={erroDe('descricao')} obrigatorio />
      <Campo id="competencia" rotulo="Competência" tipo="month" placeholder="AAAA-MM" valor={competencia} aoMudar={setCompetencia} erro={erroDe('competencia')} obrigatorio />
      <Campo id="valor" rotulo="Valor total (R$)" tipo="number" inputMode="decimal" step="0.01" min="0" valor={valor} aoMudar={setValor} erro={erroDe('valor')} obrigatorio />
      <Campo id="tipoRateio" rotulo="Rateio" como="select" opcoes={OPCOES_RATEIO} valor={tipoRateio} aoMudar={(valor) => setTipoRateio(valor as TipoRateio)} erro={erroDe('tipoRateio')} />
      <Campo
        id="vencimentoDia"
        rotulo="Dia do vencimento"
        tipo="number"
        inputMode="numeric"
        min="1"
        max="28"
        valor={vencimentoDia}
        aoMudar={setVencimentoDia}
        erro={erroDe('vencimentoDia')}
        ajuda="De 1 a 28."
        obrigatorio
      />
      <ErroFormulario erro={erroServidor && erroServidor.erros.length === 0 ? erroServidor : null} />
      <Botao type="submit" carregando={criar.isPending}>
        Criar taxa
      </Botao>
    </form>
  );
}

function CartaoTaxa({ taxa }: { taxa: Taxa }) {
  const gerar = useGerarCobrancas();
  const { mostrarToast } = useToast();
  // resultado da última geração desta taxa (totalGeradas e falhas por unidade)
  const resultado = gerar.data;
  return (
    <Cartao rotulo={taxa.descricao}>
      <h3>{taxa.descricao}</h3>
      <dl>
        <Dado rotulo="Competência">{formatarCompetencia(taxa.competencia)}</Dado>
        <Dado rotulo="Valor">{formatarMoeda(taxa.valor)}</Dado>
        <Dado rotulo="Rateio">{taxa.tipoRateio === 'igualitario' ? 'Igualitário' : 'Fração ideal'}</Dado>
        <Dado rotulo="Vencimento">dia {taxa.vencimentoDia}</Dado>
      </dl>
      <ErroFormulario erro={gerar.error} />
      <Botao variante="secundario" carregando={gerar.isPending} onClick={() => gerar.mutate(taxa.id, { onSuccess: (r) => mostrarToast(`${r.totalGeradas} cobranças geradas`) })}>
        Gerar cobranças
      </Botao>
      {resultado && (
        <div aria-label="Resultado da geração" className={estilos.acoes}>
          <p>
            <strong>{resultado.totalGeradas}</strong> cobranças geradas
          </p>
          {resultado.falhas.length > 0 && (
            <>
              <p>Unidades que não puderam ser cobradas:</p>
              <ul>
                {resultado.falhas.map((falha) => (
                  <li key={falha.unidadeId}>
                    Unidade {falha.unidadeId}: {falha.motivo}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </Cartao>
  );
}

/**
 * Taxas e cobranças em lote (síndico). Não há listagem de taxas no contrato: as taxas criadas
 * ficam só na memória desta tela (useState), para oferecer "Gerar cobranças" com o id devolvido.
 */
export function TaxasPage() {
  const [criadas, setCriadas] = useState<Taxa[]>([]);
  return (
    <Tela titulo="Taxas e cobranças" voltarPara="/financeiro">
      <Secao titulo="Nova taxa">
        <FormularioTaxa aoCriar={(taxa) => setCriadas((atuais) => [taxa, ...atuais])} />
      </Secao>
      <Secao titulo="Taxas criadas nesta sessão">
        {criadas.length === 0 ? (
          <p className={estilos.suave}>Crie uma taxa para gerar as cobranças de todas as unidades.</p>
        ) : (
          <ListaCartoes rotulo="Taxas criadas">
            {criadas.map((taxa) => (
              <li key={taxa.id}>
                <CartaoTaxa taxa={taxa} />
              </li>
            ))}
          </ListaCartoes>
        )}
      </Secao>
    </Tela>
  );
}
