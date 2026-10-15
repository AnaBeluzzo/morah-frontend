import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Botao } from '../../componentes/Botao';
import { DialogoConfirmacao } from '../../componentes/BottomSheet';
import { Campo } from '../../componentes/Campo';
import { ErroFormulario, EstadoConsulta } from '../../componentes/Estados';
import { Secao, Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useAreasComuns, useCriarReserva, useDisponibilidade } from '../../hooks/reservasHooks';
import { formatarData, formatarHora, formatarMoeda, hojeIso } from '../../utils/formatadores';
import { tocarHorario, type Selecao } from './horarios';
import estilos from './NovaReservaPage.module.css';

/** Reservar uma área comum: escolher a data, os horários (início e fim) e confirmar. */
export function NovaReservaPage() {
  const areaComumId = Number(useParams().areaComumId);
  const navigate = useNavigate();
  const { mostrarToast } = useToast();
  const [data, setData] = useState(hojeIso());
  const [selecao, setSelecao] = useState<Selecao | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const disponibilidade = useDisponibilidade(areaComumId, data);
  const area = useAreasComuns().data?.find((item) => item.id === areaComumId);
  const reservar = useCriarReserva();

  const horarios = disponibilidade.data?.horarios ?? [];
  const inicio = selecao ? horarios[selecao.inicio] : undefined;
  const fim = selecao ? horarios[selecao.fim] : undefined;
  const periodo = inicio && fim ? `das ${formatarHora(inicio.inicio)} às ${formatarHora(fim.fim)}` : '';

  function mudarData(novaData: string) {
    setData(novaData);
    setSelecao(null);
    reservar.reset();
  }

  function confirmar() {
    if (!inicio || !fim) return;
    // os instantes vão exatamente como vieram da disponibilidade
    reservar.mutate(
      { areaComumId, inicio: inicio.inicio, fim: fim.fim },
      {
        onSuccess: (reserva) => {
          mostrarToast('Reserva confirmada');
          navigate(`/reservas/${reserva.id}`, { replace: true });
        },
        onError: () => {
          setConfirmando(false);
          setSelecao(null);
        },
      },
    );
  }

  return (
    <Tela titulo={area?.nome ?? 'Nova reserva'} voltarPara="/reservas/areas">
      <Campo id="data" rotulo="Data" tipo="date" min={hojeIso()} valor={data} aoMudar={mudarData} />
      <Secao titulo="Horários">
        <p className={estilos.instrucao}>Toque no horário de início e depois no último horário que você quer usar.</p>
        {/* 409: o horário foi reservado por outra pessoa enquanto você escolhia */}
        <ErroFormulario erro={reservar.error} />
        {!data && <p>Escolha uma data para ver os horários.</p>}
        {data && (
          <EstadoConsulta consulta={disponibilidade}>
            {() => (
              <ul className={estilos.horarios} aria-label="Horários do dia">
                {horarios.map((horario, indice) => {
                  const escolhido = selecao !== null && indice >= selecao.inicio && indice <= selecao.fim;
                  return (
                    <li key={horario.inicio}>
                      <button
                        type="button"
                        className={`${estilos.horario} ${escolhido ? estilos.escolhido : ''}`}
                        disabled={!horario.disponivel}
                        aria-pressed={escolhido}
                        onClick={() => setSelecao(tocarHorario(selecao, indice, horarios))}
                      >
                        <span>{formatarHora(horario.inicio)}</span>{' '}
                        <small>{horario.disponivel ? `até ${formatarHora(horario.fim)}` : 'Ocupado'}</small>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </EstadoConsulta>
        )}
      </Secao>
      <div className={estilos.rodape}>
        <Botao disabled={!periodo} onClick={() => setConfirmando(true)}>
          {periodo ? `Reservar ${periodo}` : 'Escolha os horários'}
        </Botao>
      </div>
      <DialogoConfirmacao
        aberto={confirmando}
        titulo="Confirmar reserva?"
        mensagem={
          <p>
            {area?.nome ?? 'Área comum'} no dia {data && formatarData(data)}, {periodo}.
            {area?.taxa !== undefined ? ` Taxa de ${formatarMoeda(area.taxa)}.` : ''}
          </p>
        }
        textoConfirmar="Confirmar reserva"
        enviando={reservar.isPending}
        aoConfirmar={confirmar}
        aoCancelar={() => setConfirmando(false)}
      />
    </Tela>
  );
}
