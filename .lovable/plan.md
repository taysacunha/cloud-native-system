

## Plano: Corrigir fluxo de venda de dias no cadastro Padrão

### Problemas identificados

1. **Label "Opções adicionais"** — nome confuso, deve voltar a ser "Vender dias de férias"
2. **Lógica de venda no Padrão errada** — Hoje divide gozo em "1 ou 2 períodos" e pede datas separadas. O correto: o usuário escolhe em qual período oficial (1º ou 2º) está a venda. O outro período é gozado inteiro (15 dias, sem campo extra). Só precisa de data de início do gozo no período da venda.
3. **Sem validação de datas do gozo** — A data de início do gozo deve estar dentro do período oficial correspondente, e a data final calculada não pode ultrapassar o fim do período oficial.

### Como deve funcionar (Padrão)

Exemplo: Vende 10 dias, período de venda = 2º (16/11 a 30/11).
- 1º período: gozado completo (15 dias) — nenhum campo extra.
- 2º período: gozo de 5 dias (15 - 10). Usuário digita data de início do gozo.
  - Validação: início >= 16/11 E fim (início + 4) <= 30/11.
  - Se violar, erro impedindo salvar.

### Mudanças em `FeriasDialog.tsx`

1. **Renomear** "Opções adicionais" → "Vender dias de férias" no RadioGroup. Manter as 3 opções: "Nenhum" / "Vender dias de férias" / "Gozo em datas diferentes" (exceção).

2. **Seção de venda (Padrão, diasVendidos <= 10)**:
   - Campo: dias a vender (1-10)
   - Select: "Período da venda" (1º ou 2º)
   - Texto informativo: "O [outro] período será gozado integralmente (15 dias)"
   - 1 card de gozo com data de início + fim automático para o período da venda
   - Dias de gozo = 15 - diasVendidos

3. **Remover** a lógica de "1 ou 2 períodos de gozo" e os campos `gozo_venda_q2` para o fluxo Padrão. Esses campos só fazem sentido na Exceção (>10 dias vendidos).

4. **Validação de datas do gozo**:
   - Se `quinzena_venda === 1`: gozo início >= q1Inicio E gozo fim <= q1Fim
   - Se `quinzena_venda === 2`: gozo início >= q2Inicio E gozo fim <= q2Fim
   - Mostrar erro inline se violado. Bloquear submit.

5. **Auto-cálculo**: gozo fim = gozo início + (15 - diasVendidos - 1) dias.

6. **Payload (save)**: salvar gozo nos campos `gozo_quinzena1_inicio/fim` ou `gozo_quinzena2_inicio/fim` conforme o período da venda. O outro período não tem campos de gozo (é o período oficial inteiro).

### Exceção (>10 dias)

Manter a lógica atual de distribuição em 1 ou 2 períodos de gozo, mas com a mesma validação de datas dentro dos períodos oficiais.

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `FeriasDialog.tsx` | Renomear label, simplificar venda padrão (1 campo de gozo no período da venda), validação de datas dentro do período oficial |

