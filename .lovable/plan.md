

## Plano: Trocas em Cadeia + Equilíbrio Obrigatório de Distribuição

### Problema atual

O gerador tenta alocar demandas na ordem sábado → domingo → semana. Quando um domingo fica sem corretor (todos bloqueados por sábado, consecutivos, etc.), o sistema desiste. Ele não considera que poderia **reatribuir** um sábado de um corretor A para um corretor B (disponível no sábado), liberando A para o domingo.

Além disso, a distribuição permite que corretores cheguem a 3 externos enquanto outros ficam com 0-1, sem tentar redistribuir via trocas.

### Solução: Duas novas etapas no gerador

#### Etapa nova 1: Chain Swap para demandas não alocadas (após etapa 8.8, antes da 8.9)

```text
Para cada demanda não alocada (ex: Setai domingo):
  1. Listar corretores elegíveis bloqueados e o MOTIVO do bloqueio
  2. Para cada corretor bloqueado por "tem plantão no sábado" (Regra 9):
     a. Encontrar a alocação de sábado que bloqueia (ex: Leonardo no M. Ruy Carneiro sáb)
     b. Listar corretores alternativos para essa alocação de sábado:
        - Elegíveis para aquele local/turno
        - Disponíveis no sábado
        - Sem conflito de domingo
        - Sem plantão externo no sábado
     c. Se encontrar alternativa (ex: Daniela):
        → Trocar: Leonardo sáb M.Ruy → Daniela sáb M.Ruy
        → Alocar: Leonardo dom Setai
        → Log: "CHAIN SWAP: Leonardo liberado para Setai domingo"
  3. Aplicar mesma lógica para bloqueios por consecutivos:
     - Se broker está bloqueado por ter externo na sexta,
       tentar mover o externo da sexta para outro broker
```

#### Etapa nova 2: Rebalanceamento obrigatório via trocas (após etapa 9, antes da 8.10)

```text
Enquanto existir broker com 3+ externos E broker com 0-1 externos:
  Para cada broker "over" (3+ externos):
    Para cada alocação desse broker:
      Para cada broker "under" (0-1 externos):
        Se "under" é elegível para o local/turno dessa alocação
        E passa em todas as regras invioláveis:
          → Trocar: remover de "over", dar para "under"
          → Atualizar contadores
          → Break (próximo over)
```

### Arquivo afetado

**`src/lib/scheduleGenerator.ts`** — Adicionar duas funções:

1. `chainSwapForUnallocated(context, possibleDemands, allocatedDemands, internalLocIds)` — ~120 linhas
   - Chamada após `deConsecutivizeExternals` (etapa 8.8)
   - Para cada demanda pendente, tenta cadeia de trocas
   - Suporta trocas sáb↔dom e trocas por consecutivos

2. `rebalanceDistributionViaSwaps(context, possibleDemands, allocatedDemands)` — ~80 linhas
   - Chamada após etapa 9 (último recurso), antes da 8.10 (internos seg-sex)
   - Itera até convergir ou limite de 20 trocas
   - Move alocações de brokers com 3+ para brokers com 0-1

### Integração no fluxo existente

```text
Etapa 8.8: deConsecutivizeExternals (existente)
    ↓
NOVA: chainSwapForUnallocated     ← tenta preencher demandas vazias via cadeia
    ↓
Etapa 8.9: Internos sábado (existente)
    ↓
Etapa 9: Último recurso (existente)
    ↓
NOVA: rebalanceDistributionViaSwaps  ← equilibra 3→1 via trocas
    ↓
Etapa 8.10: Internos seg-sex (existente)
    ↓
Etapa 8.11: Passe final conservador (existente)
```

### Regras respeitadas nas trocas

- Todas as regras invioláveis (construtora, local duplicado, hard cap 3, 3 consecutivos)
- Regra 9 (sáb/dom)
- Elegibilidade (broker deve estar configurado no local)
- Disponibilidade de dia/turno
- Consecutivos mantidos como preferência (só relaxa nos passes finais, como hoje)

