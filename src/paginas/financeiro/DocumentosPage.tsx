import { BotaoLink } from '../../componentes/Botao';
import { BotaoCarregarMais } from '../../componentes/BotaoCarregarMais';
import { Cartao, ListaCartoes } from '../../componentes/Cartao';
import { EstadoConsulta } from '../../componentes/Estados';
import { Selo } from '../../componentes/Selo';
import { Tela } from '../../componentes/Tela';
import { useContextoAtivo } from '../../contexto/SessaoContext';
import { useDocumentosFinanceiros } from '../../hooks/financeiroHooks';
import { itensDasPaginas } from '../../hooks/paginacao';
import { formatarData } from '../../utils/formatadores';
import { rotular, ROTULOS_TIPO_DOCUMENTO } from '../../utils/rotulos';
import estilos from '../paginas.module.css';

/** Notas fiscais, prestações de contas etc. publicadas pelo síndico. */
export function DocumentosPage() {
  const { perfil } = useContextoAtivo();
  const consulta = useDocumentosFinanceiros();
  const documentos = itensDasPaginas(consulta.data);

  return (
    <Tela titulo="Documentos" voltarPara="/financeiro">
      {perfil === 'sindico' && <BotaoLink para="/financeiro/documentos/novo">Publicar documento</BotaoLink>}
      <EstadoConsulta consulta={consulta} vazio={() => documentos.length === 0} mensagemVazio="Nenhum documento publicado.">
        {() => (
          <>
            <ListaCartoes rotulo="Documentos">
              {documentos.map((documento) => (
                <li key={documento.id}>
                  <Cartao rotulo={documento.titulo}>
                    <div className={estilos.selos}>
                      <Selo tom="info">{rotular(ROTULOS_TIPO_DOCUMENTO, documento.tipo)}</Selo>
                    </div>
                    <h2>{documento.titulo}</h2>
                    <p className={estilos.suave}>
                      {documento.competencia ? `Competência ${formatarData(documento.competencia)} · ` : ''}
                      publicado em {formatarData(documento.publicadoEm)}
                    </p>
                    <a href={documento.arquivoUrl} target="_blank" rel="noopener noreferrer">
                      Abrir arquivo
                    </a>
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
