import { ListaCartoes } from '../../componentes/Cartao';
import { ErroFormulario, EstadoConsulta } from '../../componentes/Estados';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useAlterarModulo, useModulos } from '../../hooks/personalizacaoHooks';
import { rotular, ROTULOS_MODULO } from '../../utils/rotulos';
import estilos from './ModulosPage.module.css';

/** Uma chave liga/desliga por módulo; abas e rotas refletem na hora. */
export function ModulosPage() {
  const consulta = useModulos();
  const alterar = useAlterarModulo();
  const { mostrarToast } = useToast();

  return (
    <Tela titulo="Módulos" voltarPara="/condominio">
      <p>Módulos desligados somem do app para todos. Login, Início, Notificações e Personalização ficam sempre ativos.</p>
      <ErroFormulario erro={alterar.error} />
      <EstadoConsulta consulta={consulta} vazio={(modulos) => modulos.length === 0} mensagemVazio="Nenhum módulo configurável.">
        {(modulos) => (
          <ListaCartoes rotulo="Módulos do condomínio">
            {modulos.map((modulo) => {
              const nome = modulo.nome || rotular(ROTULOS_MODULO, modulo.modulo);
              const enviando = alterar.isPending && alterar.variables?.modulo === modulo.modulo;
              return (
                <li key={modulo.modulo}>
                  <label className={estilos.modulo}>
                    <span>
                      <strong>{nome}</strong>
                      <small>{modulo.ativo ? 'Ativo' : 'Desativado'}</small>
                    </span>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={modulo.ativo}
                      disabled={enviando}
                      onChange={(evento) =>
                        alterar.mutate(
                          { modulo: modulo.modulo, ativo: evento.target.checked },
                          { onSuccess: (atualizado) => mostrarToast(`${nome} ${atualizado.ativo ? 'ativado' : 'desativado'}`) },
                        )
                      }
                    />
                  </label>
                </li>
              );
            })}
          </ListaCartoes>
        )}
      </EstadoConsulta>
    </Tela>
  );
}
