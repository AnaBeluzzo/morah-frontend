import { EstadoConsulta } from '../../componentes/Estados';
import { Tela } from '../../componentes/Tela';
import { useDashboard } from '../../hooks/dashboardHooks';
import { PainelMorador } from './PainelMorador';
import { PainelPortaria } from './PainelPortaria';
import { PainelSindico } from './PainelSindico';

/** Tela inicial: o servidor manda um formato por perfil e o campo `perfil` diz qual é. */
export function InicioPage() {
  const consulta = useDashboard();
  return (
    <Tela titulo="Início">
      <EstadoConsulta consulta={consulta}>
        {(painel) => {
          if (painel.perfil === 'sindico') return <PainelSindico painel={painel} />;
          if (painel.perfil === 'portaria') return <PainelPortaria painel={painel} />;
          // morador e proprietário usam o mesmo painel
          return <PainelMorador painel={painel} />;
        }}
      </EstadoConsulta>
    </Tela>
  );
}
