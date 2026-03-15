

# Plano: Externos Acima de Tudo + Remover Bloqueio Fantasma de Domingo

## Diagnóstico definitivo

Identifiquei **3 causas raiz** que se reforçam mutuamente e que NÃO foram corrigidas nas tentativas anteriores:

### Causa 1: Bloqueio fantasma de domingo por pré-reserva
`findBrokerForDemand` (linhas 2019-2030) bloqueia corretores pré-reservados para sábado interno (`saturdayInternalWorkers`) de **QUALQUER demanda de domingo** — mesmo que a reserva de sábado seja feita ANTES de qualquer alocação real (linha 2817). Como passes 1-5 rodam antes da ETAPA 8.9 (alocação real do sábado), **2-3 corretores ficam bloqueados de domingo por nada**. Mesma lógica se aplica em `canAnyoneStillReachTwo` (linha 862) e `hasWeekendConflict` (linha 346).

### Causa 2: Gate global travado por elegibilidade fantasma
`canAnyoneStillReachTwo` (linha 860-862) conta corretores em `saturdayInternalWorkers` como "bloqueados" para demandas de sáb/dom, mas NÃO verifica se esses mesmos corretores poderiam pegar **demandas seg-sex** pendentes. Resultado: o gate diz "há broker under-two que pode receber" → trava 3º externo → mas esse broker NÃO pode receber as demandas restantes (são de dia/turno incompatível) → demandas ficam sem alocação.

### Causa 3: Após todas as etapas, sábado interno nunca é sacrificado
O usuário disse "externos acima de tudo", mas o código NUNCA remove uma alocação de sábado interno para liberar um corretor para uma demanda externa pendente. ETAPA 8.11 tenta alocar com as mesmas regras, e se não consegue, a demanda fica pendente.

## Mudanças (arquivo: `src/lib/scheduleGenerator.ts`)

### 1. Remover bloqueio de domingo baseado em pré-reserva

**`findBrokerForDemand`** (linhas 2019-2030): Remover completamente o bloco que faz `isSunday && context.saturdayInternalWorkers?.has(broker.brokerId)`. O bloqueio real será feito naturalmente por `checkAbsoluteRules` → `hasWeekendConflict` SOMENTE quando já existir alocação real no sábado (após ETAPA 8.9).

**`hasWeekendConflict`** (linhas 344-348): Remover a verificação de `saturdayInternalWorkers` para domingo. Manter APENAS a verificação de `assignments.some(...)`.

**`canAnyoneStillReachTwo`** (linhas 860-862): Remover o bloqueio `if (isSaturdayInternalWorker && (isSaturday || isSunday)) continue;`. Manter apenas a verificação de `checkTrulyInviolableRules` que usa alocações reais.

**`checkTrulyInviolableRulesWithRelaxation`** (linhas 748-766): A verificação de `hasWeekendConflict` aqui já usa `context.assignments` E `context.saturdayInternalWorkers`. Remover o parâmetro `saturdayInternalWorkers` para que só cheque alocações reais.

### 2. Manter bloqueio de sábado EXTERNO para pré-reservados (linhas 2006-2017)

Quem está reservado para sábado interno NÃO pode pegar sábado externo durante passes 1-3. A partir do pass 4, **permitir** se houver demanda pendente (relaxamento progressivo, priorizando externo).

### 3. Nova etapa: sacrificar sábado interno se necessário (após ETAPA 8.11)

Após ETAPA 8.11, se ainda houver demandas externas não alocadas:
1. Para cada demanda pendente, verificar se algum corretor elegível está alocado no sábado interno
2. Se sim e esse corretor pode pegar a demanda (regras invioláveis OK exceto fim de semana):
   - Remover a alocação de sábado interno do corretor
   - Alocar o corretor na demanda externa
   - Logar como `WARNING: INTERNO_COBERTURA_REDUZIDA`
3. Manter mínimo de 1 corretor por local interno no sábado (não esvaziar completamente)

### 4. Gate global: verificação REAL contra demandas específicas pendentes

Em `canAnyoneStillReachTwo`, após encontrar brokers under-two, verificar se cada um pode REALMENTE pegar pelo menos uma das `unallocatedDemands` passadas. Se nenhum under-two consegue pegar nenhuma demanda pendente, retornar `canReach: false` (liberar gate). O código atual já tenta isso parcialmente mas o bloqueio fantasma de `saturdayInternalWorkers` anula o efeito.

### 5. Passes 1-3: relaxar cap para compensação

Alterar `checkAbsoluteRules` (linha 979): usar `effectiveLimit = MAX_EXTERNAL_SHIFTS_HARD_CAP` a partir do pass **3** (não 4) para corretores com compensação. Isso dá mais chances antes do último recurso.

### 6. Diagnóstico final

Após ETAPA 8.11, se houver pendências, logar por demanda: top 3 brokers elegíveis e motivo exato do bloqueio. Logar por broker-chave (quem tem < 2 externos): quantas demandas era elegível e por que não pegou.

## Resumo da ordem final

```text
ETAPA 5:     Passes 1-5 (SEM bloqueio domingo por pré-reserva)
ETAPA 8.6:   Rebalanceamento
ETAPA 8.8:   Desconsecutivar + Chain Swap
ETAPA 8.9:   Sábado interno (alocação real → agora sim bloqueia domingo)
ETAPA 9:     Último recurso (gate corrigido)
ETAPA 8.11:  Passe final externo
ETAPA 8.11b: NOVA: Sacrificar sábado interno se necessário
ETAPA 8.10:  Internos seg-sex (ÚLTIMO)
```

## Regras preservadas
- Nunca mesmo corretor manhã+tarde no mesmo local externo
- Regra 8 (consecutivos) — relaxável nos passes finais
- Regra 6 (construtora)
- Regra 4 (dois locais externos no mesmo dia)
- Hard cap de 3 externos
- Proteção Bessa (max 2 com externos por dia)

