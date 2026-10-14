import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { SinoNotificacoes } from '../../componentes/SinoNotificacoes';
import type { Notificacao } from '../../tipos/notificacoes';
import { api, NOTIFICACOES, problema } from '../../testes/handlers';
import { renderizar } from '../../testes/renderizar';
import { servidor } from '../../testes/servidor';
import { NotificacoesPage } from './NotificacoesPage';

function naoLida(id: number): Notificacao {
  return { id, tipo: 'reserva', titulo: `Reserva ${id}`, enviadaEm: '2026-10-01T12:00:00Z' };
}

describe('NotificacoesPage', () => {
  it('deveMostrarCarregandoEDepoisALista', async () => {
    renderizar(<NotificacoesPage />);
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(await screen.findByText('Novo aviso: Manutenção da piscina')).toBeInTheDocument();
    // a do convite não tem tipo e mesmo assim aparece
    expect(screen.getByText('Convite de acesso')).toBeInTheDocument();
    expect(screen.getAllByText('Nova')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Carregar mais' })).not.toBeInTheDocument();
  });

  it('deveMostrarVazio', async () => {
    servidor.use(http.get(api('/notificacoes'), () => HttpResponse.json([])));
    renderizar(<NotificacoesPage />);
    expect(await screen.findByText('Você não tem notificações.')).toBeInTheDocument();
  });

  it('deveMostrarErroComTentarDeNovo', async () => {
    servidor.use(http.get(api('/notificacoes'), () => problema(500, 'Erro inesperado no servidor')));
    renderizar(<NotificacoesPage />);
    expect(await screen.findByText('Erro inesperado no servidor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });

  it('tocarDeveMarcarComoLida', async () => {
    let marcada = 0;
    servidor.use(
      http.patch(api('/notificacoes/:notificacaoId/lida'), ({ params }) => {
        marcada = Number(params.notificacaoId);
        return HttpResponse.json({ ...NOTIFICACOES[0], lidaEm: '2026-10-14T12:00:00Z' });
      }),
    );
    const { usuario } = renderizar(<NotificacoesPage />);
    await usuario.click(await screen.findByRole('button', { name: /Manutenção da piscina/ }));
    await waitFor(() => expect(marcada).toBe(3));
  });

  it('deveOferecerCarregarMaisQuandoAPaginaVemCheia', async () => {
    const cheia = Array.from({ length: 20 }, (_, indice) => naoLida(100 + indice));
    servidor.use(
      http.get(api('/notificacoes'), ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        return HttpResponse.json(page === 0 ? cheia : [naoLida(999)]);
      }),
    );
    const { usuario } = renderizar(<NotificacoesPage />);
    await usuario.click(await screen.findByRole('button', { name: 'Carregar mais' }));
    expect(await screen.findByText('Reserva 999')).toBeInTheDocument();
    // a segunda página não veio cheia: acabou
    expect(screen.queryByRole('button', { name: 'Carregar mais' })).not.toBeInTheDocument();
  });
});

describe('SinoNotificacoes', () => {
  it('deveContarAsNaoLidasDaPrimeiraPagina', async () => {
    renderizar(<SinoNotificacoes />);
    expect(await screen.findByRole('link', { name: 'Notificações (2 não lidas)' })).toBeInTheDocument();
  });

  it('deveMostrar9MaisAcimaDeNove', async () => {
    servidor.use(http.get(api('/notificacoes'), () => HttpResponse.json(Array.from({ length: 12 }, (_, indice) => naoLida(indice)))));
    renderizar(<SinoNotificacoes />);
    expect(await screen.findByText('9+')).toBeInTheDocument();
  });

  it('naoDeveMostrarSeloSemNaoLidas', async () => {
    servidor.use(http.get(api('/notificacoes'), () => HttpResponse.json([NOTIFICACOES[2]])));
    renderizar(<SinoNotificacoes />);
    await waitFor(() => expect(screen.getByRole('link', { name: 'Notificações' })).toBeInTheDocument());
  });
});
