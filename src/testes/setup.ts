// Preparação comum dos testes de unidade e componentes (Vitest + Testing Library + MSW).
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { Logger } from '../utils/logger';
import { servidor } from './servidor';

// requisição sem handler é erro: garante que todo endpoint usado nos testes está simulado
beforeAll(() => {
  servidor.listen({ onUnhandledFrame: 'error' });
  Logger.getInstance().definirNivelMinimo('error');
});

afterEach(() => {
  cleanup();
  servidor.resetHandlers();
  localStorage.clear();
  document.documentElement.removeAttribute('style');
});

afterAll(() => servidor.close());
