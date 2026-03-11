

## Plano: Ajustes no sistema de férias

### Resumo das mudanças

4 melhorias no módulo de férias:

1. **Venda de dias > 15: fluxo simplificado** — Quando vender mais de 15 dias, mostrar apenas 1 campo de período (gozo residual). Adicionar opção de distribuir em 1 ou 2 períodos de gozo.
2. **Vender dias e Gozo diferente mutuamente exclusivos** — Ao marcar "Vender dias", desmarcar "Gozo diferente" e vice-versa.
3. **Permitir cadastro de apenas 1 período** — Tornar o 2º período opcional. Indicador visual na tabela e dashboard para colaboradores com apenas 1 período.
4. **Relatórios** — Novo filtro/indicador na Consulta Geral para ver colaboradores com 1 período.

---

### 1. Migration: tornar quinzena2 nullable

A tabela `ferias_ferias` exige `quinzena2_inicio` e `quinzena2_fim` como NOT NULL. Para permitir 1 período, precisamos torná-los nullable.

```sql
ALTER TABLE ferias_ferias ALTER COLUMN quinzena2_inicio DROP NOT NULL;
ALTER TABLE ferias_ferias ALTER COLUMN quinzena2_fim DROP NOT NULL;
```

### 2. FeriasDialog.tsx — Lógica principal

**Zod schema**: tornar `quinzena2_inicio` e `quinzena2_fim` opcionais (`.optional()`).

**Novo campo**: `numero_periodos` (radio: "1 período" / "2 períodos") exibido logo acima dos cards de período. Quando "1 período", ocultar 2º período e limpar seus campos.

**Venda de dias simplificada (>15 dias vendidos)**:
- Quando `diasVendidos > 15`, o gozo restante cabe em 1 período. Forçar `numero_periodos = 1` e mostrar apenas 1 card "Período de Gozo" com data de início editável e fim calculado automaticamente (`30 - diasVendidos` dias).
- Remover a distribuição P1/P2 quando > 15 dias vendidos (não faz sentido).
- Quando `diasVendidos <= 15`, manter a distribuição atual mas com opção de 1 ou 2 períodos de gozo.

**Mutual exclusivity (vender dias × gozo diferente)**:
- Quando `vender_dias` é marcado → desmarcar `gozo_diferente` automaticamente.
- Quando `gozo_diferente` é marcado → desmarcar `vender_dias` automaticamente.
- Na UI: mostrar apenas uma das seções por vez. Adicionar texto explicativo: "Não é possível vender dias e ter gozo em datas diferentes ao mesmo tempo."

**Payload de save**: quando `numero_periodos === 1`, enviar `quinzena2_inicio: null, quinzena2_fim: null`.

### 3. FeriasFerias.tsx — Indicador visual na tabela

- Na coluna "2º Período", quando vazio/null, mostrar um Badge amarelo "1 período" ao invés de "—".
- Nos stats cards, adicionar contagem de "1 período" como informação.

### 4. FeriasDashboard.tsx — Card de alerta

- Novo card ou seção no dashboard: "Colaboradores com 1 período" com contagem e lista dos nomes, para visibilidade.

### 5. ConsultaGeralTab.tsx — Filtro em relatórios

- Novo filtro "Tipo": adicionar opção "1 período" / "2 períodos" ao `selectedTipo`.
- Na tabela, adicionar indicador visual (badge) quando é 1 período.
- Nos stats cards, adicionar contagem de 1 período.

### 6. FeriasViewDialog.tsx

- Ajustar para exibir corretamente quando só tem 1 período (ocultar card do 2º período se null).

### 7. FeriasRelatorios.tsx / ExcecoesPDFGenerator / ContadorPDFGenerator

- Tratar `quinzena2_inicio` null nos geradores de PDF sem quebrar.

---

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| **Migration SQL** | `quinzena2_inicio/fim` DROP NOT NULL |
| `FeriasDialog.tsx` | Novo campo `numero_periodos`, fluxo simplificado venda >15, mutual exclusivity |
| `FeriasFerias.tsx` | Badge "1 período" na tabela, stat card |
| `FeriasDashboard.tsx` | Card/alerta de colaboradores com 1 período |
| `ConsultaGeralTab.tsx` | Filtro e indicador "1 período" |
| `FeriasViewDialog.tsx` | Tratar 2º período null |
| `ContadorPDFGenerator.tsx` | Tratar quinzena2 null |
| `ExcecoesPDFGenerator.tsx` | Tratar quinzena2 null |

