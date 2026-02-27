

## Problema

As edge functions existentes (`invite-user`, `manage-user`) exigem que um admin autenticado faça a chamada. Como não existe nenhum usuário no banco ainda, não há como usá-las.

A função `make_first_admin` no banco também exige um usuário já autenticado via Supabase Auth.

## Plano

### Passo 1: Criar edge function temporária `seed-admin`
Uma edge function simples que usa o `SUPABASE_SERVICE_ROLE_KEY` para:
1. Criar o usuário no Supabase Auth com `createUser()` (email + senha + email confirmado)
2. Inserir role `super_admin` na tabela `user_roles`
3. Inserir nome na tabela `user_profiles`
4. Inserir acesso aos 3 sistemas (`escalas`, `vendas`, `ferias`) com permissão `view_edit` na tabela `system_access`

A function será protegida por um token fixo no header para evitar uso indevido.

### Passo 2: Chamar a function para criar o usuário
Dados:
- Nome: Bruno Silva Morais Carneiro da Cunha
- Email: brunumorais@gmail.com
- Senha: K410.alicia
- Role: super_admin
- Sistemas: escalas, vendas, ferias (todos com view_edit)

### Passo 3: Remover a edge function temporária
Após confirmar que o usuário foi criado, deletar a function `seed-admin` do projeto.

