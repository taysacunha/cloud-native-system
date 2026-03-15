

## Correção: Inverter a lógica de sábado — priorizar externos para quem pega sábado interno

### O problema real (que você explicou claramente)

A lógica atual **pune** quem trabalha sábado interno (como Andrea), dando MENOS externos. O correto é o **oposto**:

- Andrea está **ocupada no sábado** (interno) → ela **não pode** pegar sábado/domingo externo
- Então ela deve receber **mais externos durante a semana** (seg-sex)
- Isso **libera** outros corretores (que não pegam sábado interno) para cobrir os **externos de sábado e domingo**
- Resultado: **todos os externos alocados**, com melhor distribuição

### Mudanças no `src/lib/scheduleGenerator.ts`

#### 1. Regra 10 em `checkAbsoluteRules` (~linha 1063-1075)
**Remover** o limite especial de 2 externos para Saturday workers. Eles seguem o mesmo limite que todos os outros corretores.

#### 2. Bloco de domingo em `findBrokerForDemand` (~linha 1971-1982)
**Manter** — é correto que quem pega sábado interno não pegue domingo externo. Isso LIBERA o domingo para outros.

#### 3. Limite de 2 externos em `findBrokerForDemand` (~linha 1988-2002)
**Remover** o bloqueio especial. Saturday internal workers devem seguir as mesmas regras de limite que qualquer outro corretor.

#### 4. Bloqueio de sexta em `findBrokerForDemand` (~linha 2008-2018)
**Remover** o bloqueio. Andrea pode pegar sexta tranquilamente — o sábado dela é INTERNO, não externo. Consecutivo sexta→sábado interno não é problema.

#### 5. Target de externos (~linha 2877-2886)
**Aumentar** o target para Saturday internal workers. Se o target normal é 2, o deles pode ser **2 ou até 3** (já que não podem pegar sáb/dom externo, precisam compensar em dias de semana).

#### 6. Prioridade na ordenação de candidatos
Na hora de alocar externos de **segunda a sexta**, Saturday internal workers devem ter **prioridade** (ou ao menos igualdade), pois eles têm menos dias disponíveis (sem sáb/dom).

#### 7. Warning na validação
Quando um Saturday internal worker receber 3+ externos durante a semana, emitir **warning** (não erro): "Corretor X recebeu 3 externos por estar ocupado no sábado interno".

### Resumo da filosofia invertida

| Antes (errado) | Depois (correto) |
|---|---|
| Sábado interno → menos externos | Sábado interno → mais externos na semana |
| Restringe Andrea a 1-2 | Permite Andrea ter 2-3 (compensação) |
| Sáb/Dom externos ficam sem cobertura | Outros corretores livres cobrem sáb/dom |
| Bloqueio de sexta | Sexta liberada (sábado é interno, não consecutivo externo) |

