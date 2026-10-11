# Perfil de Implementação: Kollontai
**Identificador do Perfil:** `kollontai`  
**Norma Base:** GOST `1.3.0`  
**Autor:** lumenpink  
**Status:** Ativo / Produção

---

## 1. Visão Geral

Este documento define as especificações concretas, serviços de nuvem, ferramentas de automação e infraestrutura adotadas no perfil **Kollontai** (homenagem à revolucionária soviética, feminista e diplomata Alexandra Kollontai) para satisfazer todos os requisitos normativos do padrão **GOST**.

---

## 2. Forja de Código e Repositórios Remotos

### 2.1 Forja Primária
* **Instância:** [Codeberg](https://codeberg.org/) (Software Forgejo).
* **Organização / Usuário:** `lumenpink`.
* **URL do Repositório:** `https://codeberg.org/lumenpink/<nome-do-repo>`.
* **Remote Git SSH Padrão:** `ssh://git@codeberg.org/lumenpink/<nome-do-repo>.git`.
* **Branch Padrão:** `main`.

### 2.2 Criação Automatizada via API
A criação de repositórios remotos utiliza a API v1 do Codeberg autenticada via `$CODEBERG_TOKEN`:

```bash
curl -X POST \
  -H "Authorization: token $CODEBERG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<nome-do-repo>",
    "description": "<Descrição curta e objetiva do projeto>",
    "private": false,
    "auto_init": false
  }' \
  "https://codeberg.org/api/v1/user/repos"
```

### 2.3 Redundância Mandatória: Repositório de Backup / Espelho (*Mirror*)
Todo repositório no perfil Kollontai deve implementar redundância geográfica e resiliência contra indisponibilidade de forjas através de um repositório secundário de backup:

1. **Forja de Backup Padrão:**
   * **Padrão Canônico:** **GitHub** (`https://github.com/lumenpink/<nome-do-repo>`), operando como espelho secundário de contingência e preservação.
   * **Exceções Declaradas no `.cccprc`:** Repositórios com propósitos específicos (como notas/vaults do Obsidian em `tildegit.org` ou instâncias próprias) podem utilizar forjas alternativas, desde que declaradas explicitamente na chave `backup_forge` ou `backup_url` do `.cccprc`.
2. **Paridade Estrita de Metadados & Sinalização de Espelho:**
   * **Metadados Idênticos:** Nome do repositório, tópicos (*topics/tags*), homepage/website (`https://<nome-do-repo>.2lp.in`), licença e visibilidade (público/privado) **DEVEM** ser estritamente iguais entre o repositório principal e o backup.
   * **Distinção Mandatória:** No repositório de backup, a descrição oficial (*About / Description*) **DEVE** declarar explicitamente que se trata de uma cópia de contingência, apontando diretamente para o repositório principal no Codeberg:
     ```text
     [MIRROR / BACKUP] <Descrição do projeto>. Repositório canônico e issues em: https://codeberg.org/lumenpink/<nome-do-repo>
     ```
   * Issues, pull requests e contribuições devem ser mantidos e tratados exclusivamente na forja canônica no Codeberg.
3. **Estratégia de Sincronização e Espelhamento Soberano (Zero Dual Push Local):**
   * **Push Unidirecional Local:** O ambiente local do desenvolvedor mantém um único destino de push configurado no `origin`, apontando exclusivamente para a forja primária no Codeberg:
     ```bash
     git remote set-url origin ssh://git@codeberg.org/lumenpink/<nome-do-repo>.git
     ```
     O desenvolvedor **NUNCA** faz push manual duplo local para ambas as forjas.
   * **Push Secundário Automatizado a partir da Forja Principal:** É responsabilidade estrita da infraestrutura do repositório canônico no Codeberg replicar as alterações para o espelho secundário:
     - **Push Mirror Nativo do Codeberg / Forgejo (Recomendado):** Configurado diretamente nas opções do repositório no Codeberg (*Configurações > Repositório > Espelhamento de Envio / Push Mirror*), onde a própria forja replica commits, branches e tags para o GitHub automaticamente após qualquer recebimento de push.
     - **Job de Espelhamento no Forgejo Actions (CI):** Como alternativa ou contingência, um workflow dedicado no CI acionado a cada push em branches e tags que executa o push espelhado para o GitHub autenticado via secret (`GITHUB_MIRROR_TOKEN` ou chave SSH).

---

## 3. Gestão de Commits e Hooks (`cccp`)

O ecossistema Kollontai utiliza a CLI **`cccp`** como ferramenta central de versionamento, hooks do Git e integridade semântica.

### 3.1 Arquivo `.cccprc`
Todo repositório no perfil Kollontai **DEVE** conter na raiz o arquivo `.cccprc`:

```ini
# Forja Canônica Primária (Codeberg)
codeberg_owner = lumenpink
codeberg_repo = <nome-do-repo>

# Redundância & Repositório de Backup (Mandatório)
# backup_forge padrão: github (opções: github, tildegit, gitlab, custom)
backup_forge = github
backup_owner = lumenpink
backup_repo = <nome-do-repo>
# Ou declaração direta de URL de transporte:
# backup_url = git@github.com:lumenpink/<nome-do-repo>.git

# Diretivas de Agentes e Idioma
agent_md_url = https://gist.githubusercontent.com/lumenpink/ebaded4f8bfb956346c28b64f48754fb/raw/c48a2f9cfb4fd73dcb944c4e47a5b17b8f3a3a2e/AGENTS.md
agent_var_lang = english
```

### 3.2 Ativação e Bloqueios dos Hooks
Após criar ou clonar o projeto, os hooks **DEVEM** ser inicializados via:
```bash
cccp install
```
Isso instala:
* **`commit-msg`:**
  - Validador rigoroso de Conventional Commits.
  - **Enforcement de Tickets:** Rejeita qualquer commit que não contenha a referência explícita ao ticket da issue no padrão `(ref #<id>)` ou `(closes #<id>)`. Bloqueia commits sem ticket na raiz.
* **`post-commit`:** Sincronizador atômico de versão (`VERSION`), atualização do `CHANGELOG.md` e metadados.
* **`pre-push`:** Gate de CI local com `act` (ver Seção 5.8).

---

## 4. Publicação Web e Documentação (`*.2lp.in`)

### 4.1 Infraestrutura: Cloudflare Workers
A vitrine de documentação pública (`./site`) é publicada na borda da Cloudflare sob o domínio unificado `*.2lp.in`.

### 4.2 Arquivo `wrangler.jsonc`
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "<nome-do-projeto>",
  "compatibility_date": "2024-09-23",
  "routes": [
    {
      "pattern": "<nome-do-projeto>.2lp.in",
      "custom_domain": true
    }
  ],
  "assets": {
    "directory": "./site"
  }
}
```

### 4.3 Cabeçalhos de Segurança (`site/_headers`)
```http
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
```

### 4.4 Fallback: Codeberg Pages (Stateless Orphan Force Push)
Como contingência e redundância estática, o pipeline de CI publica a pasta `./site` também no Codeberg Pages (`https://lumenpink.codeberg.page/<nome-do-repo>/`).
Para evitar acúmulo de histórico de builds e inchaço do repositório no Codeberg, o branch `pages` é tratado como estritamente efêmero: a publicação gera uma árvore órfã isolada com commit único do snapshot atual e executa `git push --force origin pages`.

