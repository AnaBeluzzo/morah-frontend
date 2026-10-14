import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, pagina, problema } from '../../testes/handlers';
import { renderizar } from '../../testes/renderizar';
import { servidor } from '../../testes/servidor';
import { CobrancasPage } from './CobrancasPage';
import { DetalheCobrancaPage } from './DetalheCobrancaPage';
import { DocumentosPage } from './DocumentosPage';
import { InadimplenciaPage } from './InadimplenciaPage';
import { NovoDocumentoPage } from './NovoDocumentoPage';
import { PixPage } from './PixPage';
import { TaxasPage } from './TaxasPage';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CobrancasPage', () => {
  it('deveMostrarCarregandoEDepoisAsCobrancasComSelo', async () => {
    renderizar(<CobrancasPage />, { perfil: 'proprietario' });
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    const cobranca = await screen.findByRole('link', { name: /Cobrança 09\/2026/ });
    expect(within(cobranca).getByText('Atrasado')).toBeInTheDocument();
    expect(within(cobranca).getByText('R$ 512,50')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Taxas e cobranças em lote' })).not.toBeInTheDocument();
  });

  it('deveMostrarVazioEErro', async () => {
    servidor.use(http.get(api('/financeiro/cobrancas'), () => HttpResponse.json(pagina([]))));
    const { unmount } = renderizar(<CobrancasPage />);
    expect(await screen.findByText('Nenhuma cobrança encontrada.')).toBeInTheDocument();
    unmount();
    servidor.use(http.get(api('/financeiro/cobrancas'), () => problema(403, 'Módulo Financeiro desativado neste condomínio')));
    renderizar(<CobrancasPage />);
    expect(await screen.findByRole('heading', { name: 'Módulo indisponível' })).toBeInTheDocument();
  });

  it('sindicoDeveFiltrarPorStatusCompetenciaEUnidade', async () => {
    const buscas: string[] = [];
    servidor.use(
      http.get(api('/financeiro/cobrancas'), ({ request }) => {
        buscas.push(new URL(request.url).search);
        return HttpResponse.json(pagina([]));
      }),
    );
    const { usuario } = renderizar(<CobrancasPage />, { perfil: 'sindico' });
    expect(screen.getByRole('link', { name: 'Inadimplência' })).toBeInTheDocument();
    await usuario.click(screen.getByText('Filtros'));
    await usuario.selectOptions(screen.getByLabelText('Status'), 'pendente');
    await usuario.type(screen.getByLabelText('Competência'), '2026-09');
    await usuario.type(screen.getByLabelText('ID da unidade'), '2');
    await usuario.click(screen.getByRole('button', { name: 'Filtrar' }));
    await waitFor(() => expect(buscas.at(-1)).toBe('?status=pendente&competencia=2026-09&unidadeId=2&page=0&size=20'));
  });
});

