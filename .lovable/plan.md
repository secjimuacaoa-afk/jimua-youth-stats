# Reformulação Completa — JIMUA Analytics

Entrega em três blocos técnicos executados sequencialmente na mesma iteração. Sem quebra de dados existentes: todos os campos novos são opcionais.

---

## Bloco 1 — Base de dados e regras

### Novas tabelas

- **contactos** — nome, cargo, telefone, whatsapp, email, estrutura_tipo (distrito/intendência/circuito/igreja/nacional), estrutura_id, foto_url, notas, criado_por.
- **periodos_estatisticos** — ano, semestre (1 ou 2), igreja_id, estado (aberto/consolidado); único por (igreja, ano, semestre).
- **assembleias** — ano, semestre, data, estrutura (nacional/distrito), estrutura_id, estado (preparação/revisão/aprovada/encerrada), observações, responsável.
- **ocorrencias** — jovem_id, ano, semestre, data, tipo_categoria (entrada/saída), tipo_codigo (vindo_classe_infantil, vindo_denominacao, evangelizado, ingresso_voluntario, ausente_estudo, ausente_saude, ausente_trabalho, transferido, desistente, falecido), motivo, observações, criado_por. Aplica automaticamente `activo=false` + motivo_inactividade quando é saída.
- **actividades** — igreja_id, ano, semestre, mês, data, tipo (culto, estudo_biblico, evangelizacao, seminario, congresso, acampamento, retiro, conferencia, accao_social, visita_missionaria, outra), local, descrição, criado_por.
- **presencas** — actividade_id, jovem_id, estado (presente/ausente/justificado). Único por (actividade, jovem).

### Extensões a tabelas existentes

- **jovens**: `foto_url, bi_numero, bi_data_emissao, bi_validade, nif, nacionalidade, naturalidade, endereco, bairro, municipio, provincia, telefone, whatsapp, email, profissao` (todos opcionais).
- **profiles**: sem alterações.

### Funções e triggers

- `has_jurisdiction(user_id, igreja_id)` — verifica se o utilizador tem acesso à igreja (via distrito → intendência → circuito).
- `ocorrencia_apply_estado()` — trigger AFTER INSERT em `ocorrencias` que actualiza `jovens.activo` e `motivo_inactividade` conforme o tipo (nunca sobrescreve dados pessoais).
- `mapa_estatistico(igreja_id, ano, semestre)` — RPC que devolve JSON com todos os totais no formato exacto do M.E.O anexo: N.º Anterior (Real/Físico), Ocorrências (A, A1, A2, B, B1, C, D), N.º Actual (Real2), Diferenças (E, F, G, G1), N.º Actual (Físico2), Parte Etária (H, I), Categoria (J, K, L), Escolaridade (M, N, O, P, P1, P2, Q), Ocupação (R–X1), Estado Civil (Y, Z). Cálculo: N.º Actual = N.º Anterior + Entradas − Saídas.
- `fmr_calcular(escopo, id, ano, semestre)` e `fma_calcular(escopo, id, ano, semestre)` — RPCs para Frequência Média nas Reuniões e nas Actividades, com agregação recursiva por igreja → circuito → intendência → distrito → conferência.
- Bloqueio: quando `assembleias.estado='encerrada'` para (ano, semestre), triggers em `ocorrencias`, `actividades`, `presencas` rejeitam INSERT/UPDATE/DELETE nesse período.

### RLS

- Todas as tabelas novas: `authenticated` lê/escreve dentro da sua jurisdição (via `has_jurisdiction` e `has_role`); `super_admin` vê tudo.
- `contactos`: SELECT aberto a todos os `authenticated`; INSERT/UPDATE/DELETE apenas pelo criador ou admin/super_admin.
- GRANTs completos + `ENABLE ROW LEVEL SECURITY` em todas.

---

## Bloco 2 — Backend/lógica partilhada (frontend)

- **`src/lib/estatistica.ts`** — funções auxiliares que chamam `mapa_estatistico`, `fmr_calcular`, `fma_calcular` e devolvem estruturas prontas para gráficos.
- **`src/lib/pdf.ts`** — gerador PDF unificado usando `jspdf` + `jspdf-autotable`:
  - Cabeçalho: "Igreja Metodista Unida" (linha 1, bold), "Conferência Anual do Oeste de Angola" (linha 2), logo JIMUA (`src/assets/logo-jimua.png`) alinhado à direita.
  - Rodapé: duas linhas de assinatura lado a lado — "O Secretário" e "O Director" — com espaço em branco por cima.
  - Numeração de páginas + data de exportação.
  - Usado por: Mapa Estatístico, Relatório de Frequência, Lista de Jovens, Estatísticas gerais.
