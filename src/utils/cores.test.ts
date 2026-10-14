import { describe, expect, it } from 'vitest';
import { aplicarCores, contraste, corDoTextoSobre, corValida } from './cores';

describe('cores', () => {
  it('deveValidarOFormatoRRGGBB', () => {
    expect(corValida('#1F4E79')).toBe(true);
    expect(corValida('#f2f4f7')).toBe(true);
    expect(corValida('azul')).toBe(false);
    expect(corValida('#FFF')).toBe(false);
    expect(corValida('1F4E79')).toBe(false);
  });

  it('deveCalcularAContrasteWcag', () => {
    expect(contraste('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contraste('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('deveEscolherTextoClaroSobreCorEscuraETextoEscuroSobreCorClara', () => {
    expect(corDoTextoSobre('#1F4E79')).toBe('#FFFFFF');
    expect(corDoTextoSobre('#0F766E')).toBe('#FFFFFF');
    expect(corDoTextoSobre('#F2F4F7')).toBe('#111827');
    expect(corDoTextoSobre('#F59E0B')).toBe('#111827');
    expect(corDoTextoSobre('#FFFF00')).toBe('#111827');
  });

  it('deveAplicarAsCoresComoVariaveisCss', () => {
    aplicarCores({ corPrimaria: '#0F766E', corSecundaria: '#F2F4F7', corDestaque: '#F97316' });
    const estilo = document.documentElement.style;
    expect(estilo.getPropertyValue('--cor-primaria')).toBe('#0F766E');
    expect(estilo.getPropertyValue('--cor-primaria-texto')).toBe('#FFFFFF');
    expect(estilo.getPropertyValue('--cor-secundaria')).toBe('#F2F4F7');
    expect(estilo.getPropertyValue('--cor-secundaria-texto')).toBe('#111827');
    expect(estilo.getPropertyValue('--cor-destaque')).toBe('#F97316');
  });

  it('deveIgnorarCorInvalidaEManterAAnterior', () => {
    aplicarCores({ corPrimaria: '#1F4E79', corSecundaria: '#F2F4F7', corDestaque: '#F59E0B' });
    aplicarCores({ corPrimaria: 'vermelho', corSecundaria: '#F2F4F7', corDestaque: '#F59E0B' });
    expect(document.documentElement.style.getPropertyValue('--cor-primaria')).toBe('#1F4E79');
  });
});
