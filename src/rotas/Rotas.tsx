import { Route, Routes } from 'react-router';
import { EstadoVazio } from '../componentes/Estados';
import { LayoutApp } from '../componentes/LayoutApp';
import { Tela } from '../componentes/Tela';
import { useContextoAtivo } from '../contexto/SessaoContext';
import { useTema } from '../contexto/TemaContext';
import { AvisoPage } from '../paginas/avisos/AvisoPage';
import { FormularioAvisoPage } from '../paginas/avisos/FormularioAvisoPage';
import { MuralPage } from '../paginas/avisos/MuralPage';
import { InicioPage } from '../paginas/inicio/InicioPage';
import { LoginPage } from '../paginas/login/LoginPage';
import { PerfilPage } from '../paginas/login/PerfilPage';
import { TrocarPerfilPage } from '../paginas/login/TrocarPerfilPage';
import { MaisPage } from '../paginas/mais/MaisPage';
import { NotificacoesPage } from '../paginas/notificacoes/NotificacoesPage';
import { CondominioPage } from '../paginas/personalizacao/CondominioPage';
import { IdentidadeVisualPage } from '../paginas/personalizacao/IdentidadeVisualPage';
import { ModulosPage } from '../paginas/personalizacao/ModulosPage';
import { ABAS_POR_PERFIL, itensVisiveis } from './navegacao';
import { RotaProtegida, RotaPublica } from './RotaProtegida';

/** Layout das telas logadas, com as abas do perfil ativo (só as de módulos ativos). */
function LayoutLogado() {
  const contexto = useContextoAtivo();
  const { moduloAtivo } = useTema();
  return <LayoutApp abas={itensVisiveis(ABAS_POR_PERFIL[contexto.perfil], moduloAtivo)} />;
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
        <Route path="avisos" element={<RotaProtegida modulo="avisos"><MuralPage /></RotaProtegida>} />
        <Route path="avisos/novo" element={<RotaProtegida perfis={['sindico']} modulo="avisos"><FormularioAvisoPage /></RotaProtegida>} />
        <Route path="avisos/:avisoId" element={<RotaProtegida modulo="avisos"><AvisoPage /></RotaProtegida>} />
        <Route path="avisos/:avisoId/editar" element={<RotaProtegida perfis={['sindico']} modulo="avisos"><FormularioAvisoPage /></RotaProtegida>} />
        <Route path="condominio" element={<RotaProtegida perfis={['sindico']}><CondominioPage /></RotaProtegida>} />
        <Route path="condominio/identidade" element={<RotaProtegida perfis={['sindico']}><IdentidadeVisualPage /></RotaProtegida>} />
        <Route path="condominio/modulos" element={<RotaProtegida perfis={['sindico']}><ModulosPage /></RotaProtegida>} />
        <Route path="*" element={<PaginaNaoEncontrada />} />
      </Route>
    </Routes>
  );
}
