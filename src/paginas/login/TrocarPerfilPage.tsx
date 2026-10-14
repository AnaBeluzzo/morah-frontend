import { useState } from 'react';
import { useNavigate } from 'react-router';
import { DialogoConfirmacao } from '../../componentes/BottomSheet';
import { ListaCartoes } from '../../componentes/Cartao';
import { ErroFormulario, EstadoVazio } from '../../componentes/Estados';
import { Selo } from '../../componentes/Selo';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useSessao } from '../../contexto/SessaoContext';
import { useTrocarContexto } from '../../hooks/autenticacaoHooks';
import type { PerfilDisponivel } from '../../tipos/login';
import { ROTULOS_PERFIL } from '../../utils/rotulos';
import estilos from './TrocarPerfilPage.module.css';

function descrever(opcao: PerfilDisponivel): string {
  const unidade = opcao.unidadeId !== undefined ? ` · unidade ${opcao.unidadeId}` : '';
  return `${ROTULOS_PERFIL[opcao.perfil]} em ${opcao.condominioNome ?? `condomínio ${opcao.condominioId}`}${unidade}`;
}

export function TrocarPerfilPage() {
  const navigate = useNavigate();
  const { sessao } = useSessao();
  const { mostrarToast } = useToast();
  const troca = useTrocarContexto();
  const [escolhida, setEscolhida] = useState<PerfilDisponivel | null>(null);
  const opcoes = sessao?.perfisDisponiveis ?? [];
  const atual = sessao?.contexto;

  function confirmar() {
    if (!escolhida) {
      return;
    }
    troca.mutate(
      { condominioId: escolhida.condominioId, perfil: escolhida.perfil },
      {
        onSuccess: () => {
          mostrarToast('Perfil alterado');
          navigate('/', { replace: true });
        },
        onError: () => setEscolhida(null),
      },
    );
  }

  return (
    <Tela titulo="Trocar perfil" voltarPara="/perfil">
      <ErroFormulario erro={troca.error} />
      {opcoes.length === 0 ? (
        <EstadoVazio mensagem="Nenhum outro perfil disponível." />
      ) : (
        <ListaCartoes rotulo="Perfis disponíveis">
          {opcoes.map((opcao) => {
            const ativo = opcao.perfil === atual?.perfil && opcao.condominioId === atual?.condominioId;
            return (
              <li key={`${opcao.condominioId}-${opcao.perfil}-${opcao.unidadeId ?? ''}`}>
                <button type="button" className={estilos.opcao} onClick={() => setEscolhida(opcao)}>
                  <span>{descrever(opcao)}</span>
                  {ativo && <Selo tom="info">Atual</Selo>}
                </button>
              </li>
            );
          })}
        </ListaCartoes>
      )}
      <DialogoConfirmacao
        aberto={escolhida !== null}
        titulo="Trocar de perfil?"
        mensagem={escolhida ? `Entrar como ${descrever(escolhida)}.` : ''}
        textoConfirmar="Trocar"
        enviando={troca.isPending}
        aoConfirmar={confirmar}
        aoCancelar={() => setEscolhida(null)}
      />
    </Tela>
  );
}
