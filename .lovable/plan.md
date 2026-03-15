

## Diagnóstico: Por que Andrea fica com 1 externo enquanto outros têm 3

Identifiquei **3 bloqueios combinados** no gerador que estrangulam corretores que trabalham sábado (como a Andrea):

### Bloqueio 1 — REGRA 10 (linha 1063-1075 de `scheduleGenerator.ts`)
```text
Se trabalha sábado (interno OU externo) → máximo 1 externo na semana
```
Isso é aplicado em `checkAbsoluteRules()` E novamente em `findBrokerForDemand()` (linha 1988-2002). É o bloqueio principal.

### Bloqueio 2 — Sexta proibida (linha 2008-2018)
```text
Se trabalha sábado → não pode externo na sexta (evitar consecutivo)
```
Isso elimina mais um dia de possibilidade.

### Bloqueio 3 — Domingo proibido (linha 1972-1982)
```text
Se reservada para sábado interno → bloqueada no domingo (Regra 9)
```

**Resultado combinado**: Andrea, por ser selecionada para sábado interno, fica limitada a 1 externo (seg-qui apenas), enquanto quem não pega sábado recebe 2 ou 3 externos livremente.

### Sem rebalanceamento efetivo
A etapa 8.6 (linha 3267) tenta rebalancear, mas só aloca demandas **não alocadas** para quem tem <2. Se todas as demandas já foram alocadas para outros corretores, não há swap — o rebalanceamento é inerte.

---

## Plano de Correção

### 1. Permitir até 2 externos para quem trabalha sábado
**Arquivo**: `src/lib/scheduleGenerator.ts`

- **REGRA 10 em `checkAbsoluteRules`** (linhas 1063-1075): Mudar limite de `>= 1` para `>= 2`
- **REGRA 10 em `findBrokerForDemand`** (linhas 1988-2002): Mesmo ajuste — `broker.externalShiftCount >= 2` ao invés de `>= 1`
- **Bloco de sexta** (linhas 2008-2018): Transformar em preferência (não bloqueio absoluto). Se o corretor tem 0 externos, permitir sexta mesmo com sábado. Só bloquear se já tem 1+ externo E a sexta criaria consecutivo real.

### 2. Adicionar rebalanceamento ativo por swap (Chain Swap)
**Arquivo**: `src/lib/scheduleGenerator.ts`

Após a etapa 8.8 (de-consecutivização) e antes do último recurso, adicionar uma etapa de **rebalanceamento por swap**:
- Identificar corretores com 3+ externos e corretores com <2 externos
- Para cada plantão de quem tem 3, tentar trocar com quem tem <2 (se elegível para o mesmo local e sem violar regras invioláveis)
- Isso redistribui ativamente os plantões, em vez de apenas alocar demandas restantes

### 3. Corrigir cálculo de target para sábado
**Arquivo**: `src/lib/scheduleGenerator.ts` (linhas 2876-2888)

O target para quem trabalha sábado é fixado em 1. Mudar para 2 (mesmo critério de alternância dos outros corretores).

### Resumo de mudanças

| Local no código | Mudança |
|---|---|
| `checkAbsoluteRules` REGRA 10 (~l.1067) | `>= 1` → `>= 2` |
| `findBrokerForDemand` REGRA sábado (~l.1992) | `>= 1` → `>= 2` |
| Bloqueio de sexta (~l.2008) | Converter em preferência, não bloqueio |
| Target sábado (~l.2883) | `target = 1` → manter target original |
| Nova etapa rebalanceamento (~após l.3341) | Swap ativo: 3→2 para quem tem excesso, dando para quem tem <2 |

### Resultado esperado
- Andrea (e outros com sábado) poderão receber até 2 externos por semana
- O rebalanceamento ativo garantirá que ninguém fique com 3 enquanto alguém tem 1
- Todos os externos continuam alocados (cobertura total)
- Desequilíbrios são reportados como alertas (não bloqueiam salvamento)

