

# Plano: Corrigir bloqueio real de Andrea — Rule 8 hard na avaliação de elegibilidade

## Causa raiz REAL (não é target)

A remoção do `target = 1` foi necessária mas insuficiente. O problema persiste por causa de **Rule 8 aplicada como hard block nos checkpoints de elegibilidade**, criando um efeito cascata:

### O que acontece passo a passo:

1. **Passes 1-5**: Andrea recebe 1 externo (ex: quarta-feira). Para o 2º, as demandas restantes estão em dias adjacentes (terça/quinta) → bloqueada por Rule 8 (consecutivos). Outros corretores pegam essas demandas.

2. **ETAPA 8.6 (Rebalanceamento)**: Tenta dar 2º a Andrea. Usa `checkTrulyInviolableRules` — Rule 8 é **HARD BLOCK**. Andrea continua com 1.

3. **ETAPA 8.8.1 (Chain Swap)**: Tenta trocar overloaded→Andrea. Usa `checkTrulyInviolableRules` — mesma coisa, Rule 8 hard. Não troca.

4. **ETAPA 9 — O PONTO CRÍTICO**:
   - `canAnyoneStillReachTwo` verifica se Andrea pode receber alguma demanda pendente
   - Usa `checkTrulyInviolableRules` (linha 864) — **Rule 8 HARD**
   - Todas as demandas elegíveis de Andrea são em dias consecutivos ao existente
   - Resultado: Andrea **NÃO** entra na lista `brokersUnderTwo`
   - Gate diz "ninguém under-two pode receber" → **GATE LIBERADO PREMATURAMENTE**
   - PASSO 3 permite 3º externo para outros corretores
   - Os outros pegam as demandas restantes OU ninguém consegue
   - **Andrea fica com 1 porque o sistema decidiu que ela não pode receber mais**

5. **ETAPA 8.11**: Chega tarde demais. As demandas foram preenchidas por outros ou são genuinamente impossíveis. As que sobram, Andrea teria condição de pegar COM Rule 8 relaxada (que é permitida nesta etapa), mas o dano já foi feito.

```text
Andrea: 1 ext (qua)
Demandas pendentes: ter-manhã, qui-tarde (adjacentes)

canAnyoneStillReachTwo:
  → Andrea elegível? checkTrulyInviolableRules → Rule 8 HARD → NÃO
  → brokersUnderTwo = [] → gate LIBERADO
  → Outros (2 ext) recebem 3º → demandas ALOCADAS A OUTROS
  → Andrea: ainda 1 ext
```

## Correção — 3 pontos cirúrgicos

### 1. `canAnyoneStillReachTwo` (linha 864): Usar Rule 8 relaxada

Mudar de:
```typescript
const check = checkTrulyInviolableRules(broker, demand, context);
```
Para:
```typescript
const check = checkTrulyInviolableRulesWithRelaxation(broker, demand, context, true);
```

Efeito: Andrea entra em `brokersUnderTwo` → gate fica ATIVO → ninguém recebe 3º → PASSO 2 aloca Andrea com Rule 8 relaxada.

### 2. ETAPA 8.6 Rebalanceamento (linha 3357): Relaxar Rule 8 para under-two

Mudar de:
```typescript
const check = checkTrulyInviolableRules(underBroker, demand, context);
```
Para:
```typescript
const check = checkTrulyInviolableRulesWithRelaxation(underBroker, demand, context, true);
```

Efeito: Andrea pode receber 2º externo mesmo em dia consecutivo já no rebalanceamento, antes da ETAPA 9.

### 3. ETAPA 8.8.1 Chain Swap (linha 3442): Relaxar Rule 8 para under-two

Mudar de:
```typescript
const check = checkTrulyInviolableRules(underBroker, demandForCheck, context);
```
Para:
```typescript
const check = checkTrulyInviolableRulesWithRelaxation(underBroker, demandForCheck, context, true);
```

Efeito: Chain Swap pode transferir um externo de overloaded para Andrea mesmo criando consecutivo.

## Regras preservadas

- 3 dias externos consecutivos: ABSOLUTO (verificado dentro de `checkTrulyInviolableRulesWithRelaxation`)
- Rule 4 (dois locais externos/dia): ABSOLUTO
- Rule 5 (dois turnos mesmo local): ABSOLUTO
- Rule 6 (construtora): ABSOLUTO
- Rule 9 (sáb OU dom): ABSOLUTO
- Hard cap 3: ABSOLUTO
- Proteção Bessa: mantida

A única regra relaxada é Rule 8 (2 dias consecutivos), e SOMENTE para corretores com menos de 2 externos. Isso é o mínimo necessário para que Andrea (e qualquer corretor sub-alocado) receba sua segunda alocação.

