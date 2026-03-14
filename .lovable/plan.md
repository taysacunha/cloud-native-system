

## Corrigir verificação de conflitos para usar períodos reais de gozo

### Problema

O `checkConflicts` no `FeriasDialog.tsx` compara os **períodos oficiais** (`quinzena1_inicio/fim`, `quinzena2_inicio/fim`) das férias existentes. Porém, quando uma férias tem exceção (`gozo_flexivel=true` ou `gozo_diferente=true`), o colaborador **não estará ausente** nas datas oficiais — estará ausente nas datas reais de gozo (armazenadas em `ferias_gozo_periodos` ou nos campos `gozo_quinzena1/2_inicio/fim`).

Resultado: o sistema pode reportar conflito onde não existe (o gozo real é em outra data) ou não reportar conflito onde deveria (o gozo real sobrepõe mas o oficial não).

### Solução

Ao verificar conflitos, para cada férias existente, extrair os **intervalos reais de ausência** em vez dos períodos oficiais:

1. Se `gozo_flexivel = true` → buscar `ferias_gozo_periodos` e usar esses intervalos
2. Se `gozo_diferente = true` → usar `gozo_quinzena1_inicio/fim` e `gozo_quinzena2_inicio/fim`
3. Caso contrário → usar os períodos oficiais (comportamento atual)

Essa mesma lógica já existe no `CalendarioFeriasTab.tsx` (`getGozoIntervals`), então reutilizaremos o padrão.

### Mudanças

| # | Arquivo | O que muda |
|---|---------|-----------|
| 1 | `src/components/ferias/ferias/FeriasDialog.tsx` | Dentro de `checkConflicts`, após buscar `existingFerias`, buscar também `ferias_gozo_periodos` para as férias com `gozo_flexivel=true`. Para cada férias existente, extrair os intervalos reais de gozo (flexível → gozo_periodos, gozo_diferente → campos gozo_quinzena, padrão → quinzena oficial). Comparar overlap contra esses intervalos reais. Atualizar também a string `periodo` no conflito para mostrar as datas reais. |

### Detalhes da lógica

No loop `for (const ef of existingFerias)`, substituir a extração fixa de `efQ1Start/End` e `efQ2Start/End` por:

```typescript
// Extrair intervalos reais de ausência
let realIntervals: { start: Date; end: Date }[] = [];

if (ef.gozo_flexivel && gozoPeriodosMap[ef.id]?.length > 0) {
  // Usar sub-períodos flexíveis
  realIntervals = gozoPeriodosMap[ef.id].map(gp => ({
    start: parseISO(gp.data_inicio),
    end: parseISO(gp.data_fim),
  }));
} else if (ef.gozo_diferente && ef.gozo_quinzena1_inicio) {
  // Usar datas de gozo diferente (legacy)
  realIntervals.push({ start: parseISO(ef.gozo_quinzena1_inicio), end: parseISO(ef.gozo_quinzena1_fim) });
  if (ef.gozo_quinzena2_inicio) {
    realIntervals.push({ start: parseISO(ef.gozo_quinzena2_inicio), end: parseISO(ef.gozo_quinzena2_fim) });
  }
} else {
  // Padrão: períodos oficiais
  realIntervals.push({ start: efQ1Start, end: efQ1End });
  if (efQ2Start && efQ2End) realIntervals.push({ start: efQ2Start, end: efQ2End });
}
```

Depois verificar overlap do novo cadastro contra cada `realInterval`, e mostrar no campo `periodo` as datas reais.

A busca dos `ferias_gozo_periodos` será feita em batch (uma query com `.in("ferias_id", ids)`) para performance.

