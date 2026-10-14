import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { Tela } from '../../componentes/Tela';
import { RotaProtegida } from '../../rotas/RotaProtegida';
import { api, modulos, PERSONALIZACAO, problema } from '../../testes/handlers';
import { renderizar } from '../../testes/renderizar';
import { servidor } from '../../testes/servidor';
import { camposAlterados } from '../../utils/alteracoes';
import { IdentidadeVisualPage } from './IdentidadeVisualPage';
import { ModulosPage } from './ModulosPage';

function variavel(nome: string): string {
  return document.documentElement.style.getPropertyValue(nome);
}

/** Captura o corpo dos PATCH de personalização. */
function capturarPatch() {
  const corpos: string[] = [];
  servidor.use(
    http.patch(api('/condominio/personalizacao'), async ({ request }) => {
      const texto = await request.text();
      corpos.push(texto);
      return HttpResponse.json({ ...PERSONALIZACAO, ...JSON.parse(texto), atualizadoEm: `2026-10-14T12:00:0${corpos.length}Z` });
    }),
  );
  return corpos;
}

describe('TemaContext', () => {
  it('deveAplicarAsCoresDoCondominioComoVariaveisCssENomeNoTopo', async () => {
    servidor.use(http.get(api('/condominio/personalizacao'), () => HttpResponse.json({ ...PERSONALIZACAO, corPrimaria: '#FFFF00', nomeExibicao: 'Residencial Sol' })));
    renderizar(
      <Tela titulo="Início">
        <p>conteúdo</p>
      </Tela>,
    );
    expect(await screen.findByText('Residencial Sol')).toBeInTheDocument();
    expect(variavel('--cor-primaria')).toBe('#FFFF00');
    // amarelo é claro: texto escuro por contraste
    expect(variavel('--cor-primaria-texto')).toBe('#111827');
    expect(variavel('--cor-destaque')).toBe('#F59E0B');
  });

  it('deveMostrarALogoQuandoHouver', async () => {
    servidor.use(http.get(api('/condominio/personalizacao'), () => HttpResponse.json({ ...PERSONALIZACAO, logoUrl: 'https://exemplo.com/logo.png' })));
    renderizar(<Tela titulo="Início">x</Tela>);
    expect(await screen.findByRole('img', { name: 'Logo de Condomínio Demo' })).toHaveAttribute('src', 'https://exemplo.com/logo.png');
  });
});

describe('IdentidadeVisualPage', () => {
  it('deveMostrarCarregandoEDepoisOFormulario', async () => {
    renderizar(<IdentidadeVisualPage />, { perfil: 'sindico' });
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(await screen.findByLabelText(/Nome de exibição/)).toHaveValue('Condomínio Demo');
  });

  it('deveMostrarErroDeCarregamento', async () => {
    servidor.use(http.get(api('/condominio/personalizacao'), () => problema(500, 'Erro inesperado no servidor')));
    renderizar(<IdentidadeVisualPage />, { perfil: 'sindico' });
    expect(await screen.findByText('Erro inesperado no servidor')).toBeInTheDocument();
  });

  it('deveValidarCorENomeNoCliente', async () => {
    const corpos = capturarPatch();
    const { usuario } = renderizar(<IdentidadeVisualPage />, { perfil: 'sindico' });
    const corPrimaria = await screen.findByLabelText('Cor primária');
    await usuario.clear(corPrimaria);
    await usuario.type(corPrimaria, 'azul');
    await usuario.clear(screen.getByLabelText(/Nome de exibição/));
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(screen.getByText('Use o formato #RRGGBB (ex.: #1F4E79).')).toBeInTheDocument();
    expect(screen.getByText('Informe o nome de exibição.')).toBeInTheDocument();
    expect(corpos).toHaveLength(0);
  });

  it('deveMostrarOsErrosDoServidorEmCadaCampo', async () => {
    servidor.use(
      http.patch(api('/condominio/personalizacao'), () =>
        problema(400, 'Um ou mais campos são inválidos', [{ campo: 'nomeExibicao', mensagem: 'tamanho deve ser entre 1 e 60' }]),
      ),
    );
    const { usuario } = renderizar(<IdentidadeVisualPage />, { perfil: 'sindico' });
    await usuario.type(await screen.findByLabelText(/Nome de exibição/), ' Novo');
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('tamanho deve ser entre 1 e 60')).toBeInTheDocument();
  });

  it('deveEnviarSoOsCamposAlteradosEAplicarNaHora', async () => {
    const corpos = capturarPatch();
    const { usuario } = renderizar(<IdentidadeVisualPage />, { perfil: 'sindico' });
    const corPrimaria = await screen.findByLabelText('Cor primária');
    await usuario.clear(corPrimaria);
    await usuario.type(corPrimaria, '#0f766e');
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(corpos).toEqual(['{"corPrimaria":"#0F766E"}']));
    await waitFor(() => expect(variavel('--cor-primaria')).toBe('#0F766E'));
    expect(await screen.findByText('Identidade visual salva')).toBeInTheDocument();
  });

  it('removerLogoDeveEnviarLogoUrlNullExplicito', async () => {
    servidor.use(http.get(api('/condominio/personalizacao'), () => HttpResponse.json({ ...PERSONALIZACAO, logoUrl: 'https://exemplo.com/logo.png' })));
    const corpos = capturarPatch();
    const { usuario } = renderizar(<IdentidadeVisualPage />, { perfil: 'sindico' });
    await usuario.click(await screen.findByRole('button', { name: 'Remover logo' }));
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(corpos).toEqual(['{"logoUrl":null}']));
  });
});

