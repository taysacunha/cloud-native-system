

## Plano: Corrigir o cadastro de férias (reverter erros e implementar corretamente)

### Entendimento correto

1. **Sempre 2 quinzenas oficiais** — nunca nullable. É o que vai para o contador. Remover toggle `numero_periodos` e toda lógica de "1 período".
2. **Venda de dias** — Disponível em Padrão (máx 10) e Exceção (máx 30). Ao vender, o usuário informa quantos dias, escolhe se o gozo residual fica em 1 ou 2 períodos, preenche data(s) de início do gozo e o sistema calcula o fim. As quinzenas oficiais permanecem inalteradas.
3. **Seletor único exclusivo** — Em vez de checkboxes separados que somem, colocar um RadioGroup com 3 opções: "Nenhum", "Vender dias", "Gozo em datas diferentes". Gozo diferente só aparece quando é Exceção.
4. **Remover** todas as badges "1 período", stats de "1 período" da tabela, dashboard e relatórios.

### Arquivos e mudanças

| Arquivo | O que fazer |
|---------|-------------|
| `FeriasDialog.tsx` | Reverter: remover `numero_periodos` do schema/form/UI. Sempre exigir 2 quinzenas. Substituir checkboxes por RadioGroup exclusivo ("Nenhum" / "Vender dias" / "Gozo diferente" — este último só se `isExcecao`). Na seção de venda: após digitar dias vendidos, RadioGroup "1 período de gozo" / "2 períodos de gozo", campos de data de início do gozo com fim automático. Payload: quinzena2 nunca null, gozo fields preenchidos conforme venda. |
| `FeriasFerias.tsx` | Remover stat card "1 Período", remover badge "1 período" na coluna 2º Período (sempre terá valor). |
| `FeriasDashboard.tsx` | Nenhuma mudança extra necessária (não havia sido alterado com "1 período" card). |
| `ConsultaGeralTab.tsx` | Remover opções "1 Período" / "2 Períodos" do filtro Tipo. Remover stat card "1 Período". |
| `FeriasViewDialog.tsx` | Remover bloco "Período Único" (quinzena2 nunca será null). |
| `ContadorPDFGenerator.tsx` | Reverter tratamento de quinzena2 null (não será mais necessário). |

### Detalhes do RadioGroup exclusivo

```
Opções adicionais:
○ Nenhum (padrão)
○ Vender dias de férias
○ Gozo em datas diferentes (só aparece se Exceção)
```

Quando "Vender dias" selecionado:
- Campo: quantidade de dias (máx 10 Padrão, máx 30 Exceção)
- Se dias > 15: forçar 1 período de gozo
- Se dias <= 15: RadioGroup "1 período de gozo" / "2 períodos de gozo"
- Se 1 período: 1 campo de data início gozo → fim = início + (30 - diasVendidos - 1)
- Se 2 períodos: campos de distribuição (dias vendidos P1 + P2) + 2 campos de data início gozo

Os campos de gozo são salvos em `gozo_quinzena1_inicio/fim` e `gozo_quinzena2_inicio/fim` (mesmos campos do gozo diferente).

Quando "Gozo diferente" selecionado:
- Mesma UI atual de gozo diferente (qual período + datas)

### Migration

Reverter a migration anterior — tornar quinzena2 NOT NULL novamente:

```sql
-- Primeiro preencher qualquer registro que esteja null
UPDATE ferias_ferias 
SET quinzena2_inicio = quinzena1_inicio, quinzena2_fim = quinzena1_fim 
WHERE quinzena2_inicio IS NULL;

ALTER TABLE ferias_ferias ALTER COLUMN quinzena2_inicio SET NOT NULL;
ALTER TABLE ferias_ferias ALTER COLUMN quinzena2_fim SET NOT NULL;
```