### 4.5 Armazenamento Canônico de Artefatos & Releases (Cloudflare R2)
No ecossistema Kollontai, binários compilados (executáveis `musl`, APKs Android, bundles `.tar.gz`) **NÃO** são acumulados nem hospedados em releases no Codeberg.
Todos os artefatos de release são enviados diretamente para buckets Cloudflare R2 via `npx wrangler r2 object put` e distribuídos na borda sob `*.2lp.in` com suporte nativo a streaming HTTP Range (RFC 7233) e zero taxa de saída.

### 4.6 Topologia de Serviços Dinâmicos no Perfil Kollontai
Para repositórios que implementam serviços web dinâmicos, daemons ou REPLs (como o Matraca):
1. **Camada Privada Primária (Mesh VPN):**
   - Acesso via **Tailscale** (`http://100.x.y.z:<porta>`).
   - Todo tráfego entre smartphones, laptops e estações de desenvolvimento permanece criptografado ponto a ponto na rede WireGuard privada sem abertura de portas no firewall.
2. **Camada de Borda Autenticada (Cloudflare Tunnel):**
   - Quando for conveniente o acesso web com certificado SSL público sem a VPN ativa no cliente móvel, utiliza-se o **`cloudflared`** direcionando para o subdomínio `app.<repo>.2lp.in` com autenticação obrigatória no aplicativo.

---

## 5. Stack e Ferramental Padrão de Testes

Para atender aos requisitos de alta cobertura (>90%, foco em 100%) e mutação da norma GOST, o ecossistema Kollontai adota as seguintes ferramentas padronizadas por linguagem:

### 5.1 Shell Scripting / CLI de Sistema
* **Dialeto Canônico:** POSIX Shell estrito (`/bin/sh`) como baseline universal portável; Bash 5.2+ (`#!/usr/bin/env bash`) quando recursos avançados (arrays, controle fino de processos) forem expressamente justificados.
* **Runner de Testes:** **`shellspec`** (BDD framework para POSIX shell / bash).
* **Estrutura:** Especificações organizadas sob `spec/` (ex: `spec/*_spec.sh`).
* **Cobertura:** Mensuração via `kcov` integrada ao shellspec (`shellspec --kcov`), mantendo meta de bloqueio $\ge 90\%$.
* **Linter & Formatação:** `shellcheck` (zero avisos tolerados) e `shfmt -d -i 2 -ci -bn .`.

### 5.2 Rust (Sistemas, Milters, Daemons, CLI e Clientes)
* **Compilador Canônico:** **`rustc >= 1.99.0`** (Estado da arte).
* **Edição Canônica Obrigatória:** **`edition = "2024"`** e `rust-version = "1.99"` declarados em todo `Cargo.toml`.
* **Runner de Testes:** **`cargo test`** (testes unitários in-source em `src/` e testes de integração em `tests/`).
* **Cobertura:** **`cargo-tarpaulin`** ou **`cargo-llvm-cov`** (com flag obrigatória de bloqueio `--fail-under 90`).
* **Testes de Mutação:** **`cargo-mutants`** para detecção de testes ineficazes e mutantes sobreviventes.
* **Target Estático de Distribuição:** `x86_64-unknown-linux-musl` e `aarch64-unknown-linux-musl` (compilação estática pura sem glibc para distribuição hermética).

