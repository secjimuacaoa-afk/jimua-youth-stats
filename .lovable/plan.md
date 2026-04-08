

# Plano: Reestruturar Gestão de Jovens e Estruturas Eclesiásticas

## Resumo das alterações

Duas mudanças principais pedidas:

1. **Jovens (Admin)**: Apenas visualiza, filtrado por igreja. Sem botão "Novo Jovem" para admin.
2. **Estruturas**: Cadastro hierárquico — Intendência → Circuito → Cargo Pastoral (Igreja), com edição.

---

## 1. Reestruturar a Base de Dados

A tabela `estruturas` actual é plana (3 campos texto). Vamos normalizar em 3 tabelas separadas para impor a hierarquia:

**Migração SQL:**
- Criar tabela `intendencias` (id, nome, created_at)
- Criar tabela `circuitos` (id, nome, intendencia_id FK, created_at)
- Criar tabela `igrejas` (id, nome, circuito_id FK, created_at) — substitui o conceito de "cargo pastoral"
- Migrar dados existentes da tabela `estruturas` para as novas tabelas
- Actualizar `jovens.estrutura_id` para apontar para `igrejas.id`
- Actualizar `user_estruturas.estrutura_id` para apontar para `igrejas.id`
- Manter a tabela `estruturas` antiga temporariamente até migração completa, depois removê-la
- Aplicar RLS: Admin gere tudo; Local vê apenas a sua hierarquia

**Nota sobre terminologia (dos Estatutos):**
- **Intendência** = nível intermediário entre Distrito e Igreja Local (Art. 12.º)
- **Circuito** = agrupamento de igrejas dentro da intendência
- **Cargo Pastoral / Igreja Local** = unidade operacional onde os jovens estão (Art. 13.º)

## 2. Página Estruturas — Interface com Abas/Tabs

Reestruturar a página `Estruturas.tsx` com 3 abas:

- **Aba "Intendências"**: Listar, criar e editar intendências
- **Aba "Circuitos"**: Seleccionar intendência → listar, criar e editar circuitos dessa intendência
- **Aba "Igrejas (Cargos Pastorais)"**: Seleccionar circuito → listar, criar e editar igrejas

Cada nível depende do anterior (cascata). Botões de editar em cada linha da tabela.

## 3. Página Jovens — Modo Admin (Apenas Visualização)

- **Remover** o botão "Novo Jovem" e o diálogo de criação quando `isAdmin === true`
- **Adicionar filtros hierárquicos** no topo: Intendência → Circuito → Igreja (cascata)
- Admin selecciona a igreja primeiro, depois vê a lista de jovens dessa igreja
- Manter o botão "Novo Jovem" apenas para secretários locais (tipo `local`)

## 4. Actualizar Referências

- `Jovens.tsx`: query usa `igrejas` em vez de `estruturas`
- `Utilizadores.tsx`: associação de utilizador usa `igrejas`
- `Relatorios.tsx`: relatórios associados a `igrejas`
- `Dashboard.tsx` e `Estatisticas.tsx`: ajustar queries

---

## Ficheiros a modificar/criar

| Ficheiro | Acção |
|---|---|
| Migração SQL | Criar 3 tabelas + migrar dados + RLS |
| `src/pages/Estruturas.tsx` | Reescrever com 3 abas hierárquicas + edição |
| `src/pages/Jovens.tsx` | Remover criação para admin, adicionar filtros hierárquicos |
| `src/pages/Utilizadores.tsx` | Actualizar referência de estrutura para igreja |
| `src/pages/Relatorios.tsx` | Actualizar referência |
| `src/pages/Dashboard.tsx` | Actualizar queries |
| `src/pages/Estatisticas.tsx` | Actualizar queries |

