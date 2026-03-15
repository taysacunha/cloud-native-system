
Plano objetivo: parar de “supor” e transformar o problema em diagnóstico baseado nos dados reais da geração.

1. O que o código mostra hoje
- O sistema salva a validação final em `schedule_validation_results`, mas não salva o rastro real de decisão por demanda/corretor.
- O que existe salvo é `summary`, `violations`, `broker_reports` e `unallocated_demands` (`src/integrations/supabase/types.ts:2628+`).
- As justificativas de plantão não alocado são reconstruídas depois, no fim da geração, com `findBrokerForDemand(... pass 10, collectBlockedBrokers=true)` (`src/lib/scheduleGenerator.ts:4450+`). Isso não é o histórico real do momento em que Andrea foi descartada; é uma reavaliação tardia.
- Por isso o sistema acabou caindo em hipótese. O dado que responde “por que Andrea ficou com 1” simplesmente não está sendo persistido hoje.

2. O bug técnico que ainda ficou aberto
- Ainda existem caminhos antigos usando regra dura:
  - `canExceedLimit()` usa `checkTrulyInviolableRules()` antigo (`src/lib/scheduleGenerator.ts:799-818`).
  - A análise/lookahead também usa o helper antigo (`src/lib/scheduleGenerator.ts:1641-1643`).
  - `checkInviolableRules()` ainda mantém Regra 8 como absoluta (`src/lib/scheduleGenerator.ts:882-950`), o que mantém comportamento dividido no arquivo.
- Resultado: mesmo com partes do fluxo relaxadas, outras continuam decidindo como se consecutivo fosse bloqueio absoluto, abrindo gate/reserva/troca de forma errada e podendo deixar Andrea em 1 com externos sobrando.

3. Solução correta para o que você pediu
- Não vou atacar “Andrea” no escuro.
- Vou corrigir o motor e, junto, fazer o sistema provar com dados por que cada plantão ficou vazio e por que cada corretor foi rejeitado.

4. Implementação proposta
- Unificar toda elegibilidade externa em um único helper de decisão.
  - Remover o comportamento duplicado entre `checkTrulyInviolableRules`, `checkInviolableRules`, `checkAbsoluteRules` e o helper relaxado.
  - Todo ponto de decisão passará pela mesma lógica, com modo explícito:
    - estrito
    - relaxado para corretor com `< 2` externos
- Corrigir os caminhos legados que ainda usam a lógica antiga:
  - `canExceedLimit()`
  - análise de gargalo/lookahead
  - qualquer reserva/swap/rebalance que ainda consulte helper antigo
- Persistir diagnóstico real por demanda não alocada no momento da geração:
  - data
  - local
  - turno
  - pass
  - lista de elegíveis
  - para cada elegível: regra que bloqueou, contagem de externos naquele momento, se Regra 8 foi relaxada ou não
- Salvar esse diagnóstico junto da validação da escala para consulta posterior.
- Expor na UI de validação um painel “Por que não alocou” com filtro por corretor.
  - Ex.: Andrea → quantas vezes foi barrada por Regra 8, Regra 9, conflito físico, construtora, etc.
- Adicionar um resumo automático por corretor subalocado:
  - “Andrea terminou com 1 externo”
  - “teve N oportunidades reais”
  - “foi barrada X vezes por A, Y por B”
  - “sobraram Z demandas em que ela era elegível / não era elegível”

5. Resultado esperado
- Parar a análise por suposição.
- Saber exatamente por que Andrea ficou com 1.
- Corrigir a causa real no motor, não no palpite.
- Ter prova persistida no sistema quando um externo ficar sem alocação.

6. Arquivos principais
- `src/lib/scheduleGenerator.ts` — unificação do motor e captura do trace real
- `src/pages/Schedules.tsx` — salvar/carregar o novo diagnóstico junto da validação
- `src/components/ValidationReportPanel.tsx` — mostrar o “porquê não alocou”
- `src/integrations/supabase/types.ts` / estrutura da tabela de validação — suportar o trace persistido

7. Resposta direta à sua pergunta
- O motivo de estar parecendo “baboseira” é simples: hoje o sistema não guarda o dado forense da decisão de alocação. Ele guarda o resultado final e depois reconstrói a explicação. Isso é insuficiente para um caso como o de Andrea.
- A solução certa é: eliminar os caminhos antigos do motor e passar a registrar o motivo real de bloqueio no instante da geração. Aí deixa de existir chute.
