

## Plano: Popular o Dev Tracker com todas as funcionalidades desenvolvidas

Após análise completa do projeto, identifiquei as funcionalidades por sistema. O plano é inserir registros na tabela `dev_tracker` via SQL com todos os itens abaixo. As horas e valores serão estimativas baseadas na complexidade do código (linhas, componentes, lógica).

### Inventário de funcionalidades por sistema

**1. Login / Infraestrutura** (~14 itens)
- Autenticação (login, registro, recuperação de senha, validação de força)
- Seleção de sistema (tela multi-sistema)
- Gerenciamento de usuários (CRUD, convite por e-mail, roles)
- Sistema de roles (super_admin, admin, manager, supervisor, collaborator, broker)
- Controle de acesso por sistema (system_access com view/view_edit)
- RoleGuard e ProtectedRoute
- Controle de sessão única (useSessionControl)
- Logout por inatividade (useInactivityLogout)
- Primeiro admin setup (FirstAdminSetup)
- Edge Functions (invite-user, list-users, manage-user, deactivate-expired-notice)
- Perfil do usuário
- Logs de auditoria por módulo (AuditLogsPanel)
- Code splitting e lazy loading
- Componentes reutilizáveis (TableControls, paginação, busca, ordenação)

**2. Sistema de Escalas (Plantões)** (~12 itens)
- Dashboard com estatísticas (gráficos, top corretores/locais)
- CRUD de corretores (com disponibilidade por dia/turno)
- CRUD de locais (internos/externos, configuração de períodos)
- Gerador automático de escalas (~4500 linhas de lógica)
- Calendário de escalas (visualização e edição)
- Substituição e troca de plantões
- Fila de rodízio por local (location_rotation_queue)
- Fila de rodízio de sábado (saturday_rotation_queue)
- Validador de regras de escala
- Relatórios e consultas (5 abas: básico, performance, distribuição, temporal, local)
- Exportação PDF de escalas
- Histórico mensal agregado (assignment_history_monthly)

**3. Sistema de Vendas** (~10 itens)
- Dashboard com resumo de VGV, vendas, propostas
- CRUD de equipes de vendas
- CRUD de corretores de vendas
- Registro de vendas (com valor proporcional por corretor)
- Gestão de propostas
- Gestão de leads mensais
- Avaliações C2S (14 critérios, cálculo automático, classificação)
- Ranking de corretores e equipes
- Relatórios de vendas (PDF individual por corretor)
- Logs de auditoria de vendas

**4. Sistema de Férias / Folgas** (~16 itens)
- Dashboard de férias
- Estrutura organizacional (unidades, setores, equipes, cargos)
- CRUD de colaboradores (com filtros avançados)
- Gestão de férias (programação, aprovação, gozo, redução)
- Gerador automático de férias
- Gestão de folgas (gerador, mover, trocar, remover, perda)
- Folgas de sábado por setor
- Formulário anual de férias
- Calendário (férias, folgas, aniversariantes)
- Aniversariantes
- Créditos de férias
- Configurações (feriados, folgas, quinzenas, regras, avançado)
- Relatórios (consulta geral, PDF de aniversariantes, formulário, exceções, contador)
- Atualização automática de status de férias (função SQL)

**5. Sistema de Estoque** (~10 itens)
- Dashboard de estoque
- CRUD de materiais (com categorias)
- CRUD de locais de armazenamento
- Gestão de saldos
- Solicitações de materiais (workflow com status)
- Movimentações de estoque (entrada/saída)
- Notificações de estoque
- Gestão de gestores (vínculo unidade-usuário)
- Logs de auditoria de estoque
- Controle de acesso por unidade (useUsuarioUnidades)

### Implementação

Será executado um INSERT em massa na tabela `dev_tracker` com todos os registros acima, com estimativas de horas baseadas na complexidade real do código. Os valores (R$) serão deixados em 0 para você preencher manualmente pela interface, já que esse é o custo comercial que só você define.

| Arquivo | Alteração |
|---------|-----------|
| Migration SQL | INSERT de ~62 registros na tabela `dev_tracker` |

Nenhuma alteração de código frontend necessária — apenas dados.

