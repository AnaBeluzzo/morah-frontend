// Tipos do módulo Login (nomes e campos iguais aos schemas do contrato).

export type Perfil = 'morador' | 'proprietario' | 'sindico' | 'portaria';

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface ContextoAtivo {
  perfil: Perfil;
  condominioId: number;
  condominioNome?: string;
  /** Ausente para síndico e portaria. */
  unidadeId?: number;
}

export interface PerfilDisponivel {
  perfil: Perfil;
  condominioId: number;
  condominioNome?: string;
  unidadeId?: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
  contexto: ContextoAtivo;
  perfisDisponiveis: PerfilDisponivel[];
}

export interface ContextoRequest {
  condominioId: number;
  perfil: Perfil;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface ContextoAtivoResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
  contexto: ContextoAtivo;
}

export interface PessoaAutenticada {
  id: number;
  nome: string;
  cpf?: string;
  email?: string;
}

export interface MeResponse {
  pessoa: PessoaAutenticada;
  perfisDisponiveis: PerfilDisponivel[];
  contextoAtivo: ContextoAtivo;
}
