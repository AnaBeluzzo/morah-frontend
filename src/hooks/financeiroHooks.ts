import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  baixarCobrancaManualmente,
  buscarCobranca,
  buscarCobrancas,
  buscarDocumentosFinanceiros,
  buscarInadimplencia,
  criarDocumentoFinanceiro,
  criarTaxa,
  gerarCobrancasEmLote,
  gerarPix,
} from '../api/financeiroApi';
import type { BaixaManualRequest, DocumentoFinanceiroCreateRequest, FiltrosCobrancas, TaxaCreateRequest } from '../tipos/financeiro';
import { Logger } from '../utils/logger';
import { proximaPagina, TAMANHO_PAGINA } from './paginacao';

const logger = Logger.getInstance();

export function useCobrancas(filtros: FiltrosCobrancas) {
  return useInfiniteQuery({
    queryKey: ['cobrancas', filtros],
    queryFn: ({ pageParam }) => buscarCobrancas({ ...filtros, page: pageParam, size: TAMANHO_PAGINA }),
    initialPageParam: 0,
    getNextPageParam: proximaPagina,
  });
}

export function useCobranca(cobrancaId: number) {
  return useQuery({ queryKey: ['cobranca', cobrancaId], queryFn: () => buscarCobranca(cobrancaId) });
}

/** O código PIX não é reaproveitado do cache: cada tela pede o vigente (e "gerar novo" busca de novo). */
export function usePix(cobrancaId: number) {
  return useQuery({ queryKey: ['pix', cobrancaId], queryFn: () => gerarPix(cobrancaId), staleTime: 0, gcTime: 0 });
}

export function useBaixarCobrancaManualmente(cobrancaId: number) {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (dados: BaixaManualRequest) => baixarCobrancaManualmente(cobrancaId, dados),
    onSuccess: (cobranca) => {
      clienteQuery.setQueryData(['cobranca', cobrancaId], cobranca);
      logger.info('Financeiro', `baixa manual da cobrança ${cobrancaId}`);
      return Promise.all([
        clienteQuery.invalidateQueries({ queryKey: ['cobrancas'] }),
        clienteQuery.invalidateQueries({ queryKey: ['inadimplencia'] }),
        clienteQuery.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });
}

export function useDocumentosFinanceiros() {
  return useInfiniteQuery({
    queryKey: ['documentos'],
    queryFn: ({ pageParam }) => buscarDocumentosFinanceiros({ page: pageParam, size: TAMANHO_PAGINA }),
    initialPageParam: 0,
    getNextPageParam: proximaPagina,
  });
}

export function useCriarDocumentoFinanceiro() {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (dados: DocumentoFinanceiroCreateRequest) => criarDocumentoFinanceiro(dados),
    onSuccess: () => clienteQuery.invalidateQueries({ queryKey: ['documentos'] }),
  });
}

export function useCriarTaxa() {
  return useMutation({
    mutationFn: (dados: TaxaCreateRequest) => criarTaxa(dados),
    onSuccess: (taxa) => logger.info('Financeiro', `taxa ${taxa.id} criada`),
  });
}

export function useGerarCobrancas() {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (taxaId: number) => gerarCobrancasEmLote(taxaId),
    onSuccess: () =>
      Promise.all([
        clienteQuery.invalidateQueries({ queryKey: ['cobrancas'] }),
        clienteQuery.invalidateQueries({ queryKey: ['inadimplencia'] }),
        clienteQuery.invalidateQueries({ queryKey: ['dashboard'] }),
      ]),
  });
}

export function useInadimplencia() {
  return useQuery({ queryKey: ['inadimplencia'], queryFn: buscarInadimplencia });
}
