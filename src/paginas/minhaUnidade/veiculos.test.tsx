import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { api, problema } from '../../testes/handlers';
import { renderizar } from '../../testes/renderizar';
import { servidor } from '../../testes/servidor';
import { EditarVeiculoPage, NovoVeiculoPage } from './FormularioVeiculoPage';
import { VeiculosPage } from './VeiculosPage';

describe('VeiculosPage', () => {
  it('deveListarOsVeiculosDaUnidade', async () => {
    renderizar(<VeiculosPage />, { perfil: 'proprietario' });
    const carro = await screen.findByRole('region', { name: 'ABC1D23' });
    expect(within(carro).getByText('Carro')).toBeInTheDocument();
    expect(within(carro).getByText('Fiat Argo · Prata')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'XYZ9A87' })).getByText('Moto')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cadastrar veículo' })).toBeInTheDocument();
  });

  it('deveMostrarVazio', async () => {
    servidor.use(http.get(api('/unidades/minha/veiculos'), () => HttpResponse.json([])));
    renderizar(<VeiculosPage />);
    expect(await screen.findByText('Nenhum veículo cadastrado nesta unidade.')).toBeInTheDocument();
  });

  it('deveExcluirComConfirmacao', async () => {
    let excluido = 0;
    servidor.use(
      http.delete(api('/unidades/minha/veiculos/:veiculoId'), ({ params }) => {
        excluido = Number(params.veiculoId);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { usuario } = renderizar(<VeiculosPage />);
    const moto = await screen.findByRole('region', { name: 'XYZ9A87' });
    await usuario.click(within(moto).getByRole('button', { name: 'Excluir' }));
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir' }));
    await waitFor(() => expect(excluido).toBe(2));
    expect(await screen.findByText('Veículo excluído')).toBeInTheDocument();
  });
});

describe('NovoVeiculoPage e EditarVeiculoPage', () => {
  it('cadastrarDeveValidarEEnviar', async () => {
    let corpo: unknown;
    servidor.use(
      http.post(api('/unidades/minha/veiculos'), async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json({ id: 9, unidadeId: 2, placa: 'QWE1R23', modelo: 'Onix', tipo: 'carro' }, { status: 201 });
      }),
    );
    const { usuario } = renderizar(<NovoVeiculoPage />, { rota: '/unidade/veiculos/novo', caminho: '/unidade/veiculos/novo' });
    await usuario.type(screen.getByLabelText(/^Placa/), '123');
    await usuario.click(screen.getByRole('button', { name: 'Cadastrar' }));
    expect(screen.getByText('Informe a placa no formato ABC1234 ou ABC1D23.')).toBeInTheDocument();
    expect(screen.getByText('Informe o modelo.')).toBeInTheDocument();

    await usuario.clear(screen.getByLabelText(/^Placa/));
    await usuario.type(screen.getByLabelText(/^Placa/), 'qwe-1r23');
    await usuario.type(screen.getByLabelText(/^Modelo/), ' Onix ');
    await usuario.click(screen.getByRole('button', { name: 'Cadastrar' }));
    // cor vazia não vai no corpo; a placa é normalizada pelo servidor
    await waitFor(() => expect(corpo).toEqual({ placa: 'qwe-1r23', modelo: 'Onix', tipo: 'carro' }));
    expect(await screen.findByText('Outra tela')).toBeInTheDocument();
  });

  it('cadastrarDeveMostrarPlacaRepetida', async () => {
    servidor.use(http.post(api('/unidades/minha/veiculos'), () => problema(409, 'Já existe um veículo cadastrado com a placa ABC1D23')));
    const { usuario } = renderizar(<NovoVeiculoPage />);
    await usuario.type(screen.getByLabelText(/^Placa/), 'ABC1D23');
    await usuario.type(screen.getByLabelText(/^Modelo/), 'Argo');
    await usuario.click(screen.getByRole('button', { name: 'Cadastrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe um veículo cadastrado com a placa ABC1D23');
  });

  it('editarDeveEnviarSoOQueMudou', async () => {
    let corpo: unknown;
    servidor.use(
      http.patch(api('/unidades/minha/veiculos/:veiculoId'), async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json({ id: 1, unidadeId: 1, placa: 'ABC1D23', modelo: 'Fiat Argo', tipo: 'carro' });
      }),
    );
    const opcoes = { rota: '/unidade/veiculos/1/editar', caminho: '/unidade/veiculos/:veiculoId/editar' };
    const { usuario } = renderizar(<EditarVeiculoPage />, opcoes);
    expect(await screen.findByDisplayValue('Fiat Argo')).toBeInTheDocument();
    await usuario.clear(screen.getByLabelText(/^Cor/));
    await usuario.selectOptions(screen.getByLabelText(/^Tipo/), 'moto');
    await usuario.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() => expect(corpo).toEqual({ cor: '', tipo: 'moto' }));
    expect(await screen.findByText('Outra tela')).toBeInTheDocument();
  });

  it('editarSemMudancaNaoChamaOServidor', async () => {
    const { usuario } = renderizar(<EditarVeiculoPage />, { rota: '/unidade/veiculos/1/editar', caminho: '/unidade/veiculos/:veiculoId/editar' });
    await screen.findByDisplayValue('Fiat Argo');
    await usuario.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByText('Nada foi alterado.')).toBeInTheDocument();
  });

  it('editarVeiculoInexistenteMostraAviso', async () => {
    renderizar(<EditarVeiculoPage />, { rota: '/unidade/veiculos/99/editar', caminho: '/unidade/veiculos/:veiculoId/editar' });
    expect(await screen.findByText('Veículo não encontrado nesta unidade.')).toBeInTheDocument();
  });
});
