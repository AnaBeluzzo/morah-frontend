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
import type { BaixaManualRequest, DocumentoFinanceiroCreateRequest, FiltrosCobrancas, GerarCobrancasResponse, Taxa, TaxaCreateRequest } from '../tipos/financeiro';
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

/** Taxa criada nesta sessão e o resultado da última geração de cobranças dela. */
export interface TaxaCriada {
  taxa: Taxa;
  resultado?: GerarCobrancasResponse;
}

// Não existe listagem de taxas no contrato: as criadas ficam só em memória (cache do Query),
// para oferecer "Gerar cobranças" com o id devolvido. Somem no logout ou ao recarregar.
const CHAVE_TAXAS_CRIADAS = ['taxasCriadas'];

export function useTaxasCriadas() {
  return useQuery<TaxaCriada[]>({ queryKey: CHAVE_TAXAS_CRIADAS, queryFn: () => [], initialData: [], staleTime: Infinity, gcTime: Infinity });
}

export function useCriarTaxa() {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (dados: TaxaCreateRequest) => criarTaxa(dados),
    onSuccess: (taxa) => {
      clienteQuery.setQueryData<TaxaCriada[]>(CHAVE_TAXAS_CRIADAS, (atuais = []) => [{ taxa }, ...atuais]);
      logger.info('Financeiro', `taxa ${taxa.id} criada`);
    },
  });
}

export function useGerarCobrancas() {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (taxaId: number) => gerarCobrancasEmLote(taxaId),
    onSuccess: (resultado) => {
      clienteQuery.setQueryData<TaxaCriada[]>(CHAVE_TAXAS_CRIADAS, (atuais = []) =>
        atuais.map((item) => (item.taxa.id === resultado.taxaId ? { ...item, resultado } : item)),
      );
      return Promise.all([
        clienteQuery.invalidateQueries({ queryKey: ['cobrancas'] }),
        clienteQuery.invalidateQueries({ queryKey: ['inadimplencia'] }),
        clienteQuery.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });
}

export function useInadimplencia() {
  return useQuery({ queryKey: ['inadimplencia'], queryFn: buscarInadimplencia });
}
