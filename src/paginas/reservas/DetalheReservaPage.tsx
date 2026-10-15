import { useState } from 'react';
import { useParams } from 'react-router';
import { Botao, BotaoLink } from '../../componentes/Botao';
import { DialogoConfirmacao } from '../../componentes/BottomSheet';
import { Cartao, Dado } from '../../componentes/Cartao';
import { ErroFormulario, EstadoConsulta } from '../../componentes/Estados';
import { Selo } from '../../componentes/Selo';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useContextoAtivo } from '../../contexto/SessaoContext';
import { useCancelarReserva, useReserva } from '../../hooks/reservasHooks';
import { formatarData, formatarHora, formatarMoeda } from '../../utils/formatadores';
import { ROTULOS_STATUS_RESERVA, TOM_STATUS_RESERVA } from '../../utils/rotulos';
import estilos from '../paginas.module.css';

export function DetalheReservaPage() {
  const reservaId = Number(useParams().reservaId);
  const { perfil } = useContextoAtivo();
  const morador = perfil === 'morador' || perfil === 'proprietario';
  const consulta = useReserva(reservaId);
  const cancelar = useCancelarReserva(reservaId);
  const { mostrarToast } = useToast();
  const [confirmando, setConfirmando] = useState(false);

  function confirmarCancelamento() {
    cancelar.mutate(undefined, {
      onSuccess: () => mostrarToast('Reserva cancelada'),
      onSettled: () => setConfirmando(false),
    });
  }

  return (
    <Tela titulo="Reserva" voltarPara="/reservas">
      <EstadoConsulta consulta={consulta}>
        {(reserva) => (
          <>
            <Cartao>
              <div className={estilos.linha}>
                <h2>{reserva.areaComumNome ?? 'Área comum'}</h2>
                <Selo tom={TOM_STATUS_RESERVA[reserva.status]}>{ROTULOS_STATUS_RESERVA[reserva.status]}</Selo>
              </div>
              <p className={estilos.valor}>
                {formatarHora(reserva.inicio)} às {formatarHora(reserva.fim)}
              </p>
              <dl>
                <Dado rotulo="Dia">{formatarData(reserva.inicio)}</Dado>
                {reserva.valor !== undefined && <Dado rotulo="Taxa">{formatarMoeda(reserva.valor)}</Dado>}
                <Dado rotulo="Unidade (ID)">{reserva.unidadeId}</Dado>
                {reserva.solicitante && <Dado rotulo="Reservado por">{reserva.solicitante.nome}</Dado>}
              </dl>
            </Cartao>
            <ErroFormulario erro={cancelar.error} />
            {/* só uma reserva confirmada pode ser cancelada (o servidor responde 409 nas outras) */}
            {morador && reserva.status === 'confirmada' && (
              <Botao variante="perigo" onClick={() => setConfirmando(true)}>
                Cancelar reserva
              </Botao>
            )}
            {perfil === 'portaria' && <BotaoLink para={`/reservas/${reserva.id}/vistoria`}>Registrar vistoria</BotaoLink>}
            <DialogoConfirmacao
              aberto={confirmando}
              titulo="Cancelar esta reserva?"
              mensagem="O horário fica livre para outras unidades."
              textoConfirmar="Cancelar reserva"
              perigo
              enviando={cancelar.isPending}
              aoConfirmar={confirmarCancelamento}
              aoCancelar={() => setConfirmando(false)}
            />
          </>
        )}
      </EstadoConsulta>
    </Tela>
  );
}
