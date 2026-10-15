import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { ErroApi } from '../../api/ApiClient';
import { Botao } from '../../componentes/Botao';
import { Campo } from '../../componentes/Campo';
import { ErroFormulario } from '../../componentes/Estados';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useRegistrarEncomenda } from '../../hooks/encomendasHooks';

type Campos = 'unidadeId' | 'transportadora' | 'remetente' | 'codigoRastreio' | 'fotoUrl';

/** Portaria registra o recebimento; a unidade é notificada e recebe o código de retirada. */
export function RegistrarEncomendaPage() {
  const navigate = useNavigate();
  const { mostrarToast } = useToast();
  const registrar = useRegistrarEncomenda();
  const [valores, setValores] = useState<Record<Campos, string>>({ unidadeId: '', transportadora: '', remetente: '', codigoRastreio: '', fotoUrl: '' });
  const [erros, setErros] = useState<Partial<Record<Campos, string>>>({});
  const erroServidor = registrar.error instanceof ErroApi ? registrar.error : null;

  function mudar(campo: Campos, valor: string) {
    setValores({ ...valores, [campo]: valor });
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const encontrados: Partial<Record<Campos, string>> = {};
    if (!(Number(valores.unidadeId) >= 1)) encontrados.unidadeId = 'Informe o ID da unidade.';
    if (!valores.transportadora.trim()) encontrados.transportadora = 'Informe a transportadora.';
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      return;
    }
    registrar.mutate(
      {
        unidadeId: Number(valores.unidadeId),
        transportadora: valores.transportadora.trim(),
        remetente: valores.remetente.trim() || undefined,
        codigoRastreio: valores.codigoRastreio.trim() || undefined,
        fotoUrl: valores.fotoUrl.trim() || undefined,
      },
      {
        onSuccess: (encomenda) => {
          mostrarToast('Encomenda registrada: a unidade foi avisada');
          navigate(`/encomendas/${encomenda.id}`, { replace: true });
        },
      },
    );
  }

  return (
    <Tela titulo="Registrar encomenda" voltarPara="/encomendas">
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
        <Campo id="transportadora" rotulo="Transportadora" valor={valores.transportadora} aoMudar={(v) => mudar('transportadora', v)} erro={erros.transportadora ?? erroServidor?.erroDoCampo('transportadora')} obrigatorio />
        <Campo id="remetente" rotulo="Remetente" valor={valores.remetente} aoMudar={(v) => mudar('remetente', v)} erro={erroServidor?.erroDoCampo('remetente')} />
        <Campo id="codigoRastreio" rotulo="Código de rastreio" valor={valores.codigoRastreio} aoMudar={(v) => mudar('codigoRastreio', v)} erro={erroServidor?.erroDoCampo('codigoRastreio')} />
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
        <ErroFormulario erro={erroServidor && erroServidor.erros.length === 0 ? erroServidor : null} mensagem404="Unidade não encontrada" />
        <Botao type="submit" carregando={registrar.isPending}>
          Registrar e avisar a unidade
        </Botao>
      </form>
    </Tela>
  );
}
