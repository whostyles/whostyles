# GOST — Padrão Técnico para Repositórios Abertos
**Versão da Norma:** `1.0.0-draft`  
**Status:** Oficial / Proposta Normativa  
**Referência:** ГОСТ (Государственный Стандарт / General Open Source Standard)

---

## 1. Escopo e Propósito

Esta especificação define os requisitos estruturais, metodológicos, de governança e de documentação para criação, manutenção e ciclo de vida de repositórios de software aberto.

O objetivo do GOST é eliminar atritos no surgimento de novos projetos, garantir rastreabilidade histórica completa, assegurar a máxima liberdade do código e impor rigor de engenharia orientado à documentação e testes.

As palavras-chave **DEVE** (*MUST*), **NÃO DEVE** (*MUST NOT*), **DEVERIA** (*SHOULD*), **NÃO DEVERIA** (*SHOULD NOT*) e **PODE** (*MAY*) neste documento devem ser interpretadas conforme descrito na [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).

---

## 2. Filosofia e Licenciamento

Todo projeto em conformidade com o GOST **DEVE** declarar sua licença de forma explícita na raiz do repositório através de um arquivo `LICENSE`. A especificação técnica detalhada, perfis e matriz normativa encontram-se em [specs/legal/licenses.md](./specs/legal/licenses.md).

### 2.1 Princípio da Menor Permissividade como Padrão Raiz
* **Regra da Raiz:** O arquivo `LICENSE` na raiz **DEVE** ser a licença padrão e geral de todo o repositório.
* Em repositórios com múltiplos tipos de artefatos (como monorepos ou aplicações híbridas), o arquivo `LICENSE` **DEVE** conter a licença menos permissiva (mais restritiva) adotada (ex: `GPL-3.0`).
* Quaisquer licenças mais permissivas (ex: `Apache-2.0` para sub-bibliotecas ou `CC-BY-SA-4.0` para mídias) funcionam como exceções modulares declaradas.

### 2.2 Tipologia por Perfil de Repositório
1. **Aplicações Completas / Monorepos Híbridos (ex: Mayak, Navalha):** Adotam `GPL-3.0` (ou `AGPL-3.0` para serviços web) na raiz (`LICENSE`).
2. **Microapps & Comrades (ex: comrades/cli):** Adotam `Apache-2.0` na raiz (`LICENSE`) diretamente, sem necessidade de arquivos satélites supérfluos.
3. **Bibliotecas, Protocolos e SDKs:** Adotam `Apache-2.0` na raiz (`LICENSE`) para máxima interoperabilidade.
4. **Especificações e Normas (ex: GOST):** Adotam `CC-BY-SA-4.0` para os textos normativos na raiz (`LICENSE`), com esquemas e templates em `CC0-1.0` e marcas protegidas via satélite.

### 2.3 Arquivos Satélites Padronizados
Quando houver artefatos que exijam tratamentos jurídicos específicos, os seguintes arquivos canônicos **DEVEM** ser utilizados:
* `LICENSE-MEDIA`: Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional (`CC-BY-SA-4.0`) para mídias, áudios, vídeos, fontes e ilustrações.
* `LICENSE-LOGO`: Creative Commons Atribuição-SemDerivações 4.0 Internacional (`CC-BY-ND-4.0`) para marcas, insígnias, ícones oficiais e logotipos.
* `LICENSE-APACHE`: Apache License 2.0 (`Apache-2.0`) para módulos, sub-crates ou bibliotecas desacopladas contidas em monorepos de aplicações.

### 2.4 Mapeamento Obrigatório no `README.md`
Repositórios com múltiplos tipos de artefatos ou licenças satélites **DEVEM** incluir em seu `README.md` uma seção ou tabela de mapeamento discriminando expressamente os caminhos e arquivos cobertos por cada licença.

### 2.5 Princípio Anti-Boilerplate
Cada repositório implementa exclusivamente as licenças condizentes com seu perfil real. É vedado copiar blocos genéricos de licenciamento e arquivos satélites vazios para projetos simples (como comrades ou microutilitários).

---

## 3. Anatomia Mínima da Raiz

Todo repositório GOST **DEVE** conter em sua raiz a seguinte estrutura mínima independente da stack ou linguagem utilizada:

```
.
├── LICENSE                     # Termo legal de licenciamento padrão (Seção 2)
├── LICENSE-MEDIA               # (Opcional) Licença CC-BY-SA para mídias e assets
├── LICENSE-LOGO                # (Opcional) Licença CC-BY-ND para marcas e logos
├── LICENSE-APACHE              # (Opcional) Licença Apache-2.0 para bibliotecas internas
├── VERSION                     # Versão semântica em texto plano (Seção 4)
├── CHANGELOG.md                # Registro cronológico de mudanças (Seção 4)
├── README.md                   # Apresentação executiva e guia rápido
├── .gitignore                  # Higiene do repositório e arquivos ignorados
├── .editorconfig               # Configuração canônica de formatação para editores
├── site/                       # Portal estático de documentação pública (Seção 8)
│   ├── index.html              # Ponto de entrada da documentação
│   └── _headers                # Cabeçalhos HTTP de segurança
└── .forgejo/ / .github/        # Automação de CI/CD (Seção 7)
    └── workflows/ci.yml
```

Arquivos de configuração e metadados específicos de ferramentas **NÃO DEVEM** poluir a raiz sem necessidade e devem ser isolados em pastas de configuração ou perfis.

---

## 4. Versionamento e Histórico

