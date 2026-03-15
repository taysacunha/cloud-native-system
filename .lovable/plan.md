
Objetivo direto: manter as regras, mas mudar a prioridade para que quem trabalhou sábado na semana passada (ex.: Andrea) seja puxado para externos na semana seguinte quando houver demanda pendente, e com isso reduzir os 7 externos não alocados.

Plano

1) Corrigir o “sinal de compensação” (causa principal)
- Arquivo: `src/lib/scheduleGenerator.ts`
- Hoje o boost está ligado a `saturdayInternalWorkers` (semana atual), mas o seu caso é “trabalhou sábado na semana passada”.
- Vou criar um flag no broker da semana: `workedSaturdayLastWeek` (via `accumulator.previousWeekStats.saturday_count > 0`).
- Esse flag passa a dirigir prioridade/compensação dinâmica.

2) Compensação dinâmica por demanda (sem quebrar regra)
- Manter base de alternância normal (1/2), mas:
  - Se `workedSaturdayLastWeek` e corretor está com `<2`, ele ganha prioridade forte em externos de seg-sex.
  - Não força 3 automático; sobe para 3 apenas quando necessário para cobertura (como você pediu: dinâmico por demanda).
- Continua “salvar com alerta” para excesso (não hard block).

3) Unificar o motor de elegibilidade (remover falso “pode chegar a 2”)
- Hoje o gate global usa checagem diferente da alocação real.
- Vou extrair uma função única de elegibilidade real e usar em:
  - `findBrokerForDemand`
  - `canAnyoneStillReachTwo`
  - chain swap
- Isso evita travar 3º externo por “possibilidade fantasma” e deixar demanda sem alocação.

4) Ajustar ordem das etapas para priorizar externo de verdade
- Hoje internos seg-sex entram antes do último passe externo.
- Vou mover o passe final de externos para acontecer antes de completar internos seg-sex.
- Resultado esperado: interno não “rouba” slot de corretor/turno enquanto ainda há externo pendente.

5) Prioridade de ordenação alinhada ao seu cenário
- No sort de candidatos (seg-sex), prioridade:
  1. `workedSaturdayLastWeek && externalShiftCount < 2`
  2. menor `externalShiftCount`
  3. critérios atuais (escassez/FIFO/local)
- Isso puxa Andrea antes, sem remover regras.

6) Diagnóstico explícito para casos como Andrea + 7 pendências
- Adicionar logs objetivos por corretor/demanda:
  - “por que Andrea não foi escolhida”
  - “por que cada demanda ficou pendente no final”
- Isso evita nova rodada de tentativa-cega e permite validar a causa real em minutos.

7) Preservações confirmadas (não vou mexer)
- “Nunca permitir” mesmo corretor manhã+tarde no mesmo local externo (conforme sua resposta).
- Regras invioláveis continuam invioláveis.
- Ajuste é de prioridade, ordem de execução e coerência do gate.

Detalhes técnicos (resumo)
- Arquivo principal: `src/lib/scheduleGenerator.ts`
- Mudanças centrais:
  - novo atributo no `BrokerQueueItem`: `workedSaturdayLastWeek`
  - refactor de elegibilidade para helper único
  - refactor de ordem ETAPA 8.11 vs 8.10
  - ajuste de sort em `findBrokerForDemand`
  - ajuste de target/credit dinâmico por demanda pendente
- Critério de aceite:
  - Andrea deixa de ficar “presa em 1” quando houver demanda e elegibilidade real.
  - Redução material dos externos não alocados.
  - Quando houver extrapolação de equilíbrio, sair como warning (não bloquear salvamento).
