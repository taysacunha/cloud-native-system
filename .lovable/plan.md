

## Analise dos alertas restantes

### Status atual apos as correcoes

As correcoes do `dev_tracker` (RLS habilitado) e `ferias_folgas_creditos` (policies restritivas) **funcionaram com sucesso** — confirmado no scan.

### Alertas restantes

**Errors (2):**

1. **Security Definer View** — ja ignorado (falso positivo intencional)
2. **jsPDF Critical Vulnerability** (supply chain) — a versao ^3.0.4 tem uma vulnerabilidade de Path Traversal (GHSA-f8cm-6447-x5h2). Como o jsPDF e usado apenas para gerar PDFs no client-side a partir de dados ja carregados, o risco pratico e **baixo** neste contexto. A correcao seria atualizar para uma versao corrigida quando disponivel, ou marcar como ignorado se aceitavel.

**Warnings (4):**

1-3. **`schedule_observations`** — 3 policies com `USING (true)` / `WITH CHECK (true)` para INSERT, UPDATE e DELETE. Qualquer usuario autenticado pode criar/editar/apagar observacoes de escala.
4. **`module_audit_logs`** — 1 policy "System can insert module_audit_logs" com `WITH CHECK (true)`. Essa e **intencional** — o trigger `audit_module_changes()` precisa inserir logs automaticamente em nome de qualquer usuario autenticado. Sem essa policy, o trigger falharia.

**Info (1):**

- **Leaked Password Protection Disabled** — configuracao no dashboard Supabase (Settings > Auth > Password Protection). Nao requer codigo, apenas habilitar no painel.

### Plano de correcao

**1. `schedule_observations` — corrigir policies permissivas**

Substituir as 4 policies `true` por policies que verificam acesso ao sistema `escalas`:

```sql
-- Remover policies permissivas
DROP POLICY "Authenticated users can delete observations" ON schedule_observations;
DROP POLICY "Authenticated users can insert observations" ON schedule_observations;
DROP POLICY "Authenticated users can update observations" ON schedule_observations;
DROP POLICY "Authenticated users can view observations" ON schedule_observations;

-- Novas policies restritivas
CREATE POLICY "Escalas users can view observations" ON schedule_observations
  FOR SELECT TO authenticated USING (can_view_system(auth.uid(), 'escalas'));

CREATE POLICY "Escalas editors can insert observations" ON schedule_observations
  FOR INSERT TO authenticated WITH CHECK (can_edit_system(auth.uid(), 'escalas'));

CREATE POLICY "Escalas editors can update observations" ON schedule_observations
  FOR UPDATE TO authenticated
  USING (can_edit_system(auth.uid(), 'escalas'))
  WITH CHECK (can_edit_system(auth.uid(), 'escalas'));

CREATE POLICY "Escalas editors can delete observations" ON schedule_observations
  FOR DELETE TO authenticated USING (can_edit_system(auth.uid(), 'escalas'));
```

**2. `module_audit_logs` INSERT `true` — ignorar (falso positivo)**

O trigger `audit_module_changes()` usa `SECURITY DEFINER` e insere logs automaticamente. A policy `true` para INSERT e necessaria para que o trigger funcione para qualquer usuario autenticado que modifica dados. Marcar como ignorado.

**3. jsPDF vulnerability — avaliar risco**

A vulnerabilidade e de Local File Inclusion, relevante apenas em ambientes server-side (Node.js). No browser, o jsPDF nao tem acesso ao sistema de arquivos. Risco pratico: **nenhum**. Recomendacao: marcar como ignorado com justificativa.

**4. Leaked Password Protection — acao manual**

Habilitar em: Supabase Dashboard > Authentication > Settings > Password Protection. Sem alteracao de codigo.

### Resumo de acoes

| Item | Acao | Tipo |
|------|------|------|
| `schedule_observations` policies | Corrigir via SQL migration | Codigo |
| `module_audit_logs` INSERT true | Ignorar (intencional) | Manual |
| jsPDF vulnerability | Ignorar (browser-only) | Manual |
| Security Definer View | Ja ignorado | — |
| Leaked Password Protection | Habilitar no dashboard | Manual |

