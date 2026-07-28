# Actualizações estruturais e funcionais

## 1. BI obrigatório e único (todos, com prazo)

**BD (migração):**
- `jovens.bi_numero`: adicionar índice único parcial `UNIQUE (bi_numero) WHERE bi_numero IS NOT NULL` (já permite legados NULL).
- Novo campo `jovens.bi_pendente_ate DATE` default `2026-12-31` — só para legados sem BI.
- Trigger `BEFORE INSERT`: exigir `bi_numero NOT NULL` em novos registos.
- Trigger `BEFORE UPDATE`: se `bi_numero IS NULL` e `now() > bi_pendente_ate`, bloquear qualquer update além do próprio `bi_numero`.

**UI (`Jovens.tsx`):**
- Formulário: `bi_numero` obrigatório com validação Zod + mensagem "BI já cadastrado" em erro de unicidade.
- Banner amarelo na lista quando existem jovens sem BI: "N jovens sem BI — regularizar até 31/12/2026".
- No formulário de edição de legado sem BI: bloquear submit até preencher.

## 2. Filtros do módulo Jovens por perfil

**Super Admin (Geral):** cascata **Distrito → Intendência → Circuito → Igreja → (Semestre/Ano)**. O primeiro select é Distrito.
**Distrital:** cascata começa em **Intendência → Circuito → Igreja**, restrita ao seu distrito.
**Local:** filtro principal é **Classe** (novo, ver §5) + Semestre/Ano. Sem hierarquia geográfica.

Implementação em `src/pages/Jovens.tsx`: substituir o bloco `allFiltered` por selects encadeados condicionais em `role`.

## 3. Módulos exclusivos do Secretário Local

Ocultar completamente para Distrital e Geral (rota + sidebar + guard):
- Ocorrências
- Frequência
- Actividades

Alterações:
- `AppSidebar.tsx`: envolver estes items em `{role === 'local' && ...}`.
- `ProtectedRoute`: nova prop `localOnly` que redireciona não-locais para `/dashboard`.
- `App.tsx`: aplicar `localOnly` nas 3 rotas.

## 4. Assembleias — exclusivo do Distrital, com aprovação bloqueante

**BD:**
- `assembleias`: novas colunas `igreja_id UUID`, `jovens_base INT`, `corpo_directivo INT`, `representantes_distrito INT`, `representantes_gabinete INT`, `assistente INT`, `aprovado_em TIMESTAMPTZ`, `aprovado_por UUID`.
- RLS: só `admin`/`super_admin` (Distrital vê apenas as do seu distrito, via `user_estruturas`).
- Trigger `enforce_semester_lock`: em `jovens`, `ocorrencias`, `actividades`, `presencas` — se existe `assembleias` com `igreja_id`+`ano`+`semestre` e `estado='aprovado'`, bloquear INSERT/UPDATE/DELETE.

**UI (`Assembleias.tsx`, reescrever):**
- Só acessível a `admin` e `super_admin`; ocultar da sidebar do Local.
- Fluxo: seleccionar Igreja → data → contagens de presença → botão "Aprovar estatística" (irreversível → confirmação).
- Estados: `preparacao` → `aprovado` → `encerrado`.

**UI Local:** quando o semestre está bloqueado, todos os forms de Jovens/Ocorrências/Frequência/Actividades mostram badge "Semestre encerrado — só leitura" e desabilitam submit.

## 5. Classes (nova entidade — perfil Local)

**BD:**
```
classes (id, igreja_id, nome, guia, localizacao, coordenador)
```
- RLS: Local vê/gere só as da sua igreja; Distrital/Geral leitura na sua jurisdição.
- `jovens.classe_id UUID NULL REFERENCES classes(id)` — cada jovem numa única classe.

**UI:**
- Nova página `src/pages/Classes.tsx` (só Local) — CRUD com campos: Nome, Guia, Localização, Coordenador.
- Sidebar: novo item "Classes" só para Local.
- Formulário de Jovem: novo select "Classe" (obrigatório para Local, opcional para admins).
- Mapa Estatístico (`MapaEstatistico.tsx`): novo filtro "Classe" no topo.
- Dashboard do Local: novo card "Ranking de Classes" (BarChart horizontal ordenado por nº de membros activos).

## 6. Alertas e ciclo do semestre

- Helper `src/lib/semestre.ts`: calcula semestre corrente (1: Jan–Jun, 2: Jul–Dez) e dias até ao fim.
- Banner global no topo do `DashboardLayout` para Locais quando faltam ≤ 30 dias: "Semestre X/AAAA termina em N dias — submeta o Mapa Estatístico".
- Cadastro de jovem: `semestre` e `ano_semestre` obrigatórios (defaults = semestre corrente).
- Botão "Renovar para o próximo semestre" no perfil do jovem (Local): duplica o registo com `semestre+1`/novo ano, mantendo dados e permitindo actualizar `activo`/`motivo_inactividade`. No arranque de cada semestre, lista "Jovens por renovar".

## 7. Transferência automática para OJA aos 26

**BD:** view/RPC `jovens_a_transferir()` — jovens com `is_oja=false`, `activo=true`, idade ≥ 26.
**UI:** novo sino de notificações no header para Local; badge com contagem. Ao abrir, lista com nome + botão "Transferir para Organização de Jovens Adultos" que faz `UPDATE jovens SET is_oja=true`. Uma vez transferido, sai automaticamente de todas as contagens (o `public_dashboard_stats` e o dashboard interno já filtram `is_oja=false`; confirmar em todos os `count`).

## 8. Redesign do Dashboard

- Paleta distinta por série: usar tokens semânticos `--chart-1..--chart-5` (já disponíveis em `index.css` do shadcn); actualizar `Dashboard.tsx` para atribuir cores diferentes por categoria comparada (barras de "Categoria" com cor por barra, pie de género com cores distintas, etc.).
- Filtro do Dashboard replica o de Jovens (Distrito/Intendência/… conforme perfil).
- Adicionar o card "Ranking de Classes" no perfil Local.

---

## Detalhes técnicos

**Migrações necessárias (1 migração):**
1. `ALTER TABLE jovens ADD COLUMN classe_id UUID REFERENCES classes(id)`, `bi_pendente_ate DATE`; índice único parcial em `bi_numero`.
2. `CREATE TABLE classes` + GRANTs + RLS.
3. `ALTER TABLE assembleias` — colunas de presença e aprovação.
4. Trigger `enforce_semester_lock` aplicado a jovens/ocorrencias/actividades/presencas.
5. Trigger de BI obrigatório em jovens.
6. RPC `jovens_a_transferir()`.

**Ficheiros a criar:**
- `src/pages/Classes.tsx`
- `src/lib/semestre.ts`
- `src/components/NotificacoesOja.tsx`

**Ficheiros a editar:**
- `src/pages/Jovens.tsx` (filtros por perfil, BI obrigatório, Classe no form)
- `src/pages/Dashboard.tsx` (cores, filtros, ranking de classes)
- `src/pages/Assembleias.tsx` (reescrever fluxo distrital)
- `src/pages/MapaEstatistico.tsx` (filtro Classe)
- `src/pages/Ocorrencias.tsx`, `Frequencia.tsx`, `Actividades.tsx` (localOnly + respeitar bloqueio)
- `src/components/AppSidebar.tsx`, `src/components/ProtectedRoute.tsx`, `src/App.tsx`, `src/components/DashboardLayout.tsx`

**Fora do âmbito** (confirmar depois se querem): notificações por email, exportação do M.E.O já com filtro por classe no PDF (fica só a filtragem em ecrã nesta iteração — posso incluir no PDF se quiser).
