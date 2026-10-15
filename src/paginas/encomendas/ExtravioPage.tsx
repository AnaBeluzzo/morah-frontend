import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ErroApi } from '../../api/ApiClient';
import { Botao } from '../../componentes/Botao';
import { Campo } from '../../componentes/Campo';
import { ErroFormulario } from '../../componentes/Estados';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useAbrirOcorrencia } from '../../hooks/encomendasHooks';

/** Morador informa o extravio: abre uma ocorrência e a encomenda passa a "Extraviada". */
export function ExtravioPage() {
  const encomendaId = Number(useParams().encomendaId);
  const navigate = useNavigate();
  const { mostrarToast } = useToast();
  const ocorrencia = useAbrirOcorrencia(encomendaId);
  const [titulo, setTitulo] = useState('Encomenda não encontrada na portaria');
  const [descricao, setDescricao] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const erroServidor = ocorrencia.error instanceof ErroApi ? ocorrencia.error : null;

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const encontrados: Record<string, string> = {};
    if (!titulo.trim()) encontrados.titulo = 'Informe um título.';
    if (!descricao.trim()) encontrados.descricao = 'Conte o que aconteceu.';
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      return;
    }
    ocorrencia.mutate(
      { titulo: titulo.trim(), descricao: descricao.trim() },
      {
        onSuccess: () => {
          mostrarToast('Ocorrência aberta');
          navigate(`/encomendas/${encomendaId}`, { replace: true });
        },
      },
    );
  }

  return (
    <Tela titulo="Informar extravio" voltarPara={`/encomendas/${encomendaId}`}>
      <form onSubmit={enviar} noValidate>
        <Campo id="titulo" rotulo="Título" valor={titulo} aoMudar={setTitulo} erro={erros.titulo ?? erroServidor?.erroDoCampo('titulo')} obrigatorio />
        <Campo id="descricao" rotulo="O que aconteceu" como="textarea" valor={descricao} aoMudar={setDescricao} erro={erros.descricao ?? erroServidor?.erroDoCampo('descricao')} obrigatorio />
        <ErroFormulario erro={erroServidor && erroServidor.erros.length === 0 ? erroServidor : null} />
        <Botao type="submit" variante="perigo" carregando={ocorrencia.isPending}>
          Abrir ocorrência de extravio
        </Botao>
      </form>
    </Tela>
  );
}
