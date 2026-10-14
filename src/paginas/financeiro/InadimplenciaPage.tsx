import { EstadoConsulta } from '../../componentes/Estados';
import { Tela } from '../../componentes/Tela';
import { useInadimplencia } from '../../hooks/financeiroHooks';
import { formatarMoeda, formatarPercentual } from '../../utils/formatadores';
import estilos from '../paginas.module.css';

/** Resumo de inadimplência: unidade inadimplente = tem ao menos uma cobrança atrasada. */
export function InadimplenciaPage() {
  const consulta = useInadimplencia();
  return (
    <Tela titulo="Inadimplência" voltarPara="/financeiro">
      <EstadoConsulta consulta={consulta}>
        {(resumo) => (
          <div className={estilos.grade}>
            <section className={estilos.indicador} aria-label="Percentual de inadimplência">
              <strong>{formatarPercentual(resumo.percentualInadimplencia)}</strong>
              inadimplência
            </section>
            <section className={estilos.indicador} aria-label="Valor em aberto">
              <strong>{formatarMoeda(resumo.valorTotalEmAberto)}</strong>
              em aberto
            </section>
            <section className={estilos.indicador} aria-label="Unidades inadimplentes">
              <strong>{resumo.unidadesInadimplentes}</strong>
              unidades inadimplentes
            </section>
            <section className={estilos.indicador} aria-label="Total de unidades">
              <strong>{resumo.totalUnidades}</strong>
              unidades no total
            </section>
          </div>
        )}
      </EstadoConsulta>
    </Tela>
  );
}
