

## Plano: Redesign Locais de Armazenamento + Controles de Tabela em Todo o Módulo Estoque

### 1. Simplificar Locais de Armazenamento (`EstoqueLocais.tsx`)

**Problema atual:** Campo "Local Pai" confuso, sem validação de duplicidade, sem confirmação ao desativar.

**Solução:**
- **Remover hierarquia** — eliminar `buildTree`, `LocalNode`, campo "Local Pai" do dialog. Sempre salvar `parent_id = null`
- **Substituir por tabela simples** por unidade: Nome | Tipo | Status | Ações
- **Validação de duplicidade** — antes de salvar, verificar se já existe local ativo com mesmo nome (case-insensitive) na mesma unidade. Se sim, toast de erro: "Já existe um local com este nome nesta unidade"
- **AlertDialog de confirmação** ao desativar/excluir

### 2. Adicionar ordenação, busca, paginação em todas as páginas de listagem do Estoque

Páginas que receberão os controles usando o hook `useTableControls` e componentes `TableSearch`, `TablePagination`, `SortableHeader` (já existentes em `src/hooks/useTableControls.ts` e `src/components/vendas/TableControls.tsx`):

| Página | Arquivo | Estado atual |
|--------|---------|-------------|
| Materiais | `EstoqueMateriais.tsx` | Busca simples, sem paginação/ordenação |
| Locais | `EstoqueLocais.tsx` | Sem controles |
| Saldos | `EstoqueSaldos.tsx` | Busca simples, sem paginação/ordenação |
| Movimentações | `EstoqueMovimentacoes.tsx` | Busca + filtro tipo, sem paginação/ordenação |
| Solicitações | `EstoqueSolicitacoes.tsx` | Busca + filtro status, sem paginação/ordenação |
| Notificações | `EstoqueNotificacoes.tsx` | Sem controles |
| Gestores | `EstoqueGestores.tsx` | Sem controles |

**Para cada página:**
- Substituir busca manual por `useTableControls` com `defaultItemsPerPage = 25`
- Adicionar `TableSearch` no topo
- Adicionar `SortableHeader` nas colunas relevantes (nome, data, tipo, quantidade etc.)
- Adicionar `TablePagination` no rodapé com opções 25, 50, 100 itens por página
- Mover `TableControls.tsx` de `vendas/` para `components/` (uso compartilhado) ou importar direto de `vendas/`

### 3. Ajustar opções de itens por página

O `TablePagination` atual oferece 20/50/100. Será atualizado para **25/50/100** conforme solicitado, alterando os `<SelectItem>` no componente.

### Arquivos a alterar

| Arquivo | Alteração |
|---------|-----------|
| `EstoqueLocais.tsx` | Reescrita: tabela flat, validação duplicidade, AlertDialog, useTableControls |
| `EstoqueMateriais.tsx` | Adicionar useTableControls + paginação + ordenação |
| `EstoqueSaldos.tsx` | Adicionar useTableControls + paginação + ordenação |
| `EstoqueMovimentacoes.tsx` | Adicionar useTableControls + paginação + ordenação |
| `EstoqueSolicitacoes.tsx` | Adicionar useTableControls + paginação + ordenação |
| `EstoqueNotificacoes.tsx` | Adicionar useTableControls + paginação + ordenação |
| `EstoqueGestores.tsx` | Adicionar useTableControls + paginação + ordenação |
| `TableControls.tsx` | Alterar opções para 25/50/100 |

