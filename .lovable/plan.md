

## Plano: Criar migração SQL para as tabelas do módulo de Estoque

### Situação

Na implementação da Fase 1, foram criados todos os arquivos de frontend (layout, sidebar, 3 páginas de CRUD, auditoria), mas a **migração SQL nunca foi gerada**. As tabelas não existem no banco, por isso nada funciona.

### O que será feito

Criar uma migração SQL única contendo:

1. **8 tabelas**:
   - `estoque_locais_armazenamento` (id, unidade_id FK ferias_unidades, nome, tipo, parent_id self-ref, is_active, created_at, updated_at)
   - `estoque_materiais` (id, nome, descricao, unidade_medida, categoria, estoque_minimo, is_active, created_at, updated_at)
   - `estoque_saldos` (id, material_id, local_armazenamento_id, quantidade, updated_at) com UNIQUE(material_id, local_armazenamento_id)
   - `estoque_gestores` (id, user_id FK auth.users, unidade_id FK ferias_unidades, nome_gestor, created_at)
   - `estoque_solicitacoes` (id, solicitante_user_id FK auth.users, solicitante_nome, unidade_id, status, observacoes, created_at, updated_at)
   - `estoque_solicitacao_itens` (id, solicitacao_id, material_id, quantidade_solicitada, quantidade_atendida, local_armazenamento_id)
   - `estoque_movimentacoes` (id, material_id, tipo, quantidade, local_origem_id, local_destino_id, solicitacao_id, responsavel_user_id, recebido_por_user_id, recebido_em, observacoes, created_at)
   - `estoque_notificacoes` (id, user_id, tipo, referencia_id, referencia_tipo, mensagem, lida, created_at)

2. **RLS policies** para todas as tabelas (authenticated users com acesso ao sistema estoque)

3. **Triggers**:
   - `handle_updated_at` nas tabelas com `updated_at`
   - `audit_module_changes` estendido para tabelas `estoque_*` com `module_name = 'estoque'` (atualizar a função existente via `CREATE OR REPLACE`)

### Arquivo impactado

- Nova migração SQL via migration tool (1 arquivo)

