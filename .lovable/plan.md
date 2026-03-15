
Objetivo inegociável: impedir definitivamente cenário “Andrea = 1 externo” com outros em 4 quando ela está apta. O código atual ainda permite isso por 3 brechas reais que identifiquei.

1) Diagnóstico objetivo no código
- `findBrokerForDemand` chama `checkAbsoluteRules`, e `checkAbsoluteRules` ainda bloqueia em `>= 2` (máx 2 absoluto). Isso inutiliza os níveis 3/4 dentro do fluxo principal.
- O aumento para 3º/4º acontece depois, nas etapas de emergência (`ETAPA 9` e `ETAPA 8.11`), que hoje relaxam distribuição sem reaplicar o gate 1→2→3→4 de forma estrita.
- A branch “único corretor configurado” em `findBrokerForDemand` pode furar gate/hard-cap de nível.

2) Plano de implementação (sem novas dúvidas)
- Corrigir o núcleo de seleção:
  - Remover “máx 2 absoluto” de `checkAbsoluteRules` (ou parametrizar para respeitar `maxAllowedExternals`).
  - Manter limite real via gate de nível + hard cap 4.
  - Fazer branch “único configurado” também respeitar gate/hard cap.
- Unificar o gate em todas as fases externas:
  - Reaplicar regra 1→2→3→4 também na `ETAPA 9` e na `ETAPA 8.11`.
  - “Relaxar só sem opção” = só sobe nível após esgotar swaps/cadeias para quem está abaixo.
- Rebalanceamento obrigatório no fim:
  - Rodar rebalanceamento novamente após `ETAPA 8.11` (hoje ele roda antes).
  - Encerrar apenas quando não houver mais troca possível ou quando distribuição estiver dentro do critério.
- Trava final obrigatória (hard fail):
  - Adicionar validação de escada de distribuição no final da semana:
    - ninguém com 2 se existir elegível com 0;
    - ninguém com 3 se existir elegível com 1;
    - ninguém com 4 se existir elegível com 2.
  - Se violar, a tentativa falha e entra retry (não salva).
- Blindagem no retry:
  - Em `generateWeeklyScheduleWithRetry`, marcar essa violação como inviolável (nunca converter para warning de emergência).

3) Arquivos a alterar
- `src/lib/scheduleGenerator.ts`
  - `checkAbsoluteRules`
  - `findBrokerForDemand`
  - `ETAPA 5` (níveis) + `ETAPA 9` + `ETAPA 8.11`
  - rebalanceamento final pós-emergência
  - função de assert da “escada de distribuição”
- `src/lib/scheduleValidator.ts`
  - adicionar regra crítica explícita da escada 1→2→3→4 para bloquear tentativa inválida no retry.

4) Resultado esperado após ajuste
- Cenário “1 vs 4” deixa de ser aceito pelo gerador.
- Se for matematicamente possível equilibrar (como você afirmou), o sistema vai encontrar via níveis + swaps + retry.
- Se uma tentativa gerar desvio, ela é descartada automaticamente antes de retornar/salvar.
