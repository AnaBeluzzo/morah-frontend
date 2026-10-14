import { Outlet } from 'react-router';
import { BarraAbas, type Aba } from './BarraAbas';

/** Esqueleto das telas logadas: a tela da rota atual + a barra de abas inferior. */
export function LayoutApp({ abas }: { abas: Aba[] }) {
  return (
    <>
      <Outlet />
      <BarraAbas abas={abas} />
    </>
  );
}