describe('DetalheCobrancaPage', () => {
  it('moradorDeveVerOsValoresEOBotaoDePix', async () => {
    renderizar(<DetalheCobrancaPage />, { rota: '/financeiro/cobrancas/1', caminho: '/financeiro/cobrancas/:cobrancaId', perfil: 'proprietario' });
    expect(await screen.findByText('R$ 500,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 10,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 2,50')).toBeInTheDocument();
    expect(screen.getByText('10/09/2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pagar com PIX' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dar baixa manual' })).not.toBeInTheDocument();
  });

  it('cobrancaPagaNaoOferecePix', async () => {
    renderizar(<DetalheCobrancaPage />, { rota: '/financeiro/cobrancas/3', caminho: '/financeiro/cobrancas/:cobrancaId', perfil: 'proprietario' });
    expect(await screen.findByText('Pago')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Pagar com PIX' })).not.toBeInTheDocument();
  });

  it('sindicoDeveDarBaixaManualComValorPreenchido', async () => {
    let corpo: Record<string, unknown> = {};
    servidor.use(
      http.post(api('/financeiro/cobrancas/:cobrancaId/baixa-manual'), async ({ request }) => {
        corpo = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: 1, unidadeId: 1, competencia: '2026-09', vencimento: '2026-09-10', valorOriginal: 500, multa: 10, juros: 2.5, valorTotal: 512.5, status: 'pago' });
      }),
    );
    const { usuario } = renderizar(<DetalheCobrancaPage />, { rota: '/financeiro/cobrancas/1', caminho: '/financeiro/cobrancas/:cobrancaId', perfil: 'sindico' });
    await usuario.click(await screen.findByRole('button', { name: 'Dar baixa manual' }));
    const dialogo = screen.getByRole('dialog', { name: 'Baixa manual' });
    expect(within(dialogo).getByLabelText(/Valor pago/)).toHaveValue(512.5);
    await usuario.selectOptions(within(dialogo).getByLabelText(/Meio de pagamento/), 'dinheiro');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Confirmar baixa' }));
    await waitFor(() => expect(corpo.meio).toBe('dinheiro'));
    expect(corpo.valor).toBe(512.5);
    expect(String(corpo.pagoEm)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\.000Z$/);
    expect(await screen.findByText('Pago')).toBeInTheDocument();
  });

  it('baixaManualDeveValidarOValor', async () => {
    const { usuario } = renderizar(<DetalheCobrancaPage />, { rota: '/financeiro/cobrancas/1', caminho: '/financeiro/cobrancas/:cobrancaId', perfil: 'sindico' });
    await usuario.click(await screen.findByRole('button', { name: 'Dar baixa manual' }));
    await usuario.clear(screen.getByLabelText(/Valor pago/));
    await usuario.click(screen.getByRole('button', { name: 'Confirmar baixa' }));
    expect(screen.getByText('Informe um valor maior que zero.')).toBeInTheDocument();
  });
});

describe('PixPage', () => {
  it('deveMostrarOCodigoContagemECopiar', async () => {
    // o user-event instala uma área de transferência simulada no navigator
    const { usuario } = renderizar(<PixPage />, { rota: '/financeiro/cobrancas/1/pix', caminho: '/financeiro/cobrancas/:cobrancaId/pix', perfil: 'proprietario' });
    const codigo = await screen.findByLabelText('Código PIX');
    expect(screen.getByText(/^(30:0\d|29:5\d)$/)).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Copiar código' }));
    expect(await navigator.clipboard.readText()).toBe(codigo.textContent);
    expect(await screen.findByText('Código copiado')).toBeInTheDocument();
  });

  it('codigoExpiradoDeveOferecerGerarNovo', async () => {
    let pedidos = 0;
    servidor.use(
      http.get(api('/financeiro/cobrancas/:cobrancaId/pix'), () => {
        pedidos++;
        return HttpResponse.json({ codigoPix: `codigo-${pedidos}`, expiraEm: pedidos === 1 ? '2020-01-01T00:00:00Z' : new Date(Date.now() + 1_800_000).toISOString() });
      }),
    );
    const { usuario } = renderizar(<PixPage />, { rota: '/financeiro/cobrancas/1/pix', caminho: '/financeiro/cobrancas/:cobrancaId/pix', perfil: 'proprietario' });
    await usuario.click(await screen.findByRole('button', { name: 'Gerar novo código' }));
    expect(await screen.findByText('codigo-2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copiar código' })).toBeInTheDocument();
  });

  it('cobrancaPagaDeveMostrarOConflito', async () => {
    renderizar(<PixPage />, { rota: '/financeiro/cobrancas/3/pix', caminho: '/financeiro/cobrancas/:cobrancaId/pix', perfil: 'proprietario' });
    expect(await screen.findByText('Cobrança já está paga ou cancelada')).toBeInTheDocument();
  });
});

describe('Documentos', () => {
  it('deveListarEOferecerPublicacaoSoAoSindico', async () => {
    const { unmount } = renderizar(<DocumentosPage />, { perfil: 'morador' });
    expect(await screen.findByRole('heading', { name: 'Prestação de contas de setembro' })).toBeInTheDocument();
    expect(screen.getByText('Prestação de contas')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Publicar documento' })).not.toBeInTheDocument();
    unmount();
    renderizar(<DocumentosPage />, { perfil: 'sindico' });
    expect(await screen.findByRole('link', { name: 'Publicar documento' })).toBeInTheDocument();
  });

  it('publicarDeveValidarEEnviar', async () => {
    let corpo: unknown;
    servidor.use(
      http.post(api('/financeiro/documentos'), async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json({ id: 9, publicadoEm: '2026-10-14T12:00:00Z', ...(corpo as object) }, { status: 201 });
      }),
    );
    const { usuario } = renderizar(<NovoDocumentoPage />, { rota: '/financeiro/documentos/novo', caminho: '/financeiro/documentos/novo', perfil: 'sindico' });
    await usuario.type(screen.getByLabelText(/URL do arquivo/), 'arquivo.pdf');
    await usuario.click(screen.getByRole('button', { name: 'Publicar' }));
    expect(screen.getByText('Informe o título.')).toBeInTheDocument();
    expect(screen.getByText('Informe uma URL começando com http:// ou https://.')).toBeInTheDocument();

    await usuario.type(screen.getByLabelText(/Título/), 'NF da portaria');
    await usuario.clear(screen.getByLabelText(/URL do arquivo/));
    await usuario.type(screen.getByLabelText(/URL do arquivo/), 'https://exemplo.com/nf.pdf');
    await usuario.click(screen.getByRole('button', { name: 'Publicar' }));
    await waitFor(() => expect(corpo).toEqual({ tipo: 'nota_fiscal', titulo: 'NF da portaria', arquivoUrl: 'https://exemplo.com/nf.pdf' }));
    expect(await screen.findByText('Outra tela')).toBeInTheDocument();
  });

  it('publicarDeveMostrarErrosDoServidor', async () => {
    servidor.use(http.post(api('/financeiro/documentos'), () => problema(400, 'Um ou mais campos são inválidos', [{ campo: 'arquivoUrl', mensagem: 'deve ser uma URL válida' }])));
    const { usuario } = renderizar(<NovoDocumentoPage />, { perfil: 'sindico' });
    await usuario.type(screen.getByLabelText(/Título/), 'NF');
    await usuario.type(screen.getByLabelText(/URL do arquivo/), 'https://x');
    await usuario.click(screen.getByRole('button', { name: 'Publicar' }));
    expect(await screen.findByText('deve ser uma URL válida')).toBeInTheDocument();
  });
});

