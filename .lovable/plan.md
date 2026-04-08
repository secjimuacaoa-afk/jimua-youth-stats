

# Plano de Implementação — JIMUA Sistema Estatístico (Fase Backend + Funcionalidades Core)

Este é um plano abrangente dividido em 4 fases sequenciais. Dado o tamanho, recomendo implementar **uma fase de cada vez**.

---

## Fase 1: Base de Dados e Autenticação

### Tabelas a criar (migração SQL)

1. **`profiles`** — dados do utilizador (linked to `auth.users`)
   - `id` (uuid, FK auth.users), `nome_completo`, `tipo` (enum: admin/local), `activo`, `created_at`

2. **`user_roles`** — tabela de roles separada (segurança)
   - `id`, `user_id` (FK auth.users), `role` (enum: admin/local)

3. **`estruturas`** — hierarquia eclesiástica
   - `id`, `intendencia`, `circuito`, `cargo_pastoral`, `created_at`

4. **`user_estruturas`** — relação utilizador ↔ estrutura
   - `id`, `user_id`, `estrutura_id`

5. **`jovens`** — registo individual
   - `id`, `nome`, `sexo`, `data_nascimento`, `categoria`, `escolaridade`, `ocupacao`, `estado_civil`, `activo`, `motivo_inactividade`, `origem`, `estrutura_id`, `created_by`, `created_at`, `updated_at`

6. **`relatorios`** — relatórios semestrais
   - `id`, `estrutura_id`, `ano`, `semestre`, `status` (enum: rascunho/submetido/aprovado/rejeitado), `data_submissao`, `comentario_admin`, `created_by`, `created_at`

### RLS Policies
- Admin vê tudo; Local vê apenas dados da sua estrutura
- Função `has_role()` (SECURITY DEFINER) para evitar recursão
- Trigger para criar perfil automaticamente no signup

### Autenticação
- Login real com `supabase.auth.signInWithPassword()`
- Sem auto-registo — admin cria utilizadores via `supabase.auth.admin.createUser()` (edge function)
- Edge function `create-user` para criação segura de utilizadores pelo admin
- Protecção de rotas com `AuthProvider` e redirect para login
- Logout funcional no sidebar

---

## Fase 2: CRUD Completo (Dados Reais)

### Estruturas
- Formulário de criação/edição com intendência, circuito, cargo pastoral
- Listagem dinâmica do banco de dados

### Jovens
- Formulário completo ligado ao Supabase (INSERT/UPDATE)
- Parte etária calculada automaticamente a partir da data de nascimento
- Filtros por intendência, circuito, categoria, estado
- Pesquisa por nome
- Local vê apenas jovens da sua estrutura

### Utilizadores (apenas admin)
- Criação de utilizadores via edge function
- Associação obrigatória a uma estrutura (para tipo local)
- Activar/desactivar utilizadores

### Relatórios
- Criação de relatório semestral (rascunho)
- Submissão pelo secretário local
- Aprovação/rejeição pelo admin com comentário

---

## Fase 3: Mapa Estatístico Automático

### Lógica de cálculo (client-side ou edge function)
- **Número anterior**: COUNT jovens activos no semestre anterior
- **Número actual**: COUNT jovens activos no semestre corrente
- **Crescimento**: actual - anterior (absoluto e percentual)
- **Ocorrências**: agrupamento pelo campo `origem` (A, A1, A2, B, B1)
- **Diferenças**: agrupamento pelo campo `motivo_inactividade` (C, D, E, F, G, G1)
- **Distribuições**: sexo, parte_etaria, categoria, escolaridade, ocupação, estado_civil

### Dashboard dinâmico
- Admin: dados globais com filtro por intendência/circuito/cargo pastoral
- Local: dados da sua unidade apenas
- Gráficos de barras para distribuições
- Indicadores: taxa de abandono, % estudantes, distribuição por género/etária

---

## Fase 4: Exportação de Relatórios

### PDF
- Layout institucional com logotipo JIMUA
- Cabeçalho: Intendência, Circuito, Cargo Pastoral, Ano, Semestre
- Mapa estatístico completo em tabelas formatadas
- Gerado client-side com biblioteca como `jspdf` + `jspdf-autotable`

### Excel (.xlsx)
- Mapa estatístico em folha formatada
- Usando `xlsx` ou `exceljs` no browser
- Cabeçalhos com cores institucionais (azul escuro)

### Word (.docx)
- Usando `docx` no browser
- Layout semelhante ao PDF com tabelas e logotipo

---

## Resumo Técnico

| Componente | Tecnologia |
|---|---|
| Auth | Lovable Cloud Auth (email/password) |
| DB | 6 tabelas + RLS + triggers |
| Edge Functions | `create-user` (admin cria utilizadores) |
| Exportação | jspdf, exceljs, docx (client-side) |
| State | React Query + Supabase client |

### Ordem de implementação recomendada
1. Fase 1 (DB + Auth) — fundação obrigatória
2. Fase 2 (CRUD) — funcionalidade core
3. Fase 3 (Estatísticas) — valor principal do sistema
4. Fase 4 (Exportação) — entrega final

