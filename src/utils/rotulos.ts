import type { PrioridadeAviso, TipoPublicoAlvo } from '../tipos/avisos';
import type { StatusCobranca, TipoRateio } from '../tipos/financeiro';
import type { Perfil } from '../tipos/login';
import type { TipoNotificacao } from '../tipos/notificacoes';
import type { ModuloCodigo } from '../tipos/personalizacao';

// Rótulos em português dos enums do contrato: um mapa por enum, com o valor do contrato como
// chave. O tipo Record<Enum, string> obriga (em tempo de compilação) a ter rótulo para todo valor.
// Cada status também tem um tom de selo (cor + texto, nunca só cor).

export type TomSelo = 'sucesso' | 'alerta' | 'perigo' | 'info' | 'neutro';

/** Rótulo de um valor; se o servidor mandar um valor desconhecido, mostra o próprio valor. */
export function rotular(mapa: Record<string, string>, valor: string | undefined): string {
  if (valor === undefined) {
    return '';
  }
  return mapa[valor] ?? valor;
}

// ---------------------------------------------------------------- Login

export const ROTULOS_PERFIL: Record<Perfil, string> = {
  morador: 'Morador',
  proprietario: 'Proprietário',
  sindico: 'Síndico',
  portaria: 'Portaria',
};

// ---------------------------------------------------------------- Notificações

export const ROTULOS_TIPO_NOTIFICACAO: Record<TipoNotificacao, string> = {
  portaria: 'Portaria',
  encomenda: 'Encomenda',
  financeiro: 'Financeiro',
  aviso: 'Aviso',
  reserva: 'Reserva',
};

// ---------------------------------------------------------------- Personalização

export const ROTULOS_MODULO: Record<ModuloCodigo, string> = {
  financeiro: 'Financeiro',
  portaria: 'Portaria',
  avisos: 'Avisos',
  reservas: 'Reservas',
  minha_unidade: 'Minha Unidade',
  encomendas: 'Encomendas',
};

// ---------------------------------------------------------------- Avisos

export const ROTULOS_PRIORIDADE_AVISO: Record<PrioridadeAviso, string> = {
  normal: 'Normal',
  urgente: 'Urgente',
};

export const TOM_PRIORIDADE_AVISO: Record<PrioridadeAviso, TomSelo> = {
  normal: 'neutro',
  urgente: 'perigo',
};

export const ROTULOS_TIPO_PUBLICO_ALVO: Record<TipoPublicoAlvo, string> = {
  condominio: 'Todo o condomínio',
  bloco: 'Um bloco',
  unidade: 'Uma unidade',
};

// ---------------------------------------------------------------- Financeiro

export const ROTULOS_STATUS_COBRANCA: Record<StatusCobranca, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
};

export const TOM_STATUS_COBRANCA: Record<StatusCobranca, TomSelo> = {
  pendente: 'alerta',
  pago: 'sucesso',
  atrasado: 'perigo',
  cancelado: 'neutro',
};

export const ROTULOS_TIPO_RATEIO: Record<TipoRateio, string> = {
  igualitario: 'Igualitário (divide pelo número de unidades)',
  fracao_ideal: 'Por fração ideal da unidade',
};

/** `tipo` do documento e `meio` da baixa são textos livres no contrato: estes são os valores sugeridos. */
export const ROTULOS_TIPO_DOCUMENTO: Record<string, string> = {
  nota_fiscal: 'Nota fiscal',
  prestacao_contas: 'Prestação de contas',
  balancete: 'Balancete',
  outro: 'Outro',
};

export const ROTULOS_MEIO_PAGAMENTO: Record<string, string> = {
  transferencia: 'Transferência',
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  boleto: 'Boleto',
  cheque: 'Cheque',
};
