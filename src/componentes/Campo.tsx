import type { HTMLAttributes, HTMLInputTypeAttribute } from 'react';
import estilos from './Campo.module.css';

export interface OpcaoCampo {
  valor: string;
  rotulo: string;
}

interface CampoProps {
  id: string;
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  /** Erro do cliente ou do servidor (`erros[].mensagem`), mostrado embaixo do campo. */
  erro?: string;
  ajuda?: string;
  obrigatorio?: boolean;
  como?: 'input' | 'select' | 'textarea';
  tipo?: HTMLInputTypeAttribute;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
  min?: string;
  max?: string;
  step?: string;
  opcoes?: OpcaoCampo[];
  desabilitado?: boolean;
}

/** Rótulo + controle + ajuda + erro, sempre ligados por id (acessível ao leitor de tela). */
export function Campo({ id, rotulo, valor, aoMudar, erro, ajuda, obrigatorio, como = 'input', opcoes = [], desabilitado, tipo = 'text', ...resto }: CampoProps) {
  const descricoes = [ajuda ? `${id}-ajuda` : '', erro ? `${id}-erro` : ''].filter(Boolean).join(' ') || undefined;
  const comuns = {
    id,
    name: id,
    value: valor,
    disabled: desabilitado,
    required: obrigatorio,
    'aria-invalid': erro ? true : undefined,
    'aria-describedby': descricoes,
  };

  return (
    <div className={estilos.campo}>
      <label htmlFor={id} className={estilos.rotulo}>
        {rotulo}
        {obrigatorio && <span aria-hidden="true"> *</span>}
      </label>
      {como === 'select' && (
        <select {...comuns} onChange={(evento) => aoMudar(evento.target.value)}>
          {opcoes.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.rotulo}
            </option>
          ))}
        </select>
      )}
      {como === 'textarea' && (
        <textarea {...comuns} maxLength={resto.maxLength} placeholder={resto.placeholder} onChange={(evento) => aoMudar(evento.target.value)} />
      )}
      {como === 'input' && <input {...comuns} {...resto} type={tipo} onChange={(evento) => aoMudar(evento.target.value)} />}
      {ajuda && (
        <p id={`${id}-ajuda`} className={estilos.ajuda}>
          {ajuda}
        </p>
      )}
      {erro && (
        <p id={`${id}-erro`} className={estilos.erro}>
          {erro}
        </p>
      )}
    </div>
  );
}
