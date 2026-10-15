import { useNavigate } from 'react-router';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useCriarAviso } from '../../hooks/avisosHooks';
import { deDataHoraLocal } from '../../utils/formatadores';
import { FormularioAviso, type ValoresAviso } from './FormularioAviso';

const AVISO_EM_BRANCO: ValoresAviso = {
  titulo: '',
  conteudo: '',
  categoria: '',
  prioridade: 'normal',
  publicoTipo: 'condominio',
  publicoId: '',
  expiraEm: '',
};

/** Síndico publica um aviso para o condomínio, um bloco ou uma unidade. */
export function NovoAvisoPage() {
  const navigate = useNavigate();
  const { mostrarToast } = useToast();
  const criar = useCriarAviso();

  function publicar(valores: ValoresAviso) {
    const id = Number(valores.publicoId);
    criar.mutate(
      {
        titulo: valores.titulo.trim(),
        conteudo: valores.conteudo.trim(),
        categoria: valores.categoria.trim() || undefined,
        prioridade: valores.prioridade,
        expiraEm: valores.expiraEm ? deDataHoraLocal(valores.expiraEm) : undefined,
        publicoAlvo: {
          tipo: valores.publicoTipo,
          blocoId: valores.publicoTipo === 'bloco' ? id : undefined,
          unidadeId: valores.publicoTipo === 'unidade' ? id : undefined,
        },
      },
      {
        onSuccess: (aviso) => {
          mostrarToast('Aviso publicado');
          navigate(`/avisos/${aviso.id}`, { replace: true });
        },
      },
    );
  }

  return (
    <Tela titulo="Novo aviso" voltarPara="/avisos">
      <FormularioAviso inicial={AVISO_EM_BRANCO} comPublico textoBotao="Publicar" enviando={criar.isPending} erroServidor={criar.error} aoEnviar={publicar} />
    </Tela>
  );
}
