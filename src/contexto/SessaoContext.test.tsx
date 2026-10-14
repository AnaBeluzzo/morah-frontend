import { useQuery } from '@tanstack/react-query';
import { act, screen, waitFor } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { ApiClient } from '../api/ApiClient';
import { useEntrar, useSair, useTrocarContexto } from '../hooks/autenticacaoHooks';
import { api, CONTEXTOS, problema } from '../testes/handlers';
import { renderizar } from '../testes/renderizar';
import { servidor } from '../testes/servidor';
import { useSessao } from './SessaoContext';

let buscas = 0;

/** Dado que só existe com sessão (como as telas logadas, que saem da tela no logout). */
function DadosLogados() {
  const dados = useQuery({
    queryKey: ['exemplo'],
    queryFn: () => {
      buscas++;
      return 'em cache';
    },
  });
  return <p>cache: {dados.data ?? 'vazio'}</p>;
}

function PainelSessao() {
  const { sessao } = useSessao();
  const entrar = useEntrar();
  const sair = useSair();
  const trocar = useTrocarContexto();
  return (
    <div>
      <p>perfil: {sessao?.contexto.perfil ?? 'nenhum'}</p>
      {sessao && <DadosLogados />}
      <button onClick={() => entrar.mutate({ email: 'helena.prado@demo.com.br', senha: 'demo123' })}>entrar</button>
      <button onClick={() => sair.mutate()}>sair</button>
      <button onClick={() => trocar.mutate({ condominioId: 1, perfil: 'sindico' })}>trocar</button>
    </div>
  );
}

describe('SessaoContext', () => {
  it('deveGuardarTokensEContextoNoLocalStorageAoEntrar', async () => {
    const { usuario } = renderizar(<PainelSessao />, { perfil: null });
    expect(screen.getByText('perfil: nenhum')).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'entrar' }));

    await waitFor(() => expect(screen.getByText('perfil: sindico')).toBeInTheDocument());
    expect(localStorage.getItem('morah.accessToken')).toBe('access-sindico');
    expect(localStorage.getItem('morah.refreshToken')).toBe('refresh-sindico');
    expect(JSON.parse(localStorage.getItem('morah.sessao')!)).toEqual({ contexto: CONTEXTOS.sindico, perfisDisponiveis: [CONTEXTOS.sindico] });
  });

  it('deveRecuperarASessaoSalvaAoAbrirOApp', () => {
    renderizar(<PainelSessao />, { perfil: 'portaria' });
    expect(screen.getByText('perfil: portaria')).toBeInTheDocument();
  });

  it('deveLimparTudoNoLogoutMesmoSeOServidorFalhar', async () => {
    servidor.use(http.post(api('/auth/logout'), () => problema(500, 'Erro inesperado no servidor')));
    const { usuario, clienteQuery } = renderizar(<PainelSessao />, { perfil: 'morador' });
    await screen.findByText('cache: em cache');

    await usuario.click(screen.getByRole('button', { name: 'sair' }));

    await waitFor(() => expect(screen.getByText('perfil: nenhum')).toBeInTheDocument());
    expect(localStorage.getItem('morah.accessToken')).toBeNull();
    expect(localStorage.getItem('morah.sessao')).toBeNull();
    expect(clienteQuery.getQueryData(['exemplo'])).toBeUndefined();
  });

  it('deveTrocarOContextoComNovosTokensELimparOCache', async () => {
    const { usuario } = renderizar(<PainelSessao />, { perfil: 'proprietario' });
    await screen.findByText('cache: em cache');
    const buscasAntes = buscas;

    await usuario.click(screen.getByRole('button', { name: 'trocar' }));

    await waitFor(() => expect(screen.getByText('perfil: sindico')).toBeInTheDocument());
    expect(localStorage.getItem('morah.accessToken')).toBe('access-contexto');
    expect(localStorage.getItem('morah.refreshToken')).toBe('refresh-contexto');
    // o cache do contexto anterior foi descartado: o dado é buscado de novo
    await screen.findByText('cache: em cache');
    expect(buscas).toBe(buscasAntes + 1);
  });

  it('deveVoltarSemSessaoQuandoORefreshFalha', async () => {
    servidor.use(
      http.get(api('/auth/me'), () => problema(401, 'Token ausente, expirado, inválido ou de sessão encerrada')),
      http.post(api('/auth/refresh'), () => problema(401, 'Refresh token inválido')),
    );
    renderizar(<PainelSessao />, { perfil: 'morador' });
    await act(async () => {
      await ApiClient.getInstance().get('/auth/me').catch(() => undefined);
    });
    await waitFor(() => expect(screen.getByText('perfil: nenhum')).toBeInTheDocument());
    expect(screen.getByText('Sua sessão terminou. Entre de novo.')).toBeInTheDocument();
  });
});
