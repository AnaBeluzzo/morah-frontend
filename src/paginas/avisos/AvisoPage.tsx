import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ErroApi } from '../../api/ApiClient';
import { Botao, BotaoLink } from '../../componentes/Botao';
import { DialogoConfirmacao } from '../../componentes/BottomSheet';
import { Cartao, Dado } from '../../componentes/Cartao';
import { ErroFormulario, EstadoConsulta, EstadoVazio } from '../../componentes/Estados';
import { Selo } from '../../componentes/Selo';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useContextoAtivo } from '../../contexto/SessaoContext';
import { useAviso, useDeletarAviso } from '../../hooks/avisosHooks';
import type { PublicoAlvo } from '../../tipos/avisos';
import { formatarDataHora } from '../../utils/formatadores';
import { rotular, ROTULOS_PRIORIDADE_AVISO, ROTULOS_TIPO_PUBLICO_ALVO, TOM_PRIORIDADE_AVISO } from '../../utils/rotulos';
import estilos from '../paginas.module.css';

function descreverPublico(publico: PublicoAlvo): string {
  if (publico.tipo === 'bloco') return `Bloco (ID ${publico.blocoId})`;
  if (publico.tipo === 'unidade') return `Unidade (ID ${publico.unidadeId})`;
  return rotular(ROTULOS_TIPO_PUBLICO_ALVO, publico.tipo);
}

/** Detalhe do aviso. Abrir já marca como lido (o servidor faz isso no GET). */
export function AvisoPage() {
  const avisoId = Number(useParams().avisoId);
  const { perfil } = useContextoAtivo();
  const navigate = useNavigate();
  const { mostrarToast } = useToast();
  const consulta = useAviso(avisoId);
  const expirar = useDeletarAviso();
  const [confirmando, setConfirmando] = useState(false);
  const foraDeVigencia = consulta.error instanceof ErroApi && consulta.error.status === 410;

  function confirmarExpiracao() {
    expirar.mutate(avisoId, {
      onSuccess: () => {
        mostrarToast('Aviso expirado');
        navigate('/avisos', { replace: true });
      },
      onError: () => setConfirmando(false),
    });
  }

  return (
    <Tela titulo="Aviso" voltarPara="/avisos">
      {foraDeVigencia ? (
        <EstadoVazio mensagem="Este aviso não está mais em vigência.">
          <BotaoLink para="/avisos" variante="secundario">
            Voltar ao mural
          </BotaoLink>
        </EstadoVazio>
      ) : (
        <EstadoConsulta consulta={consulta}>
          {(aviso) => (
            <>
              <Cartao destaque={aviso.prioridade === 'urgente'}>
                {aviso.prioridade && (
                  <div className={estilos.selos}>
                    <Selo tom={TOM_PRIORIDADE_AVISO[aviso.prioridade]}>{rotular(ROTULOS_PRIORIDADE_AVISO, aviso.prioridade)}</Selo>
                  </div>
                )}
                <h2>{aviso.titulo}</h2>
                <p className={estilos.conteudo}>{aviso.conteudo}</p>
              </Cartao>
              <Cartao>
                <dl>
                  {aviso.categoria && <Dado rotulo="Categoria">{aviso.categoria}</Dado>}
                  {aviso.autor && <Dado rotulo="Publicado por">{aviso.autor.nome}</Dado>}
                  <Dado rotulo="Publicado em">{formatarDataHora(aviso.publicadoEm)}</Dado>
                  {aviso.expiraEm && <Dado rotulo="Expira em">{formatarDataHora(aviso.expiraEm)}</Dado>}
                  {aviso.publicoAlvo && <Dado rotulo="Público">{descreverPublico(aviso.publicoAlvo)}</Dado>}
                </dl>
              </Cartao>
              {perfil === 'sindico' && (
                <div className={estilos.acoes}>
                  <ErroFormulario erro={expirar.error} />
                  <BotaoLink para={`/avisos/${aviso.id}/editar`} variante="secundario">
                    Editar
                  </BotaoLink>
                  <Botao variante="perigo" onClick={() => setConfirmando(true)}>
                    Expirar aviso
                  </Botao>
                </div>
              )}
              <DialogoConfirmacao
                aberto={confirmando}
                titulo="Expirar este aviso?"
                mensagem="Ele sai do mural na hora (não é apagado do histórico)."
                textoConfirmar="Expirar"
                perigo
                enviando={expirar.isPending}
                aoConfirmar={confirmarExpiracao}
                aoCancelar={() => setConfirmando(false)}
              />
            </>
          )}
        </EstadoConsulta>
      )}
    </Tela>
  );
}
