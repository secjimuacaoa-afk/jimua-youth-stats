# Refinamento geral da plataforma

Nota: o ficheiro ESTATÍSTICA.pdf chegou vazio. Fico a aguardar a imagem do modelo; entretanto o Mapa Estatístico é reformulado com a estrutura de formulário oficial já conhecida (cabeçalho de identificação + quadros de indicadores), e ajusto ao modelo assim que a imagem chegar.

## 1. Telemóvel em toda a plataforma

- Menu lateral passa a gaveta deslizante em ecrãs pequenos, com botão de abrir no topo e barra superior fixa com o logótipo.
- Tabelas largas (Jovens, Utilizadores, Estruturas, Mapa) ganham deslocamento horizontal controlado e, onde faz sentido, apresentação em cartões no telemóvel.
- Filtros, diálogos e formulários passam a empilhar numa coluna; botões com altura mínima confortável ao toque.
- Gráficos com altura e legendas adaptadas ao ecrã pequeno.

## 2. Mapa Estatístico (fusão com Estatísticas)

- Passa a existir uma única página chamada "Mapa Estatístico"; a entrada "Estatísticas" sai do menu e o endereço antigo reencaminha para a nova página.
- Estrutura em folha oficial: cabeçalho com logótipo JIMUA, identificação da Juventude (Igreja Metodista Unida — Conferência Anual do Oeste de Angola — Organização de Jovens), distrito/intendência/circuito/igreja, ano e semestre.
- Quadros com os indicadores que a plataforma já tem sobre a juventude (efectivo anterior, entradas, saídas por código A–F, efectivo actual, sexo, faixa etária, categoria, escolaridade, ocupação, estado civil), com descrições claras de cada indicador.
- Impressão: folha A4, texto a preto sobre branco, linhas de grelha visíveis, sem cortes de coluna, cabeçalho repetido e sem códigos,  todos os indicadores devem ter textos descritivos claros.

## 3. Página "Sobre a Plataforma"

- Retirar as referências a "Artigo 2.º", ficando apenas Visão e Missão.
- Remover a segunda descrição da missão ("Missão da Organização de Jovens").
- Mover "Propriedade e Gestão da Plataforma" para o fim, dentro do rodapé, com o nome "Direcção Geral da Juventude" e o email [jimua.caoa@gmail.com para contectos oficiais ou reclamações](mailto:jimua.caoa@gmail.com).
- Corrigir o passo de Validação: "Encerrado o semestre, o Secretário Distrital aprova/valida a estatística; a partir daí o período fica bloqueado para edições, salvo autorização registada."

## 4. Página inicial

- Substituir o logótipo grande do herói por uma pré-visualização da plataforma (imagem do painel dentro de uma moldura tipo ecrã). O logótipo mantém-se no cabeçalho.

## 5. Dados gerais (área pública)

- Remover o gráfico de taxa de abandono e o de crescimento semestral.
- Remover os botões de exportar PDF/Excel do público; a exportação passa a existir apenas na área autenticada, para qualquer secretário (Geral, Distrital ou Local), sempre limitada à sua jurisdição.

## 6. Auditoria

- Nova página "Auditoria" visível apenas a Secretário Geral, Distrital e local, listando as alterações já registadas nas fichas de jovens (jovem, campo, valor anterior, valor novo, autor, data), com pesquisa e filtro por período, respeitando a jurisdição de cada perfil.

## 7. Estruturas eclesiásticas

- Carregar a lista enviada por acrescento e correcção: mantém-se o que já existe e coincide pelo nome, cria-se o que falta, nada é apagado.
- Distritos sem intendência indicada (Cunene) recebem uma intendência com o nome do distrito.
- Apenas Luanda usa Circuitos. Nos restantes distritos o campo Circuito deixa de aparecer no ecrã de Estruturas e nos formulários; internamente cada igreja fica ligada a um circuito técnico com o nome da própria intendência, para não alterar as ligações existentes.
- Total a carregar: 13 distritos, 35 intendências, 29 circuitos (só Luanda), 428 igrejas.

## 8. Indicadores por perfil

- Secretário Geral: passa a mostrar também o número de intendências, além do número de igrejas.
- Secretário Distrital: passa a mostrar o número de intendências do seu distrito.

## 9. Cores dos gráficos

- Alargar a paleta para que cada indicador tenha cor própria e distinguível (mantendo a identidade JIMUA: azul-marinho, verde, dourado, vermelho para saídas/alertas, e tons intermédios para as restantes categorias), com contraste verificado.

## Notas técnicas

- Estruturas carregadas por migração idempotente (inserção condicionada ao nome dentro do pai), sem apagar registos nem tocar em jovens.
- Fusão das páginas: `MapaEstatistico.tsx` absorve o conteúdo de `Estatisticas.tsx`; rota `/estatisticas` passa a redireccionar; `AppSidebar` actualizado.
- Nova rota `/auditoria` protegida (admin/super_admin) a ler `jovens_audit` com as políticas já existentes; se a leitura por jurisdição não estiver coberta, acrescento a política em migração separada.
- Exportação: `exportPublico.ts` deixa de ser usado no painel público e passa a ser chamado a partir do Mapa Estatístico autenticado.
- Impressão via CSS `@media print` dedicado.
- Sem alterações a autenticação, cálculos estatísticos ou regras de bloqueio de semestre.