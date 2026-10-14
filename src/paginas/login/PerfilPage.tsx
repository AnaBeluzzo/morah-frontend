import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Botao, BotaoLink } from '../../componentes/Botao';
import { DialogoConfirmacao } from '../../componentes/BottomSheet';
import { Cartao, Dado } from '../../componentes/Cartao';
import { EstadoConsulta } from '../../componentes/Estados';
import { Secao, Tela } from '../../componentes/Tela';
import { useSessao } from '../../contexto/SessaoContext';
import { useMe, useSair } from '../../hooks/autenticacaoHooks';
import { ROTULOS_PERFIL } from '../../utils/rotulos';

export function PerfilPage() {
  const navigate = useNavigate();
  const consulta = useMe();
  const sairDoApp = useSair();
  const { sessao } = useSessao();
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);
  // "Trocar perfil" só faz sentido com mais de uma opção de contexto
  const podeTrocar = (sessao?.perfisDisponiveis.length ?? 0) > 1;

  function sair() {
    sairDoApp.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) });
  }

  return (
    <Tela titulo="Perfil" voltarPara="/mais">
      <EstadoConsulta consulta={consulta}>
        {(me) => (
          <>
            <Cartao>
              <h2>{me.pessoa.nome}</h2>
              <dl>
                {me.pessoa.email && <Dado rotulo="E-mail">{me.pessoa.email}</Dado>}
                {me.pessoa.cpf && <Dado rotulo="CPF">{me.pessoa.cpf}</Dado>}
              </dl>
            </Cartao>
            <Secao titulo="Contexto ativo">
              <Cartao>
                <dl>
                  <Dado rotulo="Perfil">{ROTULOS_PERFIL[me.contextoAtivo.perfil]}</Dado>
                  <Dado rotulo="Condomínio">{me.contextoAtivo.condominioNome ?? me.contextoAtivo.condominioId}</Dado>
                  {me.contextoAtivo.unidadeId !== undefined && <Dado rotulo="Unidade (ID)">{me.contextoAtivo.unidadeId}</Dado>}
                </dl>
              </Cartao>
            </Secao>
          </>
        )}
      </EstadoConsulta>
      {podeTrocar && (
        <BotaoLink para="/perfil/trocar" variante="secundario">
          Trocar perfil
        </BotaoLink>
      )}
      <Botao variante="perigo" onClick={() => setConfirmandoSaida(true)}>
        Sair
      </Botao>
      <DialogoConfirmacao
        aberto={confirmandoSaida}
        titulo="Sair do Morah?"
        mensagem="Você vai precisar entrar de novo com e-mail e senha."
        textoConfirmar="Sair"
        perigo
        enviando={sairDoApp.isPending}
        aoConfirmar={sair}
        aoCancelar={() => setConfirmandoSaida(false)}
      />
    </Tela>
  );
}
