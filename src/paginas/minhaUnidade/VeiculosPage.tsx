import { useState } from 'react';
import { Botao, BotaoLink } from '../../componentes/Botao';
import { DialogoConfirmacao } from '../../componentes/BottomSheet';
import { Cartao, ListaCartoes } from '../../componentes/Cartao';
import { ErroFormulario, EstadoConsulta } from '../../componentes/Estados';
import { Selo } from '../../componentes/Selo';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useDeletarVeiculo, useVeiculos } from '../../hooks/minhaUnidadeHooks';
import type { Veiculo } from '../../tipos/minhaUnidade';
import { ROTULOS_TIPO_VEICULO } from '../../utils/rotulos';
import estilos from '../paginas.module.css';

/** Morador/proprietário: veículos da unidade, com cadastrar, editar e excluir. */
export function VeiculosPage() {
  const consulta = useVeiculos();
  const excluir = useDeletarVeiculo();
  const { mostrarToast } = useToast();
  const [excluindo, setExcluindo] = useState<Veiculo | null>(null);

  function confirmar() {
    if (!excluindo) return;
    excluir.mutate(excluindo.id, {
      onSuccess: () => mostrarToast('Veículo excluído'),
      onSettled: () => setExcluindo(null),
    });
  }

  return (
    <Tela titulo="Veículos" voltarPara="/unidade">
      <BotaoLink para="/unidade/veiculos/novo">Cadastrar veículo</BotaoLink>
      <ErroFormulario erro={excluir.error} />
      <EstadoConsulta consulta={consulta} vazio={(lista) => lista.length === 0} mensagemVazio="Nenhum veículo cadastrado nesta unidade.">
        {(lista) => (
          <ListaCartoes rotulo="Veículos">
            {lista.map((veiculo) => (
              <li key={veiculo.id}>
                <Cartao rotulo={veiculo.placa}>
                  <div className={estilos.linha}>
                    <strong>{veiculo.placa}</strong>
                    <Selo tom="info">{ROTULOS_TIPO_VEICULO[veiculo.tipo]}</Selo>
                  </div>
                  <p className={estilos.suave}>{[veiculo.modelo, veiculo.cor].filter(Boolean).join(' · ')}</p>
                  <div className={estilos.acoes}>
                    <BotaoLink para={`/unidade/veiculos/${veiculo.id}/editar`} variante="secundario">
                      Editar
                    </BotaoLink>
                    <Botao variante="perigo" onClick={() => setExcluindo(veiculo)}>
                      Excluir
                    </Botao>
                  </div>
                </Cartao>
              </li>
            ))}
          </ListaCartoes>
        )}
      </EstadoConsulta>
      <DialogoConfirmacao
        aberto={excluindo !== null}
        titulo="Excluir veículo?"
        mensagem={`O veículo ${excluindo?.placa ?? ''} sai do cadastro da unidade.`}
        textoConfirmar="Excluir"
        perigo
        enviando={excluir.isPending}
        aoConfirmar={confirmar}
        aoCancelar={() => setExcluindo(null)}
      />
    </Tela>
  );
}
