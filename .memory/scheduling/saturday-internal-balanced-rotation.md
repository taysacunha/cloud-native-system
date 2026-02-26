# Memory: scheduling/saturday-internal-balanced-rotation
Updated: now

A alocação de sábados internos (Tambaú/Bessa) agora implementa um sistema de rotação balanceada para evitar que um corretor trabalhe todos os sábados do mês.

**Lógica de Ordenação**:
1. **PRIORIDADE 1**: Ordenar por `times_worked` (quem trabalhou MENOS sábados primeiro)
2. **PRIORIDADE 2**: Posição na fila FIFO (menor = mais tempo sem trabalhar)

**Atualização da Fila após Alocação**:
Após alocar um corretor para o sábado interno:
1. Incrementar `times_worked`
2. Atualizar `last_saturday_date`
3. Remover da posição atual e mover para o FINAL da fila
4. Recalcular `queue_position` de todos os itens (1-indexed)

**Resultado Esperado**:
Com 5 sábados e ~10 corretores elegíveis, a distribuição deve ser aproximadamente:
- Cada corretor trabalha ~1 sábado (alguns 0, outros 2 no máximo)
- Nenhum corretor deve trabalhar mais de `ceil(sábados/corretores)` sábados

**Diagnóstico**: O sistema loga a ordenação e as atualizações FIFO para rastreabilidade.
