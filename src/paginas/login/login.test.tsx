import { screen, waitFor, within } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { api, CONTEXTOS, ME_PROPRIETARIO, problema } from '../../testes/handlers';
import { renderizar } from '../../testes/renderizar';
import { servidor } from '../../testes/servidor';
import { LoginPage } from './LoginPage';
import { PerfilPage } from './PerfilPage';
import { TrocarPerfilPage } from './TrocarPerfilPage';

describe('LoginPage', () => {
  it('deveValidarCamposNoCliente', async () => {
    const { usuario } = renderizar(<LoginPage />, { perfil: null, caminho: '/login', rota: '/login' });
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(screen.getByText('Informe o e-mail.')).toBeInTheDocument();
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument();

    await usuario.type(screen.getByLabelText(/E-mail/), 'sem-arroba');
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument();
  });

  it('deveMostrarOErro401Amigavel', async () => {
    const { usuario } = renderizar(<LoginPage />, { perfil: null, caminho: '/login', rota: '/login' });
    await usuario.type(screen.getByLabelText(/E-mail/), 'rafael.nunes@demo.com.br');
    await usuario.type(screen.getByLabelText(/^Senha/), 'errada');
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos');
  });

  it('deveMostrarOsErrosDoServidorEmCadaCampo', async () => {
    servidor.use(
      http.post(api('/auth/login'), () =>
        problema(400, 'Um ou mais campos são inválidos', [{ campo: 'email', mensagem: 'deve ser um endereço de e-mail bem formado' }]),
      ),
    );
    const { usuario } = renderizar(<LoginPage />, { perfil: null, caminho: '/login', rota: '/login' });
    await usuario.type(screen.getByLabelText(/E-mail/), 'a@b.c');
    await usuario.type(screen.getByLabelText(/^Senha/), 'x');
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('deve ser um endereço de e-mail bem formado')).toBeInTheDocument();
  });

  it('deveMostrarEOcultarASenha', async () => {
    const { usuario } = renderizar(<LoginPage />, { perfil: null, caminho: '/login', rota: '/login' });
    const senha = screen.getByLabelText(/^Senha/);
    expect(senha).toHaveAttribute('type', 'password');
    await usuario.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(senha).toHaveAttribute('type', 'text');
  });

  it('deveDesabilitarOBotaoEnquantoEnviaEEntrarNoSucesso', async () => {
    servidor.use(
      http.post(api('/auth/login'), async () => {
        await delay(50);
        return HttpResponse.json({ accessToken: 'a', refreshToken: 'r', contexto: CONTEXTOS.morador, perfisDisponiveis: [CONTEXTOS.morador] });
      }),
    );
    const { usuario } = renderizar(<LoginPage />, { perfil: null, caminho: '/login', rota: '/login' });
    await usuario.click(screen.getByRole('button', { name: /Camila Duarte/ }));
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeDisabled();
    expect(await screen.findByText('Outra tela')).toBeInTheDocument();
    expect(localStorage.getItem('morah.refreshToken')).toBe('r');
  });
});

describe('PerfilPage', () => {
  it('deveMostrarCarregandoEDepoisOsDados', async () => {
    renderizar(<PerfilPage />, { perfil: 'proprietario' });
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Rafael Nunes' })).toBeInTheDocument();
    expect(screen.getByText('Proprietário')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Trocar perfil' })).not.toBeInTheDocument();
  });

  it('deveMostrarErroComTentarDeNovo', async () => {
    servidor.use(http.get(api('/auth/me'), () => problema(500, 'Erro inesperado no servidor')));
    const { usuario } = renderizar(<PerfilPage />, { perfil: 'proprietario' });
    expect(await screen.findByText('Erro inesperado no servidor')).toBeInTheDocument();
    servidor.use(http.get(api('/auth/me'), () => HttpResponse.json(ME_PROPRIETARIO)));
    await usuario.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('heading', { name: 'Rafael Nunes' })).toBeInTheDocument();
  });

  it('deveMostrarTrocarPerfilQuandoHaMaisDeUmaOpcao', async () => {
    renderizar(<PerfilPage />, { perfil: 'proprietario', perfisDisponiveis: [CONTEXTOS.proprietario, CONTEXTOS.sindico] });
    expect(await screen.findByRole('link', { name: 'Trocar perfil' })).toBeInTheDocument();
  });

  it('deveSairDepoisDeConfirmar', async () => {
    let saiu = false;
    servidor.use(
      http.post(api('/auth/logout'), () => {
        saiu = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { usuario } = renderizar(<PerfilPage />, { perfil: 'proprietario', caminho: '/perfil', rota: '/perfil' });
    await usuario.click(screen.getByRole('button', { name: 'Sair' }));
    const dialogo = screen.getByRole('dialog', { name: 'Sair do Morah?' });
    await usuario.click(within(dialogo).getByRole('button', { name: 'Sair' }));
    await waitFor(() => expect(saiu).toBe(true));
    await waitFor(() => expect(localStorage.getItem('morah.refreshToken')).toBeNull());
  });
});

describe('TrocarPerfilPage', () => {
  it('deveTrocarOContextoDepoisDeConfirmar', async () => {
    let corpo: unknown;
    servidor.use(
      http.post(api('/auth/contexto'), async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json({ accessToken: 'n', refreshToken: 'm', contexto: CONTEXTOS.sindico });
      }),
    );
    const { usuario } = renderizar(<TrocarPerfilPage />, {
      perfil: 'proprietario',
      perfisDisponiveis: [CONTEXTOS.proprietario, CONTEXTOS.sindico],
      caminho: '/perfil/trocar',
      rota: '/perfil/trocar',
    });
    expect(screen.getByText('Atual')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: /Síndico em Condomínio Demo/ }));
    await usuario.click(screen.getByRole('button', { name: 'Trocar' }));
    await waitFor(() => expect(corpo).toEqual({ condominioId: 1, perfil: 'sindico' }));
    expect(await screen.findByText('Outra tela')).toBeInTheDocument();
  });

  it('deveMostrarO403QuandoNaoHaOVinculo', async () => {
    servidor.use(http.post(api('/auth/contexto'), () => problema(403, 'Você não possui o vínculo (condomínio, perfil) solicitado')));
    const { usuario } = renderizar(<TrocarPerfilPage />, { perfil: 'proprietario', perfisDisponiveis: [CONTEXTOS.proprietario, CONTEXTOS.sindico] });
    await usuario.click(screen.getByRole('button', { name: /Síndico em Condomínio Demo/ }));
    await usuario.click(screen.getByRole('button', { name: 'Trocar' }));
    expect(await screen.findByText('Você não possui o vínculo (condomínio, perfil) solicitado')).toBeInTheDocument();
  });
});
