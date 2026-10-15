import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ErroApi } from '../../api/ApiClient';
import { Botao } from '../../componentes/Botao';
import { Campo } from '../../componentes/Campo';
import { ErroFormulario } from '../../componentes/Estados';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useRegistrarVistoria } from '../../hooks/reservasHooks';
import type { MomentoVistoria } from '../../tipos/reservas';
import { ROTULOS_MOMENTO_VISTORIA } from '../../utils/rotulos';
import estilos from '../paginas.module.css';

const OPCOES_MOMENTO = Object.entries(ROTULOS_MOMENTO_VISTORIA).map(([valor, rotulo]) => ({ valor, rotulo }));

/** Portaria vistoria o espaço: com dano abre uma ocorrência; a vistoria de saída conclui a reserva. */
export function VistoriaPage() {
  const reservaId = Number(useParams().reservaId);
  const navigate = useNavigate();
  const { mostrarToast } = useToast();
  const vistoria = useRegistrarVistoria(reservaId);
  const [momento, setMomento] = useState<MomentoVistoria>('entrada');
  const [observacao, setObservacao] = useState('');
  const [dano, setDano] = useState(false);
  const [fotos, setFotos] = useState('');
  const erroServidor = vistoria.error instanceof ErroApi ? vistoria.error : null;

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    // uma URL por linha (não há upload de fotos)
    const fotosUrl = fotos
      .split('\n')
      .map((linha) => linha.trim())
      .filter(Boolean);
    vistoria.mutate(
      { momento, observacao: observacao.trim() || undefined, dano, fotosUrl: fotosUrl.length > 0 ? fotosUrl : undefined },
      {
        onSuccess: () => {
          mostrarToast(dano ? 'Vistoria registrada e ocorrência aberta' : 'Vistoria registrada');
          navigate(`/reservas/${reservaId}`, { replace: true });
        },
      },
    );
  }

  return (
    <Tela titulo="Vistoria" voltarPara={`/reservas/${reservaId}`}>
      <form onSubmit={enviar} noValidate>
        <Campo id="momento" rotulo="Momento" como="select" opcoes={OPCOES_MOMENTO} valor={momento} aoMudar={(valor) => setMomento(valor as MomentoVistoria)} erro={erroServidor?.erroDoCampo('momento')} obrigatorio />
        <label className={estilos.opcaoCheck}>
          <input type="checkbox" checked={dano} onChange={(evento) => setDano(evento.target.checked)} />
          Houve dano no espaço
        </label>
        <Campo id="observacao" rotulo="Observação" como="textarea" valor={observacao} aoMudar={setObservacao} erro={erroServidor?.erroDoCampo('observacao')} />
        <Campo
          id="fotos"
          rotulo="URLs das fotos"
          como="textarea"
          valor={fotos}
          aoMudar={setFotos}
          erro={erroServidor?.erroDoCampo('fotosUrl')}
          ajuda="Opcional. Uma URL por linha (não há upload)."
        />
        <ErroFormulario erro={erroServidor && erroServidor.erros.length === 0 ? erroServidor : null} />
        <Botao type="submit" carregando={vistoria.isPending}>
          Registrar vistoria
        </Botao>
      </form>
    </Tela>
  );
}
