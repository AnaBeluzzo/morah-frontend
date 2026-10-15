import type { APIRequestContext, Page } from '@playwright/test';
import { abrirAba, abrirNoMais, apiComo, diaDaquiA, entrar, expect, test, titulo, type PerfilDemo } from './apoio';

// Cada teste usa um dia diferente no futuro: o banco é novo a cada execução e os dias não colidem.

/** Abre "Nova reserva" do Salão de festas na data pedida. */
async function abrirNovaReserva(pagina: Page, data: string) {
  await abrirAba(pagina, 'Reservas');
  await pagina.getByRole('link', { name: 'Nova reserva' }).click();
  await pagina.getByRole('region', { name: 'Salão de festas' }).getByRole('link', { name: 'Reservar' }).click();
  await expect(titulo(pagina)).toHaveText('Salão de festas');
  await pagina.getByLabel('Data').fill(data);
  await expect(pagina.getByRole('list', { name: 'Horários do dia' }).getByRole('button')).toHaveCount(14);
}

function horario(pagina: Page, hora: string) {
  return pagina.getByRole('list', { name: 'Horários do dia' }).getByRole('button', { name: new RegExp(`^${hora}`) });
}

/** Cenário pela API: reserva o horário de índice `indice` (0 = 08:00) do dia. */
async function reservarPelaApi(request: APIRequestContext, perfil: PerfilDemo, data: string, indice: number): Promise<number> {
  const cliente = await apiComo(request, perfil);
  const { horarios } = await cliente.get(`/areas-comuns/1/disponibilidade?data=${data}`);
  const reserva = await cliente.post('/reservas', { areaComumId: 1, inicio: horarios[indice].inicio, fim: horarios[indice].fim });
  return reserva.id as number;
}

test.describe('Reservas', () => {
  test('moradoraEscolheDataEHorariosEReserva', async ({ page }) => {
    await entrar(page, 'morador');
    await abrirNovaReserva(page, diaDaquiA(40));
    await horario(page, '10:00').click();
    await horario(page, '11:00').click();
    await page.getByRole('button', { name: 'Reservar das 10:00 às 12:00' }).click();
    await expect(page.getByRole('dialog')).toContainText('Taxa de R$ 150,00');
    await page.getByRole('dialog').getByRole('button', { name: 'Confirmar reserva' }).click();

    await expect(page.getByText('Reserva confirmada')).toBeVisible();
    await expect(titulo(page)).toHaveText('Reserva');
    await expect(page.getByText('10:00 às 12:00')).toBeVisible();
    await expect(page.getByText('Confirmada', { exact: true })).toBeVisible();
  });

  test('segundaReservaNoMesmoHorarioMostraOConflito', async ({ page, novaPagina, monitor }) => {
    monitor.esperarErroHttp(409, '/v1/reservas');
    const dia = diaDaquiA(41);
    await entrar(page, 'morador');
    await abrirNovaReserva(page, dia);
    const proprietario = await novaPagina();
    await entrar(proprietario, 'proprietario');
    await abrirNovaReserva(proprietario, dia);

    // as duas pessoas escolhem 14:00; a moradora confirma primeiro
    await horario(page, '14:00').click();
    await horario(proprietario, '14:00').click();
    await page.getByRole('button', { name: 'Reservar das 14:00 às 15:00' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Confirmar reserva' }).click();
    await expect(page.getByText('Reserva confirmada')).toBeVisible();

    await proprietario.getByRole('button', { name: 'Reservar das 14:00 às 15:00' }).click();
    await proprietario.getByRole('dialog').getByRole('button', { name: 'Confirmar reserva' }).click();
    await expect(proprietario.getByRole('alert')).toContainText('Horário indisponível');
    // os horários são buscados de novo: agora 14:00 aparece ocupado
    await expect(horario(proprietario, '14:00')).toBeDisabled();
    await expect(horario(proprietario, '14:00')).toContainText('Ocupado');
  });

  test('moradoraCancelaUmaReservaConfirmada', async ({ page, request }) => {
    const dia = diaDaquiA(42);
    await reservarPelaApi(request, 'morador', dia, 2);

    await entrar(page, 'morador');
    await abrirAba(page, 'Reservas');
    await page.getByLabel('Dia').fill(dia);
    await page.getByRole('link', { name: /Salão de festas/ }).click();
    await page.getByRole('button', { name: 'Cancelar reserva' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancelar reserva' }).click();
    await expect(page.getByText('Reserva cancelada')).toBeVisible();
    await expect(page.getByText('Cancelada', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancelar reserva' })).toHaveCount(0);
  });

  test('portariaRegistraVistoriaComDanoEDepoisDeSaidaQueConcluiAReserva', async ({ page, request }) => {
    const dia = diaDaquiA(43);
    await reservarPelaApi(request, 'proprietario', dia, 4);

    await entrar(page, 'portaria');
    await abrirAba(page, 'Reservas');
    await page.getByLabel('Dia').fill(dia);
    await page.getByRole('link', { name: /Salão de festas/ }).click();

    await page.getByRole('link', { name: 'Registrar vistoria' }).click();
    await page.getByLabel('Momento').selectOption('entrada');
    await page.getByLabel('Houve dano no espaço').check();
    await page.getByLabel('Observação').fill('Cadeira quebrada antes do uso');
    await page.getByLabel('URLs das fotos').fill('https://exemplo.com/cadeira.jpg');
    await page.getByRole('button', { name: 'Registrar vistoria' }).click();
    await expect(page.getByText('Vistoria registrada e ocorrência aberta')).toBeVisible();
    await expect(page.getByText('Confirmada', { exact: true })).toBeVisible();

    await page.getByRole('link', { name: 'Registrar vistoria' }).click();
    await page.getByLabel('Momento').selectOption('saida');
    await page.getByRole('button', { name: 'Registrar vistoria' }).click();
    await expect(page.getByText('Vistoria registrada', { exact: true })).toBeVisible();
    await expect(page.getByText('Concluída', { exact: true })).toBeVisible();
  });

  test('sindicoVeTodasAsReservas', async ({ page, request }) => {
    const dia = diaDaquiA(44);
    await reservarPelaApi(request, 'proprietario', dia, 0);
    await reservarPelaApi(request, 'morador', dia, 1);

    await entrar(page, 'sindico');
    await abrirNoMais(page, 'Reservas');
    await expect(titulo(page)).toHaveText('Reservas');
    await expect(page.getByRole('link', { name: 'Nova reserva' })).toHaveCount(0);
    await page.getByLabel('Dia').fill(dia);
    const reservas = page.getByRole('list', { name: 'Reservas' }).getByRole('link');
    await expect(reservas).toHaveCount(2);
    await expect(reservas.filter({ hasText: 'Unidade 1' })).toHaveCount(1);
    await expect(reservas.filter({ hasText: 'Unidade 2' })).toHaveCount(1);
  });
});
