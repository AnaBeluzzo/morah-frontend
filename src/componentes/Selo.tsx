import type { ReactNode } from 'react';
import type { TomSelo } from '../utils/rotulos';
import estilos from './Selo.module.css';

/** Selo colorido de status: sempre cor + texto (nunca só cor). */
export function Selo({ tom, children }: { tom: TomSelo; children: ReactNode }) {
  return <span className={`${estilos.selo} ${estilos[tom]}`}>{children}</span>;
}
