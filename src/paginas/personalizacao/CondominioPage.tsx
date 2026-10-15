import { ListaAtalhos, type Atalho } from '../../componentes/ListaAtalhos';
import { Tela } from '../../componentes/Tela';

const ATALHOS: Atalho[] = [
  { rotulo: 'Identidade visual', caminho: '/condominio/identidade', icone: 'paleta' },
  { rotulo: 'Módulos', caminho: '/condominio/modulos', icone: 'chave' },
];

/** Aba "Condomínio" do síndico: identidade visual (nome, logo, cores) e módulos ativos. */
export function CondominioPage() {
  return (
    <Tela titulo="Condomínio">
      <p>Ajuste como o app aparece para todos os moradores e quais módulos ficam disponíveis.</p>
      <ListaAtalhos itens={ATALHOS} rotulo="Configurações do condomínio" />
    </Tela>
  );
}
