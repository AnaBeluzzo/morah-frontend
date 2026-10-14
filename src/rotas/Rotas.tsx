import { Route, Routes } from 'react-router';
import type { Aba } from '../componentes/BarraAbas';
import { EstadoVazio } from '../componentes/Estados';
import { LayoutApp } from '../componentes/LayoutApp';
import { Tela } from '../componentes/Tela';
import { InicioPage } from '../paginas/inicio/InicioPage';

const ABAS: Aba[] = [{ rotulo: 'Início', caminho: '/', icone: 'inicio' }];

export function Rotas() {
  return (
    <Routes>
      <Route element={<LayoutApp abas={ABAS} />}>
        <Route index element={<InicioPage />} />
        <Route
          path="*"
          element={
            <Tela titulo="Página não encontrada" voltarPara="/">
              <EstadoVazio mensagem="Esta página não existe." />
            </Tela>
          }
        />
      </Route>
    </Routes>
  );
}
