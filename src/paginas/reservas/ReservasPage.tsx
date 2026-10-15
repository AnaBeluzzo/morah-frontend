import { useState } from 'react';
import { BotaoLink } from '../../componentes/Botao';
import { BotaoCarregarMais } from '../../componentes/BotaoCarregarMais';
import { Campo } from '../../componentes/Campo';
import { Cartao, ListaCartoes } from '../../componentes/Cartao';
import { EstadoConsulta } from '../../componentes/Estados';
import { Selo } from '../../componentes/Selo';
import { Tela } from '../../componentes/Tela';
import { useContextoAtivo } from '../../contexto/SessaoContext';
import { itensDasPaginas } from '../../hooks/paginacao';
import { useReservas } from '../../hooks/reservasHooks';
import { formatarMoeda, formatarPeriodo, hojeIso } from '../../utils/formatadores';
import { ROTULOS_STATUS_RESERVA, TOM_STATUS_RESERVA } from '../../utils/rotulos';
import estilos from '../paginas.module.css';

/** Minhas reservas (morador), reservas do dia (portaria) ou todas (síndico). */
export function ReservasPage() {
  const { perfil } = useContextoAtivo();
  const morador = perfil === 'morador' || perfil === 'proprietario';
  // a portaria trabalha com o dia de hoje; os outros perfis veem tudo até escolher um dia
  const [data, setData] = useState(perfil === 'portaria' ? hojeIso() : '');
  const consulta = useReservas(data);
  const reservas = itensDasPaginas(consulta.data);

  return (
    <Tela titulo="Reservas" voltarPara={perfil === 'sindico' ? '/mais' : undefined}>
      <div className={estilos.acoes}>
        {morador && <BotaoLink para="/reservas/areas">Nova reserva</BotaoLink>}
        <BotaoLink para="/reservas/areas" variante="secundario">
          Áreas comuns
        </BotaoLink>
      </div>
      <Campo id="filtroData" rotulo="Dia" tipo="date" valor={data} aoMudar={setData} ajuda={perfil === 'portaria' ? 'Reservas do dia escolhido.' : 'Deixe vazio para ver todas.'} />
      <h2>{morador ? 'Minhas reservas' : 'Reservas'}</h2>
      <EstadoConsulta consulta={consulta} vazio={() => reservas.length === 0} mensagemVazio="Nenhuma reserva para esse dia.">
        {() => (
          <>
            <ListaCartoes rotulo="Reservas">
              {reservas.map((reserva) => (
                <li key={reserva.id}>
                  <Cartao para={`/reservas/${reserva.id}`} rotulo={`${reserva.areaComumNome ?? 'Reserva'} ${formatarPeriodo(reserva.inicio, reserva.fim)}`}>
                    <div className={estilos.linha}>
                      <strong>{reserva.areaComumNome ?? 'Área comum'}</strong>
                      <Selo tom={TOM_STATUS_RESERVA[reserva.status]}>{ROTULOS_STATUS_RESERVA[reserva.status]}</Selo>
                    </div>
                    <p className={estilos.suave}>{formatarPeriodo(reserva.inicio, reserva.fim)}</p>
                    {!morador && (
                      <p className={estilos.suave}>
                        Unidade {reserva.unidadeId}
                        {reserva.valor !== undefined ? `, ${formatarMoeda(reserva.valor)}` : ''}
                      </p>
                    )}
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
