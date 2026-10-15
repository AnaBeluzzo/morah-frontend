import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ErroApi } from '../../api/ApiClient';
import { Botao } from '../../componentes/Botao';
import { Campo } from '../../componentes/Campo';
import { ErroFormulario } from '../../componentes/Estados';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useConfirmarRetirada } from '../../hooks/encomendasHooks';

/**
 * Portaria confirma a retirada digitando o código da encomenda OU o código que o morador gerou
 * para um terceiro. Código errado ou vencido: o servidor responde 409 e a mensagem aparece aqui.
 */
export function RetiradaPage() {
  const encomendaId = Number(useParams().encomendaId);
  const navigate = useNavigate();
  const { mostrarToast } = useToast();
  const retirada = useConfirmarRetirada(encomendaId);
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [erroCodigo, setErroCodigo] = useState<string>();
  const erroServidor = retirada.error instanceof ErroApi ? retirada.error : null;

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!codigo.trim()) {
      setErroCodigo('Informe o código de retirada.');
      return;
    }
    setErroCodigo(undefined);
    retirada.mutate(
      { codigo: codigo.trim(), retiradoPorNome: nome.trim() || undefined, retiradoPorDocumento: documento.trim() || undefined },
      {
        onSuccess: () => {
          mostrarToast('Retirada confirmada');
          navigate(`/encomendas/${encomendaId}`, { replace: true });
        },
      },
    );
  }

  return (
    <Tela titulo="Confirmar retirada" voltarPara={`/encomendas/${encomendaId}`}>
      <form onSubmit={enviar} noValidate>
        <Campo
          id="codigo"
          rotulo="Código de retirada"
          inputMode="numeric"
          autoComplete="off"
          maxLength={6}
          valor={codigo}
          aoMudar={setCodigo}
          erro={erroCodigo ?? erroServidor?.erroDoCampo('codigo')}
          ajuda="O código de 6 dígitos da encomenda ou o de uma pessoa autorizada pelo morador."
          obrigatorio
        />
        <Campo id="retiradoPorNome" rotulo="Nome de quem retira" valor={nome} aoMudar={setNome} ajuda="Opcional." />
        <Campo id="retiradoPorDocumento" rotulo="Documento de quem retira" valor={documento} aoMudar={setDocumento} ajuda="Opcional." />
        <ErroFormulario erro={erroServidor && erroServidor.erros.length === 0 ? erroServidor : null} />
        <Botao type="submit" carregando={retirada.isPending}>
          Confirmar retirada
        </Botao>
      </form>
    </Tela>
  );
}
