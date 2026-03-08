

## Plano: Modulo de Gestao de Estoques (4 Fases) - Ajustado

### Ajustes aplicados

1. **Solicitantes**: qualquer usuario com acesso ao sistema `estoque` (view_only ou view_edit) pode solicitar materiais. Nao depende de ser "chefe" cadastrado no modulo de ferias.
2. **Sem PDF de protocolo**: removido. Substituido por historico completo de movimentacoes/recebimentos consultavel por nome, material, unidade, data.
3. **Pagina de auditoria**: adicionada, seguindo o mesmo padrao de Escalas e Vendas (`AuditLogsPanel` com `defaultModule="estoque"`).

---

### Estrutura do banco (tabelas novas)

```text
estoque_locais_armazenamento
  id, unidade_id (-> ferias_unidades), nome, tipo (deposito/armario/prateleira),
  parent_id (-> self), is_active, created_at, updated_at

estoque_materiais
  id, nome, descricao, unidade_medida, categoria,
  estoque_minimo, is_active, created_at, updated_at

estoque_saldos
  id, material_id, local_armazenamento_id, quantidade, updated_at
  UNIQUE(material_id, local_armazenamento_id)

estoque_gestores
  id, user_id (-> auth.users), unidade_id (-> ferias_unidades),
  nome_gestor, created_at

estoque_solicitacoes
  id, solicitante_user_id (-> auth.users), solicitante_nome,
  unidade_id, status (pendente/aprovada/separada/entregue/cancelada),
  observacoes, created_at, updated_at

estoque_solicitacao_itens
  id, solicitacao_id, material_id, quantidade_solicitada,
  quantidade_atendida, local_armazenamento_id

estoque_movimentacoes
  id, material_id, tipo (entrada/saida/transferencia/ajuste),
  quantidade, local_origem_id, local_destino_id,
  solicitacao_id (nullable), responsavel_user_id,
  recebido_por_user_id, recebido_em (timestamp),
  observacoes, created_at

estoque_notificacoes
  id, user_id, tipo, referencia_id, referencia_tipo,
  mensagem, lida, created_at
```

Trigger `audit_module_changes` sera estendido para incluir tabelas `estoque_*` com `module_name = 'estoque'`.

---

### Paginas do modulo

| Rota | Pagina |
|------|--------|
| `/estoque` | Dashboard |
| `/estoque/materiais` | CRUD materiais |
| `/estoque/locais` | Arvore de locais por unidade |
| `/estoque/saldos` | Consulta de saldos |
| `/estoque/solicitacoes` | Solicitacoes (criar/gerenciar) |
| `/estoque/movimentacoes` | Historico completo (busca por nome, material, unidade, data) |
| `/estoque/notificacoes` | Central de notificacoes |
| `/estoque/gestores` | Gestores por unidade |
| `/estoque/auditoria` | Auditoria (AuditLogsPanel module=estoque) |
| `/estoque/perfil` | Perfil |
| `/estoque/usuarios` | Gerenciamento de usuarios (admin) |

---

### Fluxo de solicitacao e historico

```text
USUARIO (com acesso)         GESTOR (da unidade)
      |                           |
  1. Cria solicitacao -----> 2. Notificacao
      |                     3. Separa / Entrega
      |                     4. Registra movimentacao
      |                        (saida do estoque)
  5. Recebe notificacao      |
  6. Confirma recebimento    |
      |                     7. Movimentacao atualizada
      |                        com recebido_por + timestamp
```

Todo esse fluxo fica registrado em `estoque_movimentacoes` e consultavel na pagina de Movimentacoes com filtros por:
- Nome do solicitante / recebedor
- Material
- Unidade
- Tipo de movimentacao
- Periodo

---

### Fase 1 (Base)

**Banco**: Criar todas as 8 tabelas, RLS policies, triggers de audit e updated_at. Adicionar `'estoque'` ao `system_access`. Estender `audit_module_changes` para tabelas estoque.

**Frontend**: 
- `EstoqueLayout`, `EstoqueSidebar` (mesmo padrao de FeriasLayout/VendasLayout)
- Rotas em `App.tsx`
- `SystemName` type atualizado para incluir `"estoque"`
- `SelectSystem` com card do estoque
- CRUD de materiais (`/estoque/materiais`)
- CRUD de locais de armazenamento (`/estoque/locais`) com arvore hierarquica
- Pagina de gestores por unidade (`/estoque/gestores`)

**Arquivos novos**: ~10 (layout, sidebar, 3 paginas, migrations)
**Arquivos editados**: `useSystemAccess.ts`, `App.tsx`, `SelectSystem.tsx`, `AuditLogsPanel.tsx`

---

### Fase 2 (Operacional)

- Pagina de solicitacoes: criar, aprovar, separar, entregar, cancelar
- Gestao de saldos: entrada manual, ajuste
- Transferencias entre locais/unidades com registro automatico em movimentacoes
- Confirmacao de recebimento pelo usuario
- Alertas visuais de estoque baixo na pagina de saldos

**Arquivos novos**: ~5 (paginas + componentes de dialog)

---

### Fase 3 (Comunicacao)

- Notificacoes in-app (badge no sidebar + pagina de notificacoes)
- Notificacao automatica ao gestor quando nova solicitacao
- Notificacao ao solicitante quando material separado/entregue
- Alerta de estoque baixo como notificacao ao gestor

**Arquivos novos**: ~3 (pagina notificacoes, hook, componente badge)

---

### Fase 4 (Historico e Relatorios)

- Pagina de movimentacoes com filtros avancados (nome, material, unidade, tipo, periodo)
- Pagina de auditoria (`AuditLogsPanel` com module=estoque)
- Dashboard com resumos (solicitacoes pendentes, alertas de estoque baixo, ultimas movimentacoes)
- Exportacao de relatorios

**Arquivos novos**: ~3 (paginas)
**Arquivos editados**: `AuditLogsPanel.tsx` (adicionar labels estoque)

---

### Reaproveitamento de estrutura organizacional

O modulo usa diretamente `ferias_unidades` e `ferias_setores` (somente leitura). Qualquer alteracao na estrutura organizacional no modulo de ferias reflete automaticamente no estoque. Nenhuma duplicidade de dados.

