
# 4 Melhorias: Locais (paginacao), Avaliacoes (ordenacao), PDF Corretor (detalhes), Filtro de tipo

---

## 1. Seletor de itens por pagina na pagina Locais

**Arquivo:** `src/pages/Locations.tsx`

Atualmente `itemsPerPage` e fixo em 10 (linha 161). Alterar para estado variavel com opcoes 10, 25, 50 e 100.

- Trocar `const itemsPerPage = 10` por `const [itemsPerPage, setItemsPerPage] = useState(10)`
- Criar um componente `ItemsPerPageSelector` (um Select inline com opcoes 10, 25, 50, 100)
- Posicionar o seletor em dois locais:
  - **Acima da tabela**, ao lado do campo de busca (lado direito)
  - **Abaixo da tabela**, junto ao texto "Mostrando X-Y de Z" na area de paginacao
- Ao trocar o valor, resetar `currentPage` para 1

---

## 2. Ordenacao por colunas na aba Avaliacoes (SalesReports)

**Arquivo:** `src/pages/vendas/SalesReports.tsx`

A tabela de avaliacoes (linhas 640-662) nao tem ordenacao. Adicionar estados de sort e logica similar ao `EvaluationRanking`.

- Adicionar estados: `evalSortField` (default: `"average_score"`), `evalSortDirection` (default: `"desc"`)
- Campos ordenáveis: Corretor (`name`), Equipe (`team`), Media (`average_score`), Classificacao (`classification`)
- Aplicar `useMemo` para ordenar `evaluationsData` antes de renderizar
- Adicionar icones de seta nos cabeçalhos clicaveis (ArrowUp, ArrowDown, ArrowUpDown)
- A classificacao sera ordenada por mapeamento de prioridade: Excelente > Bom > Precisa Melhorar > Nao atualiza

---

## 3. Incluir detalhes de avaliacao e vendas no PDF do corretor

**Arquivo:** `src/components/vendas/BrokerIndividualReport.tsx`

Atualmente o PDF e gerado via `html2canvas` capturando o `reportRef`. Os dados de "Detalhes da Avaliacao" (feedback, acoes, metas, ultima visita) e "Detalhes das Vendas" (lista de imoveis vendidos) estao em popovers/dialogs que nao sao capturados.

Solucao: renderizar esses dados como secoes visíveis dentro do `reportRef` (sempre visíveis, nao em popover/dialog), para que o `html2canvas` os capture no PDF.

- **Secao "Detalhes das Vendas"**: Abaixo dos graficos, adicionar uma secao com a tabela de vendas individuais (imovel, data, valor, papel titular/parceiro) — usando os dados de `saleDetails` ja disponíveis
- **Secao "Detalhes da Avaliacao"**: Abaixo da secao de vendas, buscar e renderizar os campos `obs_feedbacks`, `acoes_melhorias_c2s`, `metas_acoes_futuras` e `last_visit_date` da ultima avaliacao do periodo — dados ja disponíveis via a query `broker-last-evaluation-details` (reutilizar a mesma query do `EvaluationDetailsDialog`)
- Adicionar nova query inline no componente para buscar os dados da avaliacao (similar ao dialog)
- Essas secoes ficam visíveis quando um corretor esta selecionado, fazendo parte do conteudo capturado pelo `html2canvas`

---

## 4. Filtrar apenas corretores de venda na aba Corretores

**Arquivo:** `src/components/vendas/BrokerIndividualReport.tsx`

A tabela `sales_brokers` tem a coluna `broker_type` (default `'venda'`). Corretores como Duilio sao de locacao e nao devem aparecer.

- Na query `sales-brokers-active` (linha 145), adicionar `.eq("broker_type", "venda")` ao filtro
- Isso garante que apenas corretores de venda aparecem no Select e no relatorio

---

## Detalhes tecnicos

### Arquivos a modificar

1. **`src/pages/Locations.tsx`**
   - Trocar constante `itemsPerPage` por estado
   - Adicionar componente Select de itens por pagina acima e abaixo da tabela
   - Resetar pagina ao mudar quantidade

2. **`src/pages/vendas/SalesReports.tsx`**
   - Adicionar estados de ordenacao para a aba Avaliacoes
   - Adicionar `useMemo` para ordenar `evaluationsData`
   - Adicionar cabeçalhos clicaveis com icones de seta
   - Importar icones ArrowUp, ArrowDown, ArrowUpDown

3. **`src/components/vendas/BrokerIndividualReport.tsx`**
   - Adicionar `.eq("broker_type", "venda")` na query de brokers
   - Adicionar query para buscar detalhes da avaliacao (obs_feedbacks, acoes, metas, ultima visita)
   - Renderizar secao "Detalhes das Vendas" dentro do `reportRef` com tabela de `saleDetails`
   - Renderizar secao "Detalhes da Avaliacao" dentro do `reportRef` com os campos textuais

### Nenhuma alteracao no banco de dados
