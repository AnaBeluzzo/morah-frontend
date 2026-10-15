import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { api, horariosDoDia, pagina, problema } from '../../testes/handlers';
import { renderizar } from '../../testes/renderizar';
import { servidor } from '../../testes/servidor';
import { AreasComunsPage } from './AreasComunsPage';
import { DetalheReservaPage } from './DetalheReservaPage';
import { tocarHorario } from './horarios';
import { NovaReservaPage } from './NovaReservaPage';
import { ReservasPage } from './ReservasPage';
import { VistoriaPage } from './VistoriaPage';

const NOVA = { rota: '/reservas/areas/1/reservar', caminho: '/reservas/areas/:areaComumId/reservar' };
const DETALHE = { caminho: '/reservas/:reservaId' };

describe('tocarHorario', () => {
  const horarios = horariosDoDia(5);

  it('primeiroToqueEscolheOInicioESegundoOFim', () => {
    const inicio = tocarHorario(null, 2, horarios);
    expect(inicio).toEqual({ inicio: 2, fim: 2 });
    expect(tocarHorario(inicio, 4, horarios)).toEqual({ inicio: 2, fim: 4 });
  });

  it('naoAtravessaHorarioOcupadoNemVoltaNoTempo', () => {
    expect(tocarHorario({ inicio: 3, fim: 3 }, 6, horarios)).toEqual({ inicio: 6, fim: 6 });
    expect(tocarHorario({ inicio: 3, fim: 3 }, 1, horarios)).toEqual({ inicio: 1, fim: 1 });
    expect(tocarHorario({ inicio: 1, fim: 3 }, 4, horarios)).toEqual({ inicio: 4, fim: 4 });
  });
});

