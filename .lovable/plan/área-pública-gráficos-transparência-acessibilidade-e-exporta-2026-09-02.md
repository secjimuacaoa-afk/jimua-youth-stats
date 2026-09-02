# Área pública: gráficos, transparência, acessibilidade e exportação

## O que será feito

### 1. Gráficos interactivos + explicação dos indicadores

No dashboard público (capa `/` e `/publico/estatisticas`), substituir as barras estáticas por gráficos Recharts com tooltip e legenda, respeitando os filtros Distrito → Intendência → Circuito → Igreja já existentes:

- **Crescimento semestral** — linha/coluna com o número de jovens por semestre, mostrando entradas e saídas de cada período.
- **Taxa de abandono** — percentagem de saídas sobre o efectivo do início do semestre, com evolução por período.
- **Distribuição por género** — gráfico circular masculino/feminino com percentagens.
- Mantêm-se faixa etária, categoria e igrejas com mais jovens, também em Recharts.

Cada indicador leva um texto curto (1–2 linhas) a explicar o que mede e como é calculado, acessível também por ícone de ajuda com descrição legível por leitores de ecrã.

Nota: as tabelas de períodos estatísticos e ocorrências ainda têm quase nenhum registo (0 períodos fechados, 1 ocorrência), por isso as séries começarão vazias/a zero e preenchem-se à medida que os secretários locais fecham semestres. Os gráficos mostram um estado "sem dados suficientes" em vez de um gráfico vazio.

### 2. Página "Sobre a Plataforma"

Nova rota pública `/sobre`, ligada no cabeçalho da capa e no rodapé, com:

- Missão da JIMUA e propósito da plataforma.
- Como os dados são recolhidos (secretário local), validados (assembleia distrital) e consolidados (fecho semestral automático: nº actual = anterior + entradas − saídas).
- Compromisso de privacidade: apenas números agregados são públicos; nomes, BI, contactos e fichas individuais nunca saem da área autenticada.
- Quem tem acesso a quê, por nível (Nacional, Distrital, Local).

### 3. Acessibilidade e responsividade da área pública

Revisão de `/`, `/sobre`, `/publico/dashboard` e `/publico/estatisticas`:

- Contraste conforme WCAG AA usando os tokens do design system (sem cores fixas).
- Tamanhos mínimos de texto legíveis e hierarquia de títulos correcta (um único H1 por página).
- Navegação completa por teclado: foco visível, ordem lógica, link "saltar para o conteúdo", filtros e botões acessíveis por teclado com rótulos ARIA.
- Gráficos com alternativa textual (tabela de valores associada).
- Layouts verificados em telemóvel e desktop: filtros empilhados, gráficos com largura fluida, cabeçalho com menu compacto no telemóvel.

### 4. Exportação pública (PDF e Excel)

Botões "Exportar PDF" e "Exportar Excel" no dashboard público, respeitando os filtros activos:

- PDF gerado com o cabeçalho oficial já usado na plataforma (logótipo JIMUA, Igreja Metodista Unida / Conferência Anual do Oeste de Angola / Organização de Jovens Regulares), identificação do âmbito seleccionado (distrito, intendência, circuito, igreja) e data de exportação.
- Excel com folhas por bloco de indicadores (resumo, género, faixa etária, crescimento semestral, igrejas).
- Apenas dados agregados; nenhum registo individual é exportável na área pública.

## Detalhes técnicos

- **Base de dados:** estender `public_dashboard_stats(_distrito_id, _intendencia_id, _circuito_id, _igreja_id)` (SECURITY DEFINER, só leitura) para devolver também `serie_semestral` (ano, semestre, base, entradas, saídas, actual) e `taxa_abandono` por período, derivados de `periodos_estatisticos` e, na ausência de períodos fechados, das `ocorrencias` por código M.E.O. de entrada/saída. Sem colunas individuais expostas; `EXECUTE` mantém-se para `anon` e `authenticated`.
- **Frontend:** novo `src/components/public/` com `ChartCard` (título + explicação + gráfico Recharts + tabela alternativa) e `PublicFilters` reutilizado por `Landing.tsx` e `PublicEstatisticas.tsx`; nova página `src/pages/Sobre.tsx` e rota em `App.tsx`.
- **Exportação:** reutilizar `src/lib/pdf.ts` (`createOfficialPdf`/`addTable`) para o PDF; adicionar `xlsx` como dependência para o Excel, num novo `src/lib/exportPublico.ts`.

## Fora de âmbito

- Nenhuma alteração às regras de permissões, ao cálculo do Mapa Estatístico Oficial, ao fecho de semestre ou às páginas autenticadas.
