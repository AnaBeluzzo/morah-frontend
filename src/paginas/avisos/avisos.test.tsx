import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { api, AVISOS, ID_AVISO_EXPIRADO, pagina, problema } from '../../testes/handlers';
import { renderizar } from '../../testes/renderizar';
import { servidor } from '../../testes/servidor';
import { AvisoPage } from './AvisoPage';
import { FormularioAvisoPage } from './FormularioAvisoPage';
import { MuralPage } from './MuralPage';

describe('MuralPage', () => {
  it('deveMostrarCarregandoEDepoisOsAvisosComDestaqueELido', async () => {
    renderizar(<MuralPage />);
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    const urgente = await screen.findByRole('link', { name: 'Falta de água' });
    expect(within(urgente).getByText('Urgente')).toBeInTheDocument();
    expect(within(urgente).getByText('Não lido')).toBeInTheDocument();
    expect(within(screen.getByRole('link', { name: 'Bem-vindos ao Morah' })).getByText('Lido')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Novo aviso' })).not.toBeInTheDocument();
  });

  it('deveMostrarVazio', async () => {
    servidor.use(http.get(api('/avisos'), () => HttpResponse.json(pagina([]))));
    renderizar(<MuralPage />);
    expect(await screen.findByText('Nenhum aviso vigente.')).toBeInTheDocument();
  });

  it('deveMostrarErro', async () => {
    servidor.use(http.get(api('/avisos'), () => problema(500, 'Erro inesperado no servidor')));
    renderizar(<MuralPage />);
    expect(await screen.findByText('Erro inesperado no servidor')).toBeInTheDocument();
  });

  it('sindicoDeveVerNovoAvisoEFiltrarPorPrioridade', async () => {
    const buscas: string[] = [];
    servidor.use(
      http.get(api('/avisos'), ({ request }) => {
        buscas.push(new URL(request.url).search);
        return HttpResponse.json(pagina(AVISOS));
      }),
    );
    const { usuario } = renderizar(<MuralPage />, { perfil: 'sindico' });
    expect(await screen.findByRole('link', { name: 'Novo aviso' })).toBeInTheDocument();
    await usuario.click(screen.getByText('Filtros'));
    await usuario.selectOptions(screen.getByLabelText('Prioridade'), 'urgente');
    await waitFor(() => expect(buscas.at(-1)).toContain('prioridade=urgente'));
  });
});

describe('AvisoPage', () => {
  it('deveMostrarODetalhe', async () => {
    renderizar(<AvisoPage />, { rota: '/avisos/2', caminho: '/avisos/:avisoId' });
    expect(await screen.findByRole('heading', { name: 'Falta de água' })).toBeInTheDocument();
    expect(screen.getByText('Helena Prado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Expirar aviso' })).not.toBeInTheDocument();
  });

  it('avisoExpiradoDeveMostrarQueNaoEstaMaisEmVigencia', async () => {
    renderizar(<AvisoPage />, { rota: `/avisos/${ID_AVISO_EXPIRADO}`, caminho: '/avisos/:avisoId' });
    expect(await screen.findByText('Este aviso não está mais em vigência.')).toBeInTheDocument();
  });

  it('sindicoDeveExpirarDepoisDeConfirmar', async () => {
    let expirado = 0;
    servidor.use(
      http.delete(api('/avisos/:avisoId'), ({ params }) => {
        expirado = Number(params.avisoId);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { usuario } = renderizar(<AvisoPage />, { rota: '/avisos/2', caminho: '/avisos/:avisoId', perfil: 'sindico' });
    await usuario.click(await screen.findByRole('button', { name: 'Expirar aviso' }));
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Expirar' }));
    await waitFor(() => expect(expirado).toBe(2));
    expect(await screen.findByText('Outra tela')).toBeInTheDocument();
  });
});

describe('FormularioAvisoPage', () => {
  it('deveValidarNoClienteEPedirOIdDaUnidade', async () => {
    const { usuario } = renderizar(<FormularioAvisoPage />, { rota: '/avisos/novo', caminho: '/avisos/novo', perfil: 'sindico' });
    await usuario.selectOptions(screen.getByLabelText('Público'), 'unidade');
    await usuario.click(screen.getByRole('button', { name: 'Publicar' }));
    expect(screen.getByText('Informe o título.')).toBeInTheDocument();
    expect(screen.getByText('Informe o conteúdo.')).toBeInTheDocument();
    expect(screen.getByText('Informe o ID da unidade.')).toBeInTheDocument();
  });

  it('deveMostrarOsErrosDoServidorEmCadaCampo', async () => {
    servidor.use(http.post(api('/avisos'), () => problema(400, 'Um ou mais campos são inválidos', [{ campo: 'titulo', mensagem: 'tamanho deve ser entre 1 e 120' }])));
    const { usuario } = renderizar(<FormularioAvisoPage />, { rota: '/avisos/novo', caminho: '/avisos/novo', perfil: 'sindico' });
    await usuario.type(screen.getByLabelText(/Título/), 'x');
    await usuario.type(screen.getByLabelText(/Conteúdo/), 'y');
    await usuario.click(screen.getByRole('button', { name: 'Publicar' }));
    expect(await screen.findByText('tamanho deve ser entre 1 e 120')).toBeInTheDocument();
  });

  it('devePublicarParaUmaUnidade', async () => {
    let corpo: unknown;
    servidor.use(
      http.post(api('/avisos'), async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json({ ...AVISOS[0], id: 10 }, { status: 201 });
      }),
    );
    const { usuario } = renderizar(<FormularioAvisoPage />, { rota: '/avisos/novo', caminho: '/avisos/novo', perfil: 'sindico' });
    await usuario.type(screen.getByLabelText(/Título/), 'Portão');
    await usuario.type(screen.getByLabelText(/Conteúdo/), 'Portão em manutenção');
    await usuario.selectOptions(screen.getByLabelText('Público'), 'unidade');
    await usuario.type(screen.getByLabelText(/ID da unidade/), '1');
    await usuario.click(screen.getByRole('button', { name: 'Publicar' }));
    await waitFor(() =>
      expect(corpo).toEqual({ titulo: 'Portão', conteudo: 'Portão em manutenção', prioridade: 'normal', publicoAlvo: { tipo: 'unidade', unidadeId: 1 } }),
    );
    expect(await screen.findByText('Outra tela')).toBeInTheDocument();
  });

  it('editarDeveEnviarSoOTituloAlterado', async () => {
    let corpo = '';
    servidor.use(
      http.patch(api('/avisos/:avisoId'), async ({ request }) => {
        corpo = await request.text();
        return HttpResponse.json({ ...AVISOS[0], titulo: 'Falta de água amanhã' });
      }),
    );
    const { usuario } = renderizar(<FormularioAvisoPage />, { rota: '/avisos/2/editar', caminho: '/avisos/:avisoId/editar', perfil: 'sindico' });
    const titulo = await screen.findByLabelText(/Título/);
    await usuario.type(titulo, ' amanhã');
    await usuario.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() => expect(corpo).toBe('{"titulo":"Falta de água amanhã"}'));
  });
});