describe('ModulosPage', () => {
  it('deveListarOsModulosComAChaveDeCada', async () => {
    servidor.use(http.get(api('/condominio/modulos'), () => HttpResponse.json(modulos('encomendas'))));
    renderizar(<ModulosPage />, { perfil: 'sindico' });
    expect(await screen.findByRole('switch', { name: /Financeiro/ })).toBeChecked();
    expect(screen.getByRole('switch', { name: /Encomendas/ })).not.toBeChecked();
  });

  it('desligarDeveEnviarOPatchEAtualizarNaHora', async () => {
    let corpo: unknown;
    servidor.use(
      http.patch(api('/condominio/modulos/:modulo'), async ({ request, params }) => {
        corpo = { modulo: params.modulo, ...((await request.json()) as object) };
        return HttpResponse.json({ modulo: params.modulo, nome: 'Reservas', ativo: false });
      }),
    );
    const { usuario } = renderizar(<ModulosPage />, { perfil: 'sindico' });
    const chave = await screen.findByRole('switch', { name: /Reservas/ });
    await usuario.click(chave);
    await waitFor(() => expect(corpo).toEqual({ modulo: 'reservas', ativo: false }));
    await waitFor(() => expect(screen.getByRole('switch', { name: /Reservas/ })).not.toBeChecked());
    expect(within(screen.getByRole('switch', { name: /Reservas/ }).closest('label')!).getByText('Desativado')).toBeInTheDocument();
  });
});

describe('guarda por módulo', () => {
  it('rotaDeModuloDesativadoDeveMostrarModuloIndisponivel', async () => {
    servidor.use(http.get(api('/condominio/modulos'), () => HttpResponse.json(modulos('encomendas'))));
    renderizar(
      <RotaProtegida modulo="encomendas">
        <p>Tela de encomendas</p>
      </RotaProtegida>,
    );
    expect(await screen.findByRole('heading', { name: 'Módulo indisponível', level: 2 })).toBeInTheDocument();
    expect(screen.queryByText('Tela de encomendas')).not.toBeInTheDocument();
  });

  it('rotaDeModuloAtivoDeveAbrir', async () => {
    renderizar(
      <RotaProtegida modulo="encomendas">
        <p>Tela de encomendas</p>
      </RotaProtegida>,
    );
    expect(await screen.findByText('Tela de encomendas')).toBeInTheDocument();
  });
});

describe('camposAlterados', () => {
  it('deveDevolverSoOQueMudouIncluindoNull', () => {
    expect(camposAlterados({ a: 1, b: 'x', c: 'logo' as string | null }, { a: 1, b: 'y', c: null })).toEqual({ b: 'y', c: null });
    expect(camposAlterados({ a: 1 }, { a: 1 })).toEqual({});
  });
});