### 5.3 PHP (IndieWeb, APIs e Aplicações Web)
* **Versão Canônica:** **`PHP >= 8.5.0`** (Estado da arte).
* **Suporte Reverso Mandatório:** Compatibilidade garantida com **`PHP >= 8.2`** (`"php": "^8.2 || ^8.3 || ^8.4 || ^8.5"` no `composer.json`), proibindo quebras de sintaxe ou dependências exclusivas de versões superiores sem fallback seguro.
* **Tipagem Estrita:** `declare(strict_types=1);` mandatório em 100% dos arquivos PHP.
* **Runner de Testes:** **`pest`** (PHP Testing Framework elegante e veloz).
* **Cobertura:** Execução contínua com verificação estrita:
  ```bash
  vendor/bin/pest --coverage --min=90
  ```
* **Testes de Mutação:** **`infection`** (`vendor/bin/infection --min-msi=80 --min-covered-msi=85`).
* **Análise Estática & Estilo:** `vendor/bin/phpstan analyse --level=max` (configurado com target 8.2 no baseline de compatibilidade) e `vendor/bin/pint --test`.

### 5.4 Node.js & TypeScript (Serviços, Workers e Tooling)
* **Runtime Canônico:** **`Node.js >= 24.16.0 LTS`** (Estado da arte).
* **Padrão de Módulos:** **ESM nativo obrigatório** (`"type": "module"` no `package.json`).
* **TypeScript:** **`TypeScript >= 5.8`** sob modo estrito total (`"strict": true`).
* **Linter & Formatação:** **`biome`** (`npx biome check .` / `npx biome format .`) como ferramenta canônica e ultrarrápida baseada em Rust.
* **Runner de Testes:** **`vitest`** ou **`node:test`** nativo com cobertura v8 $\ge 90\%$.

### 5.5 Interfaces de Usuário, Web & Mobile: Dioxus 0.8
O framework declarativo universal adotado no perfil Kollontai para desenvolvimento de aplicações gráficas reativas (Desktop, Web WASM e Mobile) é o **Dioxus 0.8** (`dioxus = "0.8"`):

* **Multiplataforma Nativa:**
  - **Desktop:** Renderização rápida via Tao/Wry.
  - **Web (WASM):** Single Page Apps estáticas com renderização client-side ultra-rápida sem NodeJS em runtime.
  - **Mobile:** Android NDK e iOS compilados diretamente com Cargo.
* **Manifesto Canônico (`Dioxus.toml`):**
  Todo projeto Dioxus deve manter seu manifesto configurado com o identificador canônico `in.2lp.<app>` e metadados de empacotamento:
  ```toml
  [application]
  name = "<app>"
  default_platform = "web"

  [bundle]
  identifier = "in.2lp.<app>"
  publisher = "Lumen Pink"
  icon = ["assets/icon.png"]
  ```
* **Ergonomia Mobile e Layout Adaptativo:**
  - Safe Area Insets respeitando entalhes e barras gestuais (`env(safe-area-inset-top)` e `env(safe-area-inset-bottom)`).
  - Alvos de toque com `touch-action: manipulation` e dimensão mínima de **48px**.
  - Responsividade automática: navegação por barra inferior no celular (< 640px) e barra lateral compacta (*rail*) em tablets (640px – 1024px).
* **Componente de Rodapé Canônico:**
  Aplicações Dioxus devem embutir o componente reativo do rodapé oficial com tradução dinâmica para as 10 línguas normativas.

### 5.6 Web, Interfaces e Ponta a Ponta (E2E)
* **Runner E2E:** **`playwright`** (`npx playwright test`).
* **Escopo:** Navegação automatizada *headless* em Chromium, Firefox e WebKit simulando as jornadas reais do usuário e garantindo ausência de erros de console, layout e renderização.

### 5.7 Análise Estática, Formatação Determinística & Zero Warnings por Stack
O ecossistema adota um pipeline estrito onde **erros de linter e desvios de formatação quebram o build**:

* **Rust:**
  - Linter: `cargo clippy --all-targets --all-features -- -D warnings`
  - Formatação: `cargo fmt -- --check`
  - Auditoria de Dependências: `cargo audit`
* **PHP:**
  - Análise Estática: `vendor/bin/phpstan analyse --level=max`
  - Formatação: `vendor/bin/pint --test`
  - Auditoria de Dependências: `composer audit`
* **POSIX Shell:**
  - Linter: `shellcheck` (zero avisos tolerados em todos os scripts)
  - Formatação: `shfmt -d -i 2 -ci -bn .` (2 espaços, recuo de case, operadores no início)
* **Web, JS/TS, JSON, YAML e Markdown:**
  - Formatação e Linter: `npx biome check .` (canônico) ou `npx prettier --check "**/*.{json,yaml,md,js,ts,html,css}"`
* **Higiene Universal de Editores:**
  - Arquivo `.editorconfig` na raiz de todo repositório para impor LF, UTF-8, ausência de trailing whitespaces e indentação correta.

### 5.8 Gate de Pre-Push com `act` (CI Local Idêntico)
O ecossistema Kollontai usa **`act`** — executor local de Forgejo/GitHub Actions baseado em Docker — para rodar o job `test` do pipeline em um ambiente **bit-for-bit idêntico** ao do Forgejo antes de cada `git push`.

