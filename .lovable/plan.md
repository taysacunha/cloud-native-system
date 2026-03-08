

## Plano: Reorganizar a pagina de Registro de Desenvolvimento

### Mudancas solicitadas

1. **Abas por sistema** - Aba "Todos" + uma aba por sistema, em vez de tudo expandido
2. **Collapsible por sistema** - Na aba "Todos", cada sistema e um accordion que expande/colapsa
3. **Botao de visualizacao** - Icone de olho para abrir dialog com detalhes completos da funcionalidade (nome, descricao completa, horas, valor)
4. **Valor/hora global** - Campo no topo onde o usuario digita um valor por hora (R$/h). O custo de cada funcionalidade = horas x valor/hora. Subtotais e total geral calculados automaticamente

### Implementacao tecnica

**Arquivo unico**: `src/pages/DevTracker.tsx`

**Estrutura da UI**:
- Header com titulo + campo "Valor por hora (R$/h)" com Input
- Tabs: "Todos" | "Login / Infraestrutura" | "Escalas" | "Vendas" | "Ferias" | "Estoque"
- Aba "Todos": Accordion com cada sistema colapsavel, tabela dentro
- Abas individuais: tabela direta do sistema filtrado
- Tabela: colunas Funcionalidade | Horas | Valor (calculado) | Acoes (olho, editar, excluir)
- Descricao removida da tabela (truncava), agora acessivel pelo botao de visualizacao
- Dialog de visualizacao: mostra nome, descricao completa, horas, valor calculado
- Card de total geral no rodape (horas totais, valor total = soma de horas x valor/hora)
- O campo "cost" individual de cada feature deixa de ser editavel manualmente; o valor e sempre horas x taxa global
- O PDF tambem usa o valor/hora para calcular

**Estado novo**:
- `hourlyRate: number` (valor por hora, default 0, salvo em localStorage)
- `activeTab: string` (aba ativa)
- `viewingFeature: DevFeature | null` (dialog de visualizacao)

**Componentes usados**: Tabs, Accordion, Dialog (ja existem no projeto)

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/DevTracker.tsx` | Reescrever layout com Tabs + Accordion + dialog de view + campo valor/hora |

