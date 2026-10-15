import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { api, problema } from '../../testes/handlers';
import { renderizar } from '../../testes/renderizar';
import { servidor } from '../../testes/servidor';
import { CadastrarInquilinoPage } from './CadastrarInquilinoPage';
import { InquilinosPage } from './InquilinosPage';
import { MinhaUnidadePage } from './MinhaUnidadePage';
import { SolicitarVinculoPage } from './SolicitarVinculoPage';
import { UnidadesPage } from './UnidadesPage';

describe('MinhaUnidadePage', () => {
  it('deveMostrarAUnidadeEOsVinculos', async () => {
    renderizar(<MinhaUnidadePage />, { perfil: 'proprietario' });
    expect(screen.getAllByText('Carregando...').length).toBeGreaterThan(0);
    expect(await screen.findByRole('heading', { name: 'Apto 302' })).toBeInTheDocument();
    expect(await screen.findByText('Rafael Nunes')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inquilinos' })).toBeInTheDocument();
  });

  it('moradorNaoVeOAtalhoDeInquilinos', async () => {
    renderizar(<MinhaUnidadePage />, { perfil: 'morador' });
    await screen.findByRole('heading', { name: 'Apto 302' });
    expect(screen.queryByRole('link', { name: 'Inquilinos' })).not.toBeInTheDocument();
  });

  it('deveMostrarVazioEErro', async () => {
    servidor.use(
      http.get(api('/unidades/minha/vinculos'), () => HttpResponse.json([])),
      http.get(api('/unidades/minha'), () => problema(500, 'Erro inesperado no servidor')),
    );
    renderizar(<MinhaUnidadePage />);
    expect(await screen.findByText('Nenhum vínculo cadastrado nesta unidade.')).toBeInTheDocument();
    expect(await screen.findByText('Erro inesperado no servidor')).toBeInTheDocument();
  });
});

describe('SolicitarVinculoPage', () => {
  it('deveValidarOEnviarEMostrarAguardandoAprovacao', async () => {
    let corpo: unknown;
    servidor.use(
      http.post(api('/unidades/minha/vinculos/solicitacoes'), async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json({ id: 9, unidadeId: 2, tipoVinculo: 'dependente', nomeSolicitado: 'Lia', status: 'pendente', solicitadoEm: '2026-10-14T12:00:00Z' }, { status: 202 });
      }),
    );
    const { usuario } = renderizar(<SolicitarVinculoPage />);
    await usuario.click(screen.getByRole('button', { name: 'Enviar solicitação' }));
    expect(screen.getByText('Informe o nome.')).toBeInTheDocument();
    await usuario.type(screen.getByLabelText(/^Nome/), 'Lia');
    await usuario.click(screen.getByRole('button', { name: 'Enviar solicitação' }));
    expect(await screen.findByText('Aguardando aprovação do síndico')).toBeInTheDocument();
    expect(corpo).toEqual({ tipoVinculo: 'dependente', nome: 'Lia' });
  });

  it('deveMostrarOsErrosDoServidor', async () => {
    servidor.use(http.post(api('/unidades/minha/vinculos/solicitacoes'), () => problema(400, 'Um ou mais campos são inválidos', [{ campo: 'nome', mensagem: 'não deve estar em branco' }])));
    const { usuario } = renderizar(<SolicitarVinculoPage />);
    await usuario.type(screen.getByLabelText(/^Nome/), ' x');
    await usuario.click(screen.getByRole('button', { name: 'Enviar solicitação' }));
    expect(await screen.findByText('não deve estar em branco')).toBeInTheDocument();
  });
});

