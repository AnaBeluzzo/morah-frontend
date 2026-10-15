import { useParams } from 'react-router';
import { BotaoLink } from '../../componentes/Botao';
import { Cartao, Dado } from '../../componentes/Cartao';
import { EstadoConsulta } from '../../componentes/Estados';
import { Selo } from '../../componentes/Selo';
import { Tela } from '../../componentes/Tela';
import { useContextoAtivo } from '../../contexto/SessaoContext';
import { useEncomenda } from '../../hooks/encomendasHooks';
import { formatarDataHora } from '../../utils/formatadores';
import { ROTULOS_STATUS_ENCOMENDA, TOM_STATUS_ENCOMENDA } from '../../utils/rotulos';
import estilos from '../paginas.module.css';

export function DetalheEncomendaPage() {
  const encomendaId = Number(useParams().encomendaId);
  const { perfil } = useContextoAtivo();
  const morador = perfil === 'morador' || perfil === 'proprietario';
  const consulta = useEncomenda(encomendaId);

  return (
    <Tela titulo="Encomenda" voltarPara="/encomendas">
      <EstadoConsulta consulta={consulta}>
        {(encomenda) => {
          const aguardando = encomenda.status === 'aguardando_retirada';
          return (
            <>
              <Cartao destaque={aguardando}>
                <div className={estilos.linha}>
                  <h2>{encomenda.transportadora}</h2>
                  <Selo tom={TOM_STATUS_ENCOMENDA[encomenda.status]}>{ROTULOS_STATUS_ENCOMENDA[encomenda.status]}</Selo>
                </div>
                <dl>
                  {encomenda.remetente && <Dado rotulo="Remetente">{encomenda.remetente}</Dado>}
                  {encomenda.codigoRastreio && <Dado rotulo="Rastreio">{encomenda.codigoRastreio}</Dado>}
                  <Dado rotulo="Unidade (ID)">{encomenda.unidadeId}</Dado>
                  <Dado rotulo="Chegou em">{formatarDataHora(encomenda.recebidaEm)}</Dado>
                  {encomenda.retiradaEm && <Dado rotulo="Retirada em">{formatarDataHora(encomenda.retiradaEm)}</Dado>}
                </dl>
                {encomenda.fotoUrl && (
                  <a href={encomenda.fotoUrl} target="_blank" rel="noopener noreferrer">
                    Ver foto da encomenda
                  </a>
                )}
              </Cartao>

              {morador && aguardando && encomenda.codigoRetirada && (
                <Cartao rotulo="Como retirar">
                  <p>Mostre este código na portaria para retirar:</p>
                  <p className={estilos.codigoGrande} aria-label="Código de retirada">
                    {encomenda.codigoRetirada}
                  </p>
                </Cartao>
              )}

              {aguardando && morador && (
                <div className={estilos.acoes}>
                  <BotaoLink para={`/encomendas/${encomenda.id}/autorizar-terceiro`}>Autorizar outra pessoa a retirar</BotaoLink>
                  <BotaoLink para={`/encomendas/${encomenda.id}/extravio`} variante="secundario">
                    Informar extravio
                  </BotaoLink>
                </div>
              )}
              {aguardando && perfil === 'portaria' && <BotaoLink para={`/encomendas/${encomenda.id}/retirada`}>Confirmar retirada</BotaoLink>}
            </>
          );
        }}
      </EstadoConsulta>
    </Tela>
  );
}
