import { useState } from 'react';
import { Botao } from '../../componentes/Botao';
import { BotaoCarregarMais } from '../../componentes/BotaoCarregarMais';
import { Campo } from '../../componentes/Campo';
import { Cartao, ListaCartoes } from '../../componentes/Cartao';
import { ErroFormulario, EstadoConsulta } from '../../componentes/Estados';
import { Selo } from '../../componentes/Selo';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useContextoAtivo } from '../../contexto/SessaoContext';
import { itensDasPaginas } from '../../hooks/paginacao';
import { useAcessos, useRegistrarAcesso } from '../../hooks/portariaHooks';
import { formatarDataHora } from '../../utils/formatadores';
import { ROTULOS_STATUS_ACESSO, TOM_STATUS_ACESSO } from '../../utils/rotulos';
import estilos from '../paginas.module.css';

/** Histórico de entradas e saídas (portaria e síndico); a portaria registra a saída aqui. */
export function AcessosPage() {
  const { perfil } = useContextoAtivo();
  const [data, setData] = useState('');
  const consulta = useAcessos(data);
  const registrar = useRegistrarAcesso();
  const { mostrarToast } = useToast();
  const acessos = itensDasPaginas(consulta.data);

  return (
    <Tela titulo="Histórico de acessos" voltarPara={perfil === 'portaria' ? '/visitantes' : '/mais'}>
      <Campo id="filtroData" rotulo="Dia" tipo="date" valor={data} aoMudar={setData} ajuda="Deixe vazio para ver todos." />
      <ErroFormulario erro={registrar.error} />
      <EstadoConsulta consulta={consulta} vazio={() => acessos.length === 0} mensagemVazio="Nenhum acesso registrado nesse dia.">
        {() => (
          <>
            <ListaCartoes rotulo="Acessos">
              {acessos.map((acesso) => (
                <li key={acesso.id}>
                  <Cartao rotulo={acesso.visitante.nome}>
                    <div className={estilos.linha}>
                      <strong>{acesso.visitante.nome}</strong>
                      <Selo tom={TOM_STATUS_ACESSO[acesso.status]}>{ROTULOS_STATUS_ACESSO[acesso.status]}</Selo>
                    </div>
                    <p className={estilos.suave}>Entrou em {formatarDataHora(acesso.entrada)}</p>
                    {acesso.saida && <p className={estilos.suave}>Saiu em {formatarDataHora(acesso.saida)}</p>}
                    {perfil === 'portaria' && acesso.status === 'no_condominio' && (
                      <Botao
                        variante="secundario"
                        carregando={registrar.isPending && registrar.variables?.visitanteId === acesso.visitante.id}
                        onClick={() => registrar.mutate({ visitanteId: acesso.visitante.id, tipo: 'saida' }, { onSuccess: () => mostrarToast('Saída registrada') })}
                      >
                        Registrar saída
                      </Botao>
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
