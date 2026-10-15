import { describe, expect, it } from 'vitest';
import {
  rotular,
  ROTULOS_MODULO,
  ROTULOS_PERFIL,
  ROTULOS_PRIORIDADE_AVISO,
  ROTULOS_STATUS_ACESSO,
  ROTULOS_STATUS_AUTORIZACAO_VISITA,
  ROTULOS_STATUS_COBRANCA,
  ROTULOS_STATUS_AUTORIZACAO_RETIRADA,
  ROTULOS_STATUS_ENCOMENDA,
  ROTULOS_STATUS_OCORRENCIA,
  TOM_STATUS_ENCOMENDA,
  ROTULOS_MOMENTO_VISTORIA,
  ROTULOS_STATUS_RESERVA,
  TOM_STATUS_RESERVA,
  TOM_STATUS_ACESSO,
  TOM_STATUS_AUTORIZACAO_VISITA,
  ROTULOS_STATUS_SOLICITACAO_VINCULO,
  ROTULOS_TIPO_VINCULO,
  TOM_STATUS_SOLICITACAO_VINCULO,
  ROTULOS_TIPO_RATEIO,
  TOM_STATUS_COBRANCA,
  ROTULOS_TIPO_NOTIFICACAO,
  ROTULOS_TIPO_PUBLICO_ALVO,
  TOM_PRIORIDADE_AVISO,
} from './rotulos';

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

  it('prioridadeAvisoDeveTerRotuloETomParaTodoValorDoContrato', () => {
    expect(chaves(ROTULOS_PRIORIDADE_AVISO)).toEqual(['normal', 'urgente']);
    expect(chaves(TOM_PRIORIDADE_AVISO)).toEqual(['normal', 'urgente']);
    expect(chaves(ROTULOS_TIPO_PUBLICO_ALVO)).toEqual(['bloco', 'condominio', 'unidade']);
  });

  it('statusCobrancaETipoRateioDevemTerRotuloParaTodoValorDoContrato', () => {
    expect(chaves(ROTULOS_STATUS_COBRANCA)).toEqual(['atrasado', 'cancelado', 'pago', 'pendente']);
    expect(chaves(TOM_STATUS_COBRANCA)).toEqual(['atrasado', 'cancelado', 'pago', 'pendente']);
    expect(chaves(ROTULOS_TIPO_RATEIO)).toEqual(['fracao_ideal', 'igualitario']);
  });

  it('tipoVinculoEStatusSolicitacaoDevemTerRotuloParaTodoValorDoContrato', () => {
    expect(chaves(ROTULOS_TIPO_VINCULO)).toEqual(['dependente', 'inquilino', 'proprietario']);
    expect(chaves(ROTULOS_STATUS_SOLICITACAO_VINCULO)).toEqual(['aprovada', 'pendente', 'rejeitada']);
    expect(chaves(TOM_STATUS_SOLICITACAO_VINCULO)).toEqual(['aprovada', 'pendente', 'rejeitada']);
  });

  it('statusDaPortariaDevemTerRotuloETomParaTodoValorDoContrato', () => {
    expect(chaves(ROTULOS_STATUS_AUTORIZACAO_VISITA)).toEqual(['autorizada', 'expirada', 'pendente', 'recusada']);
    expect(chaves(TOM_STATUS_AUTORIZACAO_VISITA)).toEqual(['autorizada', 'expirada', 'pendente', 'recusada']);
    expect(chaves(ROTULOS_STATUS_ACESSO)).toEqual(['no_condominio', 'saiu']);
    expect(chaves(TOM_STATUS_ACESSO)).toEqual(['no_condominio', 'saiu']);
  });

  it('statusReservaEMomentoVistoriaDevemTerRotuloParaTodoValorDoContrato', () => {
    expect(chaves(ROTULOS_STATUS_RESERVA)).toEqual(['cancelada', 'concluida', 'confirmada', 'nao_compareceu']);
    expect(chaves(TOM_STATUS_RESERVA)).toEqual(['cancelada', 'concluida', 'confirmada', 'nao_compareceu']);
    expect(chaves(ROTULOS_MOMENTO_VISTORIA)).toEqual(['entrada', 'saida']);
  });

  it('statusDeEncomendasDevemTerRotuloParaTodoValorDoContrato', () => {
    expect(chaves(ROTULOS_STATUS_ENCOMENDA)).toEqual(['aguardando_retirada', 'extraviada', 'retirada']);
    expect(chaves(TOM_STATUS_ENCOMENDA)).toEqual(['aguardando_retirada', 'extraviada', 'retirada']);
    expect(chaves(ROTULOS_STATUS_AUTORIZACAO_RETIRADA)).toEqual(['ativa', 'expirada', 'utilizada']);
    expect(chaves(ROTULOS_STATUS_OCORRENCIA)).toEqual(['aberta', 'em_andamento', 'encerrada']);
  });

  it('moduloCodigoDeveTerRotuloParaTodoValorDoContrato', () => {
    expect(chaves(ROTULOS_MODULO)).toEqual(['avisos', 'encomendas', 'financeiro', 'minha_unidade', 'portaria', 'reservas']);
  });
});
