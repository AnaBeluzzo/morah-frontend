// Tipos do módulo Personalização (nomes e campos iguais aos schemas do contrato).

export interface Personalizacao {
  condominioId: number;
  nomeExibicao: string;
  /** Único campo que o servidor manda como `null` (sem logo) em vez de omitir. */
  logoUrl: string | null;
  corPrimaria: string;
  corSecundaria: string;
  corDestaque: string;
  atualizadoEm?: string;
}

/** Todos opcionais: envie só o que mudou. `logoUrl: null` remove a logo; ausente mantém. */
export interface PersonalizacaoUpdateRequest {
  nomeExibicao?: string;
  logoUrl?: string | null;
  corPrimaria?: string;
  corSecundaria?: string;
  corDestaque?: string;
}

export type ModuloCodigo = 'financeiro' | 'portaria' | 'avisos' | 'reservas' | 'minha_unidade' | 'encomendas';

export interface ModuloCondominio {
  modulo: ModuloCodigo;
  nome: string;
  ativo: boolean;
  atualizadoEm?: string;
}

export interface ModuloUpdateRequest {
  ativo: boolean;
}
