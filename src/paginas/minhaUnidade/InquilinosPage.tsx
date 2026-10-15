import { useState } from 'react';
import { Botao, BotaoLink } from '../../componentes/Botao';
import { DialogoConfirmacao } from '../../componentes/BottomSheet';
import { Cartao, ListaCartoes } from '../../componentes/Cartao';
import { ErroFormulario, EstadoConsulta } from '../../componentes/Estados';
import { Selo } from '../../componentes/Selo';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useDeletarInquilino, useVinculosMinhaUnidade } from '../../hooks/minhaUnidadeHooks';
import type { VinculoUnidade } from '../../tipos/minhaUnidade';
import { formatarData } from '../../utils/formatadores';
import estilos from '../paginas.module.css';
import { vinculoEncerrado } from './vinculos';

/** Só proprietário: inquilinos da unidade, cadastrar e encerrar contrato. */
export function InquilinosPage() {
  const consulta = useVinculosMinhaUnidade();
  const encerrar = useDeletarInquilino();
  const { mostrarToast } = useToast();
  const [encerrando, setEncerrando] = useState<VinculoUnidade | null>(null);

  function confirmar() {
    if (!encerrando) return;
    encerrar.mutate(encerrando.id, {
      onSuccess: () => mostrarToast('Contrato encerrado'),
      onSettled: () => setEncerrando(null),
    });
  }

  return (
    <Tela titulo="Inquilinos" voltarPara="/unidade">
      <BotaoLink para="/unidade/inquilinos/novo">Cadastrar inquilino</BotaoLink>
      <ErroFormulario erro={encerrar.error} />
      <EstadoConsulta
        consulta={consulta}
        vazio={(lista) => !lista.some((vinculo) => vinculo.tipoVinculo === 'inquilino')}
        mensagemVazio="Nenhum inquilino cadastrado."
      >
        {(lista) => (
          <ListaCartoes rotulo="Inquilinos">
            {lista
              .filter((vinculo) => vinculo.tipoVinculo === 'inquilino')
              .map((vinculo) => {
                const encerrado = vinculoEncerrado(vinculo);
                return (
                  <li key={vinculo.id}>
                    <Cartao rotulo={vinculo.pessoa.nome}>
                      <div className={estilos.linha}>
                        <strong>{vinculo.pessoa.nome}</strong>
                        <Selo tom={encerrado ? 'neutro' : 'sucesso'}>{encerrado ? 'Encerrado' : 'Ativo'}</Selo>
                      </div>
                      <p className={estilos.suave}>
                        {vinculo.inicio ? `Contrato desde ${formatarData(vinculo.inicio)}` : ''}
                        {vinculo.fim ? `, ${encerrado ? 'encerrado em' : 'até'} ${formatarData(vinculo.fim)}` : ''}
                      </p>
                      {!encerrado && (
                        <Botao variante="perigo" onClick={() => setEncerrando(vinculo)}>
                          Encerrar contrato
                        </Botao>
                      )}
                    </Cartao>
                  </li>
                );
              })}
          </ListaCartoes>
        )}
      </EstadoConsulta>
      <DialogoConfirmacao
        aberto={encerrando !== null}
        titulo="Encerrar contrato?"
        mensagem={`${encerrando?.pessoa.nome ?? ''} perde o acesso ao app hoje.`}
        textoConfirmar="Encerrar"
        perigo
        enviando={encerrar.isPending}
        aoConfirmar={confirmar}
        aoCancelar={() => setEncerrando(null)}
      />
    </Tela>
  );
}
