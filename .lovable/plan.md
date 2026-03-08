

## Plano: Edge Function para registro automatico de desenvolvimento

### Contexto

Em um app frontend-only (React/Vite), nao ha como interceptar commits git diretamente. A abordagem viavel e criar uma **API (Edge Function)** que aceita registros de desenvolvimento via POST, permitindo que qualquer automacao externa (git hooks, CI/CD, scripts, ou o proprio AI) registre trabalho automaticamente.

### O que sera criado

**1. Edge Function `log-dev-work`**
- Aceita POST com autenticacao via header `x-dev-key` (mesmo codigo `S1g.D3v!Sup4b4s3`)
- Operacoes: `upsert` (criar ou atualizar horas de feature existente) e `increment` (somar horas a feature existente)
- Busca por `system_name` + `feature_name` para decidir se insere ou atualiza
- Retorna o registro criado/atualizado

Payload exemplo:
```json
{
  "action": "upsert",
  "system_name": "vendas",
  "feature_name": "Dashboard com resumo de VGV",
  "description": "Adicionado filtro por equipe",
  "hours": 2.5
}
```

Ou para somar horas a uma feature existente:
```json
{
  "action": "increment",
  "system_name": "vendas", 
  "feature_name": "Dashboard com resumo de VGV",
  "add_hours": 1.0
}
```

**2. Configuracao no `supabase/config.toml`**
- Adicionar `[functions.log-dev-work]` com `verify_jwt = false` (autenticacao via x-dev-key)

### Fluxo de uso

- **Pelo AI (eu)**: apos cada tarefa, chamo a edge function para registrar as horas
- **Por git hook**: script `post-commit` no servidor pode chamar a API
- **Por CI/CD**: step no pipeline que registra o deploy
- **Manual**: qualquer `curl` ou ferramenta HTTP

### Arquivos

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/log-dev-work/index.ts` | Nova edge function |
| `supabase/config.toml` | Adicionar config da funcao |

Nenhuma alteracao no frontend — a pagina `/dev` ja exibe os dados da tabela automaticamente.

