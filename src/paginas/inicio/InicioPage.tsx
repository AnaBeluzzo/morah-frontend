import { Cartao } from '../../componentes/Cartao';
import { Tela } from '../../componentes/Tela';

export function InicioPage() {
  return (
    <Tela titulo="Início">
      <Cartao>
        <h2>Bem-vindo ao Morah</h2>
        <p>Gestão do seu condomínio na palma da mão.</p>
      </Cartao>
    </Tela>
  );
}
