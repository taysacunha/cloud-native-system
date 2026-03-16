
Objetivo: parar a regressão que aumentou os erros e alinhar 100% a lógica do gate/ETAPA 9 com a lógica real do fluxo principal de alocação.

O que encontrei no código atual
1. O helper novo `isBrokerTrulyEligibleForDemand()` não representa a elegibilidade real do motor.
   - Ele só aplica `checkAbsoluteRules()` + `checkTrulyInviolableRulesWithRelaxation()`.
   - Mas o fluxo principal em `findBrokerForDemand()` também aplica bloqueios extras antes/depois:
     - reserva obrigatória da demanda
     - bloqueio de sábado interno nos passes 1-3
     - sexta para quem trabalha sábado externo
     - sábado para quem já tem externo
     - proteção Bessa (semana e sábado)
   - Resultado: gate global e ETAPA 9 continuam tomando decisão com um critério diferente do motor principal.

2. A regressão explica o aumento de erros.
   - Depois da refatoração, ETAPA 9 passou a alocar usando esse helper incompleto em vários pontos.
   - Isso permite “pode no helper, não pode no motor real/validação”, gerando mais inconsistências e mais erros do que antes.

3. Há um bug direto na ETAPA 9 PASSO 1.
   - O comentário diz “só aceitar corretor com menos de 2”.
   - Mas o código bloqueia apenas `>= HARD_CAP`.
   - Na prática, o PASSO 1 pode entregar demanda para corretor com 2 externos, o que destrói a lógica de priorizar quem está abaixo da meta.

Plano de correção
1. Extrair uma única função de elegibilidade operacional real.
   - Essa função deve reproduzir exatamente a ordem e as regras usadas em `findBrokerForDemand()`.
   - Ela deve retornar `{ allowed, rule, reason }` para diagnóstico.

2. Substituir o uso do helper incompleto em todos os pontos críticos.
   - `canAnyoneStillReachTwo()`
   - `canExceedLimit()`
   - ETAPA 9 PASSO 2
   - compensação dinâmica
   - gate forçado
   - liberação para 3º externo
   - qualquer outro `allocateDemand()` fora do fluxo principal

3. Corrigir a ETAPA 9 PASSO 1 para aceitar somente brokers com `< 2`.
   - Hoje ela está permitindo brokers com 2 irem antes da hora.

4. Remover a duplicação parcial de regras espalhadas.
   - Hoje parte da regra está no helper, parte no gate, parte no `findBrokerForDemand()`.
   - Vou centralizar isso para evitar novas regressões.

5. Melhorar o log de causa real do bloqueio.
   - Quando o gate disser que alguém “ainda pode receber”, o log precisa usar exatamente a mesma função real.
   - Assim fica impossível o gate continuar preso por possibilidade falsa.

Arquivos envolvidos
- `src/lib/scheduleGenerator.ts`

Resultado esperado
- O gate global só ficará ativo quando existir corretor realmente alocável.
- A ETAPA 9 deixará de criar alocações inconsistentes.
- O PASSO 1 voltará a priorizar só quem está abaixo de 2 externos.
- A tendência é reduzir simultaneamente:
  - corretores subalocados
  - plantões externos não alocados
  - violações novas introduzidas pela própria emergência

Detalhes técnicos
- A correção certa não é “mais um patch no helper”.
- A correção certa é tornar `findBrokerForDemand()` e ETAPA 9 consumidores da mesma função de decisão operacional.
- Se isso não for feito, o sistema continuará com dois motores diferentes:
  - motor principal
  - motor de emergência/gate
- E é exatamente essa divergência que está produzindo regressão.
