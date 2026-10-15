import type { NomeIcone } from '../componentes/Icone';
import type { Perfil } from '../tipos/login';
import type { ModuloCodigo } from '../tipos/personalizacao';

// Navegação por perfil: as abas inferiores (máx. 5) e os itens da aba "Mais".

export interface ItemMenu {
  rotulo: string;
  caminho: string;
  icone: NomeIcone;
  /** Módulo ativável ao qual a tela pertence: some do menu quando o síndico o desativa. */
  modulo?: ModuloCodigo;
}

const INICIO: ItemMenu = { rotulo: 'Início', caminho: '/', icone: 'inicio' };
const MAIS: ItemMenu = { rotulo: 'Mais', caminho: '/mais', icone: 'mais' };
const PERFIL: ItemMenu = { rotulo: 'Perfil', caminho: '/perfil', icone: 'pessoa' };
const NOTIFICACOES: ItemMenu = { rotulo: 'Notificações', caminho: '/notificacoes', icone: 'sino' };
const CONDOMINIO: ItemMenu = { rotulo: 'Condomínio', caminho: '/condominio', icone: 'condominio' };
const AVISOS: ItemMenu = { rotulo: 'Avisos', caminho: '/avisos', icone: 'avisos', modulo: 'avisos' };
const FINANCEIRO: ItemMenu = { rotulo: 'Financeiro', caminho: '/financeiro', icone: 'financeiro', modulo: 'financeiro' };
const MINHA_UNIDADE: ItemMenu = { rotulo: 'Minha unidade', caminho: '/unidade', icone: 'unidade', modulo: 'minha_unidade' };
const UNIDADES: ItemMenu = { rotulo: 'Unidades', caminho: '/unidades', icone: 'unidade', modulo: 'minha_unidade' };
const VISITANTES: ItemMenu = { rotulo: 'Visitantes', caminho: '/visitantes', icone: 'visitantes', modulo: 'portaria' };
const ACESSOS: ItemMenu = { rotulo: 'Histórico de acessos', caminho: '/acessos', icone: 'unidade', modulo: 'portaria' };
const RESERVAS: ItemMenu = { rotulo: 'Reservas', caminho: '/reservas', icone: 'reservas', modulo: 'reservas' };

const ABAS_MORADOR: ItemMenu[] = [INICIO, AVISOS, FINANCEIRO, RESERVAS, MAIS];
const MAIS_MORADOR: ItemMenu[] = [NOTIFICACOES, PERFIL, MINHA_UNIDADE, VISITANTES];

export const ABAS_POR_PERFIL: Record<Perfil, ItemMenu[]> = {
  morador: ABAS_MORADOR,
  proprietario: ABAS_MORADOR,
  sindico: [INICIO, FINANCEIRO, AVISOS, CONDOMINIO, MAIS],
  portaria: [INICIO, VISITANTES, RESERVAS, MAIS],
};

export const ITENS_MAIS_POR_PERFIL: Record<Perfil, ItemMenu[]> = {
  morador: MAIS_MORADOR,
  proprietario: MAIS_MORADOR,
  sindico: [NOTIFICACOES, PERFIL, UNIDADES, ACESSOS, RESERVAS],
  portaria: [NOTIFICACOES, PERFIL, AVISOS, ACESSOS],
};

/** Esconde do menu os itens de módulos desativados no condomínio. */
export function itensVisiveis(itens: ItemMenu[], moduloAtivo: (modulo: ModuloCodigo) => boolean): ItemMenu[] {
  return itens.filter((item) => !item.modulo || moduloAtivo(item.modulo));
}

/** `proprietario` é cumulativo a `morador`: onde o morador entra, o proprietário também. */
export function perfilPermitido(perfil: Perfil, permitidos: readonly Perfil[]): boolean {
  return permitidos.includes(perfil) || (perfil === 'proprietario' && permitidos.includes('morador'));
}
