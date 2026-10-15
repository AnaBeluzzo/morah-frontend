import { BotaoLink } from '../../componentes/Botao';
import { Cartao, Dado, ListaCartoes } from '../../componentes/Cartao';
import { EstadoConsulta } from '../../componentes/Estados';
import { Selo } from '../../componentes/Selo';
import { Secao, Tela } from '../../componentes/Tela';
import { useContextoAtivo } from '../../contexto/SessaoContext';
import { useMinhaUnidade, useVinculosMinhaUnidade } from '../../hooks/minhaUnidadeHooks';
import type { Unidade } from '../../tipos/minhaUnidade';
import { formatarData, formatarNumero } from '../../utils/formatadores';
import { ROTULOS_TIPO_VINCULO } from '../../utils/rotulos';
import estilos from '../paginas.module.css';
import { vinculoEncerrado } from './vinculos';

/** Dados de uma unidade (usado também na administração do síndico). */
export function DadosUnidade({ unidade }: { unidade: Unidade }) {
  return (
    <Cartao rotulo={`Unidade ${unidade.identificacao}`}>
      {/* a identificação da unidade em letra larga, como a placa na porta */}
      <h2 className={estilos.codigoGrande}>{unidade.identificacao}</h2>
      {unidade.blocoNome && <p className={estilos.suave}>{unidade.blocoNome}</p>}
      <dl>
        <Dado rotulo="ID da unidade">{unidade.id}</Dado>
        {unidade.tipo && <Dado rotulo="Tipo">{unidade.tipo}</Dado>}
        {unidade.areaM2 !== undefined && <Dado rotulo="Área">{formatarNumero(unidade.areaM2)} m²</Dado>}
        {unidade.fracaoIdeal !== undefined && <Dado rotulo="Fração ideal">{formatarNumero(unidade.fracaoIdeal)}</Dado>}
        {unidade.status && <Dado rotulo="Situação">{unidade.status}</Dado>}
      </dl>
    </Cartao>
  );
}

export function MinhaUnidadePage() {
  const { perfil } = useContextoAtivo();
  const unidade = useMinhaUnidade();
  const vinculos = useVinculosMinhaUnidade();

  return (
    <Tela titulo="Minha unidade" voltarPara="/mais">
      <EstadoConsulta consulta={unidade}>{(dados) => <DadosUnidade unidade={dados} />}</EstadoConsulta>
      <div className={estilos.acoes}>
        <BotaoLink para="/unidade/solicitar-vinculo" variante="secundario">
          Solicitar vínculo
        </BotaoLink>
        {perfil === 'proprietario' && (
          <BotaoLink para="/unidade/inquilinos" variante="secundario">
            Inquilinos
          </BotaoLink>
        )}
      </div>
      <Secao titulo="Moradores e vínculos">
        <EstadoConsulta consulta={vinculos} vazio={(lista) => lista.length === 0} mensagemVazio="Nenhum vínculo cadastrado nesta unidade.">
          {(lista) => (
            <ListaCartoes rotulo="Vínculos">
              {lista.map((vinculo) => (
                <li key={vinculo.id}>
                  <Cartao rotulo={vinculo.pessoa.nome}>
                    <div className={estilos.linha}>
                      <strong>{vinculo.pessoa.nome}</strong>
                      <Selo tom={vinculoEncerrado(vinculo) ? 'neutro' : 'info'}>{ROTULOS_TIPO_VINCULO[vinculo.tipoVinculo]}</Selo>
                    </div>
                    <p className={estilos.suave}>
                      {vinculo.inicio ? `Desde ${formatarData(vinculo.inicio)}` : ''}
                      {vinculo.fim ? `, ${vinculoEncerrado(vinculo) ? 'encerrado em' : 'até'} ${formatarData(vinculo.fim)}` : ''}
                    </p>
                  </Cartao>
                </li>
              ))}
            </ListaCartoes>
          )}
        </EstadoConsulta>
      </Secao>
    </Tela>
  );
}