describe('Inquilinos', () => {
  it('deveListarSoInquilinosEEncerrarComConfirmacao', async () => {
    let encerrado = 0;
    servidor.use(
      http.delete(api('/unidades/minha/inquilinos/:vinculoId'), ({ params }) => {
        encerrado = Number(params.vinculoId);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { usuario } = renderizar(<InquilinosPage />, { perfil: 'proprietario' });
    const ativo = await screen.findByRole('region', { name: 'Bruno Lima' });
    expect(within(ativo).getByText('Ativo')).toBeInTheDocument();
    const encerradoAntes = screen.getByRole('region', { name: 'Carla Souza' });
    expect(within(encerradoAntes).getByText('Encerrado')).toBeInTheDocument();
    expect(within(encerradoAntes).queryByRole('button', { name: 'Encerrar contrato' })).not.toBeInTheDocument();
    expect(screen.queryByText('Rafael Nunes')).not.toBeInTheDocument();

    await usuario.click(within(ativo).getByRole('button', { name: 'Encerrar contrato' }));
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Encerrar' }));
    await waitFor(() => expect(encerrado).toBe(2));
    expect(await screen.findByText('Contrato encerrado')).toBeInTheDocument();
  });

  it('cadastrarDeveValidarEEnviar', async () => {
    let corpo: unknown;
    servidor.use(
      http.post(api('/unidades/minha/inquilinos'), async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json({ id: 10, unidadeId: 1, pessoa: { id: 11, nome: 'Davi' }, tipoVinculo: 'inquilino' }, { status: 201 });
      }),
    );
    const { usuario } = renderizar(<CadastrarInquilinoPage />, { perfil: 'proprietario', rota: '/unidade/inquilinos/novo', caminho: '/unidade/inquilinos/novo' });
    await usuario.type(screen.getByLabelText(/E-mail/), 'invalido');
    await usuario.click(screen.getByRole('button', { name: 'Cadastrar' }));
    expect(screen.getByText('Informe o nome.')).toBeInTheDocument();
    expect(screen.getByText('Informe o CPF.')).toBeInTheDocument();
    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument();
    expect(screen.getByText('Informe o início do contrato.')).toBeInTheDocument();

    await usuario.type(screen.getByLabelText(/^Nome/), 'Davi');
    await usuario.type(screen.getByLabelText(/^CPF/), '12345678900');
    await usuario.clear(screen.getByLabelText(/E-mail/));
    await usuario.type(screen.getByLabelText(/E-mail/), 'davi@exemplo.com');
    await usuario.type(screen.getByLabelText(/Início do contrato/), '2026-11-01');
    await usuario.click(screen.getByRole('button', { name: 'Cadastrar' }));
    await waitFor(() => expect(corpo).toEqual({ nome: 'Davi', cpf: '12345678900', email: 'davi@exemplo.com', contratoInicio: '2026-11-01' }));
    expect(await screen.findByText('Outra tela')).toBeInTheDocument();
  });

  it('cadastrarDeveMostrarOErroDoServidor', async () => {
    servidor.use(http.post(api('/unidades/minha/inquilinos'), () => problema(400, 'Já existe uma pessoa cadastrada com este e-mail')));
    const { usuario } = renderizar(<CadastrarInquilinoPage />, { perfil: 'proprietario' });
    await usuario.type(screen.getByLabelText(/^Nome/), 'Davi');
    await usuario.type(screen.getByLabelText(/^CPF/), '1');
    await usuario.type(screen.getByLabelText(/Início do contrato/), '2026-11-01');
    await usuario.click(screen.getByRole('button', { name: 'Cadastrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe uma pessoa cadastrada com este e-mail');
  });
});

describe('UnidadesPage', () => {
  it('deveBuscarPeloIdEAprovarASolicitacao', async () => {
    let corpo: unknown;
    servidor.use(
      http.patch(api('/unidades/:unidadeId/vinculos/solicitacoes/:solicitacaoId'), async ({ request, params }) => {
        corpo = { ...((await request.json()) as object), unidade: params.unidadeId, solicitacao: params.solicitacaoId };
        return HttpResponse.json({ id: 4, unidadeId: 1, tipoVinculo: 'dependente', nomeSolicitado: 'Lia Nunes', status: 'aprovada', solicitadoEm: '2026-10-10T12:00:00Z' });
      }),
    );
    const { usuario } = renderizar(<UnidadesPage />, { perfil: 'sindico' });
    await usuario.type(screen.getByLabelText(/ID da unidade/), '1');
    await usuario.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByRole('heading', { name: 'Apto 302' })).toBeInTheDocument();
    const solicitacao = await screen.findByRole('region', { name: 'Lia Nunes' });
    await usuario.click(within(solicitacao).getByRole('button', { name: 'Aprovar' }));
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Aprovar' }));
    await waitFor(() => expect(corpo).toEqual({ decisao: 'aprovada', unidade: '1', solicitacao: '4' }));
    expect(await screen.findByText('Solicitação aprovada')).toBeInTheDocument();
  });

  it('deveMostrarUnidadeNaoEncontradaNo404', async () => {
    const { usuario } = renderizar(<UnidadesPage />, { perfil: 'sindico' });
    await usuario.type(screen.getByLabelText(/ID da unidade/), '99');
    await usuario.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByText('Unidade não encontrada.')).toBeInTheDocument();
  });

  it('decisaoRepetidaDeveMostrarOConflito', async () => {
    servidor.use(http.patch(api('/unidades/:unidadeId/vinculos/solicitacoes/:solicitacaoId'), () => problema(409, 'Solicitação já decidida')));
    const { usuario } = renderizar(<UnidadesPage />, { perfil: 'sindico' });
    await usuario.type(screen.getByLabelText(/ID da unidade/), '1');
    await usuario.click(screen.getByRole('button', { name: 'Buscar' }));
    const solicitacao = await screen.findByRole('region', { name: 'Lia Nunes' });
    await usuario.click(within(solicitacao).getByRole('button', { name: 'Rejeitar' }));
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Rejeitar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Solicitação já decidida');
  });
});
