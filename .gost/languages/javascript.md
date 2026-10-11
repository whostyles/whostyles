# GOST Language Specification: JavaScript & TypeScript
**Identificador da Stack:** `javascript`  
**Padrão Base:** GOST `1.0.0`

---

## 1. Visão Geral e Filosofia
Esta especificação define os requisitos de engenharia, ferramentas e padrões para desenvolvimento em **JavaScript** e **TypeScript** no ecossistema GOST.

O ecossistema adota **Node.js 24 LTS** (`>= 24.16.0`) como runtime canônico de servidor e build do estado da arte, impondo **ESM nativo obrigatório** (`"type": "module"` no `package.json`), **TypeScript 5.8+** em modo estrito (`"strict": true`) e Web Standards nativos para Cloudflare Workers e navegadores.

---

## 2. Ferramental Mandatório de Testes & Qualidade

| Requisito GOST | Ferramenta Padrão | Comando de Validação no CI |
|---|---|---|
| **Test Runner (E2E / Browser)** | **Playwright** | `npx playwright test` |
| **Test Runner (Unit)** | **Vitest** / **Node Test Runner** | `npx vitest run --coverage` (ou `node --test`) |
| **Cobertura (≥ 90%)** | **v8 / Vitest Coverage** | `npx vitest run --coverage --coverage.thresholds.lines 90` |
| **Testes de Mutação** | **Stryker Mutator** | `npx stryker run` |
| **Linter & Formatação** | **Biome** (Canônico) | `npx biome check .` |
| **Auditoria de Segurança** | **npm/pnpm audit** | `npm audit --audit-level=high` |

---

## 3. Gestão de Dependências (Twelve-Factor)
1. **Lockfile Estrito e Congelado:** O arquivo `package-lock.json` ou `pnpm-lock.yaml` **DEVE** estar commitado na raiz.
2. **Instalação Hermética em CI:**
   ```bash
   npm ci
   # ou
   pnpm install --frozen-lockfile
   ```
3. **Anti-Bloat:** Proibição de bibliotecas de terceiros para operações triviais (ex: `is-even`, `left-pad`). Preferência absoluta por APIs nativas modernas do JavaScript (ES2022+ / Web Standards: `fetch`, `FormData`, `URL`, `crypto.subtle`).

---

## 4. Arquitetura de Domínio & SOLID Pragmático
1. **Estrutura de Pastas Canônica:**
   ```text
   src/
   ├── domain/             # Regras de negócio, contratos de tipos e enums
   ├── application/        # Casos de uso e fluxos
   └── infrastructure/     # Adaptadores de I/O (HTTP clients, DB, fakes in-memory)
   ```
2. **In-Memory Fakes:** Testes unitários substituem I/O real por implementações em memória baseadas em `Map` ou arrays simples, sem frameworks pesados de mocking dinâmico.
3. **Parse, Don't Validate:** Validação de payloads na borda (usando tipos primitivos ou esquemas leves como `zod` na entrada). O Core opera com objetos e primitivos confiáveis.
4. **Estados Finitos:** Modelados com uniões de tipos literais estritos em TypeScript (`type Status = 'pending' | 'active' | 'completed'`) ou objetos imutáveis congelados (`Object.freeze()`) em JS puro.

---

## 5. Padrões de Sistema e Containers OCI
1. **Conformidade XDG (Node.js):**
   ```javascript
   import path from 'node:path';
   import os from 'node:os';

   export function getConfigDir(appName) {
       const base = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
       return path.join(base, appName);
   }
   ```
2. **Dockerfile Canônico (Multi-stage + Alpine Non-Root):**
   ```dockerfile
   FROM node:24-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build --if-present

   FROM node:24-alpine
   USER 1000:1000
   WORKDIR /app
   COPY --chown=node:node --from=builder /app ./
   ENTRYPOINT ["node", "dist/index.js"]
   ```
3. **Streams:** `console.log()` estritamente para dados de saída; `console.error()` / `console.warn()` para logs diagnósticos e progresso.
