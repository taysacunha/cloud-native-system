

## Problema Raiz: Alocação Greedy sem Controle de Nível

O sistema atual aloca demandas em passes 1-5 usando `findBrokerForDemand`, que ordena por `externalShiftCount` mas **não impede** que um corretor receba o 2º externo antes que todos tenham o 1º. A ordenação por "menos externos" ajuda, mas não garante porque:

1. Se o corretor com 0 externos não é elegível para aquele local específico, o sistema pula para um com 1+ e aloca
2. O rebalanceamento final tenta corrigir mas falha quando o "under" broker não é elegível para nenhuma alocação do "over" broker
3. Resultado: um corretor acumula 3-4 enquanto outro fica com 0-1

## Solução: Alocação por Níveis com Gate Obrigatório

Substituir os passes 1-5 por **passes por nível**, onde cada nível garante que TODOS os elegíveis atinjam aquele patamar antes de avançar:

```text
NÍVEL 1: Só brokers com 0 externos podem receber (todos ganham 1º)
    ↓ chain swaps para demandas pendentes
NÍVEL 2: Só brokers com ≤1 externo podem receber (todos ganham 2º)  
    ↓ chain swaps para demandas pendentes
NÍVEL 3: GATE → só se todos elegíveis já têm 2+
         Só brokers com ≤2 externos (todos ganham 3º)
    ↓ chain swaps
NÍVEL 4: GATE → só se todos elegíveis já têm 3+
         Só brokers com ≤3 externos (HARD CAP = 4)
```

### Alterações em `src/lib/scheduleGenerator.ts`

**1. Constante**: `MAX_EXTERNAL_SHIFTS_HARD_CAP` de 3 → 4

**2. Substituir passes 1-5** (linhas ~3647-3683) por loop de 4 níveis:

```text
for level = 1 to 4:
  // Gate para nível 3+: verificar se todos elegíveis já atingiram level-1
  if level >= 3:
    globalMin = min(externalShiftCount) entre brokers com locais externos
    if globalMin < level - 1:
      // Ainda tem gente abaixo → NÃO avançar para este nível
      // Rodar chain swaps extras tentando dar mais para quem está abaixo
      runExtraChainSwaps(level - 1)
      // Re-verificar
      if globalMin still < level - 1: skip este nível
      
  for each demand não alocada:
    findBrokerForDemand com maxAllowed = level
    // Só aceita broker com externalShiftCount < level
    
  // Entre níveis: chain swaps para cobrir gaps
  chainSwapForUnallocated()
```

**3. Parâmetro `maxAllowedExternals` em `findBrokerForDemand`**:
- Adicionar parâmetro que limita `broker.externalShiftCount < maxAllowedExternals`
- Bloquear qualquer broker acima do nível atual, independente de elegibilidade

**4. Rebalanceamento mais agressivo** (`rebalanceDistributionViaSwaps`):
- Rodar até `maxCount - minCount < 2` (já está)
- Quando swap direto falha, tentar **cadeia de 2 hops**: broker A(over) → broker B(intermediário) + broker B → broker C(under)
- Aumentar MAX_REBALANCE_SWAPS de 20 → 40

**5. Chain swaps extras entre níveis**:
- Após cada nível, se há demandas pendentes E brokers com < nível_atual que são elegíveis para alguma demanda, tentar chain swaps para liberá-los

### Fluxo Final

```text
Etapa 5 NOVA: Alocação por níveis
  Nível 1 → chain swaps → 
  Nível 2 → chain swaps → 
  Gate check → Nível 3 → chain swaps →
  Gate check → Nível 4

Etapa 8.6: Rebalanceamento (mantido, reforçado)
Etapa 8.8: De-consecutivização (mantida)
Etapa 8.8b: Chain swap final (mantido)
Etapa 8.9: Internos sábado
Etapa 9: Último recurso (simplificado — nível 4 já cobre)
Etapa 9b: Rebalanceamento obrigatório (mantido, com 2-hop chains)
Etapa 8.10: Internos seg-sex
Etapa 8.11: Passe final (mantido como safety net)
```

### Resultado Esperado

- Se há 8 corretores elegíveis e 20 demandas externas: cada um recebe ~2-3
- Ninguém recebe o 3º antes que todos tenham 2
- Ninguém recebe o 4º antes que todos tenham 3
- Chain swaps entre níveis maximizam cobertura em cada patamar

