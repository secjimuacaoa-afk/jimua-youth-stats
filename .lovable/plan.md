# Actualização visual dos gráficos + composição dos Dashboards + página Sobre

Intervenção cirúrgica: apenas camada de apresentação. Sem alterações a base de dados, RPCs, queries, filtros, cálculos, permissões, RLS, rotas ou autenticação.

## 1. Conteúdo novo na página "Sobre"

Adicionar (sem remover o conteúdo actual):

- Bloco "Propriedade e Gestão da Plataforma" — Direcção Geral da Juventude de Luanda, email jimua.caoa@gmail.com (link mailto).
- Definição institucional: "JUVENTUDE DA IGREJA METODISTA UNIDA — é a organização de jovens da Igreja Metodista Unida, uma escola na qual os mesmos são dirigidos e preparados para se tornarem membros úteis à Igreja e à Sociedade."
- Cartões "ARTIGO 2.º": VISÃO (ser uma escola de excelência) e MISSÃO (dirigir e preparar jovens com conhecimentos e habilidades, a fim de se tornarem mais-valias para a igreja e a sociedade).

## 2. Sistema visual único de gráficos

Criar um módulo de tema de gráficos partilhado (`src/lib/chartTheme.ts` + `src/components/charts/`) usado por todos os gráficos:

- Paleta semântica em tokens do design system (nada de cores fixas em componentes):
  - azul-marinho institucional = valor principal/estrutura
  - verde = crescimento, entradas, activos
  - dourado = destaque/complementar
  - vermelho = saídas, abandono, alertas
  - cinzas = referência, sem dados
- Tooltip próprio (fundo limpo, sombra suave, categoria + valor + percentagem quando derivável dos dados já existentes).
- Eixos discretos, gridlines subtis apenas horizontais, sem eixos duplicados, sem molduras.
- Legendas compactas ou substituídas por rótulos junto ao dado.
- Animação de entrada subtil (barras/linhas/donut), sem bounce.
- Alturas responsivas e margens que evitam corte de labels em mobile.

## 3. Gráficos existentes a refinar (mesmos dados, mesmas fontes)

- **Crescimento semestral** (painel público): gráfico combinado — barras de entradas (verde) e saídas (vermelho) sobre o eixo do período, com linha do efectivo actual (azul) por cima; rótulos de valor e leitura temporal clara.
- **Taxa de abandono**: linha com área ténue e ponto final destacado; quando existir apenas um período, apresentar um indicador percentual grande com o período identificado, em vez de simular série temporal.
- **Distribuição por Sexo**: donut moderno com centro limpo (total), masculino azul / feminino dourado, percentagens junto à legenda e tooltip com categoria, valor e percentagem.
- **Faixa Etária**: barras verticais com valor visível por cima e percentagem como texto secundário.
- **Igrejas locais com mais jovens**: barras horizontais ordenadas, 1.º lugar destacado, nome truncado com tooltip completo, valor no fim da barra.
- **Comparação por Categoria** (dashboard): barras com o mesmo estilo e valores visíveis.
- **Barras simples da página pública de estatísticas**: alinhar cores, espessura e tipografia ao mesmo sistema.
- **Mapa Estatístico**: refinar apenas a apresentação (escala cromática institucional progressiva, legenda de intensidade, contraste, hover/tooltip, leitura dos valores). Regiões, dados, filtros e exportação mantêm-se.
- A tabela alternativa acessível ("Ver valores em tabela") mantém-se em todos os gráficos.

## 4. Composição dos Dashboards por perfil

Reorganizar a página do Dashboard (mesma rota, mesmos dados e filtros já existentes) segundo a referência fornecida, com a mesma linguagem visual para os três perfis e apenas o âmbito de cada nível:

Ordem das secções:
1. Cabeçalho de boas-vindas + filtros actuais (inalterados).
2. Faixa de indicadores: Total de Jovens Activos, Inactivos, Masculino, Feminino (cards já existentes, apenas afinados).
3. Distribuição por Faixa Etária · Distribuição por Sexo · Actividades Recentes.
4. Visão Geral da Estrutura Hierárquica: cartões encadeados Igrejas → Circuitos → Intendências → Distritos → Direcção Geral, com contagens obtidas das consultas já existentes e visíveis conforme jurisdição (o Local vê apenas a sua igreja).
5. Mapa Estatístico (resumo com ligação à página existente) · Indicadores de Crescimento (crescimento semestral e taxa de abandono a partir dos valores já calculados) · Próximas Actividades.
6. Igrejas locais com mais jovens (Geral e Distrital; oculto no perfil Local, como hoje).

Diferenças por perfil (respeitando as regras de acesso já implementadas):
- Secretário Geral: consolidado nacional, filtro de Distrito disponível.
- Secretário Distrital: mesmos blocos, âmbito limitado ao seu distrito.
- Secretário Local: mesmos blocos aplicáveis à sua igreja; blocos sem dados na sua jurisdição não são apresentados.

Actividades Recentes e Próximas Actividades usam as tabelas `actividades`/registos já existentes; se não houver registos, é mostrado um estado vazio elegante — nunca dados fictícios.

## 5. Ficheiros previstos

- Novo: `src/lib/chartTheme.ts`, `src/components/charts/*` (tooltip, donut, barras, combinado, ranking).
- Alterados: `src/pages/Dashboard.tsx`, `src/components/public/PublicStatsPanel.tsx`, `src/components/public/ChartCard.tsx`, `src/pages/PublicEstatisticas.tsx`, `src/pages/MapaEstatistico.tsx` (apenas apresentação), `src/pages/Sobre.tsx`, `src/index.css` e `tailwind.config.ts` (tokens de gráfico).

## 6. Verificação final

Revisão de cada gráfico: leitura em 2–3 segundos, destaque do dado principal, coerência de paleta JIMUA, consistência entre gráficos, valores localizáveis, tooltip claro, comportamento em mobile/tablet/desktop sem overflow, e confirmação de que os números apresentados são idênticos aos actuais.
