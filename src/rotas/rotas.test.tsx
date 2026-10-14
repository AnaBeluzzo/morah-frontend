import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { renderizar } from '../testes/renderizar';
import { ABAS_POR_PERFIL, perfilPermitido } from './navegacao';
import { RotaProtegida, RotaPublica } from './RotaProtegida';

function Aplicacao() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RotaPublica>
            <p>Tela de login</p>
          </RotaPublica>
        }
      />
      <Route
        path="/"
        element={
          <RotaProtegida>
            <p>Início logado</p>
          </RotaProtegida>
        }
      />
      <Route
        path="/so-sindico"
        element={
          <RotaProtegida perfis={['sindico']}>
            <p>Tela do síndico</p>
          </RotaProtegida>
        }
      />
      <Route
        path="/de-morador"
        element={
          <RotaProtegida perfis={['morador']}>
            <p>Tela de morador</p>
          </RotaProtegida>
        }
      />
    </Routes>
  );
}

describe('guardas de rota', () => {
  it('semSessaoDeveIrParaOLogin', () => {
    renderizar(<Aplicacao />, { rota: '/', perfil: null });
    expect(screen.getByText('Tela de login')).toBeInTheDocument();
  });

  it('logadoNaoDeveVerALoginEVaiParaOInicio', () => {
    renderizar(<Aplicacao />, { rota: '/login', perfil: 'morador' });
    expect(screen.getByText('Início logado')).toBeInTheDocument();
  });

  it('perfilSemPermissaoDeveVerAcessoNaoPermitido', () => {
    renderizar(<Aplicacao />, { rota: '/so-sindico', perfil: 'morador' });
    expect(screen.getByText('Esta tela não está disponível para o seu perfil.')).toBeInTheDocument();
    expect(screen.queryByText('Tela do síndico')).not.toBeInTheDocument();
  });

  it('perfilPermitidoDeveAbrirATela', () => {
    renderizar(<Aplicacao />, { rota: '/so-sindico', perfil: 'sindico' });
    expect(screen.getByText('Tela do síndico')).toBeInTheDocument();
  });

  it('proprietarioDeveAcessarTelasDeMorador', () => {
    renderizar(<Aplicacao />, { rota: '/de-morador', perfil: 'proprietario' });
    expect(screen.getByText('Tela de morador')).toBeInTheDocument();
  });

  it('perfilPermitidoDeveSerCumulativoSoParaOProprietario', () => {
    expect(perfilPermitido('proprietario', ['morador'])).toBe(true);
    expect(perfilPermitido('morador', ['proprietario'])).toBe(false);
    expect(perfilPermitido('sindico', ['morador'])).toBe(false);
    expect(perfilPermitido('portaria', ['portaria', 'sindico'])).toBe(true);
  });

  it('cadaPerfilDeveTerNoMaximo5AbasComInicioEMais', () => {
    for (const abas of Object.values(ABAS_POR_PERFIL)) {
      expect(abas.length).toBeLessThanOrEqual(5);
      expect(abas[0].rotulo).toBe('Início');
      expect(abas[abas.length - 1].rotulo).toBe('Mais');
    }
  });
});
