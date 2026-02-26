# Memory: scheduling/bessa-weekday-coverage-protection
Updated: now

Para garantir que o Bessa nunca fique sem cobertura em dias de semana, o gerador de escalas implementa uma regra de proteção:

**Regra**: No máximo 2 dos 3 corretores do Bessa podem ter plantões externos no MESMO dia de semana. O terceiro corretor DEVE permanecer disponível para o Bessa.

**Implementação**:
1. `dailyBessaExternalCount: Map<string, number>` no `AllocationContext` rastreia quantos corretores do Bessa têm externos em cada dia
2. Na função `findBrokerForDemand`, se `dailyBessaExternalCount >= 2` para um dia, corretores do Bessa são bloqueados para externos nesse dia
3. O contador é incrementado em `allocateDemand` quando um corretor do Bessa é alocado para um externo

**Justificativa**: Corretores com externos frequentemente priorizam o externo e não comparecem ao interno. Se todos os 3 do Bessa tiverem externos, o local fica desguarnecido. Mantendo pelo menos 1 sem externo, garante-se a cobertura.