describe('ReservasPage', () => {
  it('moradorVeAsReservasDaUnidadeENovaReserva', async () => {
    renderizar(<ReservasPage />, { perfil: 'morador' });
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    const reserva = await screen.findByRole('link', { name: /Salão de festas 20\/10\/2026, das 10:00 às 12:00/ });
    expect(within(reserva).getByText('Confirmada')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nova reserva' })).toBeInTheDocument();
  });

  it('portariaComecaNoDiaDeHojeESemNovaReserva', async () => {
    const buscas: string[] = [];
    servidor.use(
      http.get(api('/reservas'), ({ request }) => {
        buscas.push(new URL(request.url).search);
        return HttpResponse.json(pagina([]));
      }),
    );
    renderizar(<ReservasPage />, { perfil: 'portaria' });
    expect(await screen.findByText('Nenhuma reserva para esse dia.')).toBeInTheDocument();
    expect(buscas[0]).toMatch(/data=\d{4}-\d{2}-\d{2}/);
    expect(screen.queryByRole('link', { name: 'Nova reserva' })).not.toBeInTheDocument();
  });

  it('deveMostrarErro', async () => {
    servidor.use(http.get(api('/reservas'), () => problema(500, 'Erro inesperado no servidor')));
    renderizar(<ReservasPage />, { perfil: 'sindico' });
    expect(await screen.findByText('Erro inesperado no servidor')).toBeInTheDocument();
  });
});

describe('AreasComunsPage', () => {
  it('deveMostrarCapacidadeETaxaEReservarSoParaMorador', async () => {
    const { unmount } = renderizar(<AreasComunsPage />, { perfil: 'proprietario' });
    expect(await screen.findByText('Até 80 pessoas, taxa de R$ 150,00')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reservar' })).toHaveAttribute('href', '/reservas/areas/1/reservar');
    unmount();
    renderizar(<AreasComunsPage />, { perfil: 'portaria' });
    await screen.findByText('Até 80 pessoas, taxa de R$ 150,00');
    expect(screen.queryByRole('link', { name: 'Reservar' })).not.toBeInTheDocument();
  });
});

describe('NovaReservaPage', () => {
  it('deveMostrarOs14HorariosComOOcupadoDesabilitado', async () => {
    renderizar(<NovaReservaPage />, NOVA);
    const lista = await screen.findByRole('list', { name: 'Horários do dia' });
    expect(within(lista).getAllByRole('button')).toHaveLength(14);
    expect(within(lista).getByRole('button', { name: /13:00.*Ocupado/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Escolha os horários' })).toBeDisabled();
  });

  it('deveReservarComOsInstantesComoVieram', async () => {
    let corpo: unknown;
    servidor.use(
      http.post(api('/reservas'), async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json({ id: 7, areaComumId: 1, unidadeId: 2, inicio: '2026-10-20T13:00:00Z', fim: '2026-10-20T15:00:00Z', status: 'confirmada' }, { status: 201 });
      }),
    );
    const { usuario } = renderizar(<NovaReservaPage />, NOVA);
    await usuario.click(await screen.findByRole('button', { name: /^10:00/ }));
    await usuario.click(screen.getByRole('button', { name: /^11:00/ }));
    await usuario.click(screen.getByRole('button', { name: 'Reservar das 10:00 às 12:00' }));
    expect(within(screen.getByRole('dialog')).getByText(/Taxa de R\$ 150,00/)).toBeInTheDocument();
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar reserva' }));
    await waitFor(() => expect(corpo).toEqual({ areaComumId: 1, inicio: '2026-10-20T13:00:00Z', fim: '2026-10-20T15:00:00Z' }));
    expect(await screen.findByText('Outra tela')).toBeInTheDocument();
  });

  it('conflitoDeHorarioDeveMostrarOErroDoServidor', async () => {
    servidor.use(http.post(api('/reservas'), () => problema(409, 'Horário indisponível: já existe reserva confirmada nesse período')));
    const { usuario } = renderizar(<NovaReservaPage />, NOVA);
    await usuario.click(await screen.findByRole('button', { name: /^09:00/ }));
    await usuario.click(screen.getByRole('button', { name: 'Reservar das 09:00 às 10:00' }));
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar reserva' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Horário indisponível');
  });
});

describe('DetalheReservaPage', () => {
  it('moradorCancelaReservaConfirmada', async () => {
    let cancelou = false;
    servidor.use(
      http.delete(api('/reservas/:reservaId'), () => {
        cancelou = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { usuario } = renderizar(<DetalheReservaPage />, { ...DETALHE, rota: '/reservas/1' });
    expect(await screen.findByText('10:00 às 12:00')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Cancelar reserva' }));
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar reserva' }));
    await waitFor(() => expect(cancelou).toBe(true));
    expect(await screen.findByText('Reserva cancelada')).toBeInTheDocument();
  });

  it('reservaConcluidaNaoPodeSerCanceladaEPortariaVeVistoria', async () => {
    const { unmount } = renderizar(<DetalheReservaPage />, { ...DETALHE, rota: '/reservas/2' });
    expect(await screen.findByText('Concluída')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar reserva' })).not.toBeInTheDocument();
    unmount();
    renderizar(<DetalheReservaPage />, { ...DETALHE, rota: '/reservas/1', perfil: 'portaria' });
    expect(await screen.findByRole('link', { name: 'Registrar vistoria' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar reserva' })).not.toBeInTheDocument();
  });
});

describe('VistoriaPage', () => {
  it('deveEnviarMomentoDanoEFotos', async () => {
    let corpo: unknown;
    servidor.use(
      http.post(api('/reservas/:reservaId/vistoria'), async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json({ id: 1, areaComumId: 1, unidadeId: 2, inicio: '2026-10-20T13:00:00Z', fim: '2026-10-20T15:00:00Z', status: 'concluida' });
      }),
    );
    const { usuario } = renderizar(<VistoriaPage />, { rota: '/reservas/1/vistoria', caminho: '/reservas/:reservaId/vistoria', perfil: 'portaria' });
    await usuario.selectOptions(screen.getByLabelText(/Momento/), 'saida');
    await usuario.click(screen.getByLabelText('Houve dano no espaço'));
    await usuario.type(screen.getByLabelText('Observação'), 'Mesa quebrada');
    await usuario.type(screen.getByLabelText('URLs das fotos'), 'https://exemplo.com/1.jpg{enter}https://exemplo.com/2.jpg');
    await usuario.click(screen.getByRole('button', { name: 'Registrar vistoria' }));
    await waitFor(() =>
      expect(corpo).toEqual({ momento: 'saida', observacao: 'Mesa quebrada', dano: true, fotosUrl: ['https://exemplo.com/1.jpg', 'https://exemplo.com/2.jpg'] }),
    );
    expect(await screen.findByText('Outra tela')).toBeInTheDocument();
  });

  it('deveMostrarOErroDoServidor', async () => {
    servidor.use(http.post(api('/reservas/:reservaId/vistoria'), () => problema(404, 'Reserva não encontrada')));
    const { usuario } = renderizar(<VistoriaPage />, { rota: '/reservas/9/vistoria', caminho: '/reservas/:reservaId/vistoria', perfil: 'portaria' });
    await usuario.click(screen.getByRole('button', { name: 'Registrar vistoria' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Reserva não encontrada');
  });
});
