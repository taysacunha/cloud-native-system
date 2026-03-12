

## Diagnóstico e Correções

### Problema 1: Taysa não consegue definir senha

**Causa provável:** O metadado `password_set` no perfil dela no Supabase já está marcado como `true`, mesmo que ela nunca tenha definido a senha. Isso faz com que:
- O sistema não mostre mais como "Pendente" (pois `password_set = true`)
- A tela de login redireciona direto para home ao invés de mostrar o formulário de definição de senha
- Mas ela não consegue logar porque nunca definiu uma senha de fato
- O botão "Reenviar convite" é bloqueado porque o sistema acha que ela já está ativa (linha 162 do invite-user)

**Solução recomendada (manual no Supabase Dashboard):**
1. Ir em Authentication > Users no Supabase
2. Encontrar a Taysa
3. Deletar o usuário
4. Convidá-la novamente pelo sistema

**Alternativa:** Usar o "Esqueci minha senha" na tela de login com o email da Taysa. Isso envia um link de recovery que permite definir uma nova senha independente do estado do metadado.

### Problema 2: Cor do ícone de Estoque diferente

No `SelectSystem.tsx`, o ícone do Estoque usa `text-amber-600` (laranja) enquanto os outros usam `text-primary` (verde do sistema). Vou padronizar para `text-primary`.

**Arquivo:** `src/pages/SelectSystem.tsx` (linha 66)
- De: `<Package className="h-8 w-8 text-amber-600" />`
- Para: `<Package className="h-8 w-8 text-primary" />`

