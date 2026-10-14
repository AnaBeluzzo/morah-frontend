import { Route, Routes } from 'react-router';
import { EstadoVazio } from '../componentes/Estados';
import { LayoutApp } from '../componentes/LayoutApp';
import { Tela } from '../componentes/Tela';
import { useContextoAtivo } from '../contexto/SessaoContext';
import { InicioPage } from '../paginas/inicio/InicioPage';
import { LoginPage } from '../paginas/login/LoginPage';
import { PerfilPage } from '../paginas/login/PerfilPage';
import { TrocarPerfilPage } from '../paginas/login/TrocarPerfilPage';
import { MaisPage } from '../paginas/mais/MaisPage';
import { NotificacoesPage } from '../paginas/notificacoes/NotificacoesPage';
import { ABAS_POR_PERFIL } from './navegacao';
import { RotaProtegida, RotaPublica } from './RotaProtegida';

/** Layout das telas logadas, com as abas do perfil ativo. */
function LayoutLogado() {
  const contexto = useContextoAtivo();
  return <LayoutApp abas={ABAS_POR_PERFIL[contexto.perfil]} />;
}

function PaginaNaoEncontrada() {
  return (
    <Tela titulo="Página não encontrada" voltarPara="/">
      <EstadoVazio mensagem="Esta página não existe." />
    </Tela>
  );
}

export function Rotas() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RotaPublica>
            <LoginPage />
          </RotaPublica>
        }
      />
      <Route
        element={
          <RotaProtegida>
            <LayoutLogado />
          </RotaProtegida>
        }
      >
        <Route index element={<InicioPage />} />
        <Route path="mais" element={<MaisPage />} />
        <Route path="perfil" element={<PerfilPage />} />
        <Route path="perfil/trocar" element={<TrocarPerfilPage />} />
        <Route path="notificacoes" element={<NotificacoesPage />} />
        <Route path="*" element={<PaginaNaoEncontrada />} />
      </Route>
    </Routes>
  );
}
