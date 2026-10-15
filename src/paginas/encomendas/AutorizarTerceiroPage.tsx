import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router';
import { ErroApi } from '../../api/ApiClient';
import { Botao, BotaoLink } from '../../componentes/Botao';
import { Campo } from '../../componentes/Campo';
import { Cartao } from '../../componentes/Cartao';
import { ErroFormulario } from '../../componentes/Estados';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useAutorizarRetiradaTerceiro } from '../../hooks/encomendasHooks';
import { formatarDataHora } from '../../utils/formatadores';
import estilos from '../paginas.module.css';

/** Morador autoriza outra pessoa a retirar; o código gerado é mostrado para ele repassar. */
export function AutorizarTerceiroPage() {
  const encomendaId = Number(useParams().encomendaId);
  const autorizar = useAutorizarRetiradaTerceiro(encomendaId);
  const { mostrarToast } = useToast();
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [validadeHoras, setValidadeHoras] = useState('24');
  const [erros, setErros] = useState<Record<string, string>>({});
  const erroServidor = autorizar.error instanceof ErroApi ? autorizar.error : null;

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const horas = Number(validadeHoras);
    const encontrados: Record<string, string> = {};
    if (!nome.trim()) encontrados.nomeTerceiro = 'Informe o nome de quem vai retirar.';
    if (!documento.trim()) encontrados.documento = 'Informe o documento de quem vai retirar.';
    if (!Number.isInteger(horas) || horas < 1) encontrados.validadeHoras = 'A validade é de pelo menos 1 hora.';
    setErros(encontrados);
    if (Object.keys(encontrados).length === 0) {
      autorizar.mutate({ nomeTerceiro: nome.trim(), documento: documento.trim(), validadeHoras: horas });
    }
  }

  async function copiar(codigo: string) {
    try {
      await navigator.clipboard.writeText(codigo);
      mostrarToast('Código copiado');
    } catch {
      mostrarToast('Não foi possível copiar. Anote o código.', 'erro');
    }
  }

  const gerada = autorizar.data;
  if (gerada) {
    return (
      <Tela titulo="Pessoa autorizada" voltarPara={`/encomendas/${encomendaId}`}>
        <Cartao rotulo="Código para o terceiro">
          <p>Passe este código para {gerada.nomeTerceiro}. Ele vale até {formatarDataHora(gerada.validade)}.</p>
          <p className={estilos.codigoGrande} aria-label="Código do terceiro">
            {gerada.codigo}
          </p>
        </Cartao>
        <div className={estilos.acoes}>
          <Botao onClick={() => copiar(gerada.codigo)}>Copiar código</Botao>
          <BotaoLink para={`/encomendas/${encomendaId}`} variante="secundario">
            Voltar para a encomenda
          </BotaoLink>
        </div>
      </Tela>
    );
  }

  return (
    <Tela titulo="Autorizar retirada" voltarPara={`/encomendas/${encomendaId}`}>
      <form onSubmit={enviar} noValidate>
        <Campo id="nomeTerceiro" rotulo="Nome de quem vai retirar" valor={nome} aoMudar={setNome} erro={erros.nomeTerceiro ?? erroServidor?.erroDoCampo('nomeTerceiro')} obrigatorio />
        <Campo id="documento" rotulo="Documento" valor={documento} aoMudar={setDocumento} erro={erros.documento ?? erroServidor?.erroDoCampo('documento')} obrigatorio />
        <Campo
          id="validadeHoras"
          rotulo="Validade (horas)"
          tipo="number"
          inputMode="numeric"
          min="1"
          valor={validadeHoras}
          aoMudar={setValidadeHoras}
          erro={erros.validadeHoras ?? erroServidor?.erroDoCampo('validadeHoras')}
          ajuda="Depois disso o código deixa de valer."
        />
        <ErroFormulario erro={erroServidor && erroServidor.erros.length === 0 ? erroServidor : null} />
        <Botao type="submit" carregando={autorizar.isPending}>
          Gerar código
        </Botao>
      </form>
    </Tela>
  );
}
