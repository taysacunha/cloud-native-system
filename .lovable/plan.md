
Objetivo: parar de tentar “adivinhar Andrea” no fim da geração e tratar a causa real no começo do fluxo: descobrir exatamente em quais locais externos ela está vinculada e, se ela estiver vinculada e elegível, impedir que o gerador deixe plantões externos vagos antes de tentar completá-la.

Diagnóstico do código atual:
- A resposta para “em quais locais externos Andrea está cadastrada como disponível?” já existe no backend, mas hoje não é exposta de forma broker-cêntrica.
- A lista de elegibilidade nasce em `src/lib/scheduleGenerator.ts` quando os externos são carregados com `locations.location_brokers` e cada vínculo passa por `isBrokerAvailableForShiftWithReason(...)`:
  - dia global do corretor
  - turno global do corretor
  - restrição local do vínculo
  - fallback legacy `available_morning/available_afternoon`
- Só depois disso entra `findBrokerForDemand(...)`, que ordena fila e aplica bloqueios. Então hoje faltam duas coisas:
  1. uma visão direta dos locais externos da Andrea;
  2. uma etapa de “resgate” para não deixar externo sem alocação enquanto existe corretor abaixo da meta com vínculo elegível.

Plano de implementação:
1. Criar um relatório broker-cêntrico de vínculos externos
- Em `src/lib/scheduleGenerator.ts`, montar um mapa por corretor com:
  - locais externos vinculados;
  - para cada local, em quais dias/turnos da semana ele ficou:
    - elegível;
    - excluído por dia global;
    - excluído por turno global;
    - excluído por restrição local;
    - sem demanda configurada no período.
- Isso responde exatamente a pergunta “Andrea está disponível em quais locais externos?”.

2. Expor esse relatório na validação, sem criar outra aba “forense genérica”
- Em `src/components/ValidationReportPanel.tsx`, adicionar uma seção direta por corretor:
  - “Locais externos vinculados”
  - “Locais elegíveis nesta semana”
  - “Locais vinculados, mas bloqueados”
- Prioridade: mostrar Andrea claramente, sem depender de interpretação de rejeições espalhadas.

3. Corrigir a lógica de fechamento dos externos com uma etapa de resgate por corretor subalocado
- Antes de aceitar demandas externas como não alocadas, rodar uma passada final broker-first:
  - pegar corretores com `externalShiftCount < target`;
  - olhar somente demandas restantes onde eles já são elegíveis pelo vínculo;
  - tentar alocar usando as regras absolutas reais;
  - só deixar a demanda vaga se nenhum corretor subalocado puder assumir.
- Isso evita o cenário atual: Andrea com 1 externo enquanto ainda existem externos vagos.

4. Ajustar a prioridade para não “perder” corretores com poucos vínculos
- Na escolha de candidatos, reforçar a prioridade para quem:
  - está abaixo da meta;
  - tem menos locais externos vinculados;
  - tem menos oportunidades restantes na semana.
- Isso é mais coerente com o caso Andrea do que continuar investindo em rastreio depois que a chance já passou.

5. Limpar o que não ajudou
- Reduzir o peso da instrumentação forense atual no fluxo principal.
- Manter só o que ajuda a responder:
  - onde ela está vinculada;
  - por que um vínculo não virou elegibilidade;
  - por que um externo ficou vago mesmo havendo corretor abaixo da meta.

Resultado esperado:
- Você vai conseguir ver claramente em quais locais externos Andrea está cadastrada.
- Se ela estiver vinculada e elegível para algum plantão externo restante, o gerador vai tentar fechá-lo antes de aceitar plantão vago.
- Se mesmo assim ela não puder ser alocada, o motivo aparecerá de forma objetiva no próprio vínculo/local, não numa trilha abstrata de rejeições.

Detalhes técnicos:
- Arquivos principais:
  - `src/lib/scheduleGenerator.ts`
  - `src/components/ValidationReportPanel.tsx`
  - possivelmente `src/pages/Schedules.tsx` apenas para passar o novo relatório
- Dados a reaproveitar:
  - `externalLocations.location_brokers`
  - `period_day_configs`
  - `period_specific_day_configs`
  - `period_excluded_dates`
  - `isBrokerAvailableForShiftWithReason(...)`
- Regra da correção:
  - não “forçar Andrea” ignorando regra absoluta;
  - mas também não permitir externo vazio se existir corretor subalocado já elegível pelo próprio vínculo.