### 4.1 Arquivo `VERSION`
* O repositório **DEVE** manter um arquivo `VERSION` na raiz contendo exclusivamente a versão atual do projeto em formato de texto puro UTF-8, finalizado por uma quebra de linha.
* O formato de versionamento **DEVE** aderir estritamente ao [Semantic Versioning 2.0.0](https://semver.org/) (`MAJOR.MINOR.PATCH[-PRERELEASE]`).
* Durante o estágio de desenvolvimento inicial, a versão **DEVERIA** seguir o padrão `0.1.0-dev.N`.

### 4.2 Arquivo `CHANGELOG.md`
* O repositório **DEVE** manter um histórico de modificações legível por humanos e baseado no padrão [Keep a Changelog](https://keepachangelog.com/).
* As seções de cada versão **DEVEM** categorizar alterações em: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.

---

## 5. Ciclo de Desenvolvimento GOST (DD-TDD)

O fluxo de trabalho em repositórios GOST **DEVE** seguir o ciclo rigoroso de **Documentation-Driven & Test-Driven Development (DD-TDD)** em 9 fases sequenciais e indivisíveis, governado pela regra de rastreabilidade estrita de tickets e isolamento em branches.

### 5.1 Cláusulas Pétreas do Ciclo

1. **Inviolabilidade das 9 Fases:** Todas as 9 etapas **DEVEM** ser seguidas em ordem sequencial estrita para toda e qualquer alteração no repositório (funcionalidade, bugfix, refatoração ou manutenção). É expressamente proibido pular etapas, invertê-las ou executá-las em lote.
2. **Zero Código sem Ticket e Documentação Prévia:** **NENHUMA ALTERAÇÃO EM CÓDIGO DE PRODUÇÃO É PERMITIDA SEM TICKET ABERTO E ESPECIFICAÇÃO PRELIMINAR DE DOCUMENTAÇÃO/CONTRATO**. Nenhuma linha funcional nasce sem rastreabilidade documental prévia.
3. **Isolamento Estrito da Fase de Documentação:** Na etapa de documentação/especificação (Fase 3), é **TERMINANTEMENTE PROIBIDO alterar qualquer linha de código de produção**. Apenas contratos de interface, tipos, assinaturas, diagramas e especificações funcionais são permitidos.
4. **Rastreabilidade Estrita de Commits por Ticket:**
   - Todo trabalho **DEVE** nascer de uma issue formal registrada no issue tracker antes de qualquer modificação.
   - Todo commit intermediário **DEVE** incluir a referência ao ticket no formato `(ref #<id>)`.
   - O commit final de encerramento da Fase 9 **DEVE** conter `(closes #<id>)` para liquidar formalmente o ticket.
   - Hooks de commit (`commit-msg`) e o pipeline de CI/CD **DEVEM** rejeitar imediatamente qualquer commit sem referência a ticket.
5. **Proibição Absoluta de Commit na Linha Base:** É estritamente **PROIBIDO** commitar diretamente no branch principal (`main` ou `develop`). Todo o trabalho reside exclusivamente no branch dedicado do ticket até sua aprovação e merge.

### 5.2 Estratégia de Branches por Ticket
* Todo ticket **DEVE** ser desenvolvido em um branch dedicado derivado de `develop` (ou `main`), com nomenclatura padronizada contendo o ID do ticket:
  - `feat/<id>-<slug-curto>` (ex: `feat/42-rate-limiting`)
  - `fix/<id>-<slug-curto>` (ex: `fix/55-jwt-timestamp-overflow`)
  - `docs/<id>-<slug-curto>` (ex: `docs/12-api-spec-update`)
  - `refactor/<id>-<slug-curto>` (ex: `refactor/18-extract-auth-module`)
  - `test/<id>-<slug-curto>`
  - `chore/<id>-<slug-curto>`
* O merge do branch para a linha principal só é permitido após aprovação completa de testes, cobertura e linter no CI.

### 5.3 As 9 Fases Canônicas do Ciclo DD-TDD

```text
[1. Ticket] 
    └──> [2. New Branch] 
            └──> [3. Doc / Spec Contract] 
                    └──> [4. Red: Failing Test] 
                            └──> [5. Green: Implement] 
                                    └──> [6. Refactor to Excellence] 
                                            └──> [7. Mutation Test & Fortify] 
                                                    └──> [8. Quality Gate & Local Audit] 
                                                            └──> [9. Finish Docs & Close]
```

1. **Fase 1: Ticket / Issue (Planejamento & Escopo)**
   - Abertura formal da issue no tracker com: Contexto, Comportamento Esperado e Critérios de Aceite detalhados.
   - Proibido qualquer commit ou alteração no repositório nesta fase.
2. **Fase 2: New Branch (Isolamento Estrito)**
   - Criação da branch dedicada a partir da base (`develop` ou `main`) no formato `<tipo>/<id>-<slug>`.
   - Nenhuma linha é alterada na branch base.
3. **Fase 3: Doc / Spec Contract (Design e Contrato Preliminar)**
   - Formalização prévia do contrato, interfaces públicas, assinaturas, diagramas e comportamento esperado.
   - **Regra Inviolável:** Zero alterações em código de produção nesta etapa. Apenas documentação e contratos.
   - Commit: `docs: specify <comportamento> (ref #<id>)`
4. **Fase 4: Red - Failing Test (Comprovação Automatizada)**
   - Criação de testes automatizados unitários ou funcionais exercitando o contrato definido na Fase 3.
   - O teste **DEVE falhar**, comprovando a ausência da funcionalidade ou reproduzindo fielmente o bug.
   - Commit: `test: add failing test for <requisito> (ref #<id>)`
5. **Fase 5: Green - Implement / Fix (Implementação Funcional)**
   - Primeira escrita em código de produção: implementação estritamente necessária e suficiente para fazer a suíte passar.
   - Commit: `feat: implement <funcionalidade> (ref #<id>)` ou `fix: resolve <bug> (ref #<id>)`
6. **Fase 6: Refactor to Excellence (Polimento e Qualidade)**
   - Refatoração do código de produção e testes: eliminação de duplicações, nomes idiomáticos, separação de responsabilidades e Zero Warnings. Testes continuam 100% verdes.
   - Commit: `refactor: optimize and polish <escopo> (ref #<id>)`
7. **Fase 7: Mutation Test & Fortify (Blindagem contra Mutantes)**
   - Execução da ferramenta de testes de mutação. Cada mutante sobrevivente exige **novos testes ou asserções adicionais** até exterminar 100% dos mutantes críticos nas áreas modificadas.
   - Commit: `test: eliminate surviving mutants in <escopo> (ref #<id>)`
8. **Fase 8: Quality Gate & Local Audit (Auditoria Local)**
   - Execução e validação dos gates locais: linter rigoroso com `-D warnings` (Zero Warnings), formatação determinística (`fmt`), compilação/tipos limpos e piso de cobertura ≥ 90% (mirando 100%).
   - *(Validação local estrita; commit de ajuste se necessário: `fix: lint and formatting hygiene (ref #<id>)`)*
9. **Fase 9: Finish Docs & Close Ticket (Consolidação e Encerramento)**
   - Atualização da documentação para usuário (`./site`, `README.md`), consolidação do `CHANGELOG.md` e commit final de encerramento formal contendo obrigatoriamente a diretiva de fechamento.
   - Commit: `docs: finalize documentation and changelog (closes #<id>)`

### 5.4 Tratamento para Casos Específicos
* **Em Bugfixes (`fix`):** Na Fase 3 (Spec), documenta-se a violação do contrato anterior e o comportamento correto esperado; na Fase 4 (Red), o teste falho é o teste de regressão exato que reproduz o defeito.
* **Em Refatorações (`refactor`):** Na Fase 3 (Spec), definem-se as invariantes de negócio que não podem ser quebradas; na Fase 4 (Red), adicionam-se testes cobrindo lacunas ou casos de borda antes não testados garantindo as invariantes.
* **Em Documentação Pura (`docs`):** Quando a tarefa for exclusivamente documental, as etapas de código funcional (4 a 7) registram `N/A` explícito no checklist do ticket, mantendo-se obrigatórias a branch dedicada (Fase 2), a referência intermediária `(ref #<id>)` e o fechamento `(closes #<id>)` na Fase 9.

### 5.5 Critérios de Conclusão / Definition of Done (DoD)
Um ticket só pode ser considerado concluído e encerrado via `(closes #<id>)` se satisfizer integralmente o seguinte checklist:
- [ ] Ticket aberto previamente detalhando o problema e critérios (Fase 1).
- [ ] Branch dedicado criado no formato `<tipo>/<id>-<slug>` (Fase 2).
- [ ] Documentação preliminar de contrato registrada antes do código (Fase 3).
- [ ] Commit com teste falho registrado no histórico antes da implementação (Fase 4).
- [ ] Código funcional implementado e todos os testes passando (Fase 5).
- [ ] Refatoração concluída com código limpo e idiomático (Fase 6).
- [ ] Ausência de mutantes críticos sobreviventes (Fase 7).
- [ ] Quality gates locais 100% verdes: cobertura ≥ 90%, zero warnings, formatação determinística (Fase 8).
- [ ] Documentação do `./site`, `README.md` e `CHANGELOG.md` atualizadas (Fase 9).
- [ ] Pipeline de CI/CD 100% verde.

### 5.6 Protocolo de Comandos para Agentes de IA (*Agent Dispatch*)
Em repositórios GOST desenvolvidos ou mantidos em colaboração com agentes de inteligência artificial (LLM/CLI), a interação entre o humano e o agente **DEVE** aderir a um vocabulário determinístico de comandos operacionais para mitigar ações não autorizadas (como commits arbitrários, quebra do fluxo de tickets ou merges indevidos):

| Comando | Significado Canônico | Escopo de Autorização Concedida ao Agente |
|:---:|---|---|
| **`DCPD`** | **Do, Commit, Push, Deploy** | Autorização total de ponta a ponta: implementa código e testes, valida linters/gates locais, cria commit convencional com `(closes #<id>)`, faz push da branch, executa merge na `main` e dispara o pipeline de deploy. |
| **`DCP`** | **Do, Commit, Push** | Implementa, testa, commita e envia o push **exclusivamente para a branch de trabalho**, deixando o Pull Request aberto no Codeberg/Forgejo para revisão e validação humana prévia. |
| **`PLAN`** | **Plan & Propose** | Modo estritamente consultivo e investigativo: pesquisa o código, elabora diagnóstico e formula proposta detalhada de plano/ticket, **sem editar arquivos e sem commitar**. |
| **`TDD`** | **Ticket, Branch, Doc, Red, Green, Refactor, Mutate, Gate, Close** | Execução rigorosa e sequencial das **9 fases canônicas** do ciclo DD-TDD: criação/validação de ticket, criação da branch dedicada, contrato preliminar em docs (**sem tocar em código**), teste falho, código funcional, refatoração limpa, eliminação de mutantes, validação dos gates e commit final de fechamento. |
| **`AUDIT`** | **Audit & Check** | Inspeção passiva do repositório: executa linters em severidade máxima (`-D warnings`), verifica cobertura (≥90%), testa mutantes, audita vulnerabilidades em dependências e checa integridade de links sem alterar o código. |
| **`FIX`** | **Fix & Clean** | Saneamento e polimento técnico: correção exclusiva de avisos de linters, eliminação de mutantes sobreviventes e aplicação de formatadores determinísticos, preservando o comportamento funcional. |
| **`RELEASE`** | **Release & Tag** | Consolidação de marcos semânticos: consolidação do `CHANGELOG.md`, bump semântico no `VERSION` (`patch`, `minor` ou `major`) via `cccp release`, geração da tag Git correspondente e push de tags. |

* **Regra de Ouro:** Agentes de IA **NUNCA DEVEM** presumir autorização para commits, merges ou modificações funcionais amplas sem instrução inequívoca ou uso dos comandos deste protocolo.

---

## 6. Estratégia e Qualidade de Testes

A integridade do software no padrão GOST baseia-se na verificação automatizada contínua com alta densidade de asserções e cobertura quantitativa e qualitativa.

### 6.1 Taxonomia de Testes Obrigatória
Todo projeto **DEVE** estruturar sua validação nas seguintes camadas, conforme aplicável à natureza do componente:

1. **Testes Unitários:**
   - Testam funções, métodos, tipos e módulos em isolamento absoluto.
   - Devem ter execução instantânea (milissegundos) e zero dependências de I/O externo.
2. **Testes Funcionais:**
   - Validam regras de negócio, transformações de dados e casos de uso específicos (dada uma entrada X, a saída deve ser Y).
3. **Testes de Integração:**
   - Validam a interoperabilidade entre componentes internos, persistência em disco (ex: SQLite), variáveis de ambiente ou protocolos de comunicação local (IPC/sockets).
4. **Testes Ponta a Ponta (E2E):**
   - Para aplicações com interface com usuário (web ou desktop), os testes **DEVEM** exercitar o sistema completo simulando a interação real de usuários em navegadores headless utilizando **Playwright**.

### 6.2 Política de Cobertura (*Code Coverage*)
* **Piso Mínimo Inviolável:** A cobertura global de código automatizada **DEVE** ser mantida permanentemente em no mínimo **`90%`**.
* **Meta de Excelência:** Todo projeto **DEVE** focar ativamente na meta de **`100%`** de cobertura nos módulos centrais de domínio e utilitários.
* **Critério de Bloqueio:** Qualquer alteração, pull request ou commit que rebaixe a cobertura global abaixo de 90% **DEVE** falhar o pipeline de integração contínua.

### 6.3 Validação Qualitativa: Testes de Mutação
* A cobertura percentual pura não atesta a eficácia das verificações. Para evitar testes cosméticos (linhas executadas sem asserções de valor real), o projeto **DEVERIA** empregar **Testes de Mutação** (*Mutation Testing*).
* O teste de mutação introduz falhas sintéticas no código (mutantes); se a suíte de testes continuar passando, o teste é considerado deficiente.

### 6.4 Hermeticidade e Determinismo
* **Isolamento de Rede:** As suítes de testes unitários, funcionais e de integração **NÃO DEVEM** depender de acesso à internet pública ou serviços remotos. Chamadas externas devem ser simuladas via *mocks*, *stubs* ou *fixtures*.
* **Limpeza de Estado:** Todo teste que instanciar arquivos, diretórios temporários ou registros em banco **DEVE** destruí-los ao término da execução, garantindo que os testes sejam estritamente idempotentes e executáveis em qualquer ordem.

---

## 7. Análise Estática e Tolerância Zero a Avisos (*Zero Warnings*)

A excelência e longevidade do código exigem rigor estrito antes de qualquer execução:

### 7.1 Tolerância Zero a Warnings
* Todo projeto **DEVE** configurar seus linters e analisadores estáticos com nível de severidade máximo.
* Avisos (*warnings*) **DEVEM** ser tratados como erros fatais (ex: flags equivalentes a `-D warnings`). Qualquer commit ou PR com alertas pendentes **DEVE quebrar o CI**.

### 7.2 Filosofia de Dependências Mínimas e Auditoria de Segurança
* **Princípio Anti-Bloat:** A adição de bibliotecas de terceiros **DEVE** ser estritamente justificada no ticket do projeto. Favorece-se soluções leves, bibliotecas padrão e código autônomo.
* **Auditoria de Vulnerabilidades:** O pipeline de CI **DEVE** executar verificações automatizadas de vulnerabilidades em dependências (*dependency auditing*).

### 7.3 Formatação Determinística Obrigatória (*Zero Bikeshedding*)
* **Autoridade Automatizada:** Todo repositório **DEVE** adotar um formatador oficial determinístico para cada linguagem do projeto (ex: `rustfmt`, `pint`, `shfmt`, `prettier`/`biome`).
* **Gate de Verificação no CI:** A conformidade de formatação **DEVE** ser verificada no pipeline de CI com flags equivalentes a `--check` ou `--test`. Qualquer inconsistência visual ou de espaçamento quebra o build.
* **Fim das Discussões de Estilo:** Nenhuma revisão de código humana ou automatizada deve debater tabs, espaços ou quebras de linha; o formatador é a única fonte da verdade.

### 7.4 Higiene Universal de Editores (`.editorconfig`)
* Todo repositório **DEVE** conter na raiz o arquivo `.editorconfig` padronizando:
  - Codificação de caracteres: `charset = utf-8`
  - Fim de linha: `end_of_line = lf`
  - Inserção de quebra ao final: `insert_final_newline = true`
  - Remoção de espaços no final de linhas: `trim_trailing_whitespace = true`
  - Indentação canônica por extensão de arquivo.

### 7.5 Validação de Integridade Documental e Hiperlinks
* Repositórios com documentação pública **DEVERIAM** integrar no pipeline de CI utilitários de auditoria de links (ex: `lychee`) para prevenir referências quebradas (404), links canônicos `hreflang` inconsistentes ou âncoras órfãs.

---

## 8. Vitrine Pública e Documentação Web

Todo repositório GOST **DEVE** manter uma vitrine pública de documentação estática no diretório `./site`.

1. **Acessibilidade Universal:** O site de documentação **NÃO DEVE** depender de etapas de compilação complexas para visualização básica; HTML/CSS/JS puros ou geradores ultra-leves são encorajados.
2. **Segurança HTTP:** O diretório de publicação **DEVE** conter cabeçalhos HTTP mínimos de segurança (arquivo `_headers` ou equivalente):
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Referrer-Policy: strict-origin-when-cross-origin`
3. **Publicação Contínua:** A documentação **DEVE** ser publicada automaticamente via pipeline de CI/CD a cada push no branch principal (`main`).

### 8.1 Segregação Canônica: Vitrine Estática vs. Serviços Dinâmicos
* **Papel do `./site`:** A vitrine pública estática (publicada em `*.2lp.in` via Cloudflare Workers / Pages) destina-se estritamente à documentação, tutoriais e interfaces de demonstração estáticas.
* **Isolamento de Backends:** Aplicações dinâmicas, APIs, REPLs e daemons locais **NÃO DEVEM** expor credenciais, chaves ou sockets diretamente no diretório estático.
* **Guia de Conectividade:** A documentação estática de projetos dinâmicos **DEVE** conter uma seção clara descrevendo como acessar o serviço vivo (portas padrão, variáveis de ambiente e topologia de acesso).

### 8.2 Padrão de Resiliência para Clientes Móveis e Redes Instáveis
Sistemas que exponham interfaces web para uso em smartphones ou sob redes suscetíveis a oscilações (4G/5G, trocas de antenas, conexões móveis fracas) **DEVEM** adotar o padrão assíncrono resiliente:
1. **Idempotência no Envio:** Cada requisição do cliente deve portar um identificador exclusivo (`client_id`). Retentativas automáticas sob perda de sinal nunca devem duplicar ações no servidor.
2. **Desacoplamento de Requisição:** O backend deve persistir o job na fila e devolver resposta imediata (`HTTP 200/202`) em milissegundos, liberando a conexão de rede móvel.
3. **Short Polling Indestrutível:** Preferência por sondagem curta periódica sobre conexões persistentes contínuas (WebSockets/SSE), as quais tendem a quebrar silenciosamente durante trocas de torres de celular ou transições de rede.

### 8.3 Rodapé Canônico em Duas Linhas (Autoria, Identidade & Soberania)
Todo aplicativo com interface gráfica, vitrine pública ou documentação estática (`./site`) **DEVE** exibir o rodapé canônico formatado em **duas linhas rigorosamente estruturadas**:
* **Linha 1 — Afirmação Identitária & Transfeminista:**  
  `Orgulhosamente produzido por uma [travesti latina](https://travesti.2lp.in/<lang>/) 🏳️‍⚧️ :)`  
  - O termo *travesti* permanece rigorosamente sem tradução em todos os idiomas; o adjetivo adapta-se gramaticalmente à língua nativa com link direcionado à definição canônica.
* **Linha 2 — Metadados de Soberania, Autoria e Licença:**  
  `{Nome do App} v{Versão} • por [Lumen Pink](https://lumen.pink) • {País / Brasil} 🇧🇷 • [{Licença}](LICENSE)`  
  - Identifica o nome da aplicação, versão extraída de `VERSION`, autoria soberana, bandeira e link direto para o arquivo de licença.

---

## 9. Integração e Validação Contínua (CI/CD)

### 9.1 Separação Obrigatória de Jobs: Testes vs. Publicação
Todo pipeline de CI **DEVE** declarar seus estágios em jobs estritamente separados:

* **Job `test`** (obrigatório em todo repositório):
  - Lint, análise estática e Zero Warnings
  - Execução completa da suíte de testes (unitários, funcionais, integração, E2E)
  - Gate de cobertura (≥ 90%)
  - Auditoria de dependências
* **Job `deploy-*`** (somente quando aplicável):
  - **DEVE** declarar `needs: [test]` — nunca roda sem testes aprovados
  - **DEVE** condicionar execução ao branch principal (`if: github.ref == 'refs/heads/main'`)
  - Publica artefatos, documentação estática ou binários de release

A separação explícita garante que o gate de pre-push local (Seção 9.2) possa executar exclusivamente o job `test` sem acidentalmente disparar deploys, e que cada estágio seja inspecionável de forma independente nos logs de CI.

### 9.2 Gate de Pre-Push: CI Local com Infraestrutura Idêntica
O problema do "passa localmente, quebra no CI" origina-se da divergência entre o ambiente local do desenvolvedor e o ambiente de execução do pipeline. Para eliminar essa divergência:

* Os repositórios **DEVERIAM** configurar um *pre-push gate* que execute o job `test` do pipeline em um ambiente **bit-for-bit idêntico** ao da forja remota, antes de permitir o `git push`.
* O gate é executado como hook `pre-push` do Git, bloqueando o push em caso de falha.
* O ambiente de execução local **DEVE** ser o mesmo container/VM utilizado pelo runner de CI remoto.

#### Propriedades do Gate de Pre-Push
1. **Idempotência:** A execução local do job `test` deve produzir resultados idênticos à execução remota.
2. **Isolamento de Publicação:** O gate **NUNCA DEVE** executar jobs de deploy, publish ou release — apenas `test`.
3. **Registro Persistente:** A saída completa de cada execução do gate **DEVE** ser armazenada em logs nomeados e datados para rastreabilidade e diagnóstico.
4. **Feedback Vivo:** O gate **DEVERIA** exibir progresso em tempo real (step atual, tempo decorrido) sem poluir o histórico do terminal.
5. **Bypass Consciente:** O bypass do gate (`git push --no-verify`) **DEVE** ser sempre possível e documentado como opção explícita e consciente — nunca automático.

### 9.3 Degradação Graciosa do Gate
Se o ambiente de execução local não estiver disponível (ex: Docker não iniciado, executor não instalado), o gate **DEVE**:
- Emitir aviso claro indicando que o gate foi ignorado
- **Nunca** bloquear o push por ausência do executor local
- Registrar o bypass involuntário para rastreabilidade

### 9.4 Armazenamento Canônico de Artefatos em Object Storage (Cloudflare R2) e Higiene de Deploy

Para preservar a integridade, performance e quotas de armazenamento das forjas Git (Codeberg/Forgejo) e garantir distribuição estável e escalável:

1. **Proibição de Bloat na Forja Git:**
   - Binários compilados (executáveis `musl`, bibliotecas compartilhadas, instaladores `.apk`, executáveis `.exe`), pacotes pesados e tarballs de release **NÃO DEVEM** ser hospedados nas releases da forja Git nem comitados no histórico do repositório.
2. **Armazenamento Canônico em Object Storage (Cloudflare R2):**
   - Todos os artefatos de release e instaladores compilados **DEVEM** ser publicados diretamente em Object Storage compatível com S3 (prioritariamente **Cloudflare R2**).
   - Acesso e distribuição devem ocorrer via CDN global sem cobrança de taxa de saída (*egress-free*) sob o domínio unificado do projeto (`*.2lp.in`).
   - Artefatos no R2 devem suportar *HTTP Range Requests* (RFC 7233) para streaming e download parcial, acompanhados de hashes criptográficos (`checksums.sha256`).
3. **Higiene de Branches de Publicação / Pages (Stateless Single-Commit & Force Push):**
   - Quando a publicação de documentação estática envolver espelhamento em branch Git dedicado (ex: branch `pages` no Codeberg Pages ou GitHub Pages), o pipeline **NÃO DEVE** acumular commits históricos de builds sucessivos.
   - O pipeline **DEVE** verificar e purgar commits antigos de build criando uma árvore órfã isolada (`--orphan`), contendo rigorosamente um único commit limpo do snapshot atual (`docs(site): deploy [skip ci]`).
   - A publicação remota no branch de deploy **DEVE** ser efetuada via **`git push --force origin <temp>:pages`**, mantendo o repositório leve e livre de inchaço (*bloat*) histórico.

---

## 10. Internacionalização (Intl)

A norma GOST impõe disciplina linguística em camadas para conciliar cooperação global com acessibilidade multilíngue irrestrita.

### 10.1 Língua Primária e Segregação por Camadas
1. **Língua Primária do Repositório (Padrão CCCP):** Cada repositório **DEVE** declarar sua língua de trabalho primária na configuração do CCCP (`agent_var_lang`). Ela atua como idioma canônico para especificação de requisitos, fonte primária para as traduções e **fallback obrigatório** em runtime caso uma chave de tradução em outro idioma não esteja presente.
2. **Código-Fonte e Identificadores:** **DEVEM** ser escritos estritamente em **Inglês** (nomes de variáveis, funções, tipos, constantes e endpoints de API).
3. **Histórico de Commits e Tags:** **DEVEM** ser redigidos em **Inglês** seguindo a especificação de Conventional Commits (`feat:`, `fix:`, `docs:`, etc.).
4. **Triagem de Tickets:** Usuários **PODEM** relatar problemas e descrever features em qualquer idioma; ferramentas automatizadas de triagem (ex: `diva`) **DEVEM** estruturar o ticket na língua primária configurada no CCCP.

### 10.2 A Matriz Canônica das 10 Línguas Oficiais (App e Documentação)
**TODO O APLICATIVO** (interfaces de usuário, CLI, menus, mensagens de erro e logs amigáveis) e **TODA A DOCUMENTAÇÃO PÚBLICA** (`./site`) **DEVEM** fornecer paridade completa de tradução nas **10 Línguas Oficiais da Norma GOST**:

| Código ISO | Idioma | Endônimo Nativo | Direção | Papel / Escopo |
|:---:|---|---|:---:|---|
| **`en`** | English | English | LTR | Baseline técnico universal e de engenharia |
| **`pt`** | Portuguese | Português (Brasil / Portugal) | LTR | Língua nativa do ecossistema central |
| **`es`** | Spanish | Español | LTR | Integração ibérica e América Latina |
| **`fr`** | French | Français | LTR | Comunidade internacional e difusão francófona |
| **`de`** | German | Deutsch | LTR | Engenharia e ecossistema de software europeu |
| **`it`** | Italian | Italiano | LTR | Comunidade técnica e polo de computação mediterrâneo |
| **`ru`** | Russian | Русский | LTR | Referência estética e técnica da linhagem soviética / GOST |
| **`zh`** | Chinese | 中文 (简体中文) | LTR | Maior base populacional e polos tecnológicos da Ásia |
| **`ja`** | Japanese | 日本語 | LTR | Vanguarda técnica, comunidade open source e estética |
| **`ar`** | Arabic | العربية | **RTL** | Grande bloco linguístico global e representação do Oriente Médio |

### 10.3 Requisito de Direcionalidade (RTL) no App e na Doc
* Tanto a interface gráfica/CLI do aplicativo quanto as páginas de documentação para o Árabe (`ar`) **DEVEM** implementar suporte nativo a layouts **Right-to-Left** (`dir="rtl"`).
* O design de interface e CSS **DEVE** utilizar propriedades lógicas bidirecionais (ex: `margin-inline-start`, `padding-inline`, `start`/`end`) para alternância fluida entre LTR e RTL sem quebras visuais.

### 10.4 Arquitetura de Localização no Aplicativo e no Site
1. **No Aplicativo:** Pacotes de tradução mantidos em formato estruturado (ex: `locales/<lang>.json` ou catálogos nativos da linguagem) contendo 100% de paridade de chaves com relação à língua primária do CCCP. Em caso de ausência de chave em tempo de execução, o sistema **DEVE** recorrer ao texto na língua primária configurada no CCCP.
2. **Na Documentação:** Subdiretórios dedicados `./site/<lang>/index.html`. A raiz `./site/index.html` atua como roteador cliente:
   - Detecta preferência salva em `localStorage.getItem('doc_lang')`.
   - Detecta idioma do cliente via `navigator.language`.
   - Redireciona com fallback seguro para a língua primária do CCCP (ou `en/`).
   - Expõe links canônicos `rel="alternate" hreflang="<lang>"` para indexação de motores de busca.

---

## 11. Metadados Sociais e Cards de Compartilhamento (Padrão KokoroSim)

O compartilhamento de links de repositórios em plataformas sociais e mensageiros (WhatsApp, Telegram, Twitter/X, Discord, LinkedIn, iMessage) exige blindagem técnica contra recortes arbitrários e truncamento de texto.

### 11.1 Dimensões e Formato do Banner Gráfico
* **Resolução Obrigatória:** Exatamente **1200 × 630 pixels** (proporção 1.91:1, formato PNG otimizado, RGB).
* **Localização Padrão:** `./site/assets/og_preview.png`.

### 11.2 Safe Zone 4:3 Centralizada (Anti-Recorte)
Plataformas móveis (notadamente o WhatsApp) costumam recortar o banner em **1:1 (quadrado)** ou em balões estreitos de chat. Para garantir legibilidade absoluta:
* **Miolo Central Útil:** Todo o conteúdo textual, logotipos, badges e selos **DEVE** estar contido dentro de um retângulo central com largura entre **720px e 840px** e altura de **500px**.
* **Sangrias Laterais de Segurança:** As faixas de **180px a 240px** em cada lateral **NÃO DEVEM** conter texto nem elementos essenciais, servindo unicamente para gradiente ou textura de fundo.
* **Margens Verticais:** Top padding mínimo de **52px** e Bottom padding mínimo de **85px** (para evitar que carimbos de hora, URLs de rodapé ou botões de sobreposição encubram a mensagem).

### 11.3 Limites Rígidos de Caracteres (Anti-Truncamento)
Para impedir que redes sociais apliquem elipses (`...`) decepando palavras:

1. **Meta Tag `<meta property="og:title">` e `twitter:title`:**
   - **Faixa Segura:** **50 a 65 caracteres** (limite absoluto: 70 caracteres).
2. **Meta Tag `<meta property="og:description">` e `twitter:description`:**
   - **Faixa Segura:** **120 a 155 caracteres** (limite absoluto: 160 caracteres).
   - Deve ser auto-contida e evitar redundância com o título.
3. **Badge Superior Impresso na Imagem:**
   - **Máximo:** **35 caracteres**, em caixa alta (ex: `OPEN SOURCE // RUST + WASM`).
4. **Título Principal na Imagem:**
   - **Máximo:** **35 a 45 caracteres** (distribuído em 1 ou 2 linhas nítidas, tipografia bold de alto contraste).
5. **Subtítulo / Linha de Apoio na Imagem:**
   - **Máximo:** **50 a 60 caracteres** em linha única.
6. **Rodapé Integrado na Imagem:**
   - Indicador de URL canônica limpa (`<repo>.2lp.in`) e termo de licença contidos na largura de 720px.

---

## 12. Arquitetura de Domínio e SOLID Pragmático

A longevidade, manutenibilidade e velocidade de evolução de um projeto dependem do desacoplamento estrito entre as regras centrais de negócio e os subsistemas voláteis de entrada/saída (I/O). O GOST adota uma abordagem de arquitetura hexagonal (Portas e Adaptadores) pragmática, orientada à hermeticidade e avessa a overengineering.

### 12.1 Desacoplamento de Domínio e DIP (Ports & Adapters)
1. **Inversão de Dependência (DIP):** Módulos centrais de alto nível (*Core / Domínio*) **NÃO DEVEM** depender de módulos de baixo nível (bancos de dados, frameworks web, bibliotecas de rede, filesystem, drivers de terminal). Ambos **DEVEM** depender de abstrações (interfaces ou traits).
2. **Direção Unidirecional de Dependências:** A dependência aponta invariavelmente para dentro. O Core **NUNCA DEVE** importar ou referenciar adaptadores de infraestrutura.
3. **Portas de Entrada (*Driving / Input Ports*):** Interfaces expostas pelo Core que definem os casos de uso do sistema (invocadas por controllers HTTP, comandos CLI, consumidores de fila).
4. **Portas de Saída (*Driven / Output Ports*):** Contratos (interfaces/traits) declarados pelo Core para suprir suas necessidades de comunicação externa (persistência, envio de eventos, relógio do sistema, clientes HTTP). Os adaptadores de infraestrutura implementam esses contratos.

### 12.2 Hermeticidade Absoluta e Testes em Memória
1. **Determinismo em Milissegundos:** A suíte de testes unitários do Core **DEVE** executar em isolamento absoluto de I/O, rodando em microssegundos ou milissegundos sem depender de sockets, containers, daemons externos ou arquivos em disco.
2. **Adoção Canônica de In-Memory Fakes:** Para satisfazer as Portas de Saída nos testes de domínio, o projeto **DEVE** priorizar o uso de **Adaptadores em Memória** (*In-Memory Fakes* ou *stubs* leves) em vez de bibliotecas pesadas de mock dinâmico.
3. **Repositórios em Memória:** Estruturas simples baseadas em arrays, listas ou mapas nativos da linguagem que simulam o armazenamento preservando a semântica da porta. Isso elimina complexidade de mocking frágil, facilita refatorações seguras e garante hermeticidade total.

### 12.3 Filosofia de Tipos Primitivos e Validação na Borda (*Parse, Don't Validate*)
1. **Princípio Anti-Bloat:** O GOST rejeita o excesso de cerimônia de *Value Objects* anêmicos (proliferação de classes invólucro vazias para cada string ou número básico sem comportamento real associado).
2. **Validação e Parse na Borda (*Edge Validation*):** Toda entrada de dados brutos (requisições HTTP, argumentos de linha de comando, mensagens de fila, payloads JSON) **DEVE** ser sanitizada, validada e tipada na borda do sistema (adaptadores de entrada, DTOs de request, validadores de borda).
3. **Primitivos Confiáveis no Core:** Uma vez que os dados ultrapassam a fronteira da borda e adentram o Core, este opera com tipos primitivos nativos da linguagem (`string`, `int`, `float`, `bool`, tuplas, structs transparentes) ou tipos agregados claros, confiando nos dados já parsed. Tipos dedicados são reservados para conceitos que realmente encerram invariantes complexas ou regras de negócio vivas.

### 12.4 Modelagem de Estados Finitos com Enums Nativos
1. **Proibição de Tipos Fracos para Estado:** É estritamente **PROIBIDO** o uso de strings soltas (*stringly-typed*) ou inteiros arbitrários para representar estados de processos, status de ciclo de vida ou categorias fixas.
2. **Enums Nativos da Linguagem:** Estados de entidades e máquinas de estado finitas **DEVEM** ser expressos através de `enum` nativo da linguagem (ex: *backed enums* em PHP 8.1+, `enum` em Rust).
3. **Coesão Comportamental:** Métodos de verificação de transições válidas, predicados e propriedades derivadas **DEVEM** ser encapsulados no próprio enum ou no modelo de domínio, permitindo verificação estática de exaustividade em tempo de compilação ou análise estática (Zero Warnings).

### 12.5 Princípio de Gradação Arquitetural para Ferramentas e Serviços
A estrutura arquitetural do repositório **DEVE** ser proporcional à sua responsabilidade:
1. **Micro-ferramentas e Scripts Únicos:** Utilitários de CLI de escopo restrito ou filtros de terminal **NÃO DEVEM** adotar camadas excessivas de indireção. Devem manter estrutura modular direta (ex: arquivo único ou módulo único contendo funções puras e ponto de entrada).
2. **Aplicações e Serviços:** Sistemas com regras de domínio ricas, múltiplos casos de uso ou múltiplos adaptadores de transporte **DEVEM** implementar a segregação estrita entre Core (Domínio/Aplicação) e Infraestrutura (Adaptadores/Configuração).

---

## 13. Aderência a Padrões de Sistema e Operação (XDG, 12-Factor & OCI)

A integridade e interoperabilidade do software exigem conformidade com convenções maduras do ecossistema Unix/Linux e da computação em nuvem moderna.

### 13.1 Diretórios e Sistema de Arquivos (XDG Base Directory)
Todo software em conformidade com o GOST que manipule configurações, dados persistentes, caches ou sockets em disco **DEVE** seguir a especificação [XDG Base Directory](https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html).
* **Proibição de Poluição da `$HOME`:** É estritamente proibido criar arquivos e diretórios ocultos soltos na raiz de `$HOME` (ex: `~/.app` ou `~/.app_history`).
* **Mapeamento de Variáveis e Fallbacks Canônicos:** Caso a variável de ambiente não esteja definida ou esteja em branco, o software **DEVE** aplicar obrigatoriamente os seguintes caminhos padrão:
  - **Configurações:** `$XDG_CONFIG_HOME` ➔ Fallback: `~/.config/<app>/`
  - **Dados Persistentes:** `$XDG_DATA_HOME` ➔ Fallback: `~/.local/share/<app>/`
  - **Estado Dinâmico & Histórico:** `$XDG_STATE_HOME` ➔ Fallback: `~/.local/state/<app>/`
  - **Cache Volátil:** `$XDG_CACHE_HOME` ➔ Fallback: `~/.cache/<app>/`
  - **Sockets e IPC em Runtime:** `$XDG_RUNTIME_DIR` ➔ Fallback: `/run/user/$UID/<app>/` (ou `/tmp/<app>-$UID/` com permissão restrita).
* **Permissões de Segurança:** Diretórios e arquivos contendo credenciais, tokens ou certificados sob o padrão XDG **DEVEM** ser criados com permissões restritas de acesso (`chmod 0700` para diretórios e `chmod 0600` para arquivos).

### 13.2 Precedência de Configuração e Formato de Parâmetros
O software **DEVE** resolver parâmetros operacionais seguindo a seguinte hierarquia estrita de precedência (da **maior** para a **menor** prioridade):
1. **Flags de Linha de Comando (CLI):** Parâmetros passados explicitamente na chamada (`--port 8080`).
2. **Variáveis de Ambiente do Processo:** Variáveis exportadas no shell ou container (`APP_PORT=8080`).
3. **Arquivo `.env` Local:** Arquivo de conveniência no diretório atual de execução (*cwd*).
4. **Configuração Local do Projeto:** Arquivos de projeto no repositório (`./config.env` ou `./.apprc`).
5. **Configuração de Usuário no XDG:** `$XDG_CONFIG_HOME/<app>/config.env`.
6. **Configuração Global do Sistema:** `/etc/<app>/config.env`.
7. **Defaults Embutidos no Binário:** Valores padrão seguros compilados internamente.

* **Formato de Configuração Plano (`CHAVE=VALOR`):** Para garantir interoperabilidade direta com scripts POSIX Shell sem dependências pesadas de compilação ou parsing (anti-bloat), arquivos de configuração editáveis **DEVEM** adotar formato de pares chave-valor compatíveis com Shell (`KEY="value"`). Para metadados hierárquicos complexos que ultrapassem chave-valor simples, o formato canônico é o **JSON**.

### 13.3 Filosofia Universal Twelve-Factor (12-Factor)
O manifesto [Twelve-Factor App](https://12factor.net/) **DEVE** orientar o design não apenas de microsserviços web, mas universalmente de qualquer serviço, daemon, bot ou ferramenta de linha de comando:
1. **I. Codebase Único:** Rastreado em controle de versão com histórico rastreável via tickets (Seção 5).
2. **II. Dependências Explícitas:** Declaradas em manifestos e congeladas em arquivos de lock (`Cargo.lock`, `composer.lock`), sem dependências implícitas do sistema hospedeiro.
3. **III. Configurações no Ambiente:** Toda configuração que varie entre execuções ou ambientes (dev, test, prod) reside estritamente em variáveis de ambiente.
4. **IV. Backing Services como Recursos Anexados:** Bancos de dados, filas e serviços de terceiros são vinculados por endereços/URLs configuráveis via ambiente.
5. **V. Segregação de Build, Release, Run:** O processo de compilação produz artefato imutável; a execução apenas injeta o ambiente.
6. **VI. Processos Stateless:** O processo pode ser encerrado ou replicado a qualquer momento; estado persistente reside em backing services ou no caminho XDG correto.
7. **VII. Port & Socket Binding:** A aplicação provê serviços conectando-se diretamente a portas TCP ou a Unix Domain Sockets locais.
8. **VIII. Concorrência via Modelo de Processos:** Escala através da multiplicação de processos independentes.
9. **IX. Descartabilidade (*Disposability*):** Inicialização instantânea e encerramento gracioso reagindo a `SIGTERM` e `SIGINT`.
10. **X. Paridade Dev/Prod:** Minimização de divergências entre ambiente local e produção (validada via gate de pre-push com `act`).
11. **XI. Logs como Fluxos de Eventos (*Event Streams*):** O software **NUNCA** gerencia ou rotaciona arquivos de log internamente. Ele escreve eventos contínuos em `stdout`/`stderr` e delega a coleta ao ambiente (systemd journal, docker logging).
12. **XII. Processos de Administração Pontuais:** Migrações e tarefas de manutenção rodam como processos pontuais efêmeros.

### 13.4 Disciplina de Streams Unix, Sinais POSIX e `NO_COLOR`
1. **Segregação de Streams:**
   - `stdout` é reservado **exclusivamente para a saída de dados útil** (payloads puros para encadeamento em pipes `|`).
   - `stderr` **DEVE** concentrar todos os logs, avisos, spinners interativos de progresso e mensagens de erro.
2. **Aderência ao Padrão `NO_COLOR`:** O software **DEVE** aderir à especificação [no-color.org](https://no-color.org/). Se a variável de ambiente `NO_COLOR` estiver presente (com qualquer valor), todas as sequências de escape ANSI de cores **DEVEM** ser desativadas.
3. **Detecção Automática de TTY:** Quando `stdout` ou `stderr` não estiverem conectados a um terminal interativo (`!isatty()`), cores, animações e spinners interativos devem ser desabilitados automaticamente, prevenindo poluição em logs de automação e pipelines CI.
4. **Tratamento de Sinais:** Daemons **DEVEM** interceptar `SIGINT` e `SIGTERM` para graceful shutdown (finalizando transações e destruindo sockets/locks) e `SIGHUP` para recarregar arquivos de configuração em tempo de execução.
5. **Códigos de Saída (Exit Codes):** `0` para sucesso; `1` para falhas gerais; `2` ou `64` (`EX_USAGE`) para erros de argumentos de CLI; `130` quando interrompido por `SIGINT` (Ctrl+C).

### 13.5 Protocolos de Rede, Criptografia e Transporte
1. **Banimento de Protocolos Obsoletos:** É estritamente **PROIBIDO** o uso ou suporte a SSLv2, SSLv3, TLS 1.0 e TLS 1.1 (conforme RFC 8996). O piso aceito é **TLS 1.2**, com padrão mandatório em **TLS 1.3**.
2. **Hierarquia de Transporte:** Comunicações de rede e APIs web **DEVEM** priorizar a pilha moderna: **QUIC / HTTP/3** > **HTTP/2 (Multiplexado sobre TLS 1.3)** > **HTTP/1.1**.
3. **Unix Domain Sockets para IPC Local:** Serviços e daemons comunicando-se na mesma máquina **DEVEM** priorizar **UNIX Domain Sockets** em vez de binds em loopback TCP `127.0.0.1`, reduzindo latência de rede e aplicando controle de acesso nativo baseado no UID/GID do processo chamador.

### 13.6 Padrões Normativos para Docker e OCI Containers
Projetos que distribuem imagens ou executam via containers OCI **DEVEM** satisfazer:
1. **Multi-Stage Builds:** Todo `Dockerfile` **DEVE** separar explicitamente a etapa de compilação/build da imagem final de distribuição.
2. **Imagens Finais Mínimas:** Imagens de runtime **NÃO DEVEM** conter compiladores, headers ou utilitários dispensáveis. Binários compilados (Rust/Go) devem utilizar bases `scratch` ou `distroless`; stacks interpretadas (PHP) devem utilizar `alpine` ou `debian-slim`.
3. **Execução Obrigatória Sem Root (*Non-Root User*):** É proibido executar o serviço como `root`. O `Dockerfile` **DEVE** declarar explicitamente um usuário não privilegiado (`USER 1000:1000`, `USER app` ou `USER nobody`) antes do ponto de entrada.
4. **Banimento da Tag `:latest`:** Imagens base **DEVEM** fixar versões imutáveis semânticas (ex: `debian:bookworm-slim`, `rust:1.80-alpine3.20`), prevenindo quebras silenciosas por mutação externa de tags.
5. **Arquivo `.dockerignore`:** Presente na raiz, bloqueando a cópia acidental de `.git`, `.env*`, credenciais locais, caches e diretórios de build para as camadas da imagem.
6. **Gerenciamento de PID 1:** Aplicações em container devem utilizar gerenciadores de init leves (ex: `tini` ou flag `--init`) caso o processo não trate diretamente sinais de encerramento do kernel.
7. **Padrão `compose.yaml`:** A orquestração local para múltiplos serviços deve adotar o nome canônico aberto `compose.yaml` (especificação aberta do Compose).

### 13.7 Autenticação Single-User com Chave de API
Para microsserviços, APIs e daemons sob operação de usuário único:
1. **Esquema de Autorização:** A autenticação HTTP **DEVE** aceitar o cabeçalho `Authorization: Bearer <CHAVE>` (com suporte a `X-Api-Key: <CHAVE>` para flexibilidade).
2. **Injeção de Credenciais e Padrão `_FILE`:** A chave deve ser lida a partir de variável de ambiente (`<APP>_API_KEY`) ou via arquivo através do sufixo `_FILE` (`<APP>_API_KEY_FILE=/run/secrets/key`), garantindo suporte nativo a Docker e Systemd Secrets.
3. **Comparação Timing-Safe:** A verificação da chave de API em memória **DEVE** utilizar comparação em tempo constante (`hash_equals` em PHP, `subtle::ConstantTimeEq` em Rust), blindando contra ataques de temporização (*timing attacks*).

---

## 14. Perfis de Implementação (*Profiles*)

Esta norma GOST estabelece requisitos agnósticos a fornecedores e tecnologias. Ambientes específicos (organizações, indivíduos ou ecossistemas) **DEVEM** declarar suas escolhas concretas de infraestrutura em documentos de perfil desacoplados da norma raiz, referenciados através de `GOST_PROFILE_URL` no arquivo `GOSTVER` e baseados no modelo canônico disponível em `profiles/template.md`.

Um perfil de implementação define:
- Qual forja de código hospeda os repositórios (Codeberg, GitHub, GitLab, Forgejo auto-hospedado, etc.).
- Qual infraestrutura serve o portal de documentação e sites públicos (Cloudflare Workers, Pages, Nginx, etc.).
- Quais ferramentas e CLI gerenciam versionamento, tickets e hooks (ex: `cccp`).
- Quais frameworks e utilitários executam a suíte de testes, medem cobertura/mutação e aplicam linters com Zero Warnings.
- Como são gerados e validados os banners com Safe Zone 4:3 e os pacotes de internacionalização.
- Onde se localiza o catálogo central de descoberta de projetos.





