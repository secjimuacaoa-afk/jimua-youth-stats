

# Plano: Actualização Completa — Super Administrador, Hierarquia, Padronização e Acesso Público

Este plano é extenso mas necessário para cobrir todos os requisitos. Implementação em 8 blocos sequenciais.

---

## 1. Base de Dados — Migração SQL

**Novos valores nos enums:**
- `app_role`: adicionar `super_admin`
- `user_tipo`: adicionar `super_admin`

**Nova tabela `distritos`:**
- `id` (uuid), `nome` (text), `created_at` (timestamptz)
- RLS: super_admin gere tudo, authenticated pode ler
- FK: `intendencias` recebe coluna `distrito_id` (uuid, FK para distritos)

**Novos campos em `jovens`:**
- `semestre` (integer, NOT NULL DEFAULT 1) — 1 ou 2
- `ano_semestre` (integer, NOT NULL DEFAULT 2026) — ano do semestre
- `documento_url` (text, nullable) — URL do ficheiro anexo

**Storage bucket:**
- Criar bucket `documentos-jovens` (público para leitura autenticada)
- RLS: insert/select para authenticated

**Actualizar `user_estruturas`:**
- Adicionar `distrito_id` (uuid, nullable, FK para distritos) — para associar Secretários Distritais a um distrito

**Actualizar `handle_new_user` trigger:**
- Suportar `super_admin` como tipo válido

---

## 2. AuthContext — Novo papel `isSuperAdmin`

- Verificar se `user_roles` contém `super_admin`
- Expor `isSuperAdmin` no contexto
- `isAdmin` continua verdadeiro para `admin` e `super_admin` (retrocompatível)
- Adicionar `userDistrito` (string | null) para secretários distritais
- Carregar nome da igreja/distrito para a mensagem de boas-vindas

---

## 3. ProtectedRoute — Novo nível `superAdminOnly`

- Prop `superAdminOnly` para rotas exclusivas do Secretário Geral
- `adminOnly` permite `admin` e `super_admin`
- `superAdminOnly` apenas `super_admin`

---

## 4. Sidebar e Navegação

**AppSidebar:**
- Mostrar "Estruturas" para `admin` e `super_admin`
- Mostrar "Utilizadores" para `admin` e `super_admin`
- Continuar sem "Relatórios"
- Aba "Estruturas" para super_admin inclui gestão de Distritos (nova tab)

**App.tsx — Rotas públicas:**
- `/publico/dashboard` — dashboard geral (sem login)
- `/publico/estatisticas` — estatísticas distritais (sem login)
- Dados agregados apenas, sem dados individuais

---

## 5. Mensagem de Boas-Vindas (Dashboard)

No topo do dashboard:

```
Seja bem-vindo, Secretário [Tipo]
[Descrição do órgão]
```

- `super_admin` → "Secretário Geral" / "Direcção Geral"
- `admin` → "Secretário Distrital" / "Direcção Distrital — [Nome do Distrito]"
- `local` → "Secretário Local" / "[Nome da Igreja]"

---

## 6. Padronização de Nomes (CRÍTICO — substituir TODOS os códigos)

Criar mapeamentos constantes num ficheiro `src/lib/labels.ts`:

| Campo | Código interno | Label exibido |
|---|---|---|
| Categoria | J | Catecúmenos |
| Categoria | K | À Prova |
| Categoria | L | Efectivos |
| Escolaridade | M | Ensino Primário |
| Escolaridade | N | 1º Ciclo |
| Escolaridade | O | 2º Ciclo / Médio |
| Escolaridade | P | Ensino Superior |
| Escolaridade | P1 | Licenciados |
| Escolaridade | P2 | Pós-Graduandos |
| Escolaridade | Q | Fora do Sistema |
| Ocupação | R | Funcionário de Empresas |
| Ocupação | S | Educação |
| Ocupação | T | Saúde |
| Ocupação | U | Militar/Polícia |
| Ocupação | V | Serviços Religiosos |
| Ocupação | W | Comércio |
| Ocupação | X | Estudante |
| Ocupação | X1 | Sem Ocupação |
| Estado Civil | Y | Solteiro |
| Estado Civil | Z | Casado |
| Origem | A | Classe Infantil |
| Origem | A1 | Evangelizados |
| Origem | A2 | Ingresso Voluntário |
| Origem | B | Encaminhados à OJA |
| Origem | B1 | Transferidos |
| Motivo Inactividade | C | Afastado |
| Motivo Inactividade | D | Falecido |
| Motivo Inactividade | E | Estudo/Trabalho |
| Motivo Inactividade | F | Saúde |
| Motivo Inactividade | G | Disciplinares |
| Motivo Inactividade | G1 | Desconhecidas |
| Parte Etária | H | 12–17 anos |
| Parte Etária | I | 18–25 anos |

