import type { ContextoAtivoResponse, ContextoRequest, LoginRequest, LoginResponse, MeResponse } from '../tipos/login';
import { ApiClient } from './ApiClient';

// Login: POST /auth/login, GET /auth/me, POST /auth/contexto e POST /auth/logout.
// (O POST /auth/refresh fica dentro do ApiClient, que é quem renova os tokens.)
const cliente = ApiClient.getInstance();

export function entrar(dados: LoginRequest): Promise<LoginResponse> {
  return cliente.post<LoginResponse>('/auth/login', dados, { publica: true });
}

export function buscarMe(): Promise<MeResponse> {
  return cliente.get<MeResponse>('/auth/me');
}

export function trocarContexto(dados: ContextoRequest): Promise<ContextoAtivoResponse> {
  return cliente.post<ContextoAtivoResponse>('/auth/contexto', dados);
}

export function sair(): Promise<void> {
  return cliente.post<void>('/auth/logout');
}
