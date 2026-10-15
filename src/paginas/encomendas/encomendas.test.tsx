import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { api, pagina, problema } from '../../testes/handlers';
import { renderizar } from '../../testes/renderizar';
import { servidor } from '../../testes/servidor';
import { AutorizarTerceiroPage } from './AutorizarTerceiroPage';
import { DetalheEncomendaPage } from './DetalheEncomendaPage';
import { EncomendasPage } from './EncomendasPage';
import { ExtravioPage } from './ExtravioPage';
import { RegistrarEncomendaPage } from './RegistrarEncomendaPage';
import { RetiradaPage } from './RetiradaPage';

const DETALHE = { caminho: '/encomendas/:encomendaId' };

describe('EncomendasPage', () => {
  it('moradorVeOCodigoDeRetiradaNaLista', async () => {
    renderizar(<EncomendasPage />, { perfil: 'proprietario' });
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    const correios = await screen.findByRole('link', { name: 'Correios de Loja X' });
    expect(within(correios).getByText('Aguardando retirada')).toBeInTheDocument();
    expect(within(correios).getByText('Código de retirada: 482913')).toBeInTheDocument();
    // a já retirada não mostra mais o código
    expect(within(screen.getByRole('link', { name: 'Jadlog' })).queryByText(/Código/)).not.toBeInTheDocument();
  });

  it('portariaNaoVeOCodigoEPodeRegistrar', async () => {
    renderizar(<EncomendasPage />, { perfil: 'portaria' });
    const correios = await screen.findByRole('link', { name: 'Correios de Loja X' });
    expect(within(correios).queryByText(/Código/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Registrar encomenda' })).toBeInTheDocument();
  });

  it('deveFiltrarPorStatusEMostrarVazio', async () => {
    const buscas: string[] = [];
    servidor.use(
      http.get(api('/encomendas'), ({ request }) => {
        buscas.push(new URL(request.url).search);
        return HttpResponse.json(pagina([]));
      }),
    );
    const { usuario } = renderizar(<EncomendasPage />, { perfil: 'sindico' });
    expect(await screen.findByText('Nenhuma encomenda com esse filtro.')).toBeInTheDocument();
    await usuario.selectOptions(screen.getByLabelText('Mostrar'), 'extraviada');
    await waitFor(() => expect(buscas.at(-1)).toContain('status=extraviada'));
  });

  it('deveMostrarErro', async () => {
    servidor.use(http.get(api('/encomendas'), () => problema(500, 'Erro inesperado no servidor')));
    renderizar(<EncomendasPage />, { perfil: 'sindico' });
    expect(await screen.findByText('Erro inesperado no servidor')).toBeInTheDocument();
  });
});

describe('DetalheEncomendaPage', () => {
  it('moradorVeOCodigoEAsAcoes', async () => {
    renderizar(<DetalheEncomendaPage />, { ...DETALHE, rota: '/encomendas/1', perfil: 'morador' });
    expect(await screen.findByLabelText('Código de retirada')).toHaveTextContent('482913');
    expect(screen.getByRole('link', { name: 'Autorizar outra pessoa a retirar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Informar extravio' })).toBeInTheDocument();
  });

  it('portariaConfirmaRetiradaSoSeAguardando', async () => {
    const { unmount } = renderizar(<DetalheEncomendaPage />, { ...DETALHE, rota: '/encomendas/1', perfil: 'portaria' });
    expect(await screen.findByRole('link', { name: 'Confirmar retirada' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Código de retirada')).not.toBeInTheDocument();
    unmount();
    renderizar(<DetalheEncomendaPage />, { ...DETALHE, rota: '/encomendas/2', perfil: 'portaria' });
    expect(await screen.findByText('Retirada')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Confirmar retirada' })).not.toBeInTheDocument();
  });
});

describe('formulários de encomendas', () => {
  it('registrarDeveValidarEMostrarUnidadeNaoEncontrada', async () => {
    const { usuario } = renderizar(<RegistrarEncomendaPage />, { perfil: 'portaria' });
    await usuario.click(screen.getByRole('button', { name: 'Registrar e avisar a unidade' }));
    expect(screen.getByText('Informe o ID da unidade.')).toBeInTheDocument();
    expect(screen.getByText('Informe a transportadora.')).toBeInTheDocument();
    await usuario.type(screen.getByLabelText(/ID da unidade/), '9');
    await usuario.type(screen.getByLabelText(/Transportadora/), 'Correios');
    await usuario.click(screen.getByRole('button', { name: 'Registrar e avisar a unidade' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Unidade não encontrada');
  });

  it('retiradaComCodigoErradoMostraOConflitoEComOCertoConfirma', async () => {
    let corpo: unknown;
    const { usuario } = renderizar(<RetiradaPage />, { rota: '/encomendas/1/retirada', caminho: '/encomendas/:encomendaId/retirada', perfil: 'portaria' });
    await usuario.type(screen.getByLabelText(/Código de retirada/), '000000');
    await usuario.click(screen.getByRole('button', { name: 'Confirmar retirada' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Código de retirada inválido ou expirado');

    servidor.use(
      http.post(api('/encomendas/:encomendaId/retirada'), async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json({ id: 1, unidadeId: 1, transportadora: 'Correios', recebidaEm: '2026-10-14T21:59:55Z', status: 'retirada' });
      }),
    );
    await usuario.clear(screen.getByLabelText(/Código de retirada/));
    await usuario.type(screen.getByLabelText(/Código de retirada/), '482913');
    await usuario.type(screen.getByLabelText(/Nome de quem retira/), 'Rafael');
    await usuario.click(screen.getByRole('button', { name: 'Confirmar retirada' }));
    await waitFor(() => expect(corpo).toEqual({ codigo: '482913', retiradoPorNome: 'Rafael' }));
    expect(await screen.findByText('Outra tela')).toBeInTheDocument();
  });

  it('autorizarTerceiroDeveValidarEMostrarOCodigoGerado', async () => {
    const { usuario } = renderizar(<AutorizarTerceiroPage />, { rota: '/encomendas/1/autorizar-terceiro', caminho: '/encomendas/:encomendaId/autorizar-terceiro' });
    await usuario.clear(screen.getByLabelText(/Validade/));
    await usuario.type(screen.getByLabelText(/Validade/), '0');
    await usuario.click(screen.getByRole('button', { name: 'Gerar código' }));
    expect(screen.getByText('Informe o nome de quem vai retirar.')).toBeInTheDocument();
    expect(screen.getByText('A validade é de pelo menos 1 hora.')).toBeInTheDocument();

    await usuario.type(screen.getByLabelText(/Nome de quem vai retirar/), 'Joana');
    await usuario.type(screen.getByLabelText(/^Documento/), 'RG 1');
    await usuario.clear(screen.getByLabelText(/Validade/));
    await usuario.type(screen.getByLabelText(/Validade/), '2');
    await usuario.click(screen.getByRole('button', { name: 'Gerar código' }));
    expect(await screen.findByLabelText('Código do terceiro')).toHaveTextContent('777888');
    await usuario.click(screen.getByRole('button', { name: 'Copiar código' }));
    expect(await navigator.clipboard.readText()).toBe('777888');
  });

  it('extravioDeveAbrirOcorrencia', async () => {
    let corpo: unknown;
    servidor.use(
      http.post(api('/encomendas/:encomendaId/ocorrencias'), async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json({ id: 1, titulo: 't', descricao: 'd', status: 'aberta', abertaEm: '2026-10-14T23:00:00Z' }, { status: 201 });
      }),
    );
    const { usuario } = renderizar(<ExtravioPage />, { rota: '/encomendas/1/extravio', caminho: '/encomendas/:encomendaId/extravio' });
    await usuario.click(screen.getByRole('button', { name: 'Abrir ocorrência de extravio' }));
    expect(screen.getByText('Conte o que aconteceu.')).toBeInTheDocument();
    await usuario.type(screen.getByLabelText(/O que aconteceu/), 'Não chegou');
    await usuario.click(screen.getByRole('button', { name: 'Abrir ocorrência de extravio' }));
    await waitFor(() => expect(corpo).toEqual({ titulo: 'Encomenda não encontrada na portaria', descricao: 'Não chegou' }));
    expect(await screen.findByText('Outra tela')).toBeInTheDocument();
  });
});
