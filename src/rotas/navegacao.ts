import type { NomeIcone } from '../componentes/Icone';
import type { Perfil } from '../tipos/login';

// Navegação por perfil: as abas inferiores (máx. 5) e os itens da aba "Mais".

export interface ItemMenu {
  rotulo: string;
  caminho: string;
  icone: NomeIcone;
}

const INICIO: ItemMenu = { rotulo: 'Início', caminho: '/', icone: 'inicio' };
const MAIS: ItemMenu = { rotulo: 'Mais', caminho: '/mais', icone: 'mais' };
const PERFIL: ItemMenu = { rotulo: 'Perfil', caminho: '/perfil', icone: 'pessoa' };
const NOTIFICACOES: ItemMenu = { rotulo: 'Notificações', caminho: '/notificacoes', icone: 'sino' };

const ABAS_MORADOR: ItemMenu[] = [INICIO, MAIS];
const MAIS_MORADOR: ItemMenu[] = [NOTIFICACOES, PERFIL];

export const ABAS_POR_PERFIL: Record<Perfil, ItemMenu[]> = {
  morador: ABAS_MORADOR,
  proprietario: ABAS_MORADOR,
  sindico: [INICIO, MAIS],
  portaria: [INICIO, MAIS],
};

export const ITENS_MAIS_POR_PERFIL: Record<Perfil, ItemMenu[]> = {
  morador: MAIS_MORADOR,
  proprietario: MAIS_MORADOR,
  sindico: [NOTIFICACOES, PERFIL],
  portaria: [NOTIFICACOES, PERFIL],
};

/** `proprietario` é cumulativo a `morador`: onde o morador entra, o proprietário também. */
export function perfilPermitido(perfil: Perfil, permitidos: readonly Perfil[]): boolean {
  return permitidos.includes(perfil) || (perfil === 'proprietario' && permitidos.includes('morador'));
}
