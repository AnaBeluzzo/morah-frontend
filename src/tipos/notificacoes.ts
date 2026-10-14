// Tipos do módulo Notificações (nomes e campos iguais aos schemas do contrato).

export type TipoNotificacao = 'portaria' | 'encomenda' | 'financeiro' | 'aviso' | 'reserva';

export interface Notificacao {
  id: number;
  /** Pode faltar: o convite de inquilino é gravado sem tipo. */
  tipo?: TipoNotificacao;
  titulo: string;
  mensagem?: string;
  referenciaId?: number;
  enviadaEm: string;
  /** Ausente enquanto a notificação não foi lida. */
  lidaEm?: string;
}
