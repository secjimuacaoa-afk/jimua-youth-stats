# Nova capa pública + identidade visual JIMUA

## O que entendi

1. **Página inicial pública** (o que aparece ao abrir o link, antes de qualquer login), no espírito da imagem anexada:
   - Cabeçalho em três linhas: *Igreja Metodista Unida* / *Conferência Anual do Oeste de Angola* / *Organização de Jovens Regulares*, com o logótipo JIMUA ao lado e botão **Entrar**.
   - Herói com o logótipo JIMUA em grande, o nome da plataforma e um resumo curto do que ela faz, com botão **Aceder ao Sistema**.
   - Secção de **Funcionalidades** (cartões: cadastro completo, estrutura hierárquica, mapa estatístico automático, segurança e auditoria).
   - Secção de **Dados gerais públicos** com números agregados (total, activos/inactivos, sexo, faixa etária, OJA vs juvenis) e **filtros por Distrito → Intendência → Circuito → Igreja Local**, encadeados.
   - Apenas dados agregados: nenhum nome, BI, contacto ou registo individual fica público.
2. **Logótipo**: substituir o actual por o logo JIMUA anexado, sem fundo, em toda a plataforma (capa, login, barra lateral, PDF do Mapa Estatístico) e como favicon.
3. **Visual geral**: tipografia mais sólida e limpa, paleta e componentes mais profissionais e modernos, mantendo o funcionamento actual intacto.

## Como será feito

**Logótipo**
- Converter o ficheiro anexado para PNG transparente e publicá-lo como asset; substituir `src/assets/logo-jimua.png` em todos os pontos de uso (`Login`, `AppSidebar`, `PublicDashboard`, `PublicEstatisticas`, `src/lib/pdf.ts`) e gerar o favicon em `public/`.

**Nova rota pública**
- Nova página `src/pages/Landing.tsx` na rota `/`; o login passa para `/login` (redireccionamentos e `signOut` actualizados).
- Componentes novos: cabeçalho de três linhas, herói, grelha de funcionalidades e painel de estatísticas públicas com filtros.

**Dados públicos com filtros**
- Por segurança, a leitura directa das tabelas por visitantes anónimos está fechada. Serão adicionadas duas funções de base de dados (SECURITY DEFINER, só de leitura e só agregados):
  - uma que devolve a árvore Distrito/Intendência/Circuito/Igreja apenas com id e nome, para alimentar os filtros;
  - uma extensão de `public_dashboard_stats` que aceita filtros opcionais de distrito, intendência, circuito e igreja.
- `EXECUTE` concedido a `anon` e `authenticated`; nenhuma coluna individual exposta.

**Identidade visual**
- Nova tipografia: títulos em *Sora* (sólida, geométrica) e texto em *Manrope*; substitui Inter/Playfair.
- Refinar os tokens em `index.css` (azul institucional mais profundo, dourado/âmbar de destaque, superfícies neutras quentes, sombras e raios coerentes) e aplicar aos cartões, barra lateral, botões e cabeçalhos das páginas internas — sem alterar lógica de negócio.
- Metadados do `index.html` alinhados com o novo nome e resumo.

## Fora de âmbito
- Nenhuma alteração a regras de permissões, cálculo estatístico, fecho de semestre ou fluxos de registo.
