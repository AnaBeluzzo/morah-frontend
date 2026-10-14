import type { ParametrosPagina } from '../tipos/comum';
import type {
  BaixaManualRequest,
  Cobranca,
  CobrancaPage,
  DocumentoFinanceiro,
  DocumentoFinanceiroCreateRequest,
  DocumentoFinanceiroPage,
  FiltrosCobrancas,
  GerarCobrancasResponse,
  InadimplenciaResumo,
  PixResponse,
  Taxa,
  TaxaCreateRequest,
} from '../tipos/financeiro';
import { ApiClient } from './ApiClient';

const cliente = ApiClient.getInstance();

export function buscarCobrancas(filtros: FiltrosCobrancas & ParametrosPagina): Promise<CobrancaPage> {
  return cliente.get<CobrancaPage>('/financeiro/cobrancas', { ...filtros });
}

export function buscarCobranca(cobrancaId: number): Promise<Cobranca> {
  return cliente.get<Cobranca>(`/financeiro/cobrancas/${cobrancaId}`);
}

/** Gera (ou devolve o vigente) código PIX copia-e-cola; expira 30 min depois. 409 se paga/cancelada. */
export function gerarPix(cobrancaId: number): Promise<PixResponse> {
  return cliente.get<PixResponse>(`/financeiro/cobrancas/${cobrancaId}/pix`);
}

export function baixarCobrancaManualmente(cobrancaId: number, dados: BaixaManualRequest): Promise<Cobranca> {
  return cliente.post<Cobranca>(`/financeiro/cobrancas/${cobrancaId}/baixa-manual`, dados);
}

export function buscarDocumentosFinanceiros(parametros: ParametrosPagina): Promise<DocumentoFinanceiroPage> {
  return cliente.get<DocumentoFinanceiroPage>('/financeiro/documentos', { ...parametros });
}

export function criarDocumentoFinanceiro(dados: DocumentoFinanceiroCreateRequest): Promise<DocumentoFinanceiro> {
  return cliente.post<DocumentoFinanceiro>('/financeiro/documentos', dados);
}

export function criarTaxa(dados: TaxaCreateRequest): Promise<Taxa> {
  return cliente.post<Taxa>('/financeiro/taxas', dados);
}

export function gerarCobrancasEmLote(taxaId: number): Promise<GerarCobrancasResponse> {
  return cliente.post<GerarCobrancasResponse>(`/financeiro/taxas/${taxaId}/gerar-cobrancas`);
}

export function buscarInadimplencia(): Promise<InadimplenciaResumo> {
  return cliente.get<InadimplenciaResumo>('/financeiro/inadimplencia');
}
