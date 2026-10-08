---
name: Ticket GOST (DD-TDD)
about: Abertura formal de ticket para o ciclo DD-TDD de 9 fases
title: "tipo(escopo): descrição concisa"
labels:
  - gost
---

## Description
<!-- Descreva o problema, a nova funcionalidade ou a necessidade de refatoração -->

## Expected Behavior & Acceptance Criteria
- [ ] Critério 1
- [ ] Critério 2

## Tasks / DD-TDD Checklist (9 Fases GOST)
- [ ] **Fase 1 - Ticket:** Issue formalizada e escopo delimitado
- [ ] **Fase 2 - Branch:** Branch `<tipo>/<id>-<slug>` criada a partir de develop/main
- [ ] **Fase 3 - Doc/Spec:** Contrato preliminar e especificação (Zero código de produção)
- [ ] **Fase 4 - Red:** Teste automatizado falho comprovando o requisito
- [ ] **Fase 5 - Green:** Implementação mínima funcional com teste passando
- [ ] **Fase 6 - Refactor:** Código limpo, idiomático e com Zero Warnings
- [ ] **Fase 7 - Mutation:** Mutantes críticos eliminados com asserções robustas
- [ ] **Fase 8 - Quality Gate:** Cobertura >= 90%, linter -D warnings e formatação validados
- [ ] **Fase 9 - Close:** Changelog e documentação atualizados; commit com `(closes #<id>)`
