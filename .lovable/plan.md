

## Plano: Permitir Selecionar Múltiplas Unidades ao Adicionar Gestor

### Problema
Ao adicionar um gestor, o select de unidade só permite escolher **uma** unidade. O usuário quer poder selecionar uma, duas, ou todas as unidades disponíveis.

### Solução
Substituir o `Select` (single) de unidade no dialog "Novo Gestor" por **checkboxes** — uma para cada unidade ativa. Ao clicar "Cadastrar", o sistema insere um registro em `estoque_gestores` para cada unidade selecionada.

### Alterações em `EstoqueGestores.tsx`

1. **Estado do form**: Mudar `form.unidade_id` (string) para `form.unidade_ids` (string[])
2. **UI do dialog**: Trocar o `Select` por uma lista de `Checkbox` com o nome de cada unidade, filtrando as que o usuário já é gestor
3. **Submit**: Fazer insert de um registro por unidade selecionada (loop ou insert em batch)
4. **Validação**: Exigir pelo menos 1 unidade selecionada
5. **Filtro de disponíveis**: Para cada usuário selecionado, esconder unidades onde ele já é gestor

| Arquivo | Alteração |
|---------|-----------|
| `EstoqueGestores.tsx` | Mudar form state, trocar Select por Checkboxes, insert múltiplo |

