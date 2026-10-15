import { useState } from 'react';
import { useParams } from 'react-router';
import { Botao, BotaoLink } from '../../componentes/Botao';
import { DialogoConfirmacao } from '../../componentes/BottomSheet';
import { Campo } from '../../componentes/Campo';
import { Cartao, Dado } from '../../componentes/Cartao';
import { ErroFormulario, EstadoConsulta } from '../../componentes/Estados';
import { Selo } from '../../componentes/Selo';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useContextoAtivo } from '../../contexto/SessaoContext';
import { useAutorizacao, useDecidirAutorizacao, useReenviarAutorizacao, useRegistrarAcesso } from '../../hooks/portariaHooks';
import type { AutorizacaoVisita, DecisaoAutorizacao } from '../../tipos/portaria';
import { formatarDataHora } from '../../utils/formatadores';
import { ROTULOS_STATUS_AUTORIZACAO_VISITA, TOM_STATUS_AUTORIZACAO_VISITA } from '../../utils/rotulos';
import estilos from '../paginas.module.css';

/** Morador/proprietário: autorizar ou recusar. Só vale para pendente; expirada ou decidida dá 409. */
function DecisaoDoMorador({ autorizacao }: { autorizacao: AutorizacaoVisita }) {
  const decidir = useDecidirAutorizacao(autorizacao.id);
  const { mostrarToast } = useToast();
  const [decisao, setDecisao] = useState<DecisaoAutorizacao | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const pendente = autorizacao.status === 'pendente';

  function confirmar() {
    if (!decisao) return;
    decidir.mutate(
      { decisao, justificativa: justificativa.trim() || undefined },
      {
        onSuccess: () => mostrarToast(decisao === 'autorizado' ? 'Entrada autorizada' : 'Entrada recusada'),
        onSettled: () => setDecisao(null),
      },
    );
  }

  return (
    <div className={estilos.acoes}>
      {!pendente && <p className={estilos.suave}>Esta visita já foi decidida ou expirou: não dá mais para responder.</p>}
      <ErroFormulario erro={decidir.error} />
      <div className={estilos.grade}>
        <Botao onClick={() => setDecisao('autorizado')} disabled={!pendente}>
          Autorizar
        </Botao>
        <Botao variante="perigo" onClick={() => setDecisao('recusado')} disabled={!pendente}>
          Recusar
        </Botao>
      </div>
      <DialogoConfirmacao
        aberto={decisao !== null}
        titulo={decisao === 'autorizado' ? 'Autorizar a entrada?' : 'Recusar a entrada?'}
        mensagem={<Campo id="justificativa" rotulo="Justificativa" como="textarea" valor={justificativa} aoMudar={setJustificativa} ajuda="Opcional." />}
        textoConfirmar={decisao === 'autorizado' ? 'Autorizar' : 'Recusar'}
        perigo={decisao === 'recusado'}
        enviando={decidir.isPending}
        aoConfirmar={confirmar}
        aoCancelar={() => setDecisao(null)}
      />
    </div>
  );
}

/** Portaria: reenviar o aviso à unidade (só pendente) e registrar a entrada (só autorizada). */
function AcoesDaPortaria({ autorizacao }: { autorizacao: AutorizacaoVisita }) {
  const reenviar = useReenviarAutorizacao(autorizacao.id);
  const registrar = useRegistrarAcesso();
  const { mostrarToast } = useToast();

  return (
    <div className={estilos.acoes}>
      <ErroFormulario erro={reenviar.error ?? registrar.error} />
      {autorizacao.status === 'pendente' && (
        <Botao variante="secundario" carregando={reenviar.isPending} onClick={() => reenviar.mutate(undefined, { onSuccess: () => mostrarToast('Notificação reenviada') })}>
          Reenviar notificação
        </Botao>
      )}
      {registrar.data && <p className={estilos.suave}>Entrada registrada em {formatarDataHora(registrar.data.entrada)}.</p>}
      {autorizacao.status === 'autorizada' && !registrar.data && (
        <Botao
          carregando={registrar.isPending}
          onClick={() =>
            registrar.mutate(
              { visitanteId: autorizacao.visitante.id, autorizacaoId: autorizacao.id, tipo: 'entrada' },
              { onSuccess: () => mostrarToast('Entrada registrada') },
            )
          }
        >
          Registrar entrada
        </Botao>
      )}
      <BotaoLink para="/acessos" variante="secundario">
        Histórico de acessos
      </BotaoLink>
    </div>
  );
}

export function AutorizacaoPage() {
  const autorizacaoId = Number(useParams().autorizacaoId);
  const { perfil } = useContextoAtivo();
  const consulta = useAutorizacao(autorizacaoId);

  return (
    <Tela titulo="Visita" voltarPara="/visitantes">
      <EstadoConsulta consulta={consulta}>
        {(autorizacao) => (
          <>
            <Cartao destaque={autorizacao.status === 'pendente'}>
              <div className={estilos.linha}>
                <h2>{autorizacao.visitante.nome}</h2>
                <Selo tom={TOM_STATUS_AUTORIZACAO_VISITA[autorizacao.status]}>{ROTULOS_STATUS_AUTORIZACAO_VISITA[autorizacao.status]}</Selo>
              </div>
              <dl>
                <Dado rotulo="Motivo">{autorizacao.motivo}</Dado>
                <Dado rotulo="Unidade (ID)">{autorizacao.unidadeId}</Dado>
                {autorizacao.visitante.documento && <Dado rotulo="Documento">{autorizacao.visitante.documento}</Dado>}
                {autorizacao.visitante.telefone && <Dado rotulo="Telefone">{autorizacao.visitante.telefone}</Dado>}
                <Dado rotulo="Chegou em">{formatarDataHora(autorizacao.solicitadoEm)}</Dado>
                {autorizacao.respondidoEm && <Dado rotulo="Respondida em">{formatarDataHora(autorizacao.respondidoEm)}</Dado>}
              </dl>
            </Cartao>
            {perfil === 'portaria' ? <AcoesDaPortaria autorizacao={autorizacao} /> : <DecisaoDoMorador autorizacao={autorizacao} />}
          </>
        )}
      </EstadoConsulta>
    </Tela>
  );
}
