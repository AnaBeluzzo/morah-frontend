import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { api, pagina, problema } from '../../testes/handlers';
import { renderizar } from '../../testes/renderizar';
import { servidor } from '../../testes/servidor';
import { AcessosPage } from './AcessosPage';
import { AutorizacaoPage } from './AutorizacaoPage';
import { AutorizacoesPage } from './AutorizacoesPage';
import { RegistrarVisitantePage } from './RegistrarVisitantePage';

const DETALHE = { caminho: '/visitantes/:autorizacaoId' };

describe('AutorizacoesPage', () => {
  it('portariaDeveVerAFilaComOsAtalhos', async () => {
    renderizar(<AutorizacoesPage />, { perfil: 'portaria' });
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    const marcos = await screen.findByRole('link', { name: 'Marcos Silva' });
    expect(within(marcos).getByText('Pendente')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Registrar visitante' })).toBeInTheDocument();
  });

  it('moradorNaoVeOsAtalhosDaPortariaEFiltraPorStatus', async () => {
    const buscas: string[] = [];
    servidor.use(
      http.get(api('/portaria/autorizacoes'), ({ request }) => {
        buscas.push(new URL(request.url).search);
        return HttpResponse.json(pagina([]));
      }),
    );
    const { usuario } = renderizar(<AutorizacoesPage />, { perfil: 'proprietario' });
    expect(await screen.findByText('Nenhuma visita com esse filtro.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Registrar visitante' })).not.toBeInTheDocument();
    await usuario.selectOptions(screen.getByLabelText('Mostrar'), 'pendente');
    await waitFor(() => expect(buscas.at(-1)).toContain('status=pendente'));
  });

  it('deveMostrarErro', async () => {
    servidor.use(http.get(api('/portaria/autorizacoes'), () => problema(500, 'Erro inesperado no servidor')));
    renderizar(<AutorizacoesPage />, { perfil: 'portaria' });
    expect(await screen.findByText('Erro inesperado no servidor')).toBeInTheDocument();
  });
});

describe('AutorizacaoPage', () => {
  it('moradorDeveAutorizarComConfirmacao', async () => {
    let corpo: unknown;
    servidor.use(
      http.patch(api('/portaria/autorizacoes/:autorizacaoId/decisao'), async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json({ id: 1, visitante: { id: 1, nome: 'Marcos Silva' }, unidadeId: 1, motivo: 'Visita', solicitadoEm: '2026-10-14T21:00:00Z', status: 'autorizada' });
      }),
    );
    const { usuario } = renderizar(<AutorizacaoPage />, { ...DETALHE, rota: '/visitantes/1', perfil: 'proprietario' });
    await usuario.click(await screen.findByRole('button', { name: 'Autorizar' }));
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Autorizar' }));
    await waitFor(() => expect(corpo).toEqual({ decisao: 'autorizado' }));
    expect(await screen.findByText('Autorizada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Autorizar' })).toBeDisabled();
  });

  it('expiradaDeveDesabilitarAutorizarERecusar', async () => {
    renderizar(<AutorizacaoPage />, { ...DETALHE, rota: '/visitantes/3', perfil: 'morador' });
    expect(await screen.findByRole('button', { name: 'Autorizar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Recusar' })).toBeDisabled();
  });

  it('decisaoRepetidaDeveMostrarOConflito', async () => {
    servidor.use(http.patch(api('/portaria/autorizacoes/:autorizacaoId/decisao'), () => problema(409, 'Autorização já decidida')));
    const { usuario } = renderizar(<AutorizacaoPage />, { ...DETALHE, rota: '/visitantes/1', perfil: 'proprietario' });
    await usuario.click(await screen.findByRole('button', { name: 'Recusar' }));
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Recusar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Autorização já decidida');
  });

  it('portariaSoVeReenviarQuandoPendente', async () => {
    let reenviou = false;
    servidor.use(
      http.post(api('/portaria/autorizacoes/:autorizacaoId/reenviar'), () => {
        reenviou = true;
        return new HttpResponse(null, { status: 202 });
      }),
    );
    const { usuario, unmount } = renderizar(<AutorizacaoPage />, { ...DETALHE, rota: '/visitantes/1', perfil: 'portaria' });
    await usuario.click(await screen.findByRole('button', { name: 'Reenviar notificação' }));
    await waitFor(() => expect(reenviou).toBe(true));
    expect(screen.queryByRole('button', { name: 'Registrar entrada' })).not.toBeInTheDocument();
    unmount();
    renderizar(<AutorizacaoPage />, { ...DETALHE, rota: '/visitantes/2', perfil: 'portaria' });
    expect(await screen.findByRole('button', { name: 'Registrar entrada' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reenviar notificação' })).not.toBeInTheDocument();
  });

  it('portariaRegistraEntradaComVisitanteEAutorizacao', async () => {
    let corpo: unknown;
    servidor.use(
      http.post(api('/portaria/acessos'), async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json({ id: 5, visitante: { id: 2, nome: 'Ana Costa' }, entrada: '2026-10-14T18:10:00Z', status: 'no_condominio' }, { status: 201 });
      }),
    );
    const { usuario } = renderizar(<AutorizacaoPage />, { ...DETALHE, rota: '/visitantes/2', perfil: 'portaria' });
    await usuario.click(await screen.findByRole('button', { name: 'Registrar entrada' }));
    await waitFor(() => expect(corpo).toEqual({ visitanteId: 2, autorizacaoId: 2, tipo: 'entrada' }));
    expect(await screen.findByText('Entrada registrada em 14/10/2026 15:10.')).toBeInTheDocument();
  });
});

