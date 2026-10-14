# Morah — Front-end

Front-end mobile do **Morah**, sistema de gestão de condomínios desenvolvido como projeto
acadêmico do 6º período de Engenharia de Software. Consome a API do `morah-backend`
(contrato `morah-openapi.yaml`, "Morah API — Gestão Condominial", v2.0.0).

## Autores

- _(preencher com os nomes dos alunos)_

## Stack

- Node 22, React 18 + TypeScript (strict) + Vite
- React Router e TanStack Query
- CSS Modules + variáveis CSS
- Vitest + Testing Library + MSW (unidade e componentes) e Playwright (ponta a ponta)

## Como rodar

1. Suba o backend (`morah-backend`): `mvn spring-boot:run` (porta 8080).
2. Instale as dependências e suba o front:

```bash
npm ci
npm run dev
```

O app abre em http://localhost:5173. O Vite repassa as chamadas `/v1/...` para o backend
(variável `API_TARGET`, padrão `http://localhost:8080`).

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | checagem de tipos + build de produção em `dist/` |
| `npm run preview` | serve o build (com o mesmo proxy) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | testes de unidade e componentes (Vitest) |
| `npm run e2e` | testes de ponta a ponta (Playwright) contra o backend real |
