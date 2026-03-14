

## Correção: Exibição de períodos e status na tabela de férias

### Bugs identificados

**Bug 1 — Coluna "Períodos" não mostra Q2 quando só Q1 é flexível**

Quando `gozo_flexivel=true` e `distribuicao_tipo="1"` (só o 1º período foi dividido em sub-períodos), o código na linha 492-514 de `FeriasFerias.tsx` exibe SOMENTE os sub-períodos de `ferias_gozo_periodos`. Ele ignora completamente o 2º período oficial (`quinzena2_inicio/fim`), que continua válido para o gozo. Resultado: o Q2 desaparece da tabela.

Causa raiz: a lógica é um `if/else` exclusivo — se `gozo_flexivel`, mostra só gozo_periodos; senão mostra oficial. Deveria ser: mostrar gozo_periodos + Q2 oficial quando não há sub-períodos com `referencia_periodo=2`.

**Bug 2 — `referencia_periodo` não é carregado na query**

A query de `ferias_gozo_periodos` (linha 201) não inclui `referencia_periodo` no SELECT, impossibilitando distinguir quais sub-períodos são do Q1 vs Q2 na exibição.

**Bug 3 — Status "em_gozo_q1" possivelmente prematuro**

A função `atualizar_status_ferias` no banco compara `CURRENT_DATE >= data_inicio` do gozo. Se os sub-períodos têm `referencia_periodo` corretamente setado como 1, e o MIN é 18/03, com hoje sendo 14/03, o status NÃO deveria ter transitado. Porém, o campo `distribuicao_tipo` salvo como `"1"` (string) e `referencia_periodo` como `1` (integer) devem estar consistentes. Isso pode indicar que `referencia_periodo` está sendo salvo como NULL (o que faria o fallback usar `quinzena1_inicio` oficial que pode ser anterior a hoje). Preciso verificar o save.

Olhando o save (linha 841): `referencia_periodo: p.referencia_periodo || null` — se `p.referencia_periodo` for `0` ou `undefined`, vira NULL. Isso causa o bug de status, pois a função SQL usa `WHERE referencia_periodo = 1` que retorna NULL, e o COALESCE cai no segundo subquery (sem filtro) que também retorna 18/03... então deveria funcionar. A não ser que o `quinzena1_inicio` oficial seja anterior a hoje.

**Ação sobre o status**: O bug de status provavelmente ocorre porque a data oficial `quinzena1_inicio` é anterior a 14/03. A função SQL tem fallback para `f.quinzena1_inicio` apenas se TODAS as subqueries retornarem NULL (sem sub-períodos). Se há sub-períodos, usa o MIN deles. Vou garantir que o `referencia_periodo` é sempre salvo corretamente e documentar. Se o status ainda estiver errado, será um problema nos dados (data oficial incorreta).

### Mudanças

| # | Arquivo | O que muda |
|---|---------|-----------|
| 1 | `src/pages/ferias/FeriasFerias.tsx` | Adicionar `referencia_periodo` na interface `GozoPeriodo` e no SELECT da query. Corrigir a coluna "Períodos" para: quando `gozo_flexivel`, mostrar sub-períodos flexíveis E também o Q2 oficial se não houver sub-períodos com `referencia_periodo=2`. |
| 2 | `src/components/ferias/ferias/FeriasViewDialog.tsx` | Mesma correção: se `gozo_flexivel` mas não há sub-períodos para Q2, mostrar Q2 oficial no bloco de gozo. |
| 3 | `src/components/ferias/ferias/FeriasDialog.tsx` | Garantir que `referencia_periodo` nunca seja NULL — usar `p.referencia_periodo ?? 1` no save (em vez de `|| null`). |

### Detalhe da correção da coluna Períodos

```typescript
// Atual (bug): só mostra gozo_periodos, ignora Q2 oficial
if (f.gozo_flexivel && gozoPeriodosByFeriasId[f.id]?.length) {
  // só sub-períodos
}

// Corrigido: mostra sub-períodos + Q2 oficial se não coberto
if (f.gozo_flexivel && gozoPeriodosByFeriasId[f.id]?.length) {
  const periods = gozoPeriodosByFeriasId[f.id];
  const hasQ2Flex = periods.some(p => p.referencia_periodo === 2);
  return (
    <>
      {periods.map(p => <div>...</div>)}
      {!hasQ2Flex && f.quinzena2_inicio && f.quinzena2_fim && (
        <div>{formatPeriodo(f.quinzena2_inicio, f.quinzena2_fim)}</div>
      )}
    </>
  );
}
```

