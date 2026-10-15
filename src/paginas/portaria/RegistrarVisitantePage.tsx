import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { ErroApi } from '../../api/ApiClient';
import { Botao } from '../../componentes/Botao';
import { Campo } from '../../componentes/Campo';
import { ErroFormulario } from '../../componentes/Estados';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useRegistrarVisitante } from '../../hooks/portariaHooks';

type Campos = 'unidadeId' | 'nome' | 'documento' | 'telefone' | 'motivo' | 'fotoUrl';

/** Portaria registra quem chegou; a unidade recebe o pedido de autorização. */
export function RegistrarVisitantePage() {
  const navigate = useNavigate();
  const { mostrarToast } = useToast();
  const registrar = useRegistrarVisitante();
  const [valores, setValores] = useState<Record<Campos, string>>({ unidadeId: '', nome: '', documento: '', telefone: '', motivo: '', fotoUrl: '' });
  const [erros, setErros] = useState<Partial<Record<Campos, string>>>({});
  const erroServidor = registrar.error instanceof ErroApi ? registrar.error : null;

  function mudar(campo: Campos, valor: string) {
    setValores({ ...valores, [campo]: valor });
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const encontrados: Partial<Record<Campos, string>> = {};
    if (!(Number(valores.unidadeId) >= 1)) encontrados.unidadeId = 'Informe o ID da unidade.';
    if (!valores.nome.trim()) encontrados.nome = 'Informe o nome do visitante.';
    if (!valores.motivo.trim()) encontrados.motivo = 'Informe o motivo da visita.';
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      return;
    }
    registrar.mutate(
      {
        unidadeId: Number(valores.unidadeId),
        visitante: { nome: valores.nome.trim(), documento: valores.documento.trim() || undefined, telefone: valores.telefone.trim() || undefined },
        motivo: valores.motivo.trim(),
        fotoUrl: valores.fotoUrl.trim() || undefined,
      },
      {
        onSuccess: (autorizacao) => {
          mostrarToast('Visitante registrado: aguardando a unidade');
          navigate(`/visitantes/${autorizacao.id}`, { replace: true });
        },
      },
    );
  }

  return (
    <Tela titulo="Registrar visitante" voltarPara="/visitantes">
      <form onSubmit={enviar} noValidate>
        <Campo
          id="unidadeId"
          rotulo="ID da unidade"
          tipo="number"
          inputMode="numeric"
          min="1"
          valor={valores.unidadeId}
          aoMudar={(v) => mudar('unidadeId', v)}
          erro={erros.unidadeId ?? erroServidor?.erroDoCampo('unidadeId')}
          ajuda="O app não tem lista de unidades: informe o número de identificação (ID)."
          obrigatorio
        />
        <Campo id="nome" rotulo="Nome do visitante" valor={valores.nome} aoMudar={(v) => mudar('nome', v)} erro={erros.nome ?? erroServidor?.erroDoCampo('visitante.nome')} obrigatorio />
        <Campo id="documento" rotulo="Documento" valor={valores.documento} aoMudar={(v) => mudar('documento', v)} erro={erroServidor?.erroDoCampo('visitante.documento')} />
        <Campo id="telefone" rotulo="Telefone" tipo="tel" inputMode="tel" valor={valores.telefone} aoMudar={(v) => mudar('telefone', v)} erro={erroServidor?.erroDoCampo('visitante.telefone')} />
        <Campo id="motivo" rotulo="Motivo" valor={valores.motivo} aoMudar={(v) => mudar('motivo', v)} erro={erros.motivo ?? erroServidor?.erroDoCampo('motivo')} placeholder="ex.: visita, entrega, serviço" obrigatorio />
        <Campo
          id="fotoUrl"
          rotulo="URL da foto"
          tipo="url"
          inputMode="url"
          valor={valores.fotoUrl}
          aoMudar={(v) => mudar('fotoUrl', v)}
          erro={erroServidor?.erroDoCampo('fotoUrl')}
          ajuda="Opcional. Endereço de uma foto já publicada (não há upload)."
        />
        {/* 404 = a unidade informada não existe neste condomínio */}
        <ErroFormulario erro={erroServidor && erroServidor.erros.length === 0 ? erroServidor : null} mensagem404="Unidade não encontrada" />
        <Botao type="submit" carregando={registrar.isPending}>
          Registrar e avisar a unidade
        </Botao>
      </form>
    </Tela>
  );
}
