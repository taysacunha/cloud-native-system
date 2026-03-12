
Objetivo: corrigir o erro no “Esqueci minha senha” e deixar claro para o usuário quando é bloqueio de frequência (rate limit), em vez de mostrar erro genérico.

Diagnóstico confirmado
- O erro atual não é “email não cadastrado” nem falha de código principal.
- Nos logs de Auth há resposta `429 over_email_send_rate_limit` no endpoint `/recover`.
- Houve envio com sucesso (`200`) pouco antes, e a nova tentativa foi feita dentro da janela de bloqueio.
- Por isso aparece “Erro ao enviar email de recuperação” (mensagem genérica do frontend).

Plano de implementação (arquivo: `src/pages/Auth.tsx`)
1) Melhorar tratamento de erro do reset
- No `handlePasswordReset`, diferenciar:
  - `429` / `over_email_send_rate_limit` / `email rate limit exceeded`
  - email inválido
  - erro genérico de rede/API
- Mostrar mensagens específicas, por exemplo:
  - “Você já solicitou recuperação há pouco. Aguarde X segundos e tente novamente.”

2) Adicionar cooldown visual no modal
- Criar estado de cooldown (ex.: `resetCooldownUntil` + contador em segundos).
- Quando houver sucesso no envio **ou** erro 429:
  - iniciar cooldown local (ex.: 60s)
  - desabilitar botão “Enviar Email de Recuperação”
  - exibir contagem regressiva no botão ou abaixo do campo.
- Enquanto cooldown ativo, bloquear nova chamada ao `resetPasswordForEmail` (evita spam de clique).

3) Tornar feedback mais confiável para o usuário
- Manter modal aberto nos erros (já acontece) com mensagem clara.
- Exibir ajuda curta:
  - “Use o e-mail atualmente cadastrado”
  - “Use sempre o link mais recente recebido por email” (links antigos podem expirar).

4) Validação de fluxo (teste funcional)
- Cenário A: primeiro envio → sucesso + cooldown inicia.
- Cenário B: tentar novamente durante cooldown → bloqueado localmente, sem chamada nova.
- Cenário C: após cooldown → permite novo envio.
- Cenário D: forçar 429 via repetição → mensagem específica de limite (não genérica).

Resultado esperado
- O usuário entende exatamente o motivo do erro.
- Reduz chamadas repetidas que batem no limite do Supabase.
- Menos frustração e menos suporte manual para recuperação de senha.
