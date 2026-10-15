import { Link } from 'react-router';
import { Cartao, ListaCartoes } from '../../componentes/Cartao';
import { Selo } from '../../componentes/Selo';
import { useTema } from '../../contexto/TemaContext';
import type { DashboardMorador } from '../../tipos/dashboard';
import { formatarData, formatarDataHora, formatarMoeda, formatarPeriodo } from '../../utils/formatadores';
import { ROTULOS_STATUS_COBRANCA, TOM_STATUS_COBRANCA } from '../../utils/rotulos';
import estilos from './Inicio.module.css';
import { NadaPendente, SecaoPainel } from './SecaoPainel';

/** Painel do morador/proprietário: cada seção só aparece se o módulo dela estiver ativo. */
export function PainelMorador({ painel }: { painel: DashboardMorador }) {
  const { moduloAtivo } = useTema();
  const boletos = painel.proximosBoletos ?? [];
  const avisos = painel.avisosRecentes ?? [];
  const encomendas = painel.encomendasPendentes ?? [];
  const visitas = painel.autorizacoesPendentes ?? [];
  const reservas = painel.proximasReservas ?? [];

  return (
    <>
      {/* `unidade` vem ausente quando Minha Unidade está desligado */}
      {painel.unidade && moduloAtivo('minha_unidade') && (
        <Link to="/unidade" className={estilos.placaUnidade} aria-label={`Minha unidade: ${painel.unidade.identificacao}`}>
          <strong>{painel.unidade.identificacao}</strong>
          <span>{painel.unidade.blocoNome ?? 'Minha unidade'}</span>
        </Link>
      )}

      {moduloAtivo('portaria') && (
        <SecaoPainel titulo="Visitas aguardando você" para="/visitantes">
          {visitas.length === 0 ? (
            <NadaPendente>Ninguém esperando na portaria.</NadaPendente>
          ) : (
            <ListaCartoes rotulo="Visitas pendentes">
              {visitas.map((visita) => (
                <li key={visita.id}>
                  <Cartao para={`/visitantes/${visita.id}`} destaque rotulo={visita.visitante.nome}>
                    <strong>{visita.visitante.nome}</strong>
                    <p>{visita.motivo}, chegou em {formatarDataHora(visita.solicitadoEm)}</p>
                  </Cartao>
                </li>
              ))}
            </ListaCartoes>
          )}
        </SecaoPainel>
      )}

      {moduloAtivo('financeiro') && (
        <SecaoPainel titulo="Próximos boletos" para="/financeiro">
          {boletos.length === 0 ? (
            <NadaPendente>Nenhum boleto em aberto.</NadaPendente>
          ) : (
            <ListaCartoes rotulo="Próximos boletos">
              {boletos.map((boleto) => (
                <li key={boleto.id}>
                  <Cartao para={`/financeiro/cobrancas/${boleto.id}`} destaque={boleto.status === 'atrasado'} rotulo={`Boleto de ${formatarMoeda(boleto.valorTotal)}`}>
                    <strong>{formatarMoeda(boleto.valorTotal)}</strong> <Selo tom={TOM_STATUS_COBRANCA[boleto.status]}>{ROTULOS_STATUS_COBRANCA[boleto.status]}</Selo>
                    <p>Vence em {formatarData(boleto.vencimento)}</p>
                  </Cartao>
                </li>
              ))}
            </ListaCartoes>
          )}
        </SecaoPainel>
      )}

      {moduloAtivo('encomendas') && (
        <SecaoPainel titulo="Encomendas na portaria" para="/encomendas">
          {encomendas.length === 0 ? (
            <NadaPendente>Nenhuma encomenda esperando você.</NadaPendente>
          ) : (
            <ListaCartoes rotulo="Encomendas pendentes">
              {encomendas.map((encomenda) => (
                <li key={encomenda.id}>
                  <Cartao para={`/encomendas/${encomenda.id}`} rotulo={`Encomenda ${encomenda.transportadora}`}>
                    <strong>{encomenda.transportadora}</strong>
                    {encomenda.codigoRetirada && <p>Código de retirada: {encomenda.codigoRetirada}</p>}
                  </Cartao>
                </li>
              ))}
            </ListaCartoes>
          )}
        </SecaoPainel>
      )}

      {moduloAtivo('avisos') && (
        <SecaoPainel titulo="Avisos recentes" para="/avisos">
          {avisos.length === 0 ? (
            <NadaPendente>Nenhum aviso no mural.</NadaPendente>
          ) : (
            <ListaCartoes rotulo="Avisos recentes">
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

      {moduloAtivo('reservas') && (
        <SecaoPainel titulo="Próximas reservas" para="/reservas">
          {reservas.length === 0 ? (
            <NadaPendente>Nenhuma reserva marcada.</NadaPendente>
          ) : (
            <ListaCartoes rotulo="Próximas reservas">
              {reservas.map((reserva) => (
                <li key={reserva.id}>
                  <Cartao para={`/reservas/${reserva.id}`} rotulo={`Reserva ${reserva.areaComumNome ?? ''}`}>
                    <strong>{reserva.areaComumNome ?? 'Área comum'}</strong>
                    <p>{formatarPeriodo(reserva.inicio, reserva.fim)}</p>
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
