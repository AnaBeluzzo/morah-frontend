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
import { useAutorizacoes } from '../../hooks/portariaHooks';
import type { StatusAutorizacaoVisita } from '../../tipos/portaria';
import { formatarDataHora } from '../../utils/formatadores';
import { ROTULOS_STATUS_AUTORIZACAO_VISITA, TOM_STATUS_AUTORIZACAO_VISITA } from '../../utils/rotulos';
import estilos from '../paginas.module.css';

const OPCOES_STATUS = [{ valor: '', rotulo: 'Todas' }, ...Object.entries(ROTULOS_STATUS_AUTORIZACAO_VISITA).map(([valor, rotulo]) => ({ valor, rotulo }))];

/** Fila de autorizações (portaria) ou visitas da própria unidade (morador/proprietário). */
export function AutorizacoesPage() {
  const { perfil } = useContextoAtivo();
  const portaria = perfil === 'portaria';
  const [status, setStatus] = useState<StatusAutorizacaoVisita | ''>('');
  const consulta = useAutorizacoes(status);
  const autorizacoes = itensDasPaginas(consulta.data);

  return (
    <Tela titulo="Visitantes" voltarPara={portaria ? undefined : '/mais'}>
      {portaria && (
        <div className={estilos.acoes}>
          <BotaoLink para="/visitantes/novo">Registrar visitante</BotaoLink>
          <BotaoLink para="/acessos" variante="secundario">
            Histórico de acessos
          </BotaoLink>
        </div>
      )}
      <Campo
        id="filtroStatus"
        rotulo="Mostrar"
        como="select"
        opcoes={OPCOES_STATUS}
        valor={status}
        aoMudar={(valor) => setStatus(valor as StatusAutorizacaoVisita | '')}
      />
      <EstadoConsulta consulta={consulta} vazio={() => autorizacoes.length === 0} mensagemVazio="Nenhuma visita com esse filtro.">
        {() => (
          <>
            <ListaCartoes rotulo="Autorizações de visita">
              {autorizacoes.map((autorizacao) => (
                <li key={autorizacao.id}>
                  <Cartao para={`/visitantes/${autorizacao.id}`} destaque={autorizacao.status === 'pendente'} rotulo={autorizacao.visitante.nome}>
                    <div className={estilos.linha}>
                      <strong>{autorizacao.visitante.nome}</strong>
                      <Selo tom={TOM_STATUS_AUTORIZACAO_VISITA[autorizacao.status]}>{ROTULOS_STATUS_AUTORIZACAO_VISITA[autorizacao.status]}</Selo>
                    </div>
                    <p className={estilos.suave}>
                      {autorizacao.motivo}, unidade {autorizacao.unidadeId}
                    </p>
                    <p className={estilos.suave}>Chegou em {formatarDataHora(autorizacao.solicitadoEm)}</p>
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
