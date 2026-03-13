

## Status do plano anterior

### Concluído
1. **Migration SQL** criada em `.lovable/ferias_gozo_periodos_migration.sql` (tabela `ferias_gozo_periodos` + colunas `gozo_flexivel` e `distribuicao_tipo` em `ferias_ferias`)
2. **`ExcecaoPeriodosSection.tsx`** criado com UI completa (toggle vender/gozo_diferente, distribuição 1º/2º/Ambos/Livre, sub-períodos dinâmicos)
3. **`FeriasDialog.tsx`** reescrito — integra o `ExcecaoPeriodosSection`, mutation salva na tabela `ferias_gozo_periodos`

### Pendente (3 itens)

**A. Executar a migration no Supabase**
O arquivo SQL existe mas nunca foi executado. A tabela `ferias_gozo_periodos` e as colunas `gozo_flexivel`/`distribuicao_tipo` em `ferias_ferias` ainda não existem no banco. Sem isso, qualquer tentativa de salvar uma exceção flexível dará erro.

**B. Atualizar `FeriasViewDialog.tsx`**
Atualmente mostra apenas os campos fixos `gozo_quinzena1/2`. Precisa:
- Buscar `ferias_gozo_periodos` quando `gozo_flexivel = true`
- Exibir lista de sub-períodos agrupados por `referencia_periodo` (cards compactos com número, dias, início e fim)
- Manter retrocompatibilidade para férias antigas sem períodos flexíveis

**C. Atualizar `CalendarioFeriasTab.tsx`**
A função `getGozoDates` usa apenas os campos fixos. Precisa:
- Na query, incluir `gozo_flexivel` no select
- Quando `gozo_flexivel = true`, buscar sub-períodos de `ferias_gozo_periodos` e retornar todos os intervalos
- Atualizar o cálculo de `diasComFerias` para iterar sobre múltiplos sub-períodos

### Resumo de implementação

| Passo | Arquivo | Tipo |
|-------|---------|------|
| 1 | Migration SQL | Executar via tool de migração |
| 2 | `FeriasViewDialog.tsx` | Buscar e exibir sub-períodos flexíveis |
| 3 | `CalendarioFeriasTab.tsx` | Usar sub-períodos no cálculo de dias do calendário |