#### Ferramenta
* **`act`** ([`nektos/act`](https://github.com/nektos/act)): lê `.forgejo/workflows/ci.yml` e executa os jobs dentro dos mesmos containers Docker usados pelo Forgejo Actions.
* **Pré-requisito:** Docker em execução na máquina de desenvolvimento (sempre presente no ecossistema Kollontai).

#### Comportamento do Hook `pre-push`
```
git push
  └─► pre-push hook (instalado por cccp install)
        ├─ Verifica se act + Docker estão disponíveis
        │    └─ Não disponíveis: emite aviso, NÃO bloqueia push
        ├─ Executa: act -j test --no-pull
        │    └─ Saída completa → .git/act-logs/<data>_<hora>_<branch>_<sha-curto>.log
        ├─ Mostra: spinner vivo + step atual + tempo decorrido
        └─ Exit 0: push prossegue  |  Exit 1: push abortado + resumo + path do log
```

#### Formato dos Logs
```
.git/act-logs/
  2026-09-24_09-41_feat-42-rate-limit_a4b3c2d.log
  2026-09-24_08-17_main_cd62fd5.log
```
* Diretório `.git/act-logs/` é automaticamente ignorado pelo git.
* Consulta rápida ao log mais recente: `cccp act log`

#### UX do Gate no Terminal
```
⠸ [pre-push] Running CI gate locally...
  Job: test › cargo clippy -- -D warnings     [0:12]
  Log: .git/act-logs/2026-09-24_09-41_feat-42_a4b3c2d.log
```
Sucesso:
```
✅ CI gate passed (1m 34s) — pushing to origin/main
```
Falha:
```
❌ CI gate failed (0m 47s) — push aborted
   → Step failed: cargo test (3 failures)
   → Log: .git/act-logs/2026-09-24_09-41_feat-42_a4b3c2d.log
   → Bypass consciente: git push --no-verify
```

#### Bypass Explícito
```bash
git push --no-verify  # bypass consciente e documentado — não use por hábito
```

---

## 6. Pipeline de CI/CD (`.forgejo/workflows/ci.yml`)

O workflow no Forgejo Actions declara **obrigatoriamente** jobs separados: `test` (roda também localmente via `act`) e `deploy-site` (exclusivo do Forgejo, após push):

```yaml
name: "CI / CD Pipeline"

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  test:
    name: "Run Test Suite & Enforce Coverage (>90%)"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Passos da stack (ex: pest --coverage --min=90, cargo llvm-cov --fail-under 90, etc.)

  deploy-site:
    name: "Deploy Documentation Site"
    runs-on: ubuntu-latest
    needs: [test]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: "Deploy to Cloudflare Workers"
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          if [ -n "$CLOUDFLARE_API_TOKEN" ]; then
            npx wrangler deploy
          fi
      - name: "Deploy to Codeberg Pages (Stateless Orphan Force Push)"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          git config user.name "actions-user"
          git config user.email "actions@codeberg.org"
          WORKTREE_DIR=$(mktemp -d)
          git worktree add --orphan -b pages "$WORKTREE_DIR"
          rm -rf "${WORKTREE_DIR:?}"/*
          cp -r site/* "$WORKTREE_DIR/"
          cd "$WORKTREE_DIR"
          git add -A
          if git diff --staged --quiet; then
            echo "No site changes to deploy."
          else
            git commit -m "docs(site): deploy documentation snapshot [skip ci]"
            git push --force origin pages
          fi
          cd - >/dev/null
          git worktree remove "$WORKTREE_DIR" --force || true
```

---

## 7. Registro no Catálogo Central (`~/src/catalog.json`)

Todo repositório sob o perfil Kollontai deve ser registrado no arquivo central de descoberta `~/src/catalog.json`:

```json
{
  "name": "<nome-do-projeto>",
  "forge": "codeberg",
  "slug": "lumenpink/<nome-do-projeto>",
  "description": "<Descrição objetiva em uma linha>",
  "topics": ["palavra-chave-1", "palavra-chave-2"],
  "license": "CC0-1.0",
  "website": "https://<nome-do-projeto>.2lp.in",
  "is_upstream": false
}
```

Isso garante indexação pelo `cccp catalog`, ferramentas de busca local e dashboards do ecossistema.

---

## 8. Mapeamento do Ciclo DD-TDD no Perfil Kollontai

No dia a dia do ecossistema Kollontai, o ciclo DD-TDD opera integrado ao Codeberg Issues, branches dedicados e ao CLI `cccp`:

### 8.1 Passo a Passo Operacional:
1. **Abertura do Ticket:**
   - Criado via interface do Codeberg ou via CLI:
     ```bash
     tea issue create --title "Rate limiting no endpoint de autenticação"
     # Issue #42 criada
     ```
2. **Criação do Branch Dedicado:**
   - Nunca commitar na `main`:
     ```bash
     git checkout -b feat/42-rate-limit
     ```
3. **Doc in develop (Commit):**
   - Documentação prévia dos contratos e schemas:
     ```bash
     git commit -m "docs(auth): document rate limit headers and error payloads (ref #42)"
     ```
4. **Failing Test (Commit):**
   - Teste automatizado que falha comprovando a ausência da proteção:
     ```bash
     git commit -m "test(auth): add failing integration test for 61st request (ref #42)"
     ```
5. **Fix / Code (Commit):**
   - Código que faz o teste passar com linter limpo (Zero Warnings):
     ```bash
     git commit -m "feat(auth): implement token bucket rate limiter (ref #42)"
     ```
6. **Finish Docs & Close (Commit):**
   - Atualização da documentação no `./site`, `CHANGELOG.md` e fechamento formal:
     ```bash
     git commit -m "docs(auth): update security guide and finalize tickets (closes #42)"
     ```

### 8.2 Gestão de Releases e Publicação Semântica
Quando um conjunto de tickets/milestones atinge maturidade:
```bash
cccp release minor   # ou patch / major
git push --tags origin main
```
Isso consolida o `CHANGELOG.md`, atualiza `VERSION` para versão estável e cria a tag Git correspondente.

### 8.3 Comandos Operacionais para Agentes de IA no Perfil Kollontai
No dia a dia com agentes de IA (assistentes CLI/IDE), o perfil Kollontai adota o protocolo canônico de comandos curtos:
* **`DCPD` (Do, Commit, Push, Deploy):** Autorização expressa para implementação da demanda, validação local com testes e Zero Warnings, commit no padrão Conventional Commits com fechamento de issue (`closes #ID`), push da branch do ticket, merge na branch principal (`main`) e push remoto disparando o deploy contínuo no Cloudflare Workers / R2 e Codeberg Pages (via stateless single-commit force push).
* **`DCP` (Do, Commit, Push):** Implementação, testes locais e push restritos à branch de trabalho (`feat/<id>-*`), gerando a URL do Pull Request no Codeberg para revisão humana prévia.
* **`PLAN` (Plan & Propose):** Pesquisa e diagnóstico aprofundado sem qualquer alteração em arquivos de código nem commits.
* **`TDD` (Ticket, Doc, Test, Do):** Execução estrita das 5 etapas do ciclo GOST com commits separados para documentação (`docs: ... ref #ID`), teste quebrado (`test: ... ref #ID`) e código funcional.
* **`AUDIT` (Audit & Check):** Auditoria técnica passiva rodando linters no máximo (`-D warnings`), cobertura (`llvm-cov` / `pest --coverage`), testes de mutação (`cargo-mutants` / `infection`) e `composer/cargo audit`.
* **`FIX` (Fix & Clean):** Saneamento direcionado para eliminar alertas de análise estática e corrigir formatação com `cargo fmt`, `pint` ou `shfmt`.
* **`RELEASE` (Release & Tag):** Execução automatizada de `cccp release <patch|minor|major>` e sincronização com tags remotas.

---

## 9. Internacionalização no Perfil Kollontai

O ecossistema Kollontai adota o padrão de arquitetura multilíngue validado no `indieinabox` com governança de idioma centralizada pelo `cccp`:

### 9.1 Configuração da Língua Primária (`.cccprc`)
A autoridade canônica do idioma padrão de cada repositório é configurada no `.cccprc`:
```ini
agent_var_lang = english   # ou portuguese, etc.
```
- Serve de baseline para o ciclo DD-TDD e triagem de tickets via `diva`.
- Define o idioma de fallback automático do aplicativo caso alguma chave de tradução em outro idioma não esteja presente.

### 9.2 Paridade das 10 Línguas no Aplicativo (`resources/locales/` ou `locales/`)
Todo software deve manter dicionários estruturados para as 10 línguas oficiais:
`en.json`, `pt-BR.json`, `es.json`, `fr.json`, `de.json`, `it.json`, `ru.json`, `zh.json`, `ja.json`, `ar.json`.
A suíte de testes de integração (ex: Pest, Cargo, ShellSpec) deve validar a paridade de 100% de chaves em relação ao arquivo de baseline.

### 9.3 Roteador Estático Cliente (`site/index.html`)
Na raiz de documentação `./site/index.html`, inclui-se o script de redirecionamento automático com detecção e persistência:
```html
<script>
    (function() {
        var supported = ['en', 'pt', 'es', 'fr', 'de', 'it', 'ru', 'zh', 'ja', 'ar'];
        var saved = localStorage.getItem('doc_lang');
        if (saved && supported.indexOf(saved) !== -1) {
            window.location.replace(saved + '/');
            return;
        }
        var navLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase().substring(0, 2);
        if (supported.indexOf(navLang) !== -1) {
            window.location.replace(navLang + '/');
        } else {
            window.location.replace('en/');
        }
    })();
</script>
```

### 9.4 Suporte Obrigatório a RTL para o Árabe (`site/ar/`)
As páginas sob `site/ar/` e as interfaces da aplicação utilizam:
```html
<html lang="ar" dir="rtl">
```

---

## 10. Banners e Cards Sociais (Padrão KokoroSim)

Todo repositório Lumen que publique site estático deve manter a automação para geração do banner Open Graph em `./site/assets/og_preview.png`.

### 10.1 Script de Geração (`scripts/generate_og_image.py`)
Utiliza Python + Pillow para renderizar o banner em 1200x630 com Safe Zone 4:3 centralizada (largura de 720px a 840px), evitando cortes em pré-visualizações móveis e do WhatsApp:
- **Resolução:** 1200x630 px
- **Safe Zone:** Miolo central com sangria lateral mínima de 180px.
- **Tipografia:** Fonte condensada geométrica para títulos de alto impacto.

### 10.2 Preview de Cards (`site/card_preview.html`)
Para validação visual fiel antes do deploy, recomenda-se incluir em `site/card_preview.html` a simulação de renderização em WhatsApp (Dark Mode) e Twitter/X (Summary Large Image), conforme arquitetura do KokoroSim.

---

## 11. Arquitetura Pragmática & Estrutura de Código no Perfil Kollontai

O perfil Kollontai materializa os princípios de Inversão de Dependência (DIP), hermeticidade e anti-bloat através de padrões objetivos adaptados às linguagens centrais do ecossistema (**Rust** e **PHP**).

### 11.1 Regra de Gradação: Micro-ferramenta vs. Aplicação
1. **Micro-ferramentas e Scripts Utilitários:** Ferramentas de escopo pontual (ex: CLI de 100 linhas ou filtro de texto) **NÃO DEVEM** ser fracionadas em múltiplas pastas cerimoniais. Ficam contidas diretamente em `src/main.rs` (Rust) ou arquivo executável único (PHP/Bash).
2. **Aplicações e Serviços:** Projetos que envolvam persistência, múltiplos protocolos ou casos de uso complexos **DEVEM** adotar a divisão canônica entre Domínio e Adaptadores.

### 11.2 Padrão de Diretórios para Rust
Em sistemas, daemons e milters:

```text
src/
├── domain/             # Regras de negócio puras (sem dependências de I/O)
│   ├── mod.rs
│   ├── entity.rs       # Modelos e invariantes de domínio
│   ├── status.rs       # Enums nativos para máquinas de estado
│   └── ports.rs        # Traits de I/O (Output Ports: ex: MessageStore, ClientApi)
├── application/        # Orquestração e Casos de Uso
│   ├── mod.rs
│   └── use_cases.rs    # Lógica que opera sobre os traits de domínio
├── adapters/           # Implementações de I/O e interfaces de transporte
│   ├── mod.rs
│   ├── in_memory.rs    # Fake em memória para testes unitários herméticos
│   ├── sqlite.rs       # Adaptador real de persistência
│   └── cli.rs          # Entrada via linha de comando (ex: clap)
└── main.rs             # Composition Root: instancia adaptadores e orquestra o bootstrap
```

#### Exemplo Canônico de Fake em Memória (Rust):
```rust
// src/domain/ports.rs
pub trait MessageStore {
    fn save(&mut self, id: &str, content: &str) -> Result<(), String>;
    fn find(&self, id: &str) -> Option<String>;
}

// src/adapters/in_memory.rs
use std::collections::HashMap;
use crate::domain::ports::MessageStore;

#[derive(Default)]
pub struct InMemoryMessageStore {
    items: HashMap<String, String>,
}

impl MessageStore for InMemoryMessageStore {
    fn save(&mut self, id: &str, content: &str) -> Result<(), String> {
        self.items.insert(id.to_string(), content.to_string());
        Ok(())
    }
    fn find(&self, id: &str) -> Option<String> {
        self.items.get(id).cloned()
    }
}
```
*Zero mocks dinâmicos:* Os testes unitários do caso de uso instanciam `InMemoryMessageStore` diretamente, rodando em microssegundos sem rede nem arquivos.

### 11.3 Padrão de Diretórios para PHP
Em APIs, aplicações IndieWeb e serviços web:

```text
src/
├── Domain/             # Núcleo de domínio (PHP puro, zero dependências externas)
│   ├── Models/         # Entidades de negócio
│   ├── Enums/          # Backed Enums nativos (estados e categorias)
│   └── Ports/          # Contratos e Interfaces (Input/Output Ports)
├── Application/        # Casos de uso e orquestração
│   └── UseCases/       # Handlers executando fluxos de domínio
└── Infrastructure/     # Adaptadores concretos
    ├── Persistence/    # Implementações reais (SQLite/Pdo) e In-Memory Fakes
    ├── Http/           # Controllers e Middlewares
    └── Console/        # Comandos CLI
tests/
├── Unit/               # Testes herméticos usando In-Memory Fakes (milissegundos)
└── Integration/        # Testes com fixtures de banco SQLite em arquivo temporário
```

#### Exemplo Canônico de Fake em Memória e Pest (PHP):
```php
// src/Domain/Ports/TokenStorageInterface.php
namespace App\Domain\Ports;

interface TokenStorageInterface {
    public function store(string $token, string $userId): void;
    public function find(string $token): ?string;
}

// src/Infrastructure/Persistence/InMemoryTokenStorage.php
namespace App\Infrastructure\Persistence;

use App\Domain\Ports\TokenStorageInterface;

final class InMemoryTokenStorage implements TokenStorageInterface {
    /** @var array<string, string> */
    private array $tokens = [];

    public function store(string $token, string $userId): void {
        $this->tokens[$token] = $userId;
    }

    public function find(string $token): ?string {
        return $this->tokens[$token] ?? null;
    }
}
```
No teste Pest (`tests/Unit/AuthenticateUserTest.php`):
```php
test('autentica usuário com storage em memória', function () {
    $storage = new \App\Infrastructure\Persistence\InMemoryTokenStorage();
    $storage->store('tok-123', 'usr-456');

    expect($storage->find('tok-123'))->toBe('usr-456')
        ->and($storage->find('inexistente'))->toBeNull();
});
```

### 11.4 Filosofia Anti-Bloat: Tipos Primitivos & Validação na Borda
* **Parse, Don't Validate na Entrada:** A validação e desinfecção de strings, limites numéricos e decodificação JSON ocorrem no adaptador de entrada (ex: validação de request HTTP ou parser do CLI).
* **Primitivos Confiáveis no Domínio:** Evita-se criar Value Objects cerimoniais (ex: `UsernameString`, `IdInt`) quando tipos primitivos nativos (`string`, `int`) com tipagem estrita da linguagem atendem com clareza.
* **Modelagem com Enums Nativos:**
  - Rust: `pub enum TaskState { Pending, Running, Finished { exit_code: i32 } }`
  - PHP: `enum OrderStatus: string { case Pending = 'pending'; case Approved = 'approved'; case Cancelled = 'cancelled'; }`

---

## 12. Padrões de Sistema e Containers no Perfil Kollontai

O ecossistema Kollontai adota padrões rígidos de interoperabilidade Unix, priorizando ferramentas leves e compatíveis com shell scripting e ambientes conteinerizados seguros.

### 12.1 Resolução Canônica de Diretórios XDG
Todo utilitário ou serviço Lumen implementa o mapeamento estrito da especificação XDG com fallbacks universais.

#### Em Shell Scripting (POSIX):
```sh
APP_NAME="meu-app"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/$APP_NAME"
DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/$APP_NAME"
STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/$APP_NAME"
CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/$APP_NAME"
RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}/$APP_NAME"

mkdir -p "$CONFIG_DIR" "$DATA_DIR" "$STATE_DIR" "$CACHE_DIR" 2>/dev/null
```

#### Em Rust:
```rust
pub fn config_path(app: &str) -> std::path::PathBuf {
    let base = std::env::var("XDG_CONFIG_HOME")
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|_| {
            let home = std::env::var("HOME").unwrap_or_else(|_| ".".into());
            std::path::PathBuf::from(home).join(".config")
        });
    base.join(app)
}
```

### 12.2 Configuração Plana Baseada em Shell e Env (`KEY=VALOR`)
Para eliminar dependências pesadas de parsing (como bibliotecas TOML/YAML) em scripts de automação, os arquivos de configuração locais e de usuário adotam formato plano compatível com shell:

```bash
# $XDG_CONFIG_HOME/meu-app/config.env
MATRACA_PORT="8080"
MATRACA_BIND="127.0.0.1"
MATRACA_LOG_LEVEL="info"
```

#### Carregamento Nativo em Shell:
```sh
if [ -f "$CONFIG_FILE" ]; then
    set -a
    # shellcheck source=/dev/null
    . "$CONFIG_FILE"
    set +a
fi
```

### 12.3 Dockerfiles Canônicos no Perfil Kollontai

#### Template Rust (Multi-stage + `scratch` estático):
```dockerfile
# Estágio de compilação
FROM rust:1.99-alpine AS builder
RUN apk add --no-cache musl-dev
WORKDIR /build
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release --target x86_64-unknown-linux-musl

# Imagem final de produção (Zero Inchaço)
FROM scratch
USER 1000:1000
COPY --from=builder /build/target/x86_64-unknown-linux-musl/release/app /usr/local/bin/app
ENTRYPOINT ["/usr/local/bin/app"]
```

#### Template PHP (Multi-stage + `alpine` com Non-root):
```dockerfile
# Estágio de dependências
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

# Imagem final de execução
FROM php:8.3-cli-alpine
RUN adduser -D -u 1000 appuser
WORKDIR /app
COPY --chown=appuser:appuser . /app
COPY --chown=appuser:appuser --from=vendor /app/vendor /app/vendor
USER 1000:1000
ENTRYPOINT ["php", "/app/bin/console"]
```

### 12.4 Higiene de Containers (`.dockerignore` e `compose.yaml`)
Todo repositório com suporte a Docker **DEVE** incluir `.dockerignore` rigoroso na raiz:
```dockerignore
.git
.env*
!*.example
target/
vendor/
tests/
site/
*.log
```

E para orquestração de desenvolvimento local, adotar `compose.yaml`:
```yaml
services:
  app:
    build: .
    user: "1000:1000"
    env_file:
      - .env
    ports:
      - "${APP_PORT:-8080}:8080"
    restart: unless-stopped
```

---

## 13. Rodapé Canônico Multilíngue (Padrão de Autoria e Soberania)

Todo aplicativo com interface gráfica, vitrine pública, documentação (`site/`) ou CLI com rodapé formatado no ecossistema Kollontai **DEVE** exibir o rodapé canônico em **duas linhas rigorosamente estruturadas**, com paridade de tradução nas **10 Línguas Oficiais da Norma GOST**.

### 13.1 Arquitetura do Rodapé em Duas Linhas

* **Linha 1 — Afirmação Identitária & Transfeminista:**  
  `Orgulhosamente produzido por uma [travesti latina] 🏳️‍⚧️ :)`  
  - O substantivo **"travesti"** permanece rigorosamente **sem tradução** em todos os idiomas, preservando sua singularidade geopolítica e conceitual sul-americana.
  - O adjetivo **"latina"** é adaptado à gramática nativa de cada idioma.
  - A expressão composta `travesti [latina]` **DEVE** atuar como hiperlink obrigatório direcionando para o artigo canônico de definição em `https://travesti.2lp.in/<lang>/`.
  - A bandeira trans (`🏳️‍⚧️`) sucede a expressão antes do sorriso `:)`.

* **Linha 2 — Metadados de Soberania, Autoria e Licenciamento:**  
  `{Nome do App} v{Versão} • [Lumen Pink](https://lumen.pink) • {Data/Hora ISO UTC} • {País / Brasil} 🇧🇷 • [{Licença}]`  
  - `{Nome do App}`: Identificador público da aplicação ou biblioteca.
  - `v{Versão}`: Versão extraída diretamente do arquivo `VERSION` da raiz do repositório (ex: `v0.1.0-dev.1` ou `v1.0.0`).
  - `Lumen Pink`: Com link canônico para `https://lumen.pink`.
  - `{Data/Hora ISO UTC}`: Carimbo exato de data e hora da compilação/montagem no formato ISO 8601 UTC (ex: `2026-09-28T22:20:00Z`), no lugar do ano estático.
  - `{País / Brasil} 🇧🇷`: Nome do país adaptado ao idioma (ex: `Brasil 🇧🇷`, `Brazil 🇧🇷`, `Brésil 🇧🇷`, `Brasilien 🇧🇷`, `Brasile 🇧🇷`, `Бразилия 🇧🇷`, `巴西 🇧🇷`, `ブラジル 🇧🇷`, `البرازيل 🇧🇷`), acompanhado da bandeira nacional brasileira.
  - `[{Licença}]`: Identificador SPDX da licença (ex: `GPL-3.0-or-later`, `CC-BY-SA-4.0`, etc.) com link para o arquivo `LICENSE` do repositório.

### 13.2 Matriz Canônica das 10 Línguas Oficiais (Rodapé)

| Idioma | ISO | Linha 1 (Afirmação Identitária) | Linha 2 (Metadados de Soberania) |
|:---:|:---:|---|---|
| **Português** | `pt` | Orgulhosamente produzido por uma [travesti latina](https://travesti.2lp.in/pt/) 🏳️‍⚧️ :) | {App} v{Versão} • por [Lumen Pink](https://lumen.pink) • {ISO_UTC} • Brasil 🇧🇷 • [{Licença}] |
| **Inglês** | `en` | Proudly produced by a [Latin American travesti](https://travesti.2lp.in/en/) 🏳️‍⚧️ :) | {App} v{Versão} • by [Lumen Pink](https://lumen.pink) • {ISO_UTC} • Brazil 🇧🇷 • [{Licença}] |
| **Espanhol** | `es` | Orgullosamente producido por una [travesti latinoamericana](https://travesti.2lp.in/es/) 🏳️‍⚧️ :) | {App} v{Versão} • por [Lumen Pink](https://lumen.pink) • {ISO_UTC} • Brasil 🇧🇷 • [{Licença}] |
| **Francês** | `fr` | Fièrement produit par une [travesti latino-américaine](https://travesti.2lp.in/fr/) 🏳️‍⚧️ :) | {App} v{Versão} • par [Lumen Pink](https://lumen.pink) • {ISO_UTC} • Brésil 🇧🇷 • [{Licença}] |
| **Alemão** | `de` | Mit Stolz entwickelt von einer [lateinamerikanischen Travesti](https://travesti.2lp.in/de/) 🏳️‍⚧️ :) | {App} v{Versão} • von [Lumen Pink](https://lumen.pink) • {ISO_UTC} • Brasilien 🇧🇷 • [{Licença}] |
| **Italiano** | `it` | Orgogliosamente prodotto da una [travesti latinoamericana](https://travesti.2lp.in/it/) 🏳️‍⚧️ :) | {App} v{Versão} • da [Lumen Pink](https://lumen.pink) • {ISO_UTC} • Brasile 🇧🇷 • [{Licença}] |
| **Russo** | `ru` | С гордостью создано [латиноамериканской travesti](https://travesti.2lp.in/ru/) 🏳️‍⚧️ :) | {App} v{Versão} • от [Lumen Pink](https://lumen.pink) • {ISO_UTC} • Бразилия 🇧🇷 • [{Licença}] |
| **Chinês** | `zh` | 由一位[拉美 travesti](https://travesti.2lp.in/zh/) 自豪制作 🏳️‍⚧️ :) | {App} v{Versão} • 来自 [Lumen Pink](https://lumen.pink) • {ISO_UTC} • 巴西 🇧🇷 • [{Licença}] |
| **Japonês** | `ja` | [ラテンアメリカの travesti](https://travesti.2lp.in/ja/) によって誇りを持って制作されました 🏳️‍⚧️ :) | {App} v{Versão} • 制作: [Lumen Pink](https://lumen.pink) • {ISO_UTC} • ブラジル 🇧🇷 • [{Licença}] |
| **Árabe (RTL)** | `ar` | صُنع بكل فخر بواسطة [travesti أمريكية لاتينية](https://travesti.2lp.in/ar/) 🏳️‍⚧️ :) | {App} v{Versão} • بواسطة [Lumen Pink](https://lumen.pink) • {ISO_UTC} • البرازيل 🇧🇷 • [{Licença}] |

---

## 14. Atualização Contínua de Containers Docker (Watchtower)

Para garantir segurança, integridade e atualização contínua de imagens de containers em infraestruturas Docker / Docker Compose autohospedadas (como nos nós `obione`, `obitwo` e `baquara`), a automação adota o **Watchtower** sob as seguintes diretrizes obrigatórias:

1. **Opt-in Rigoroso por Labels (`--label-enable`):**  
   O Watchtower **NUNCA** monitora ou reinicia containers de modo indiscriminado. Apenas containers declarando explicitamente a label:
   ```yaml
   labels:
     - "com.centurylinklabs.watchtower.enable=true"
   ```
   serão atualizados. Containers com dependências sensíveis de migração de banco de dados ou volumes críticos sem backup permanecem intocados.
2. **Limpeza Compulsória de Imagens Órfãs (`WATCHTOWER_CLEANUP=true`):**  
   Imagens antigas substituídas são purgadas imediatamente para evitar exaustão de armazenamento no host.
3. **Modos de Acionamento Homologados:**
   - **Agendamento Periódico:** Polling programado com intervalo seguro (ex: diário ou a cada 2h).
   - **Acionamento por Webhook (`WATCHTOWER_HTTP_API_TOKEN`):** Disparo autenticado via POST HTTP disparado automaticamente pelo pipeline de CI/CD do Codeberg após a publicação da nova imagem no registry.




