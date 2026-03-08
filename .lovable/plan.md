

## Plano: Remover senha do Deploy Guide + Revisar e completar o guia

### Parte 1: Remover autenticação do DeployGuide

A página `/dev/deploy-guide` atualmente exige o código `EXECUT2026` (desatualizado). Remover toda a lógica de autenticação, deixando apenas o conteudo do guia acessivel diretamente.

### Parte 2: Lacunas identificadas no guia atual

Apos analise do projeto, os seguintes pontos estao faltando ou incompletos:

**1. Migracao de Auth Users**
O `pg_dump --schema=public` nao exporta a tabela `auth.users` (schema `auth`). Sem isso, todos os usuarios perdem acesso. Precisa incluir instrucoes para exportar `auth.users` e `auth.identities` separadamente.

**2. Edge Functions**
O projeto tem 4 Edge Functions (`invite-user`, `list-users`, `manage-user`, `deactivate-expired-notice`). O guia menciona que "rodam via Deno Deploy local" mas nao explica como fazer o deploy delas no Supabase self-hosted. Precisa de um passo dedicado com `supabase functions deploy`.

**3. Migracoes SQL**
Ha uma pasta `supabase/migrations/` com migrations. O guia nao menciona a execucao dessas migrations caso o `pg_dump` nao seja suficiente ou para setup do zero.

**4. Configuracao SMTP para emails**
O sistema envia convites por e-mail (invite-user). No Supabase self-hosted, o SMTP precisa ser configurado manualmente no `.env` do Docker (variaveis `SMTP_HOST`, `SMTP_PORT`, etc). Sem isso, convites e recuperacao de senha nao funcionam.

**5. Storage / Buckets**
Se o projeto usa Storage do Supabase, precisa migrar os buckets tambem.

**6. Proxy do Supabase incompleto**
O Nginx faz proxy de `/supabase/` para `http://host.docker.internal:8000/`, mas o frontend aponta `VITE_SUPABASE_URL` diretamente para a API. Precisa alinhar: ou o frontend aponta para o proxy, ou o Nginx faz proxy de endpoints especificos (`/rest/`, `/auth/`, `/realtime/`, `/storage/`).

**7. HTTPS completo**
O bloco HTTPS esta comentado e incompleto. Precisa do config completo com redirect HTTP->HTTPS e headers de seguranca.

**8. Backup automatizado**
Menciona backup mas nao da o script completo para agendar no Task Scheduler.

**9. Docker Desktop em producao**
Docker Desktop exige licenca paga para uso comercial. Alternativa: instalar Docker Engine diretamente no WSL2 (gratuito).

### Implementacao

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/DeployGuide.tsx` | Remover auth gate, adicionar Steps 3.5 (Auth migration), Step 4.5 (Edge Functions deploy), Step 2.5 (SMTP config), melhorar Step 5 (Nginx completo com HTTPS), adicionar nota sobre licenca Docker Desktop, script de backup |

Um unico arquivo modificado. O guia passara de 8 para ~10 passos cobrindo todos os aspectos necessarios para o sistema funcionar completamente no servidor.

