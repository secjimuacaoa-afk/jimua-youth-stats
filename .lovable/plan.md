

# Criar Primeiro Utilizador Administrador

## Problema
A edge function `create-user` exige autenticação de um admin existente, mas ainda não existe nenhum admin no sistema. É um problema "ovo e galinha".

## Solução
Criar uma edge function temporária `seed-admin` que:
1. Cria o utilizador `admin@jimua.org` com senha `Admin123456` via `auth.admin.createUser()`
2. O trigger `handle_new_user` já existente criará automaticamente o perfil e role de admin
3. Após execução bem-sucedida, a função será eliminada

## Passos
1. **Criar** `supabase/functions/seed-admin/index.ts` — função sem autenticação que cria o admin
2. **Deploy** e **invocar** a função para criar o utilizador
3. **Eliminar** a função após confirmação de sucesso (segurança)

## Detalhes Técnicos
- Email: `admin@jimua.org`
- Senha: `Admin123456`
- Tipo: `admin`
- `email_confirm: true` para login imediato
- Metadata: `{ nome_completo: "Administrador JIMUA", tipo: "admin" }`

