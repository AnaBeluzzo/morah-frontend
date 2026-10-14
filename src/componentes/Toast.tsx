import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import estilos from './Toast.module.css';

type TipoToast = 'sucesso' | 'erro';

interface MensagemToast {
  id: number;
  texto: string;
  tipo: TipoToast;
}

interface ToastApi {
  mostrarToast: (texto: string, tipo?: TipoToast) => void;
}

const DURACAO_MS = 3500;
const ToastContexto = createContext<ToastApi | null>(null);

/** Aviso rápido (toast) depois de ações que gravam: some sozinho em alguns segundos. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [mensagens, setMensagens] = useState<MensagemToast[]>([]);
  const proximoId = useRef(1);

  const mostrarToast = useCallback((texto: string, tipo: TipoToast = 'sucesso') => {
    const id = proximoId.current++;
    setMensagens((atuais) => [...atuais, { id, texto, tipo }]);
    setTimeout(() => setMensagens((atuais) => atuais.filter((mensagem) => mensagem.id !== id)), DURACAO_MS);
  }, []);

  const api = useMemo(() => ({ mostrarToast }), [mostrarToast]);

  return (
    <ToastContexto.Provider value={api}>
      {children}
      <div className={estilos.area} role="status" aria-live="polite">
        {mensagens.map((mensagem) => (
          <p key={mensagem.id} className={`${estilos.toast} ${estilos[mensagem.tipo]}`}>
            {mensagem.texto}
          </p>
        ))}
      </div>
    </ToastContexto.Provider>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContexto);
  if (!api) {
    throw new Error('useToast precisa estar dentro de <ToastProvider>');
  }
  return api;
}