**Todos os formulários, tabelas, estatísticas e PDFs passam a mostrar APENAS as descrições completas.** Os códigos são armazenados no BD mas nunca mostrados ao utilizador.

---

## 7. Jovens — Novas funcionalidades

**Formulário:**
- Adicionar campo "Semestre" (select: 1º Semestre / 2º Semestre) + "Ano" (select com anos)
- Adicionar upload de documento (ficheiro imagem ou PDF, opcional) → armazenar no bucket `documentos-jovens`, guardar URL em `documento_url`
- Todos os selects mostram descrições completas (não códigos)

**Aba "Jovens Não Contabilizados":**
- Nova tab/secção na página Jovens para visualizar registos com `is_oja = true`
- Separar da lista principal
- Apenas visualização, sem contabilização

**Filtro por semestre:**
- Adicionar filtro no topo: "Semestre" e "Ano" para filtrar registos

---

## 8. Utilizadores — Hierarquia de criação

**Super Admin:**
- Pode criar Secretários Distritais (associados a um distrito)
- Pode criar Secretários Locais

**Secretário Distrital (admin):**
- Pode criar apenas Secretários Locais (da sua região)
- NÃO pode criar outros distritais ou super admins

**Edge function `create-user`:**
- Verificar se `super_admin` pode criar `admin`
- Verificar se `admin` pode criar `local` (apenas nas suas igrejas)
- Associar distrital a um distrito via `user_estruturas.distrito_id`

---

## Ficheiros a criar/modificar

| Ficheiro | Acção |
|---|---|
| Migração SQL | Enums, tabela distritos, colunas semestre/ano/documento_url, bucket, triggers |
| `src/lib/labels.ts` | **NOVO** — mapeamentos de códigos → descrições |
| `src/contexts/AuthContext.tsx` | Adicionar `isSuperAdmin`, `userDistrito`, info boas-vindas |
| `src/components/ProtectedRoute.tsx` | Prop `superAdminOnly` |
| `src/components/AppSidebar.tsx` | Ajustar links por role |
| `src/App.tsx` | Rotas públicas, ajustar `adminOnly` |
| `src/pages/Dashboard.tsx` | Boas-vindas dinâmicas, filtro por distrito (super admin) |
| `src/pages/Jovens.tsx` | Labels, upload, semestre, aba OJA |
| `src/pages/Estruturas.tsx` | Tab "Distritos" para super admin |
| `src/pages/Estatisticas.tsx` | Labels, filtro distrito |
| `src/pages/Utilizadores.tsx` | Hierarquia de criação, tipo distrital |
| `src/pages/PublicDashboard.tsx` | **NOVO** — dashboard público |
| `src/pages/PublicEstatisticas.tsx` | **NOVO** — estatísticas públicas |
| `supabase/functions/create-user/index.ts` | Suportar `super_admin` → `admin` |

---

## Ordem de implementação

1. Migração SQL + `labels.ts` (fundação)
2. AuthContext + ProtectedRoute (roles)
3. Sidebar + App.tsx (rotas)
4. Jovens (formulário + labels + semestre + upload + aba OJA)
5. Dashboard (boas-vindas + filtros + labels)
6. Estatísticas (labels + filtros)
7. Utilizadores + Edge function (hierarquia)
8. Páginas públicas (dashboard + estatísticas)

