import { describe, expect, it } from 'vitest';
import { rotular, ROTULOS_PERFIL, ROTULOS_TIPO_NOTIFICACAO } from './rotulos';

// Cada mapa é conferido com a lista de valores do enum no contrato (morah-openapi.yaml).
function chaves(mapa: Record<string, string>): string[] {
  return Object.keys(mapa).sort();
}

describe('rotulos', () => {
  it('rotularDeveDevolverOProprioValorQuandoDesconhecido', () => {
    expect(rotular(ROTULOS_PERFIL, 'sindico')).toBe('Síndico');
    expect(rotular(ROTULOS_PERFIL, 'zelador')).toBe('zelador');
    expect(rotular(ROTULOS_PERFIL, undefined)).toBe('');
  });

  it('perfilDeveTerRotuloParaTodoValorDoContrato', () => {
    expect(chaves(ROTULOS_PERFIL)).toEqual(['morador', 'portaria', 'proprietario', 'sindico']);
  });

  it('tipoNotificacaoDeveTerRotuloParaTodoValorDoContrato', () => {
    expect(chaves(ROTULOS_TIPO_NOTIFICACAO)).toEqual(['aviso', 'encomenda', 'financeiro', 'portaria', 'reserva']);
  });
});
