import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { BotaoLink } from '../componentes/Botao';
import { EstadoVazio } from '../componentes/Estados';
import { Tela } from '../componentes/Tela';
import { useSessao } from '../contexto/SessaoContext';
import type { Perfil } from '../tipos/login';
import { perfilPermitido } from './navegacao';

interface RotaProtegidaProps {
  /** Perfis que podem abrir a tela; sem a lista, qualquer pessoa logada. */
  perfis?: readonly Perfil[];
  children: ReactNode;
}

/**
 * Guarda de rota: sem sessão vai para o login (com `replace`, então o "voltar" do navegador
 * não reabre a tela); com perfil sem permissão mostra uma tela de acesso negado.
 */
export function RotaProtegida({ perfis, children }: RotaProtegidaProps) {
  const { sessao } = useSessao();
  if (!sessao) {
    return <Navigate to="/login" replace />;
  }
  if (perfis && !perfilPermitido(sessao.contexto.perfil, perfis)) {
    return (
      <Tela titulo="Acesso não permitido" voltarPara="/">
        <EstadoVazio mensagem="Esta tela não está disponível para o seu perfil.">
          <BotaoLink para="/" variante="secundario">
            Ir para o início
          </BotaoLink>
        </EstadoVazio>
      </Tela>
    );
  }
  return <>{children}</>;
}

/** Login: quem já está logado vai direto para o início. */
export function RotaPublica({ children }: { children: ReactNode }) {
  const { sessao } = useSessao();
  return sessao ? <Navigate to="/" replace /> : <>{children}</>;
}
