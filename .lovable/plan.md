

# Criar Utilizador Secretário Local para Testes

## Dados do utilizador
- **Email**: secretario@jimua.org
- **Senha**: Local123456
- **Nome**: Secretário Local Belém
- **Tipo**: local
- **Igreja**: Belém (Circuito Rangel, Intendência Luanda-Cazenga) — ID: `7e1defe9-8e1a-4a4c-9b4a-c8e50feb8f47`

## Abordagem

Invocar a edge function `create-user` já existente, autenticado como o admin (`admin@jimua.org`). A função já:
1. Cria o utilizador via `auth.admin.createUser()`
2. O trigger `handle_new_user` cria perfil + role automaticamente
3. Associa o utilizador à igreja via `user_estruturas`

## Passos
1. Fazer login como admin via Supabase Auth para obter token
2. Chamar `create-user` com o token do admin e os dados do novo utilizador local
3. Confirmar que o utilizador, perfil, role e associação à igreja foram criados

Não é necessário criar nenhuma função temporária — a infraestrutura já existe.

