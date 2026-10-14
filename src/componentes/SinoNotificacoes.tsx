import { Link } from 'react-router';
import { useNaoLidas } from '../hooks/notificacoesHooks';
import { Icone } from './Icone';
import estilos from './SinoNotificacoes.module.css';

/** Sino da barra superior com o selo de não lidas ("9+" acima de 9). */
export function SinoNotificacoes() {
  const { data: naoLidas = 0 } = useNaoLidas();
  const texto = naoLidas > 9 ? '9+' : String(naoLidas);
  const rotulo = naoLidas > 0 ? `Notificações (${texto} não lidas)` : 'Notificações';
  return (
    <Link to="/notificacoes" className={estilos.sino} aria-label={rotulo}>
      <Icone nome="sino" />
      {naoLidas > 0 && (
        <span className={estilos.selo} aria-hidden="true">
          {texto}
        </span>
      )}
    </Link>
  );
}
