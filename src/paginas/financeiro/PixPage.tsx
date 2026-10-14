import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Botao } from '../../componentes/Botao';
import { Cartao } from '../../componentes/Cartao';
import { EstadoConsulta } from '../../componentes/Estados';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { usePix } from '../../hooks/financeiroHooks';
import { formatarHora, formatarTempoRestante } from '../../utils/formatadores';
import estilos from '../paginas.module.css';

/** Relógio que anda de segundo em segundo (para a contagem regressiva). */
function useAgora(): number {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const intervalo = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(intervalo);
  }, []);
  return agora;
}

/** PIX copia-e-cola: código, botão copiar e contagem regressiva até expirar (30 min). */
export function PixPage() {
  const cobrancaId = Number(useParams().cobrancaId);
  const consulta = usePix(cobrancaId);
  const agora = useAgora();
  const { mostrarToast } = useToast();

  async function copiar(codigo: string) {
    try {
      await navigator.clipboard.writeText(codigo);
      mostrarToast('Código copiado');
    } catch {
      mostrarToast('Não foi possível copiar. Selecione o código e copie manualmente.', 'erro');
    }
  }

  return (
    <Tela titulo="Pagar com PIX" voltarPara={`/financeiro/cobrancas/${cobrancaId}`}>
      <EstadoConsulta consulta={consulta}>
        {(pix) => {
          const restante = new Date(pix.expiraEm).getTime() - agora;
          const expirado = restante <= 0;
          return (
            <Cartao>
              <h2>PIX copia e cola</h2>
              <code className={estilos.codigo} aria-label="Código PIX">
                {pix.codigoPix}
              </code>
              {expirado ? (
                <>
                  <p role="alert">Este código expirou. Gere um novo para pagar.</p>
                  <Botao onClick={() => consulta.refetch()} carregando={consulta.isFetching}>
                    Gerar novo código
                  </Botao>
                </>
              ) : (
                <>
                  <p aria-live="off">
                    Expira em <strong>{formatarTempoRestante(restante)}</strong> (às {formatarHora(pix.expiraEm)})
                  </p>
                  <Botao onClick={() => copiar(pix.codigoPix)}>Copiar código</Botao>
                </>
              )}
            </Cartao>
          );
        }}
      </EstadoConsulta>
    </Tela>
  );
}
