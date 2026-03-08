

## Plano: Filtrar Materiais por Unidade na Solicitação

### Problema

Ao criar uma solicitação, o select de materiais mostra **todos** os materiais ativos do sistema, independentemente da unidade selecionada. Exemplo: o Bessa não tem nenhum material cadastrado, mas aparece "Resma A4" que só existe em Tambaú.

### Solução

Buscar os materiais que possuem saldo (`estoque_saldos`) em locais (`estoque_locais_armazenamento`) da unidade selecionada. Quando o usuário seleciona a unidade (ou ela é auto-preenchida), o select de materiais mostra apenas os que existem naquela unidade.

### Alterações em `EstoqueSolicitacoes.tsx`

1. **Buscar saldos + locais** para identificar quais materiais existem na unidade selecionada
   - Query: `estoque_saldos` JOIN com `estoque_locais_armazenamento` filtrando por `unidade_id` e `quantidade > 0`
   - Extrair lista de `material_id` únicos

2. **Filtrar o select de materiais** usando essa lista
   - Se nenhuma unidade selecionada: select vazio
   - Se unidade selecionada mas sem materiais: mensagem informativa "Nenhum material disponível nesta unidade"

3. **Limpar itens ao trocar unidade** — quando o usuário muda a unidade, resetar os itens selecionados (pois os materiais mudam)

4. **Query reativa** — a query de materiais disponíveis depende do `unidadeId` selecionado, usando `enabled: !!unidadeId`

### Fluxo da lógica

```text
Usuário seleciona Unidade "Bessa"
  → Query: locais dessa unidade → saldos nesses locais → material_ids com quantidade > 0
  → Select de materiais mostra apenas esses
  → Se nenhum material: "Nenhum material disponível nesta unidade"
```

### Arquivo a alterar

| Arquivo | Alteração |
|---------|-----------|
| `EstoqueSolicitacoes.tsx` | Nova query de materiais por unidade, filtrar select, limpar itens ao trocar unidade |

