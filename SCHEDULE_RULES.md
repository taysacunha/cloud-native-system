# 📋 REGRAS DE GERAÇÃO DE ESCALAS

## Índice
1. [Visão Geral](#visão-geral)
2. [Locais Externos](#locais-externos)
3. [Locais Internos](#locais-internos)
4. [Configuração de Períodos](#configuração-de-períodos)
5. [Fluxograma de Decisão](#fluxograma-de-decisão)
6. [Troubleshooting](#troubleshooting)
7. [Histórico de Correções](#histórico-de-correções)

---

## Visão Geral

O sistema gera escalas semanais atribuindo corretores a locais (externos e internos) seguindo regras específicas para cada tipo de local.

### Tipos de Locais
| Tipo | Descrição | Corretores por Turno |
|------|-----------|---------------------|
| **Externo** | Empreendimentos externos | 1 corretor por turno |
| **Interno** | Sedes (Tambaú, Bessa) | Múltiplos corretores por turno |

### Modos de Configuração
| Modo | Descrição |
|------|-----------|
| `weekday` | Usa `period_day_configs` (configuração por dia da semana) |
| `specific_date` | Usa `period_specific_day_configs` (datas específicas) |

---

## Locais Externos

### Regras Gerais

1. **Um corretor por turno**: Cada turno (manhã/tarde) tem exatamente 1 corretor
2. **Priorização**: Corretores com menos plantões externos são priorizados
3. **Sem consecutivos**: Um corretor NÃO pode ter plantão externo em dias consecutivos
4. **Meta semanal**: 
   - Corretores Seg-Sex: 2 plantões externos/semana
   - Corretores Seg-Dom: Alternar entre 1 e 2 (semanas pares/ímpares)

### Regra "2 Antes do 3" (GATE GLOBAL)

4a. **Distribuição obrigatória**: TODOS os corretores elegíveis devem atingir 2 externos antes de qualquer um receber o 3º
   - O sistema verifica GLOBALMENTE se ainda existe corretor com <2 externos que pode receber alguma demanda
   - Enquanto existir essa possibilidade, NINGUÉM recebe 3º externo
   - Apenas quando é matematicamente impossível dar 2 para todos, o 3º é permitido
   - Esta regra garante distribuição justa e evita sobrecarga em alguns corretores

4b. **Preservação de corretores com poucos locais**: Corretores com MENOS locais externos configurados são PRESERVADOS para externos
   - Na escolha de quem vai para sábado interno, prioriza-se corretores com MAIS locais (versáteis)
   - Isso evita que corretores com poucas opções fiquem presos em internos

### Regras de Fim de Semana

5. **Sáb OU Dom**: Se trabalhou sábado externo, NÃO pode domingo (e vice-versa)
6. **Consistência**: Verificação cruzada para evitar alocação em ambos os dias

### Regra Especial: Mesmo Corretor em Ambos Turnos

7. **Condição**: Aplica-se APENAS quando o local tem **EXATAMENTE 1 corretor** cadastrado que pode fazer AMBOS os turnos
8. **Exemplo**: Aeroporto (apenas Hugo cadastrado para manhã+tarde)
9. **Comportamento**: O mesmo corretor faz manhã E tarde no mesmo dia

```
⚠️ IMPORTANTE: Esta regra NÃO se aplica quando:
- O local tem múltiplos corretores cadastrados
- O local tem apenas 1 corretor mas ele só pode fazer 1 turno
```

### Regra de Construtora

10. **Restrição**: Um corretor NÃO pode ser alocado em mais de um empreendimento da MESMA construtora no mesmo dia

### Disponibilidade do Corretor

11. **Dia da semana**: O corretor deve ter o dia em `available_weekdays`
12. **Turno no local**: O corretor deve ter `available_morning` ou `available_afternoon` para o local específico

---

## Locais Internos

### Tambaú e Bessa (Sábados)

1. **Dia**: APENAS sábados (configurado via `period_day_configs`)
2. **Corretores**: Múltiplos por turno (definido em `max_brokers_count`)
3. **Elegibilidade**: Corretores que têm sábado em `available_weekdays`
4. **Alternância**: Semanas pares/ímpares para distribuição equitativa

### Plantões Internos de Semana (Segunda a Sexta)

5. **Cobertura**: Preenche os turnos livres de cada corretor com plantões internos
6. **Compatibilidade**: Corretor PODE ter interno + externo no MESMO dia, desde que em TURNOS diferentes
   - Ex.: Externo manhã + Interno tarde = PERMITIDO
   - Ex.: Externo tarde + Interno manhã = PERMITIDO
   - Ex.: Interno manhã + Interno tarde = PERMITIDO (se ambos turnos disponíveis)
7. **Disponibilidade por Turno**: A alocação interna respeita `location_brokers.weekday_shift_availability`
   - Se o corretor só tem tarde disponível no vínculo, NÃO recebe interno de manhã
8. **Lógica** (por turno, não por dia):
   - Para cada corretor configurado em um local interno:
     - Para cada turno (manhã/tarde) do dia:
       - Verificar se o dia está em `available_weekdays`
       - Verificar se o turno está disponível no vínculo (`weekday_shift_availability` ou fallback)
       - Verificar se NÃO existe alocação (interna ou externa) naquele mesmo turno
       - Se passar em todos → alocar interno naquele turno

---

## Configuração de Períodos

### Prioridade de Configuração

```
1️⃣ period_specific_day_configs (data específica)
   ↓ se não existir
2️⃣ Se shift_config_mode = 'specific_date' → PULAR DATA
   ↓ senão
3️⃣ period_day_configs (dia da semana)
```

### Datas Excluídas

- Configuradas em `period_excluded_dates`
- Usado para feriados, datas sem funcionamento

### Estrutura de Dados

```
locations
├── location_periods (período de vigência)
│   ├── period_day_configs (config por dia da semana)
│   ├── period_specific_day_configs (config por data específica)
│   └── period_excluded_dates (datas excluídas)
└── location_brokers (corretores vinculados)
    ├── available_morning (disponível manhã)
    └── available_afternoon (disponível tarde)
```

---

## Fluxograma de Decisão

### Alocação de Plantão Externo

```
┌─────────────────────────────────────────┐
│ Para cada LOCAL EXTERNO                 │
└─────────────────────┬───────────────────┘
                      ▼
┌─────────────────────────────────────────┐
│ Período ativo para esta data?           │
│ (start_date <= date <= end_date)        │
└─────────────────────┬───────────────────┘
                      │ SIM
                      ▼
┌─────────────────────────────────────────┐
│ Existe config específica para data?     │
│ (period_specific_day_configs)           │
└─────────────────────┬───────────────────┘
                      │
         ┌────────────┴────────────┐
         │ SIM                     │ NÃO
         ▼                         ▼
┌─────────────────┐   ┌─────────────────────────┐
│ Usar config     │   │ Modo = specific_date?   │
│ específica      │   └────────────┬────────────┘
└─────────────────┘                │
                      ┌────────────┴────────────┐
                      │ SIM                     │ NÃO
                      ▼                         ▼
             ┌─────────────────┐   ┌─────────────────────┐
             │ ⏭️ PULAR DATA   │   │ Usar period_day_    │
             │ (não config.)  │   │ configs (weekday)   │
             └─────────────────┘   └─────────────────────┘
```

### Verificação de Mesmo Corretor (Ambos Turnos)

```
┌─────────────────────────────────────────┐
│ Local tem manhã E tarde configurados?   │
└─────────────────────┬───────────────────┘
                      │ SIM
                      ▼
┌─────────────────────────────────────────┐
│ Quantos corretores disponíveis para     │
│ AMBOS os turnos? (available_morning     │
│ AND available_afternoon)                │
└─────────────────────┬───────────────────┘
                      │
         ┌────────────┴────────────┐
         │ = 1                     │ > 1
         ▼                         ▼
┌─────────────────┐   ┌─────────────────────────┐
│ ✅ MESMO        │   │ ❌ CORRETORES           │
│ CORRETOR para   │   │ DIFERENTES para         │
│ manhã + tarde   │   │ manhã e tarde           │
└─────────────────┘   └─────────────────────────┘
```

---

## Troubleshooting

### Problema: Corretor não está sendo alocado

| Verificar | Solução |
|-----------|---------|
| `available_weekdays` não inclui o dia | Adicionar dia na disponibilidade do corretor |
| Não está em `location_brokers` | Vincular corretor ao local |
| `available_morning/afternoon` = false | Habilitar turno no vínculo |
| Meta semanal atingida | Normal - limite de plantões externos |
| Plantão externo no dia anterior | Normal - regra de não-consecutivo |

### Problema: Local sem escalas geradas

| Verificar | Solução |
|-----------|---------|
| `is_active` = false | Ativar o local |
| Sem período ativo | Criar período que cubra a data |
| Modo `specific_date` sem config | Adicionar config para a data específica |
| Sem corretores vinculados | Vincular corretores ao local |

### Problema: Mesmo corretor em todos os turnos (quando não deveria)

| Verificar | Solução |
|-----------|---------|
| Apenas 1 corretor com ambos turnos | Adicionar mais corretores ou ajustar disponibilidade |

---

## Histórico de Correções

### Correção 2024-12-10: Regra de Mesmo Corretor

**Problema**: A regra "mesmo corretor para ambos os turnos" estava sendo aplicada para TODOS os locais externos quando `maxBrokersCount === 1`.

**Causa**: A condição verificava `maxBrokersCount` (configuração de slots) ao invés do número real de corretores cadastrados.

**Solução**: Alterada a lógica para verificar o número de corretores em `location_brokers` que têm `available_morning AND available_afternoon`.

```typescript
// ❌ ANTES (ERRADO):
const needsSameBrokerBothShifts = hasMorning && hasAfternoon && maxBrokersCount === 1;

// ✅ DEPOIS (CORRETO):
const brokersEligibleForBothShifts = location.location_brokers?.filter((lb: any) => 
  lb.available_morning && lb.available_afternoon
) || [];
const needsSameBrokerBothShifts = hasMorning && hasAfternoon && brokersEligibleForBothShifts.length === 1;
```

---

## Validações do Sistema

O gerador executa as seguintes validações antes de gerar escalas:

1. ✅ Verifica se há corretores ativos
2. ✅ Verifica se há locais externos/internos ativos
3. ✅ Verifica períodos ativos para cada data
4. ✅ Valida configurações de dia/data específica
5. ✅ Verifica corretores vinculados aos locais
6. ✅ Valida disponibilidade de turnos

---

## Configurações Esperadas

### Local Externo Típico
```
✅ is_active = true
✅ location_type = 'external'
✅ Pelo menos 1 período ativo
✅ Pelo menos 1 corretor vinculado
✅ Config de dia ou data específica
```

### Aeroporto (Caso Especial)
```
✅ is_active = true
✅ location_type = 'external'
✅ shift_config_mode = 'specific_date' (ou 'weekday')
✅ EXATAMENTE 1 corretor com available_morning=true E available_afternoon=true
→ Resultado: Mesmo corretor faz manhã e tarde
```

### Local com Múltiplos Corretores
```
✅ is_active = true
✅ location_type = 'external'
✅ 2+ corretores vinculados com disponibilidade variada
→ Resultado: Corretores diferentes para manhã e tarde
```

---

**Última atualização**: 2024-12-10
**Versão**: 1.0
