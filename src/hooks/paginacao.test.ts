import { describe, expect, it } from 'vitest';
import { itensDasPaginas, proximaPagina } from './paginacao';

describe('paginacao', () => {
  it('deveIndicarAProximaPaginaEnquantoHouver', () => {
    expect(proximaPagina({ content: [], page: { page: 0, size: 20, totalElements: 45, totalPages: 3 } })).toBe(1);
    expect(proximaPagina({ content: [], page: { page: 2, size: 20, totalElements: 45, totalPages: 3 } })).toBeUndefined();
    expect(proximaPagina({ content: [], page: { page: 0, size: 20, totalElements: 0, totalPages: 0 } })).toBeUndefined();
  });

  it('deveJuntarOsItensDeTodasAsPaginas', () => {
    const metadados = { page: 0, size: 2, totalElements: 3, totalPages: 2 };
    const dados = { pages: [{ content: [1, 2], page: metadados }, { content: [3], page: { ...metadados, page: 1 } }], pageParams: [0, 1] };
    expect(itensDasPaginas(dados)).toEqual([1, 2, 3]);
    expect(itensDasPaginas(undefined)).toEqual([]);
  });
});
