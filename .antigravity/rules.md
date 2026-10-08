# Regras de Repositório GOST para Agentes de IA

1. **Inviolabilidade das 9 Fases do Ciclo DD-TDD:**
   Todo trabalho neste repositório DEVE seguir estritamente o ciclo de 9 fases:
   `Ticket (1) ➔ New Branch (2) ➔ Doc/Spec Contract (3) ➔ Red Failing Test (4) ➔ Green Implement (5) ➔ Refactor (6) ➔ Mutation Test (7) ➔ Quality Gate (8) ➔ Finish & Close (9)`.

2. **Zero Código sem Ticket e Spec:**
   - É TERMINANTEMENTE PROIBIDO alterar qualquer linha de código de produção sem antes existir um ticket aberto e a especificação preliminar de documentação/contrato.
   - Na Fase 3 (Doc/Spec), é estritamente proibido alterar código de produção. Apenas arquivos de documentação, esquemas e contratos são permitidos.

3. **Isolamento de Branches:**
   - Nunca comitar ou realizar alterações diretamente na branch `main` ou `develop`.
   - Sempre criar branch dedicada no padrão `<tipo>/<id>-<slug>` (ex: `feat/42-new-feature`, `fix/10-bug-fix`).

4. **Blindagem de Testes & Mutation Testing:**
   - O teste deve ser comprovado falhando (Fase 4) antes de qualquer código ser escrito.
   - Na Fase 7, é obrigatório executar testes de mutação e aniquilar mutantes sobreviventes antes de fechar o ticket.

5. **Padrão Estrito de Commits:**
   - Todo commit intermediário DEVE conter `(ref #<id>)`.
   - O commit final de encerramento da Fase 9 DEVE conter `(closes #<id>)`.
   - Nunca criar commits automaticamente sem autorização inequívoca do usuário humano.
