import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// O backend não tem CORS: o front chama o caminho relativo /v1/... e o Vite repassa
// a requisição para o backend (no `npm run dev` e no `vite preview` dos testes).
const API_TARGET = process.env.API_TARGET ?? 'http://localhost:8080';
const proxy = { '/v1': { target: API_TARGET, changeOrigin: true } };

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testes/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // datas e horas dos testes no mesmo fuso do e2e
    env: { TZ: 'America/Sao_Paulo' },
    // os testes de tela digitam como uma pessoa (user-event): folga para máquinas mais lentas
    testTimeout: 15_000,
    // poucos processos em paralelo: no Windows, muitos workers lendo node_modules ao mesmo
    // tempo às vezes falham ao abrir arquivos (antivírus); 2 já dá um tempo bom
    maxWorkers: 2,
  },
});
