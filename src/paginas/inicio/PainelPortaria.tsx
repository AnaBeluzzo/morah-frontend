import { Link } from 'react-router';
import { Cartao, ListaCartoes } from '../../componentes/Cartao';
import { useTema } from '../../contexto/TemaContext';
import type { DashboardPortaria } from '../../tipos/dashboard';
import { formatarDataHora, formatarHora } from '../../utils/formatadores';
import estilos from './Inicio.module.css';
import { NadaPendente, SecaoPainel } from './SecaoPainel';

/** Painel da portaria: visitas esperando resposta, reservas do dia e encomendas de hoje. */
export function PainelPortaria({ painel }: { painel: DashboardPortaria }) {
  const { moduloAtivo } = useTema();
  const visitas = painel.autorizacoesPendentes ?? [];
  const reservas = painel.reservasDoDia ?? [];

  return (
    <>
      {moduloAtivo('encomendas') && (
        <Link to="/encomendas" className={estilos.numero} aria-label={`${painel.encomendasRecebidasHoje ?? 0} encomendas recebidas hoje`}>
          <strong>{painel.encomendasRecebidasHoje ?? 0}</strong>
          encomendas recebidas hoje
        </Link>
      )}

      {moduloAtivo('portaria') && (
        <SecaoPainel titulo="Esperando a unidade responder" para="/visitantes">
          {visitas.length === 0 ? (
            <NadaPendente>Nenhuma visita aguardando autorização.</NadaPendente>
          ) : (
            <ListaCartoes rotulo="Visitas pendentes">
              {visitas.map((visita) => (
                <li key={visita.id}>
                  <Cartao para={`/visitantes/${visita.id}`} destaque rotulo={visita.visitante.nome}>
                    <strong>{visita.visitante.nome}</strong>
                    <p>
                      Unidade {visita.unidadeId}, desde {formatarDataHora(visita.solicitadoEm)}
                    </p>
                  </Cartao>
                </li>
              ))}
            </ListaCartoes>
          )}
        </SecaoPainel>
      )}

      {moduloAtivo('reservas') && (
        <SecaoPainel titulo="Reservas de hoje" para="/reservas">
          {reservas.length === 0 ? (
            <NadaPendente>Nenhuma área reservada hoje.</NadaPendente>
          ) : (
            <ListaCartoes rotulo="Reservas de hoje">
              {reservas.map((reserva) => (
                <li key={reserva.id}>
                  <Cartao para={`/reservas/${reserva.id}`} rotulo={`Reserva ${reserva.areaComumNome ?? ''} unidade ${reserva.unidadeId}`}>
                    <strong>{reserva.areaComumNome ?? 'Área comum'}</strong>
                    <p>
                      Das {formatarHora(reserva.inicio)} às {formatarHora(reserva.fim)}, unidade {reserva.unidadeId}
                    </p>
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
