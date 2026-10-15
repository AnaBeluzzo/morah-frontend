import { useNavigate, useParams } from 'react-router';
import { EstadoConsulta } from '../../componentes/Estados';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useAlterarAviso, useAviso } from '../../hooks/avisosHooks';
import type { Aviso } from '../../tipos/avisos';
import { camposAlterados } from '../../utils/alteracoes';
import { deDataHoraLocal, paraDataHoraLocal } from '../../utils/formatadores';
import { FormularioAviso, type ValoresAviso } from './FormularioAviso';

/** Os campos que o PATCH aceita, no formato do contrato. */
function camposDoPatch(valores: ValoresAviso) {
  return {
    titulo: valores.titulo.trim(),
    conteudo: valores.conteudo.trim(),
    categoria: valores.categoria.trim() || undefined,
    prioridade: valores.prioridade,
    expiraEm: valores.expiraEm ? deDataHoraLocal(valores.expiraEm) : undefined,
  };
}

function valoresDoAviso(aviso: Aviso): ValoresAviso {
  return {
    titulo: aviso.titulo,
    conteudo: aviso.conteudo,
    categoria: aviso.categoria ?? '',
    prioridade: aviso.prioridade ?? 'normal',
    publicoTipo: aviso.publicoAlvo?.tipo ?? 'condominio',
    publicoId: '',
    expiraEm: aviso.expiraEm ? paraDataHoraLocal(aviso.expiraEm) : '',
  };
}

/** Síndico edita um aviso: o PATCH leva só os campos que mudaram. */
export function EditarAvisoPage() {
  const avisoId = Number(useParams().avisoId);
  const navigate = useNavigate();
  const { mostrarToast } = useToast();
  const consulta = useAviso(avisoId);
  const alterar = useAlterarAviso(avisoId);

  function salvar(aviso: Aviso, valores: ValoresAviso) {
    // compara com o aviso como ele apareceu no formulário (mesma conversão de datas)
    const alteracoes = camposAlterados(camposDoPatch(valoresDoAviso(aviso)), camposDoPatch(valores));
    if (Object.keys(alteracoes).length === 0) {
      mostrarToast('Nada foi alterado.');
      return;
    }
    alterar.mutate(alteracoes, {
      onSuccess: () => {
        mostrarToast('Aviso atualizado');
        navigate(`/avisos/${avisoId}`, { replace: true });
      },
    });
  }

  return (
    <Tela titulo="Editar aviso" voltarPara={`/avisos/${avisoId}`}>
      <EstadoConsulta consulta={consulta}>
        {(aviso) => (
          <FormularioAviso
            inicial={valoresDoAviso(aviso)}
            comPublico={false}
            textoBotao="Salvar alterações"
            enviando={alterar.isPending}
            erroServidor={alterar.error}
            aoEnviar={(valores) => salvar(aviso, valores)}
          />
        )}
      </EstadoConsulta>
    </Tela>
  );
}
