import { BotaoCarregarMais } from '../../componentes/BotaoCarregarMais';
import { ListaCartoes } from '../../componentes/Cartao';
import { EstadoConsulta } from '../../componentes/Estados';
import { Icone, type NomeIcone } from '../../componentes/Icone';
import { Selo } from '../../componentes/Selo';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useMarcarNotificacaoLida, useNotificacoes } from '../../hooks/notificacoesHooks';
import type { Notificacao, TipoNotificacao } from '../../tipos/notificacoes';
import { formatarDataHora } from '../../utils/formatadores';
import { rotular, ROTULOS_TIPO_NOTIFICACAO } from '../../utils/rotulos';
import estilos from './NotificacoesPage.module.css';

const ICONE_POR_TIPO: Record<TipoNotificacao, NomeIcone> = {
  portaria: 'visitantes',
  encomenda: 'encomendas',
  financeiro: 'financeiro',
  aviso: 'avisos',
  reserva: 'reservas',
};

export function NotificacoesPage() {
  const consulta = useNotificacoes();
  const marcarLida = useMarcarNotificacaoLida();
  const { mostrarToast } = useToast();
  const notificacoes = consulta.data?.pages.flat() ?? [];

  function tocar(notificacao: Notificacao) {
    if (!notificacao.lidaEm) {
      marcarLida.mutate(notificacao.id, { onError: () => mostrarToast('Não foi possível marcar como lida.', 'erro') });
    }
  }

  return (
    <Tela titulo="Notificações" voltarPara="/mais">
      <EstadoConsulta consulta={consulta} vazio={() => notificacoes.length === 0} mensagemVazio="Você não tem notificações.">
        {() => (
          <>
            <ListaCartoes rotulo="Notificações">
              {notificacoes.map((notificacao) => {
                const lida = Boolean(notificacao.lidaEm);
                return (
                  <li key={notificacao.id}>
                    <button
                      type="button"
                      className={`${estilos.item} ${lida ? '' : estilos.naoLida}`}
                      onClick={() => tocar(notificacao)}
                      disabled={marcarLida.isPending && marcarLida.variables === notificacao.id}
                    >
                      {/* o convite de inquilino chega sem `tipo`: ícone genérico */}
                      <Icone nome={notificacao.tipo ? ICONE_POR_TIPO[notificacao.tipo] : 'info'} />
                      <span className={estilos.texto}>
                        <strong>{notificacao.titulo}</strong>
                        {notificacao.mensagem && <span>{notificacao.mensagem}</span>}
                        <small>
                          {notificacao.tipo ? `${rotular(ROTULOS_TIPO_NOTIFICACAO, notificacao.tipo)} · ` : ''}
                          {formatarDataHora(notificacao.enviadaEm)}
                        </small>
                      </span>
                      {!lida && <Selo tom="info">Nova</Selo>}
                    </button>
                  </li>
                );
              })}
            </ListaCartoes>
            <BotaoCarregarMais temMais={consulta.hasNextPage} carregando={consulta.isFetchingNextPage} aoCarregar={() => consulta.fetchNextPage()} />
          </>
        )}
      </EstadoConsulta>
    </Tela>
  );
}
