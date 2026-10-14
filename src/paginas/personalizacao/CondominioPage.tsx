import { Cartao, ListaCartoes } from '../../componentes/Cartao';
import { Tela } from '../../componentes/Tela';

/** Aba "Condomínio" do síndico: identidade visual e módulos ativos. */
export function CondominioPage() {
  return (
    <Tela titulo="Condomínio">
      <ListaCartoes rotulo="Configurações do condomínio">
        <li>
          <Cartao para="/condominio/identidade" rotulo="Identidade visual">
            <h2>Identidade visual</h2>
            <p>Nome de exibição, logo e cores do app.</p>
          </Cartao>
        </li>
        <li>
          <Cartao para="/condominio/modulos" rotulo="Módulos">
            <h2>Módulos</h2>
            <p>Ligue ou desligue os módulos do condomínio.</p>
          </Cartao>
        </li>
      </ListaCartoes>
    </Tela>
  );
}
