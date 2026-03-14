

## Plano: Datas DD/MM/AAAA + Justificativa detalhada para plantões não alocados

### Problema 1: Datas no formato americano (YYYY-MM-DD)

Na `UnallocatedSection` e nas violações do `ValidationReportPanel`, as datas são exibidas no formato ISO `2026-03-03` ao invés do formato brasileiro `03/03/2026`.

### Problema 2: Sem justificativa para plantões não alocados

Quando um plantão externo não é alocado, o sistema diz apenas "Turno não alocado: Nammos - 2026-03-03 (Manhã)". O usuário precisa saber **por quê** — quais corretores eram elegíveis e por qual motivo cada um foi bloqueado.

### Solução

#### 1. Enriquecer `UnallocatedDemand` com justificativa

Adicionar campo `reason` à interface `UnallocatedDemand` em `schedulePostValidation.ts`:

```typescript
export interface UnallocatedDemand {
  locationId: string;
  locationName: string;
  date: string;
  shift: "morning" | "afternoon";
  reason?: string; // Justificativa detalhada
}
```

#### 2. No gerador (`scheduleGenerator.ts`), coletar motivos de bloqueio

Após o passe final (etapa 8.11, ~linha 4010), para cada demanda que ficou sem alocação (`finalUnallocated`), executar `findBrokerForDemand` com `collectBlockedBrokers: true` para obter a lista de corretores bloqueados e seus motivos. Construir uma string de justificativa tipo:

> "Corretores disponíveis: Hugo (já alocado no Setai), Carlos (dia consecutivo externo), Ana (não configurada). Nenhum corretor pôde ser alocado."

Ou se não há nenhum corretor elegível: "Nenhum corretor está configurado para este local neste turno."

Salvar essa justificativa no `GenerationQualityReport.impossibleDemands` e passá-la ao `UnallocatedDemand`.

#### 3. No `detectUnallocatedDemands`, adicionar justificativa básica

Na re-validação (que não passa pelo gerador), a justificativa é mais simples: consultar `location_brokers` do local e listar quais corretores estão configurados e onde estão alocados naquele dia/turno.

#### 4. Formatar datas para DD/MM/AAAA

No `ValidationReportPanel.tsx`:
- Na `UnallocatedSection`: formatar `d.date` com `format(parseISO(d.date), "dd/MM/yyyy")`
- Nas violações com `dates[]`: mesma formatação
- No `TURNO_NAO_ALOCADO` details em `schedulePostValidation.ts`: formatar a data

### Arquivos impactados

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `src/lib/schedulePostValidation.ts` | Adicionar `reason?` ao `UnallocatedDemand`; formatar datas DD/MM nas violações; no `detectUnallocatedDemands`, consultar `location_brokers` + alocações para gerar justificativa |
| 2 | `src/lib/scheduleGenerator.ts` | Após passe final, para cada `finalUnallocated`, coletar blocked brokers via `findBrokerForDemand(collectBlockedBrokers: true)` e montar justificativa |
| 3 | `src/components/ValidationReportPanel.tsx` | Formatar datas DD/MM/AAAA na `UnallocatedSection`; exibir `reason` quando disponível |
| 4 | `src/pages/Schedules.tsx` | Propagar `reason` dos `UnallocatedDemand` do gerador para o validador |