describe('TaxasPage', () => {
  it('deveValidarCompetenciaEDiaDoVencimento', async () => {
    const { usuario } = renderizar(<TaxasPage />, { perfil: 'sindico' });
    await usuario.clear(screen.getByLabelText(/Dia do vencimento/));
    await usuario.type(screen.getByLabelText(/Dia do vencimento/), '29');
    await usuario.click(screen.getByRole('button', { name: 'Criar taxa' }));
    expect(screen.getByText('Informe a descrição.')).toBeInTheDocument();
    expect(screen.getByText('Use o formato AAAA-MM (ex.: 2026-09).')).toBeInTheDocument();
    expect(screen.getByText('Informe um valor maior que zero.')).toBeInTheDocument();
    expect(screen.getByText('Escolha um dia de 1 a 28.')).toBeInTheDocument();
  });

  it('deveCriarATaxaEGerarCobrancasMostrandoAsFalhas', async () => {
    let corpoTaxa: unknown;
    servidor.use(
      http.post(api('/financeiro/taxas'), async ({ request }) => {
        corpoTaxa = await request.json();
        return HttpResponse.json({ id: 7, ...(corpoTaxa as object) }, { status: 201 });
      }),
      http.post(api('/financeiro/taxas/:taxaId/gerar-cobrancas'), () =>
        HttpResponse.json({ taxaId: 7, totalGeradas: 1, falhas: [{ unidadeId: 2, motivo: 'Unidade já cobrada por esta taxa' }] }, { status: 202 }),
      ),
    );
    const { usuario } = renderizar(<TaxasPage />, { perfil: 'sindico' });
    await usuario.type(screen.getByLabelText(/Descrição/), 'Fundo de reserva');
    await usuario.type(screen.getByLabelText(/Competência/), '2026-11');
    await usuario.type(screen.getByLabelText(/Valor total/), '300');
    await usuario.selectOptions(screen.getByLabelText(/Rateio/), 'fracao_ideal');
    await usuario.click(screen.getByRole('button', { name: 'Criar taxa' }));
    await waitFor(() => expect(corpoTaxa).toEqual({ descricao: 'Fundo de reserva', competencia: '2026-11', valor: 300, tipoRateio: 'fracao_ideal', vencimentoDia: 10 }));

    const cartao = await screen.findByRole('region', { name: 'Fundo de reserva' });
    await usuario.click(within(cartao).getByRole('button', { name: 'Gerar cobranças' }));
    const resultado = await within(cartao).findByLabelText('Resultado da geração');
    expect(resultado).toHaveTextContent('1 cobranças geradas');
    expect(resultado).toHaveTextContent('Unidade 2: Unidade já cobrada por esta taxa');
  });
});

describe('InadimplenciaPage', () => {
  it('deveMostrarOsIndicadores', async () => {
    renderizar(<InadimplenciaPage />, { perfil: 'sindico' });
    expect(await screen.findByLabelText('Percentual de inadimplência')).toHaveTextContent('50%');
    expect(screen.getByLabelText('Valor em aberto')).toHaveTextContent('R$ 512,50');
    expect(screen.getByLabelText('Total de unidades')).toHaveTextContent('2');
  });

  it('deveMostrarErroComTentarDeNovo', async () => {
    servidor.use(http.get(api('/financeiro/inadimplencia'), () => problema(500, 'Erro inesperado no servidor')));
    renderizar(<InadimplenciaPage />, { perfil: 'sindico' });
    expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });
});
