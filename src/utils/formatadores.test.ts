import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  deDataHoraLocal,
  formatarCompetencia,
  formatarData,
  formatarDataHora,
  formatarHora,
  formatarMoeda,
  formatarPercentual,
  formatarPeriodo,
  formatarTempoRestante,
  hojeIso,
  paraDataHoraLocal,
} from './formatadores';

// Os testes rodam no fuso America/Sao_Paulo (UTC-3), configurado no vite.config.ts.
describe('formatadores', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('deveFormatarMoedaEmReais', () => {
    expect(formatarMoeda(1234.56)).toBe('R$ 1.234,56');
    expect(formatarMoeda(500)).toBe('R$ 500,00');
    expect(formatarMoeda(0)).toBe('R$ 0,00');
  });

  it('deveFormatarDataSimplesSemMudarODiaPorFuso', () => {
    expect(formatarData('2026-09-10')).toBe('10/09/2026');
    expect(formatarData('2026-01-01')).toBe('01/01/2026');
  });

  it('deveFormatarInstanteUtcNoFusoDoAparelho', () => {
    expect(formatarData('2026-10-01T02:00:00Z')).toBe('30/09/2026');
    expect(formatarHora('2026-10-01T12:00:00Z')).toBe('09:00');
    expect(formatarDataHora('2026-10-01T12:05:00Z')).toBe('01/10/2026 09:05');
  });

  it('deveFormatarCompetenciaEPercentual', () => {
    expect(formatarCompetencia('2026-09')).toBe('09/2026');
    expect(formatarPercentual(12.5)).toBe('12,5%');
    expect(formatarPercentual(100)).toBe('100%');
  });

  it('deveFormatarOPeriodoDeUmaReserva', () => {
    expect(formatarPeriodo('2026-10-20T13:00:00Z', '2026-10-20T15:00:00Z')).toBe('20/10/2026, das 10:00 às 12:00');
  });

  it('deveFormatarAContagemRegressiva', () => {
    expect(formatarTempoRestante(30 * 60 * 1000)).toBe('30:00');
    expect(formatarTempoRestante(61_000)).toBe('01:01');
    expect(formatarTempoRestante(-5000)).toBe('00:00');
  });

  it('deveConverterEntreInputDataHoraEInstanteUtc', () => {
    expect(paraDataHoraLocal('2026-10-20T13:30:00Z')).toBe('2026-10-20T10:30');
    expect(deDataHoraLocal('2026-10-20T10:30')).toBe('2026-10-20T13:30:00.000Z');
  });

  it('hojeIsoDeveUsarODiaDoAparelho', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-15T01:00:00Z')); // ainda dia 14 em São Paulo
    expect(hojeIso()).toBe('2026-10-14');
  });
});
