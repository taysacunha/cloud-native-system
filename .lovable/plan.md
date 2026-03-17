

## Por que a aba "Vínculos" sumiu

O botão "Vínculos" só aparece quando `brokerEligibilityMap` tem dados. Esses dados vêm de `getLastGenerationTrace()`, que é uma variável **em memória** — só existe imediatamente após gerar a escala. Quando você recarrega a página ou abre uma validação salva do banco, o trace é `null` e o botão desaparece.

A validação salva no banco (`schedule_validation_results`) guarda `violations`, `summary`, `broker_reports` e `unallocated_demands`, mas **não guarda** o `brokerEligibilityMap`.

## Plano de correção

### 1. Adicionar coluna `broker_eligibility_map` na tabela `schedule_validation_results`
- Tipo `jsonb`, nullable
- Migration SQL simples

### 2. Salvar o mapa junto com a validação
- Em `saveValidationToDatabase()` (`Schedules.tsx` linha 696), capturar `getLastGenerationTrace()?.brokerEligibilityMap` e incluir no insert

### 3. Restaurar o mapa ao carregar validação salva
- No `useEffect` que processa `savedValidation` (linha 181-209), extrair `broker_eligibility_map` do registro salvo e armazená-lo em um novo state
- Passar esse state para `ValidationReportPanel` como prop `brokerEligibilityMap`, com fallback para `getLastGenerationTrace()?.brokerEligibilityMap`

### 4. Manter os outros dados do trace como fallback in-memory
- `brokerDiagnostics`, `eligibilityExclusions`, `subAllocatedForensics` continuam vindo do trace em memória (não são críticos para o usuário)
- Apenas `brokerEligibilityMap` é persistido por ser a informação útil

### Arquivos alterados
- `src/pages/Schedules.tsx` — salvar e restaurar o mapa
- Migration SQL — adicionar coluna

### Resultado
A aba "Vínculos" vai aparecer sempre que houver validação salva, mesmo após recarregar a página.

