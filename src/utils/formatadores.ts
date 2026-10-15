// Formatação no padrão brasileiro. Instantes do contrato chegam em UTC (ISO-8601) e são
// mostrados no fuso do aparelho; datas simples (AAAA-MM-DD) não têm fuso e são só remontadas.

const FORMATO_MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const FORMATO_NUMERO = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const DATA_SIMPLES = /^(\d{4})-(\d{2})-(\d{2})$/;

function doisDigitos(valor: number): string {
  return String(valor).padStart(2, '0');
}

/** Date → "AAAA-MM-DD" no fuso do aparelho. */
function dataIsoDe(data: Date): string {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

/** 1234.56 → "R$ 1.234,56" (com espaço comum, para buscas e testes simples). */
export function formatarMoeda(valor: number): string {
  return FORMATO_MOEDA.format(valor).replace(/\s/g, ' ');
}

export function formatarNumero(valor: number): string {
  return FORMATO_NUMERO.format(valor);
}

/** 12.5 → "12,5%". */
export function formatarPercentual(valor: number): string {
  return `${formatarNumero(valor)}%`;
}

/** "2026-09-10" ou um instante → "10/09/2026". */
export function formatarData(valor: string): string {
  const simples = DATA_SIMPLES.exec(valor);
  if (simples) {
    return `${simples[3]}/${simples[2]}/${simples[1]}`;
  }
  const data = new Date(valor);
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}/${data.getFullYear()}`;
}

/** Instante → "HH:mm" no fuso do aparelho. */
export function formatarHora(instante: string): string {
  const data = new Date(instante);
  return `${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

/** Instante → "dd/MM/aaaa HH:mm" no fuso do aparelho. */
export function formatarDataHora(instante: string): string {
  return `${formatarData(instante)} ${formatarHora(instante)}`;
}

/** "2026-09" → "09/2026". */
export function formatarCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split('-');
  return `${mes}/${ano}`;
}

/** Milissegundos → "mm:ss" (contagem regressiva); nunca negativo. */
export function formatarTempoRestante(milissegundos: number): string {
  const totalSegundos = Math.max(0, Math.ceil(milissegundos / 1000));
  return `${doisDigitos(Math.floor(totalSegundos / 60))}:${doisDigitos(totalSegundos % 60)}`;
}

/** Data de hoje no fuso do aparelho, no formato AAAA-MM-DD (valor de <input type="date">). */
export function hojeIso(): string {
  return dataIsoDe(new Date());
}

/** Instante → valor de <input type="datetime-local"> ("AAAA-MM-DDTHH:mm", fuso do aparelho). */
export function paraDataHoraLocal(instante: string): string {
  const data = new Date(instante);
  return `${dataIsoDe(data)}T${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

/** Valor de <input type="datetime-local"> → instante ISO-8601 em UTC. */
export function deDataHoraLocal(valor: string): string {
  return new Date(valor).toISOString();
}

/** Período de uma reserva: "15/10/2026, das 10:00 às 12:00". */
export function formatarPeriodo(inicio: string, fim: string): string {
  return `${formatarData(inicio)}, das ${formatarHora(inicio)} às ${formatarHora(fim)}`;
}
