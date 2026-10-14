import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { ErroApi } from '../../api/ApiClient';
import { Botao } from '../../componentes/Botao';
import { Campo } from '../../componentes/Campo';
import { ErroFormulario } from '../../componentes/Estados';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useCriarDocumentoFinanceiro } from '../../hooks/financeiroHooks';
import { ROTULOS_TIPO_DOCUMENTO } from '../../utils/rotulos';

const OPCOES_TIPO = Object.entries(ROTULOS_TIPO_DOCUMENTO).map(([valor, rotulo]) => ({ valor, rotulo }));

type Erros = Partial<Record<'tipo' | 'titulo' | 'arquivoUrl' | 'competencia', string>>;

function urlValida(valor: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(valor).protocol);
  } catch {
    return false;
  }
}

/** Síndico publica um documento: o arquivo é uma URL de texto (não há upload). */
export function NovoDocumentoPage() {
  const navigate = useNavigate();
  const { mostrarToast } = useToast();
  const publicar = useCriarDocumentoFinanceiro();
  const [tipo, setTipo] = useState('nota_fiscal');
  const [titulo, setTitulo] = useState('');
  const [arquivoUrl, setArquivoUrl] = useState('');
  const [competencia, setCompetencia] = useState('');
  const [erros, setErros] = useState<Erros>({});
  const erroServidor = publicar.error instanceof ErroApi ? publicar.error : null;

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const encontrados: Erros = {};
    if (!titulo.trim()) encontrados.titulo = 'Informe o título.';
    if (!arquivoUrl.trim()) encontrados.arquivoUrl = 'Informe a URL do arquivo.';
    else if (!urlValida(arquivoUrl.trim())) encontrados.arquivoUrl = 'Informe uma URL começando com http:// ou https://.';
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      return;
    }
    publicar.mutate(
      { tipo, titulo: titulo.trim(), arquivoUrl: arquivoUrl.trim(), competencia: competencia || undefined },
      {
        onSuccess: () => {
          mostrarToast('Documento publicado');
          navigate('/financeiro/documentos', { replace: true });
        },
      },
    );
  }

  return (
    <Tela titulo="Publicar documento" voltarPara="/financeiro/documentos">
      <form onSubmit={enviar} noValidate>
        <Campo id="tipo" rotulo="Tipo" como="select" opcoes={OPCOES_TIPO} valor={tipo} aoMudar={setTipo} erro={erroServidor?.erroDoCampo('tipo')} obrigatorio />
        <Campo id="titulo" rotulo="Título" valor={titulo} aoMudar={setTitulo} erro={erros.titulo ?? erroServidor?.erroDoCampo('titulo')} obrigatorio />
        <Campo
          id="arquivoUrl"
          rotulo="URL do arquivo"
          tipo="url"
          inputMode="url"
          placeholder="https://..."
          valor={arquivoUrl}
          aoMudar={setArquivoUrl}
          erro={erros.arquivoUrl ?? erroServidor?.erroDoCampo('arquivoUrl')}
          ajuda="Endereço de um arquivo já publicado (não há upload)."
          obrigatorio
        />
        <Campo id="competencia" rotulo="Competência" tipo="date" valor={competencia} aoMudar={setCompetencia} erro={erroServidor?.erroDoCampo('competencia')} ajuda="Opcional." />
        <ErroFormulario erro={erroServidor && erroServidor.erros.length === 0 ? erroServidor : null} />
        <Botao type="submit" carregando={publicar.isPending}>
          Publicar
        </Botao>
      </form>
    </Tela>
  );
}
