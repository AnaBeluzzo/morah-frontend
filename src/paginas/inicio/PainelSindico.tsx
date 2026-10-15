import { Link } from 'react-router';
import { Cartao, ListaCartoes } from '../../componentes/Cartao';
import { useTema } from '../../contexto/TemaContext';
import type { DashboardSindico } from '../../tipos/dashboard';
import { formatarData, formatarMoeda, formatarPercentual } from '../../utils/formatadores';
import estilos from './Inicio.module.css';
import { NadaPendente, SecaoPainel } from './SecaoPainel';

/** Painel do síndico: inadimplência, avisos publicados, solicitações e ocorrências. */
export function PainelSindico({ painel }: { painel: DashboardSindico }) {
  const { moduloAtivo } = useTema();
  const avisos = painel.avisosPublicadosRecentes ?? [];

  return (
    <>
      {/* `inadimplencia` vem ausente quando o Financeiro está desligado */}
      {painel.inadimplencia && moduloAtivo('financeiro') && (
        <SecaoPainel titulo="Inadimplência" para="/financeiro/inadimplencia">
          <div className={estilos.numeros}>
            <div className={estilos.numero}>
              <strong>{formatarPercentual(painel.inadimplencia.percentualInadimplencia)}</strong>
              das unidades com boleto atrasado
            </div>
            <div className={estilos.numero}>
              <strong>{formatarMoeda(painel.inadimplencia.valorTotalEmAberto)}</strong>
              em aberto
            </div>
          </div>
        </SecaoPainel>
      )}

      <SecaoPainel titulo="Pendências">
        <div className={estilos.numeros}>
          {moduloAtivo('minha_unidade') && (
            <Link to="/unidades" className={estilos.numero} aria-label={`${painel.solicitacoesVinculoPendentes ?? 0} solicitações de vínculo pendentes`}>
              <strong>{painel.solicitacoesVinculoPendentes ?? 0}</strong>
              solicitações de vínculo
            </Link>
          )}
          {/* ocorrências não pertencem a um só módulo: sempre aparecem */}
          <div className={estilos.numero} aria-label={`${painel.ocorrenciasAbertas ?? 0} ocorrências abertas`}>
            <strong>{painel.ocorrenciasAbertas ?? 0}</strong>
            ocorrências abertas
          </div>
        </div>
      </SecaoPainel>

      {moduloAtivo('avisos') && (
        <SecaoPainel titulo="Avisos publicados" para="/avisos">
          {avisos.length === 0 ? (
            <NadaPendente>Nenhum aviso vigente. Publique um pelo mural.</NadaPendente>
          ) : (
            <ListaCartoes rotulo="Avisos publicados">
              {avisos.map((aviso) => (
                <li key={aviso.id}>
                  <Cartao para={`/avisos/${aviso.id}`} destaque={aviso.prioridade === 'urgente'} rotulo={aviso.titulo}>
                    <strong>{aviso.titulo}</strong>
                    <p>Publicado em {formatarData(aviso.publicadoEm)}</p>
                  </Cartao>
                </li>
              ))}
            </ListaCartoes>
          )}
        </SecaoPainel>
      )}
    </>
  );
}