- **`src/components/charts/`** — wrappers Recharts (já disponível): `BarChartCard`, `PieChartCard`, `CompareChartCard` (comparação por categoria com barras agrupadas).

---

## Bloco 3 — UI e navegação

### Sidebar nova ordem
Dashboard · Jovens · Ocorrências · Frequência · Actividades · Assembleias · Mapa Estatístico · Estruturas · Contactos · Utilizadores · Configurações.

### Dashboard (`src/pages/Dashboard.tsx`)
- Filtros hierárquicos (Distrito → Intendência → Circuito → Igreja) que **efectivamente recomputam** todos os KPIs e gráficos (bug actual).
- Gráficos Recharts: barras (categoria, escolaridade, ocupação), pizza (sexo, estado civil, faixa etária), comparação agrupada por categoria entre semestres.
- Cards: Total, Activos/Inactivos %, Novos no mês/ano, Distribuição M/F, OJA vs Juvenis.

### Estruturas (`src/pages/Estruturas.tsx`)
Redesign em árvore expansível (accordion aninhado): Distrito ▸ Intendências ▸ Circuitos ▸ Igrejas. Cada nó tem contador de subordinados e acções (criar/editar/eliminar) conforme papel.

### Jovens (`src/pages/Jovens.tsx`)
- Filtro passa a começar por **Distrito** para `super_admin` (depois Intendência → Circuito → Igreja).
- Formulário de cadastro expandido em 4 abas: **Dados Pessoais**, **Documentação**, **Contactos & Endereço**, **Igreja & Estado**. Upload de fotografia para `documentos-jovens/fotos/`. Todos os novos campos opcionais.
- Botão "Registar ocorrência" abre modal que insere em `ocorrencias` (nunca edita o jovem directamente — o trigger trata do estado).
- Histórico continua em `jovens_audit`.

### Contactos (`src/pages/Contactos.tsx`, nova)
Directório com pesquisa e filtros por estrutura. Todos os autenticados vêem; qualquer autenticado cria os seus próprios; admin/super_admin editam todos. Cargo + estrutura obrigatórios.

### Ocorrências (`src/pages/Ocorrencias.tsx`, nova)
Listagem filtrável por ano/semestre/tipo/jovem. Criação a partir daqui ou da página do jovem.

### Assembleias (`src/pages/Assembleias.tsx`, nova)
CRUD com máquina de estados (Preparação → Revisão → Aprovada → Encerrada). Ao encerrar, bloqueia edição do período.

### Frequência (`src/pages/Frequencia.tsx`, nova)
Registo mensal de Cultos e Estudos Bíblicos. Grelha de presenças (Presente/Ausente/Justificado) por jovem. Cálculo FMR automático mostrado em rodapé.

### Actividades (`src/pages/Actividades.tsx`, nova)
CRUD de actividades + registo de participantes. Alimenta FMA.

### Mapa Estatístico (`src/pages/MapaEstatistico.tsx`, nova)
Reproduz visualmente o layout do M.E.O anexo (tabelas com códigos A–Z). Filtros: Ano · Semestre · Distrito · Intendência · Circuito · Igreja. Botão "Exportar PDF" gera o mapa com cabeçalho e assinaturas. Botão "Comparar" mostra semestres/anos lado a lado.

### Público
`PublicDashboard` e `PublicEstatisticas` ganham os novos gráficos Recharts (agregados apenas — sem alteração à RPC de segurança).

---

## Detalhes técnicos

- **Recharts** já está instalado no shadcn stack — usar `<ChartContainer>` do projecto para tokens semânticos.
- **jspdf-autotable** a instalar (`bun add jspdf-autotable`) para tabelas do Mapa Estatístico.
- Todo o código respeita tokens de design (`--primary`, etc.) — sem cores hard-coded.
- Novos formulários usam **Zod** para validação (nome max 200, telefone regex, email, etc.).
- Edge Functions existentes intactas.
- Migração única com todos os `CREATE TABLE` + `GRANT` + `RLS` + `POLICY` + funções + triggers, na ordem exigida.

## Ordem de execução

1. Migração SQL (Bloco 1).
2. Assets partilhados: `src/lib/pdf.ts`, `src/lib/estatistica.ts`, `src/components/charts/*`.
3. Sidebar + rotas em `App.tsx`.
4. Páginas novas (Contactos, Ocorrências, Assembleias, Frequência, Actividades, MapaEstatistico).
5. Actualizações a Dashboard, Jovens, Estruturas, Estatísticas, PublicDashboard.
6. Verificação: build, teste rápido de fluxos-chave via Playwright (login super_admin → filtrar dashboard, abrir estruturas em árvore, exportar PDF do mapa).

## Fora deste âmbito

- Migração retroactiva de dados antigos para novos campos (ficam vazios).
- OCR/leitura automática de BI.
- Notificações por email/WhatsApp.
