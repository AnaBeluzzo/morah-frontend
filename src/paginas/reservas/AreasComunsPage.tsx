import { BotaoLink } from '../../componentes/Botao';
import { Cartao, ListaCartoes } from '../../componentes/Cartao';
import { EstadoConsulta } from '../../componentes/Estados';
import { Tela } from '../../componentes/Tela';
import { useContextoAtivo } from '../../contexto/SessaoContext';
import { useAreasComuns } from '../../hooks/reservasHooks';
import { formatarMoeda } from '../../utils/formatadores';
import estilos from '../paginas.module.css';

/** Áreas comuns do condomínio, com capacidade e taxa; o morador reserva daqui. */
export function AreasComunsPage() {
  const { perfil } = useContextoAtivo();
  const podeReservar = perfil === 'morador' || perfil === 'proprietario';
  const consulta = useAreasComuns();

  return (
    <Tela titulo="Áreas comuns" voltarPara="/reservas">
      <EstadoConsulta consulta={consulta} vazio={(areas) => areas.length === 0} mensagemVazio="Nenhuma área comum cadastrada.">
        {(areas) => (
          <ListaCartoes rotulo="Áreas comuns">
            {areas.map((area) => (
              <li key={area.id}>
                <Cartao rotulo={area.nome}>
                  <h2>{area.nome}</h2>
                  {area.descricao && <p>{area.descricao}</p>}
                  <p className={estilos.suave}>
                    {area.capacidade !== undefined ? `Até ${area.capacidade} pessoas` : 'Capacidade não informada'}
                    {area.taxa !== undefined ? `, taxa de ${formatarMoeda(area.taxa)}` : ''}
                  </p>
                  {podeReservar && <BotaoLink para={`/reservas/areas/${area.id}/reservar`}>Reservar</BotaoLink>}
                </Cartao>
              </li>
            ))}
          </ListaCartoes>
        )}
      </EstadoConsulta>
    </Tela>
  );
}
