import { useState, type FormEvent } from 'react';
import { BotaoLink, Botao } from '../../componentes/Botao';
import { BotaoCarregarMais } from '../../componentes/BotaoCarregarMais';
import { Campo } from '../../componentes/Campo';
import { Cartao, ListaCartoes } from '../../componentes/Cartao';
import { EstadoConsulta } from '../../componentes/Estados';
import { Selo } from '../../componentes/Selo';
import { Tela } from '../../componentes/Tela';
import { useContextoAtivo } from '../../contexto/SessaoContext';
import { useAvisos } from '../../hooks/avisosHooks';
import { itensDasPaginas } from '../../hooks/paginacao';
import type { FiltrosAvisos, PrioridadeAviso } from '../../tipos/avisos';
import { formatarData } from '../../utils/formatadores';
import estilos from '../paginas.module.css';

const OPCOES_PRIORIDADE = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'normal', rotulo: 'Normal' },
  { valor: 'urgente', rotulo: 'Urgente' },
];

/** Mural de avisos vigentes, com filtros de categoria e prioridade. */
export function MuralPage() {
  const { perfil } = useContextoAtivo();
  const [categoria, setCategoria] = useState('');
  const [filtros, setFiltros] = useState<FiltrosAvisos>({ categoria: '', prioridade: '' });
  const consulta = useAvisos(filtros);
  const avisos = itensDasPaginas(consulta.data);

  function filtrar(evento: FormEvent) {
    evento.preventDefault();
    setFiltros((atuais) => ({ ...atuais, categoria: categoria.trim() }));
  }

  return (
    <Tela titulo="Avisos">
      {perfil === 'sindico' && <BotaoLink para="/avisos/novo">Novo aviso</BotaoLink>}
      <details className={estilos.filtros}>
        <summary>Filtros</summary>
        <form onSubmit={filtrar} aria-label="Filtrar avisos">
          <Campo id="filtroCategoria" rotulo="Categoria" valor={categoria} aoMudar={setCategoria} placeholder="ex.: manutencao" />
          <Campo
            id="filtroPrioridade"
            rotulo="Prioridade"
            como="select"
            opcoes={OPCOES_PRIORIDADE}
            valor={filtros.prioridade ?? ''}
            aoMudar={(valor) => setFiltros((atuais) => ({ ...atuais, prioridade: valor as PrioridadeAviso | '' }))}
          />
          <Botao type="submit" variante="secundario">
            Filtrar
          </Botao>
        </form>
      </details>

      <EstadoConsulta consulta={consulta} vazio={() => avisos.length === 0} mensagemVazio="Nenhum aviso vigente.">
        {() => (
          <>
            <ListaCartoes rotulo="Avisos">
              {avisos.map((aviso) => {
                const urgente = aviso.prioridade === 'urgente';
                return (
                  <li key={aviso.id}>
                    <Cartao para={`/avisos/${aviso.id}`} destaque={urgente} rotulo={aviso.titulo}>
                      <div className={estilos.selos}>
                        {urgente && <Selo tom="perigo">Urgente</Selo>}
                        {aviso.lidoPeloUsuario ? <Selo tom="neutro">Lido</Selo> : <Selo tom="info">Não lido</Selo>}
                      </div>
                      <h2 className={aviso.lidoPeloUsuario ? '' : estilos.naoLido}>{aviso.titulo}</h2>
                      <p className={estilos.suave}>
                        {aviso.categoria ? `${aviso.categoria} · ` : ''}
                        {formatarData(aviso.publicadoEm)}
                      </p>
                    </Cartao>
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
