

# Plano: Reconfiguração Inicial da Estrutura do Sistema

## Resumo

Limpar dados estruturais (intendências, circuitos, igrejas, jovens), manter apenas distritos, e restringir Super Admin a criar apenas Secretários Distritais.

---

## 1. Limpeza de Dados (via insert tool — operações DELETE)

Eliminar por ordem de dependência:
1. `jovens` (3 registos) — depende de `igrejas`
2. `jovens_audit` — depende de `jovens`
3. `user_estruturas` com `igreja_id` não nulo — associações locais
4. `igrejas` (4 registos) — depende de `circuitos`
5. `circuitos` (4 registos) — depende de `intendencias`
6. `intendencias` (3 registos)

Os 13 distritos permanecem intactos.

## 2. Restringir Super Admin — Apenas Secretários Distritais

**`src/pages/Utilizadores.tsx`** — remover `"local"` do `allowedTypes` do Super Admin:
```typescript
if (isSuperAdmin) return [
  { value: "admin", label: "Secretário Distrital" },
];
```

**`supabase/functions/create-user/index.ts`** — adicionar verificação:
- Se caller é `super_admin` e `tipo === "local"` → rejeitar com erro 403

## 3. Ocultar campos irrelevantes no formulário

No formulário de criação (Super Admin), esconder o campo "Igreja" — já que só cria distritais.

---

## Ficheiros a modificar

| Ficheiro | Acção |
|---|---|
| Dados BD | DELETE em jovens_audit, jovens, user_estruturas (igreja), igrejas, circuitos, intendencias |
| `src/pages/Utilizadores.tsx` | Super Admin só cria "admin" |
| `supabase/functions/create-user/index.ts` | Bloquear super_admin de criar "local" |

