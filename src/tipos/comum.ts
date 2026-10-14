// Tipos comuns do contrato (seção "Comuns" de components/schemas).

export interface ErroCampo {
  campo?: string;
  mensagem?: string;
}

/** Formato de erro padrão (RFC 9457). */
export interface Problem {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  erros?: ErroCampo[];
}

export interface PageMetadata {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Formato das listas paginadas: `XxxPage` do contrato = `Pagina<Xxx>`. */
export interface Pagina<T> {
  content: T[];
  page: PageMetadata;
}

export interface PessoaResumo {
  id: number;
  nome: string;
  telefone?: string;
}

/** Parâmetros `page` (a partir de 0) e `size` (1 a 100) das listas paginadas. */
export interface ParametrosPagina {
  page?: number;
  size?: number;
}
