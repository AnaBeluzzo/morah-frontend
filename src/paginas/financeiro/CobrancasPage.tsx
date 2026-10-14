import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { Botao, BotaoLink } from '../../componentes/Botao';
import { BotaoCarregarMais } from '../../componentes/BotaoCarregarMais';
import { Campo } from '../../componentes/Campo';
import { Cartao, ListaCartoes } from '../../componentes/Cartao';
import { EstadoConsulta } from '../../componentes/Estados';
import { Selo } from '../../componentes/Selo';
import { Tela } from '../../componentes/Tela';
import { useContextoAtivo } from '../../contexto/SessaoContext';
import { useCobrancas } from '../../hooks/financeiroHooks';
import { itensDasPaginas } from '../../hooks/paginacao';
import type { FiltrosCobrancas, StatusCobranca } from '../../tipos/financeiro';
import { formatarCompetencia, formatarData, formatarMoeda } from '../../utils/formatadores';
import { ROTULOS_STATUS_COBRANCA, TOM_STATUS_COBRANCA } from '../../utils/rotulos';
import estilos from '../paginas.module.css';

const PADRAO_COMPETENCIA = /^\d{4}-\d{2}$/;
const OPCOES_STATUS = [{ valor: '', rotulo: 'Todos' }, ...Object.entries(ROTULOS_STATUS_COBRANCA).map(([valor, rotulo]) => ({ valor, rotulo }))];

/** Aba Financeiro: atalhos do módulo e a lista de cobranças (da unidade, ou do condomínio para o síndico). */
export function CobrancasPage() {
  const { perfil } = useContextoAtivo();
  const sindico = perfil === 'sindico';
  // filtros ficam na URL: ao voltar do detalhe da cobrança, a lista volta filtrada
  const [parametros, setParametros] = useSearchParams();
  const filtros: FiltrosCobrancas = {
    status: (parametros.get('status') ?? '') as StatusCobranca | '',
    competencia: parametros.get('competencia') ?? undefined,
    unidadeId: parametros.get('unidadeId') ? Number(parametros.get('unidadeId')) : undefined,
  };
  const [competencia, setCompetencia] = useState(filtros.competencia ?? '');
  const [unidadeId, setUnidadeId] = useState(parametros.get('unidadeId') ?? '');
  const [erroCompetencia, setErroCompetencia] = useState<string>();
  const consulta = useCobrancas(filtros);

  function aplicar(novos: Record<string, string>) {
    const proximos = new URLSearchParams(parametros);
    for (const [nome, valor] of Object.entries(novos)) {
      if (valor) proximos.set(nome, valor);
      else proximos.delete(nome);
    }
    setParametros(proximos, { replace: true });
  }
  const cobrancas = itensDasPaginas(consulta.data);

  function filtrar(evento: FormEvent) {
    evento.preventDefault();
    if (competencia && !PADRAO_COMPETENCIA.test(competencia)) {
      setErroCompetencia('Use o formato AAAA-MM (ex.: 2026-09).');
      return;
    }
    setErroCompetencia(undefined);
    aplicar({ competencia, unidadeId });
  }

  return (
    <Tela titulo="Financeiro">
      <nav aria-label="Atalhos do financeiro" className={estilos.grade}>
        <BotaoLink para="/financeiro/documentos" variante="secundario">
          Documentos
        </BotaoLink>
        {sindico && (
          <>
            <BotaoLink para="/financeiro/inadimplencia" variante="secundario">
              Inadimplência
            </BotaoLink>
            <BotaoLink para="/financeiro/taxas" variante="secundario">
              Taxas e cobranças em lote
            </BotaoLink>
          </>
        )}
      </nav>

      <details className={estilos.filtros}>
        <summary>Filtros</summary>
        <form onSubmit={filtrar} aria-label="Filtrar cobranças" noValidate>
          <Campo
            id="filtroStatus"
            rotulo="Status"
            como="select"
            opcoes={OPCOES_STATUS}
            valor={filtros.status ?? ''}
            aoMudar={(valor) => aplicar({ status: valor })}
          />
          <Campo id="filtroCompetencia" rotulo="Competência" tipo="month" valor={competencia} aoMudar={setCompetencia} erro={erroCompetencia} placeholder="AAAA-MM" />
          {sindico && (
            <Campo id="filtroUnidade" rotulo="ID da unidade" tipo="number" inputMode="numeric" min="1" valor={unidadeId} aoMudar={setUnidadeId} ajuda="Deixe vazio para ver o condomínio todo." />
          )}
          <Botao type="submit" variante="secundario">
            Filtrar
          </Botao>
        </form>
      </details>

      <h2>Cobranças</h2>
      <EstadoConsulta consulta={consulta} vazio={() => cobrancas.length === 0} mensagemVazio="Nenhuma cobrança encontrada.">
        {() => (
          <>
            <ListaCartoes rotulo="Cobranças">
              {cobrancas.map((cobranca) => (
                <li key={cobranca.id}>
                  <Cartao para={`/financeiro/cobrancas/${cobranca.id}`} destaque={cobranca.status === 'atrasado'} rotulo={`Cobrança ${formatarCompetencia(cobranca.competencia)} unidade ${cobranca.unidadeId}`}>
                    <div className={estilos.linha}>
                      <strong>{cobranca.taxaDescricao ?? 'Cobrança'}</strong>
                      <Selo tom={TOM_STATUS_COBRANCA[cobranca.status]}>{ROTULOS_STATUS_COBRANCA[cobranca.status]}</Selo>
                    </div>
                    <p className={estilos.valor}>{formatarMoeda(cobranca.valorTotal)}</p>
                    <p className={estilos.suave}>
                      Competência {formatarCompetencia(cobranca.competencia)} · vence {formatarData(cobranca.vencimento)}
                      {sindico ? ` · unidade ${cobranca.unidadeId}` : ''}
                    </p>
                  </Cartao>
                </li>
              ))}
            </ListaCartoes>
            <BotaoCarregarMais temMais={consulta.hasNextPage} carregando={consulta.isFetchingNextPage} aoCarregar={() => consulta.fetchNextPage()} />
          </>
        )}
      </EstadoConsulta>
    </Tela>
  );
}
