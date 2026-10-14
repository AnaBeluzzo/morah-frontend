import { Botao } from './Botao';

interface BotaoCarregarMaisProps {
  temMais: boolean;
  carregando: boolean;
  aoCarregar: () => void;
}

/** "Carregar mais" das listas paginadas: só aparece enquanto houver próxima página. */
export function BotaoCarregarMais({ temMais, carregando, aoCarregar }: BotaoCarregarMaisProps) {
  if (!temMais) {
    return null;
  }
  return (
    <Botao variante="secundario" carregando={carregando} onClick={aoCarregar}>
      Carregar mais
    </Botao>
  );
}
