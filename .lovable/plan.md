# Plano: Redefinição de Senhas pelos Superiores Hierárquicos

## Objectivo

Permitir que:
- **Secretário Geral** redefina senhas de Secretários Distritais e Locais
- **Secretário Distrital** redefina senhas dos Secretários Locais do seu distrito

A redefinição é feita por atribuição directa de uma nova senha (não por email), já que muitos utilizadores podem não ter acesso fiável a email.

---

## 1. Nova Edge Function: `reset-user-password`

Ficheiro: `supabase/functions/reset-user-password/index.ts`

Lógica:
1. Validar JWT do chamador (caller).
2. Obter `roles` do caller via `user_roles`.
3. Receber `{ user_id, new_password }` (validar password ≥ 6 chars).
4. Carregar perfil do alvo (`profiles.tipo`) e estruturas (`user_estruturas`).
5. Regras de autorização:
   - `super_admin` → pode redefinir qualquer `admin` ou `local` (nunca outro `super_admin` nem o próprio via esta função).
   - `admin` (distrital) → só pode redefinir `local` cujo `igreja → circuito → intendencia → distrito` corresponda ao seu `distrito_id` em `user_estruturas`.
   - `local` → bloqueado (403).
6. Se autorizado, chamar `adminClient.auth.admin.updateUserById(target_id, { password })`.
7. Retornar sucesso/erro com `corsHeaders`.

Validação de jurisdição distrital (SQL via service role):
```
select i.id from igrejas i
join circuitos c on c.id = i.circuito_id
join intendencias int on int.id = c.intendencia_id
where i.id = <igreja_do_alvo> and int.distrito_id = <distrito_do_caller>
```

## 2. UI — `src/pages/Utilizadores.tsx`

- Adicionar coluna "Acções" na tabela.
- Botão "Redefinir senha" (ícone `KeyRound`) por linha, visível apenas se o caller tem permissão sobre aquele utilizador (mesma lógica do backend, replicada client-side para UX):
  - Super Admin: botão em todos excepto super_admins e ele próprio.
  - Admin distrital: botão apenas em locais do seu distrito.
- Ao clicar abre `Dialog` com:
  - Nome do utilizador alvo (read-only)
  - Campo "Nova senha" (mín. 6 caracteres) + campo "Confirmar senha"
  - Botões Cancelar / Redefinir
- `useMutation` invoca `supabase.functions.invoke("reset-user-password", { body: { user_id, new_password } })`.
- Toast de sucesso: "Senha redefinida. Comunique a nova senha ao utilizador."
- Toast de erro com mensagem do servidor.

Para o Admin distrital saber quais utilizadores são "do seu distrito", a query `all-user-estruturas` já traz `distrito_id` e `igreja_id`. Adicionar join com `igrejas → circuitos → intendencias` para mapear igreja→distrito (ou nova query).

## 3. Sem alterações de schema

Nenhuma migração SQL necessária. As permissões são aplicadas inteiramente na Edge Function com service role.

## 4. Segurança

- Senha nunca é logada.
- Função usa `verify_jwt = false` (padrão Lovable) mas valida JWT em código via `getUser()`.
- Jurisdição validada server-side — UI é apenas conveniência.
- `super_admin` não pode redefinir senha de outro `super_admin` nem do próprio (deve usar fluxo normal de "alterar senha" em Configurações).

---

## Ficheiros

| Ficheiro | Acção |
|---|---|
| `supabase/functions/reset-user-password/index.ts` | Criar |
| `src/pages/Utilizadores.tsx` | Adicionar coluna acções + dialog redefinir senha + lógica de visibilidade |
