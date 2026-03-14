

## Correção: Status por intervalo real (não MIN/MAX)

### O problema confirmado

A Taysa tem `gozo_flexivel = true` com 3 sub-períodos no Q1:
- Sub 1: 18/03 a 30/03
- Sub 2: 10/04 (1 dia)
- Sub 3: 24/04 (1 dia)
- Q2: período oficial separado

A função atual calcula `q1_start = MIN(data_inicio) = 18/03` e `q1_end = MAX(data_fim) = ~24/04`, tratando tudo como um bloco contínuo. Resultado: qualquer dia entre 18/03 e 24/04 mostra "em gozo", mesmo nos gaps (31/03–09/04, 11/04–23/04).

### Solução

Reescrever a função SQL para verificar se `CURRENT_DATE` cai **dentro de algum sub-período real**, não dentro do range MIN/MAX.

Lógica nova:
- `em_gozo_q1`: EXISTS sub-período ref=1 onde `CURRENT_DATE BETWEEN data_inicio AND data_fim`
- `em_gozo_q2`: EXISTS sub-período ref=2 onde `CURRENT_DATE BETWEEN data_inicio AND data_fim`
- `q1_concluida`: todos sub-períodos ref=1 terminaram, mas Q2 ainda não começou
- `concluida`: todos os períodos (Q1 + Q2) terminaram
- `aprovada`: nenhum período começou ainda (ou está num gap entre sub-períodos antes do último Q1)

Para férias **não flexíveis**, a lógica continua igual (range contínuo de gozo_diferente ou quinzena oficial).

### Arquivos

1. **`.lovable/deterministic_status_reconciliation.sql`** — Reescrever com lógica baseada em `EXISTS` nos sub-períodos reais
2. **`src/pages/ferias/FeriasFerias.tsx`** — Já ajustado (erro da RPC visível), sem alteração adicional

### Detalhes técnicos da função SQL

```text
Para gozo_flexivel = true:
  em_gozo_q1 = EXISTS(subperíodo ref=1 onde CURRENT_DATE BETWEEN inicio AND fim)
  em_gozo_q2 = EXISTS(subperíodo ref=2 onde CURRENT_DATE BETWEEN inicio AND fim)
  all_q1_done = CURRENT_DATE > MAX(data_fim) dos ref=1
  all_q2_done = CURRENT_DATE > MAX(data_fim) dos ref=2 (ou não tem Q2)
  
  Status final:
    em_gozo_q2 ativo       → 'em_gozo_q2'
    em_gozo_q1 ativo       → 'em_gozo_q1'
    all_q1_done AND all_q2_done → 'concluida'
    all_q1_done AND has_q2  → 'q1_concluida'
    all_q1_done AND !has_q2 → 'concluida'
    else                    → 'aprovada' (gap ou antes do início)
```

Para `gozo_flexivel = false`, mantém lógica de range contínuo (gozo_diferente ou quinzena oficial).

### Entrega

Um único arquivo SQL para executar no Supabase SQL Editor. Após execução, Taysa aparecerá como `Aprovada` até 17/03 e `Em Gozo - 1º Período` apenas nos dias 18–30/03, voltando para `Aprovada` no gap 31/03–09/04, etc.

