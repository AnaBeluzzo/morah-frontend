import { screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ErroApi } from '../api/ApiClient';
import { renderizar } from '../testes/renderizar';
import { BarraAbas } from './BarraAbas';
import { DialogoConfirmacao } from './BottomSheet';
import { Campo } from './Campo';
import { EstadoConsulta, ErroFormulario } from './Estados';
import { Selo } from './Selo';
import { Tela } from './Tela';
import { useToast } from './Toast';

function consulta<T>(parcial: Partial<{ data: T; isPending: boolean; isError: boolean; error: unknown }>) {
  return { data: undefined, isPending: false, isError: false, error: null, refetch: vi.fn(), ...parcial };
}

describe('EstadoConsulta', () => {
  it('deveMostrarCarregando', () => {
    renderizar(<EstadoConsulta consulta={consulta<string[]>({ isPending: true })}>{() => <p>itens</p>}</EstadoConsulta>);
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('deveMostrarErroComBotaoTentarDeNovo', async () => {
    const estado = consulta<string[]>({ isError: true, error: new ErroApi(500, 'Erro inesperado no servidor') });
    const { usuario } = renderizar(<EstadoConsulta consulta={estado}>{() => <p>itens</p>}</EstadoConsulta>);
    expect(screen.getByRole('alert')).toHaveTextContent('Erro inesperado no servidor');
    await usuario.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(estado.refetch).toHaveBeenCalled();
  });

  it('deveMostrarModuloIndisponivelNo403DeModuloDesativado', () => {
    const estado = consulta<string[]>({ isError: true, error: new ErroApi(403, 'Módulo Encomendas desativado neste condomínio') });
    renderizar(<EstadoConsulta consulta={estado}>{() => <p>itens</p>}</EstadoConsulta>);
    expect(screen.getByRole('heading', { name: 'Módulo indisponível' })).toBeInTheDocument();
  });

  it('deveMostrarVazio', () => {
    renderizar(
      <EstadoConsulta consulta={consulta({ data: [] as string[] })} vazio={(itens) => itens.length === 0} mensagemVazio="Nenhum aviso.">
        {() => <p>itens</p>}
      </EstadoConsulta>,
    );
    expect(screen.getByText('Nenhum aviso.')).toBeInTheDocument();
  });

  it('deveMostrarOsDadosNoSucesso', () => {
    renderizar(
      <EstadoConsulta consulta={consulta({ data: ['a', 'b'] })} vazio={(itens) => itens.length === 0}>
        {(itens) => <p>{itens.join(',')}</p>}
      </EstadoConsulta>,
    );
    expect(screen.getByText('a,b')).toBeInTheDocument();
  });
});

describe('componentes', () => {
  it('campoDeveLigarRotuloEMostrarErro', () => {
    renderizar(<Campo id="email" rotulo="E-mail" tipo="email" valor="" aoMudar={() => {}} erro="Informe o e-mail" obrigatorio />);
    const entrada = screen.getByLabelText(/E-mail/);
    expect(entrada).toHaveAttribute('type', 'email');
    expect(entrada).toHaveAttribute('aria-invalid', 'true');
    expect(entrada).toHaveAccessibleDescription('Informe o e-mail');
  });

  it('erroFormularioDeveTrocarA404PelaMensagemInformada', () => {
    renderizar(<ErroFormulario erro={new ErroApi(404, 'Recurso não encontrado')} mensagem404="Unidade não encontrada" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Unidade não encontrada');
  });

  it('seloDeveMostrarOTexto', () => {
    renderizar(<Selo tom="perigo">Atrasado</Selo>);
    expect(screen.getByText('Atrasado')).toBeInTheDocument();
  });

  it('barraDeAbasDeveMarcarAAbaAtual', () => {
    renderizar(
      <BarraAbas
        abas={[
          { rotulo: 'Início', caminho: '/', icone: 'inicio' },
          { rotulo: 'Avisos', caminho: '/avisos', icone: 'avisos' },
        ]}
      />,
      { rota: '/avisos' },
    );
    expect(screen.getByRole('link', { name: 'Avisos' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current');
  });

  it('telaDeveMostrarTituloEBotaoVoltar', () => {
    renderizar(
      <Tela titulo="Cobranças" voltarPara="/">
        <p>conteúdo</p>
      </Tela>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Cobranças' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
  });

  it('dialogoDeConfirmacaoDeveChamarConfirmarECancelar', async () => {
    const aoConfirmar = vi.fn();
    function Exemplo() {
      const [aberto, setAberto] = useState(true);
      return (
        <DialogoConfirmacao
          aberto={aberto}
          titulo="Expirar aviso?"
          mensagem="O aviso sai do mural."
          textoConfirmar="Expirar"
          perigo
          aoConfirmar={aoConfirmar}
          aoCancelar={() => setAberto(false)}
        />
      );
    }
    const { usuario } = renderizar(<Exemplo />);
    expect(screen.getByRole('dialog', { name: 'Expirar aviso?' })).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Expirar' }));
    expect(aoConfirmar).toHaveBeenCalledOnce();
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('toastDeveAparecerDepoisDeUmaAcao', async () => {
    function Exemplo() {
      const { mostrarToast } = useToast();
      return <button onClick={() => mostrarToast('Aviso publicado')}>Publicar</button>;
    }
    const { usuario } = renderizar(<Exemplo />);
    await usuario.click(screen.getByRole('button', { name: 'Publicar' }));
    await waitFor(() => expect(screen.getByText('Aviso publicado')).toBeInTheDocument());
  });
});
