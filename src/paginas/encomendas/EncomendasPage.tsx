import { useState } from 'react';
import { BotaoLink } from '../../componentes/Botao';
import { BotaoCarregarMais } from '../../componentes/BotaoCarregarMais';
import { Campo } from '../../componentes/Campo';
import { Cartao, ListaCartoes } from '../../componentes/Cartao';
import { EstadoConsulta } from '../../componentes/Estados';
import { Selo } from '../../componentes/Selo';
import { Tela } from '../../componentes/Tela';
import { useContextoAtivo } from '../../contexto/SessaoContext';
import { useEncomendas } from '../../hooks/encomendasHooks';
import { itensDasPaginas } from '../../hooks/paginacao';
import type { StatusEncomenda } from '../../tipos/encomendas';
import { formatarDataHora } from '../../utils/formatadores';
import { ROTULOS_STATUS_ENCOMENDA, TOM_STATUS_ENCOMENDA } from '../../utils/rotulos';
import estilos from '../paginas.module.css';

const OPCOES_STATUS = [{ valor: '', rotulo: 'Todas' }, ...Object.entries(ROTULOS_STATUS_ENCOMENDA).map(([valor, rotulo]) => ({ valor, rotulo }))];

/** Encomendas da unidade (morador) ou do condomínio (portaria e síndico). */
export function EncomendasPage() {
  const { perfil } = useContextoAtivo();
  const morador = perfil === 'morador' || perfil === 'proprietario';
  const [status, setStatus] = useState<StatusEncomenda | ''>('');
  const consulta = useEncomendas(status);
  const encomendas = itensDasPaginas(consulta.data);

  return (
    <Tela titulo="Encomendas" voltarPara={perfil === 'portaria' ? undefined : '/mais'}>
      {perfil === 'portaria' && <BotaoLink para="/encomendas/nova">Registrar encomenda</BotaoLink>}
      <Campo id="filtroStatus" rotulo="Mostrar" como="select" opcoes={OPCOES_STATUS} valor={status} aoMudar={(valor) => setStatus(valor as StatusEncomenda | '')} />
      <EstadoConsulta consulta={consulta} vazio={() => encomendas.length === 0} mensagemVazio="Nenhuma encomenda com esse filtro.">
        {() => (
          <>
            <ListaCartoes rotulo="Encomendas">
              {encomendas.map((encomenda) => (
                <li key={encomenda.id}>
                  <Cartao
                    para={`/encomendas/${encomenda.id}`}
                    destaque={encomenda.status === 'aguardando_retirada'}
                    rotulo={`${encomenda.transportadora}${encomenda.remetente ? ` de ${encomenda.remetente}` : ''}`}
                  >
                    <div className={estilos.linha}>
                      <strong>{encomenda.transportadora}</strong>
                      <Selo tom={TOM_STATUS_ENCOMENDA[encomenda.status]}>{ROTULOS_STATUS_ENCOMENDA[encomenda.status]}</Selo>
                    </div>
                    {encomenda.remetente && <p>De {encomenda.remetente}</p>}
                    <p className={estilos.suave}>
                      Chegou em {formatarDataHora(encomenda.recebidaEm)}
                      {morador ? '' : `, unidade ${encomenda.unidadeId}`}
                    </p>
                    {/* o código só interessa a quem vai retirar */}
                    {morador && encomenda.status === 'aguardando_retirada' && encomenda.codigoRetirada && <p>Código de retirada: {encomenda.codigoRetirada}</p>}
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
