import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { api, modulos, PAINEL_MORADOR, problema } from '../../testes/handlers';
import { renderizar } from '../../testes/renderizar';
import { servidor } from '../../testes/servidor';
import { InicioPage } from './InicioPage';

describe('InicioPage', () => {
  it('painelDoMoradorMostraTodasAsSecoesComLinksParaOsModulos', async () => {
    renderizar(<InicioPage />, { perfil: 'proprietario' });
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Minha unidade: Apto 302' })).toHaveAttribute('href', '/unidade');
    const boletos = screen.getByRole('region', { name: 'Próximos boletos' });
    expect(within(boletos).getByRole('link', { name: 'Boleto de R$ 512,50' })).toHaveAttribute('href', '/financeiro/cobrancas/1');
    expect(within(boletos).getByRole('link', { name: 'Ver tudo' })).toHaveAttribute('href', '/financeiro');
    expect(within(screen.getByRole('region', { name: 'Encomendas na portaria' })).getByText('Código de retirada: 482913')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Visitas aguardando você' })).toHaveTextContent('Marcos Silva');
    expect(screen.getByRole('region', { name: 'Avisos recentes' })).toHaveTextContent('Falta de água');
    expect(screen.getByRole('region', { name: 'Próximas reservas' })).toHaveTextContent('20/10/2026, das 10:00 às 12:00');
  });

  it('moduloDesativadoEscondeASecaoEUnidadeAusenteEscondeAPlaca', async () => {
    servidor.use(
      http.get(api('/condominio/modulos'), () => HttpResponse.json(modulos('encomendas'))),
      // com Minha Unidade desligado o servidor não manda `unidade`; seções de módulos desligados vêm vazias
      http.get(api('/home/dashboard'), () => HttpResponse.json({ ...PAINEL_MORADOR, unidade: undefined, encomendasPendentes: [] })),
    );
    renderizar(<InicioPage />, { perfil: 'morador' });
    expect(await screen.findByRole('region', { name: 'Próximos boletos' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Encomendas na portaria' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Minha unidade/ })).not.toBeInTheDocument();
  });

  it('secaoAtivaSemItensMostraUmaMensagemUtil', async () => {
    servidor.use(http.get(api('/home/dashboard'), () => HttpResponse.json({ ...PAINEL_MORADOR, proximosBoletos: [] })));
    renderizar(<InicioPage />, { perfil: 'morador' });
    expect(await screen.findByText('Nenhum boleto em aberto.')).toBeInTheDocument();
  });

  it('painelDoSindicoMostraInadimplenciaEPendencias', async () => {
    renderizar(<InicioPage />, { perfil: 'sindico' });
    const inadimplencia = await screen.findByRole('region', { name: 'Inadimplência' });
    expect(inadimplencia).toHaveTextContent('50%');
    expect(inadimplencia).toHaveTextContent('R$ 512,50');
    expect(screen.getByRole('link', { name: '3 solicitações de vínculo pendentes' })).toHaveAttribute('href', '/unidades');
    expect(screen.getByLabelText('1 ocorrências abertas')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Avisos publicados' })).toHaveTextContent('Bem-vindos ao Morah');
  });

  it('painelDoSindicoSemFinanceiroEscondeAInadimplencia', async () => {
    servidor.use(http.get(api('/condominio/modulos'), () => HttpResponse.json(modulos('financeiro'))));
    renderizar(<InicioPage />, { perfil: 'sindico' });
    expect(await screen.findByRole('region', { name: 'Pendências' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Inadimplência' })).not.toBeInTheDocument();
  });

  it('painelDaPortariaMostraVisitasReservasEEncomendasDeHoje', async () => {
    renderizar(<InicioPage />, { perfil: 'portaria' });
    expect(await screen.findByRole('link', { name: '4 encomendas recebidas hoje' })).toHaveAttribute('href', '/encomendas');
    expect(screen.getByRole('region', { name: 'Esperando a unidade responder' })).toHaveTextContent('Marcos Silva');
    expect(screen.getByRole('region', { name: 'Reservas de hoje' })).toHaveTextContent('Das 10:00 às 12:00, unidade 2');
  });

  it('deveMostrarErroComTentarDeNovo', async () => {
    servidor.use(http.get(api('/home/dashboard'), () => problema(500, 'Erro inesperado no servidor')));
    renderizar(<InicioPage />, { perfil: 'portaria' });
    expect(await screen.findByText('Erro inesperado no servidor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });
});