describe('RegistrarVisitantePage', () => {
  it('deveValidarNoCliente', async () => {
    const { usuario } = renderizar(<RegistrarVisitantePage />, { perfil: 'portaria' });
    await usuario.click(screen.getByRole('button', { name: 'Registrar e avisar a unidade' }));
    expect(screen.getByText('Informe o ID da unidade.')).toBeInTheDocument();
    expect(screen.getByText('Informe o nome do visitante.')).toBeInTheDocument();
    expect(screen.getByText('Informe o motivo da visita.')).toBeInTheDocument();
  });

  it('unidadeInexistenteDeveMostrarUnidadeNaoEncontrada', async () => {
    const { usuario } = renderizar(<RegistrarVisitantePage />, { perfil: 'portaria' });
    await usuario.type(screen.getByLabelText(/ID da unidade/), '77');
    await usuario.type(screen.getByLabelText(/Nome do visitante/), 'Bia');
    await usuario.type(screen.getByLabelText(/Motivo/), 'Visita');
    await usuario.click(screen.getByRole('button', { name: 'Registrar e avisar a unidade' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Unidade não encontrada');
  });

  it('deveMostrarOsErrosDoServidorNosCampos', async () => {
    servidor.use(http.post(api('/portaria/visitantes'), () => problema(400, 'Um ou mais campos são inválidos', [{ campo: 'visitante.nome', mensagem: 'não deve estar em branco' }])));
    const { usuario } = renderizar(<RegistrarVisitantePage />, { perfil: 'portaria' });
    await usuario.type(screen.getByLabelText(/ID da unidade/), '1');
    await usuario.type(screen.getByLabelText(/Nome do visitante/), ' ');
    await usuario.type(screen.getByLabelText(/Nome do visitante/), 'x');
    await usuario.type(screen.getByLabelText(/Motivo/), 'Visita');
    await usuario.click(screen.getByRole('button', { name: 'Registrar e avisar a unidade' }));
    expect(await screen.findByText('não deve estar em branco')).toBeInTheDocument();
  });

  it('deveRegistrarEAbrirAVisita', async () => {
    let corpo: unknown;
    servidor.use(
      http.post(api('/portaria/visitantes'), async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json({ id: 9, visitante: { id: 9, nome: 'Bia' }, unidadeId: 1, motivo: 'Visita', solicitadoEm: '2026-10-14T21:30:00Z', status: 'pendente' }, { status: 201 });
      }),
    );
    const { usuario } = renderizar(<RegistrarVisitantePage />, { perfil: 'portaria', rota: '/visitantes/novo', caminho: '/visitantes/novo' });
    await usuario.type(screen.getByLabelText(/ID da unidade/), '1');
    await usuario.type(screen.getByLabelText(/Nome do visitante/), 'Bia');
    await usuario.type(screen.getByLabelText(/Motivo/), 'Visita');
    await usuario.click(screen.getByRole('button', { name: 'Registrar e avisar a unidade' }));
    await waitFor(() => expect(corpo).toEqual({ unidadeId: 1, visitante: { nome: 'Bia' }, motivo: 'Visita' }));
    expect(await screen.findByText('Outra tela')).toBeInTheDocument();
  });
});

describe('AcessosPage', () => {
  it('portariaDeveRegistrarASaidaDeQuemEstaNoCondominio', async () => {
    let corpo: unknown;
    servidor.use(
      http.post(api('/portaria/acessos'), async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json({ id: 1, visitante: { id: 2, nome: 'Ana Costa' }, entrada: '2026-10-14T18:10:00Z', saida: '2026-10-14T19:00:00Z', status: 'saiu' }, { status: 201 });
      }),
    );
    const { usuario } = renderizar(<AcessosPage />, { perfil: 'portaria' });
    const ana = await screen.findByRole('region', { name: 'Ana Costa' });
    expect(within(screen.getByRole('region', { name: 'Lucas Prado' })).queryByRole('button')).not.toBeInTheDocument();
    await usuario.click(within(ana).getByRole('button', { name: 'Registrar saída' }));
    await waitFor(() => expect(corpo).toEqual({ visitanteId: 2, tipo: 'saida' }));
    expect(await screen.findByText('Saída registrada')).toBeInTheDocument();
  });

  it('sindicoSoConsultaEFiltraPorDia', async () => {
    const buscas: string[] = [];
    servidor.use(
      http.get(api('/portaria/acessos'), ({ request }) => {
        buscas.push(new URL(request.url).search);
        return HttpResponse.json(pagina([]));
      }),
    );
    const { usuario } = renderizar(<AcessosPage />, { perfil: 'sindico' });
    expect(await screen.findByText('Nenhum acesso registrado nesse dia.')).toBeInTheDocument();
    await usuario.type(screen.getByLabelText('Dia'), '2026-10-14');
    await waitFor(() => expect(buscas.at(-1)).toContain('data=2026-10-14'));
  });
});
