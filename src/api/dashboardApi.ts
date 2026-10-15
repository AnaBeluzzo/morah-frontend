import type { Dashboard } from '../tipos/dashboard';
import { ApiClient } from './ApiClient';

const cliente = ApiClient.getInstance();

/** Dados da tela inicial do perfil ativo (listas com no máximo 5 itens). */
export function buscarDashboard(): Promise<Dashboard> {
  return cliente.get<Dashboard>('/home/dashboard');
}
