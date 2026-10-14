import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { BrowserRouter } from 'react-router';
import { ToastProvider } from './componentes/Toast';
import { criarClienteQuery } from './hooks/clienteQuery';
import { Rotas } from './rotas/Rotas';

export default function App() {
  const [clienteQuery] = useState(criarClienteQuery);
  return (
    <QueryClientProvider client={clienteQuery}>
      <BrowserRouter>
        <ToastProvider>
          <Rotas />
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
