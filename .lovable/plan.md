

# Plano: Actualização Completa JIMUA ANALYTICS

Este plano cobre todas as melhorias solicitadas em 6 blocos de trabalho.

---

## 1. Base de Dados (Migração SQL)

**Novas colunas na tabela `jovens`:**
- `documentacao` (text[] — array de strings) para armazenar tipos de documentos
- `is_oja` (boolean, default false) — flag automática para jovens >25 anos

**Tabela de auditoria:**
- Criar `jovens_audit` (id, jovem_id, campo, valor_anterior, valor_novo, alterado_por, alterado_em) para histórico de alterações

**Constraint na `user_estruturas`:**
- Adicionar unique constraint `(igreja_id)` filtrado para tipo `local` — impedir dois secretários na mesma igreja
- Implementar via trigger (pois precisa verificar o tipo do utilizador na tabela profiles)

---

## 2. Sidebar e Navegação (`AppSidebar.tsx`)

- Actualizar texto do logo: "JIMUA" → "JIMUA ANALYTICS"
- **Remover** "Relatórios" da sidebar para AMBOS os perfis (admin e local)
- Remover a rota `/relatorios` de `App.tsx`
- Manter "Estruturas" visível apenas para admin

---

## 3. Cadastro de Jovem (`Jovens.tsx`) — Formulário Expandido

**Novos campos no formulário de criação:**
- **Documentação** (multi-select com checkboxes): Cédula, BI, Passaporte, Carta de Condução, Sem documentação (exclusivo)
- **Estado** (Activo/Inactivo) — obrigatório no registo
- **Motivo de Inactividade** (condicional — aparece se Inactivo): Afastado (C), Falecido (D), Estudo/Trabalho (E), Saúde (F), Disciplinares (G), Desconhecidas (G1)

**Regra de idade (>25 anos):**
- Ao seleccionar data de nascimento, calcular idade em tempo real
- Se >25: mostrar alerta vermelho "Este jovem será classificado como Jovem Adulto (OJA) e NÃO será contabilizado nas estatísticas"
- Salvar com `is_oja = true` automaticamente

**Edição e eliminação:**
- Adicionar botão "Editar" em cada linha da tabela (abre dialog com dados preenchidos)
- Adicionar botão "Eliminar" com confirmação (dialog de alerta)
- Registar alterações na tabela `jovens_audit` via trigger de BD

---

## 4. Dashboard Diferenciado (`Dashboard.tsx`)

### Secretário Local:
- Remover: cards de "Igrejas" e "Relatórios Pendentes"
- Mostrar: nome da igreja, total de jovens locais, activos/inactivos, distribuição M/F
- Apenas dados da sua igreja

### Admin (Secretário Distrital):
- Adicionar filtros encadeados no topo: Intendência → Circuito → Igreja (ou "Todos")
- Cards dinâmicos: Total jovens, Activos, Inactivos, Crescimento
- Comparações entre igrejas (bar chart simples)
- Distribuições estatísticas visuais (género, faixa etária, categoria)
- Excluir OJA (>25 anos) de todas as contagens estatísticas

---

## 5. Estatísticas (`Estatisticas.tsx`)

- Filtrar automaticamente jovens com `is_oja = true` das estatísticas
- Adicionar botão "Exportar PDF" (gera relatório client-side com jspdf)
- Adicionar botão "Gerar Link" (cria URL de visualização read-only — pode ser simplesmente uma rota pública com query params)
- Para o secretário local: filtrar apenas dados da sua igreja

---

## 6. Utilizadores (`Utilizadores.tsx`) — Impedir Duplicação

- No dropdown de igrejas ao criar utilizador local, **ocultar** igrejas que já têm um secretário atribuído
- Consultar `user_estruturas` para identificar igrejas já ocupadas
- Mostrar label "(já atribuída)" ou simplesmente não listar

---

## Ficheiros a modificar/criar

| Ficheiro | Acção |
|---|---|
| Migração SQL | Adicionar `documentacao`, `is_oja` a jovens; criar `jovens_audit`; trigger auditoria; trigger unicidade secretário |
| `src/components/AppSidebar.tsx` | Renomear "JIMUA" → "JIMUA ANALYTICS"; remover link Relatórios |
| `src/App.tsx` | Remover rota `/relatorios` |
| `src/pages/Jovens.tsx` | Reescrever formulário (documentação, estado, idade); adicionar edição/eliminação |
| `src/pages/Dashboard.tsx` | Dashboard diferenciado admin vs local; filtros encadeados admin; excluir OJA |
| `src/pages/Estatisticas.tsx` | Excluir OJA; exportação PDF; link visualização |
| `src/pages/Utilizadores.tsx` | Filtrar igrejas já atribuídas no dropdown |

---

## Ordem de implementação

1. Migração SQL (fundação)
2. Sidebar + rotas (navegação)
3. Jovens (formulário + edição + regra idade)
4. Dashboard (diferenciação perfis + filtros)
5. Estatísticas (exclusão OJA + exportação)
6. Utilizadores (unicidade secretário)

