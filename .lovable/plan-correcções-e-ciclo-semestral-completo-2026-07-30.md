# Correcções e Ciclo Semestral Completo

Cinco frentes: gestão de contas por hierarquia, jovens sem BI, aprovação única com pedido de desbloqueio, ciclo semestral automático com arrastamento de ocorrências, e Mapa Estatístico alinhado ao modelo anexado.

## 1. Editar contas de secretários

- O Secretário Distrital passa a poder editar **nome, email e palavra-passe** de qualquer Secretário Local do seu distrito (mandato anual).
- O Secretário Geral passa a poder editar **nome, email e palavra-passe** de qualquer Secretário Distrital.
- Na página Utilizadores, o botão actual "Redefinir senha" é substituído por um botão **"Editar conta"** que abre um formulário com Nome, Email e Nova palavra-passe (opcional).
- A validação de jurisdição é feita no servidor (não apenas no ecrã): distrital só actua sobre locais do seu distrito; ninguém edita a própria conta por aqui nem contas de nível superior.

## 2. Jovem sem Bilhete de Identidade

- Nova opção no formulário de jovens: **"Não possui documento de identificação (BI)"**.
- Ao marcar, o campo BI fica desactivado e a obrigatoriedade deixa de se aplicar (na aplicação e na regra do banco de dados).
- Na lista e nas fichas, esses jovens aparecem com a indicação "Sem BI" em vez de vazio, para se distinguirem de registos incompletos.
- Registos já existentes mantêm-se; o prazo de regularização continua a valer apenas para quem não marcou a opção.

## 3. Aprovação única + pedido de autorização de edição

- Uma estatística de semestre por igreja só pode ser aprovada **uma vez** (restrição no banco de dados, não só no ecrã).
- Depois de aprovada, o Secretário Local fica bloqueado, mas ganha um botão **"Solicitar autorização de edição"** com justificação.
- O pedido chega ao Secretário Distrital como **notificação** (sino no topo, à semelhança das notificações OJA), onde pode **Autorizar** ou **Recusar**.
- Autorização abre o semestre daquela igreja por um período definido pelo distrital (ex.: 7 dias) ou até ele fechar de novo; findo o prazo, volta a bloquear automaticamente.
- O Local recebe aviso do resultado do pedido.

## 4. Ciclo semestral e ocorrências

- **Semestre automático**: 1.º semestre 01 Jan–30 Jun, 2.º semestre 01 Jul–31 Dez. Ao registar uma ocorrência ou cadastrar um jovem, o ano/semestre é deduzido da data — deixam de ser campos manuais (ficam visíveis apenas como leitura).
- **Semestre aberto**: cadastrar, editar e eliminar ocorrências. **Semestre fechado**: apenas consulta.
- **Arrastamento**: o efectivo de um semestre parte do Número Actual do semestre anterior (importado automaticamente ao abrir), e as entradas/saídas registadas aparecem no mapa do semestre seguinte, conforme o modelo.
- **Fecho do semestre** aplica a fórmula:
`Número Actual = Número Anterior + Entradas − Saídas`
e congela os valores num registo histórico, para que os mapas antigos não mudem quando os dados actuais mudam.

```text
Criar/abrir semestre → importar Nº Actual anterior → registar ocorrências
→ efectivo actualizado automaticamente → dados complementares
→ fechar semestre → gerar Mapa Estatístico
```

- Nova página **Semestres** (Local vê o seu; Distrital e Geral vêem os da sua jurisdição) com estado Aberto/Fechado, número anterior, entradas, saídas e número actual calculado em tempo real.

## 5. Mapa Estatístico conforme o modelo anexado

O mapa passa a reproduzir integralmente o modelo, no ecrã e no PDF, com os mesmos blocos, códigos e totais:

- **Nº Anterior** (Real e Físico) por sexo.
- **Ocorrências**: A, A1, A2, A3 (entradas) e B, B1, B2, B3 (saídas).
- **Nº Actual (Real)**, **Diferenças** C, D, E, F, **Nº Actual (Físico)**.
- **Parte Etária**: G (12–17), H (18–25).
- **Categoria**: I, J, K.
- **Grau de Escolaridade**: L, L1, L2, M, M1, M2, N.
- **Área de Formação**: O, P, Q, Q1, Q2, Q3, R, S — bloco **novo**, exige novo campo "Área de Formação" na ficha do jovem (opcional para registos existentes).
- **Situação Ocupacional**: T, U, U1, U2, U3, U4, V, W, W1.
- **Estado Civil**: X, Y, Z.
- Linhas Masc./Fem./Total, linhas de verificação de totais por bloco e o **Índice de Abreviaturas** no rodapé do PDF, com espaço de assinatura "Pelo Secretário".
- Disponível nos três níveis (Local, Distrital, Geral) com os filtros hierárquicos já existentes.

Nota: os códigos actuais do sistema (categoria J/K/L, escolaridade M–Q, ocupação R–X1, estado civil Y/Z) não coincidem com os do modelo. Os dados já registados serão convertidos para a nova codificação numa migração, sem perda de informação.

## 6. Acabamento visual

- Revisão das abas afectadas (Jovens, Ocorrências, Assembleias, Semestres, Mapa) para identidade visual consistente, tabelas legíveis com deslocamento horizontal em ecrã pequeno, estados vazios e de carregamento claros, e responsividade em telemóvel.

## Detalhes técnicos

- Banco de dados: `jovens.sem_bi` (booleano) e `jovens.area_formacao`; nova tabela `periodos_estatisticos` (igreja, ano, semestre, estado, números anterior/actual congelados) com RLS por jurisdição; nova tabela `pedidos_desbloqueio` (igreja, período, justificação, estado, prazo); índice único em `assembleias(igreja_id, ano, semestre)` para estado aprovado.
- Gatilhos: `enforce_bi_obrigatorio` passa a aceitar `sem_bi`; `enforce_semester_lock_*` passa a consultar `periodos_estatisticos` e autorizações activas em vez de apenas assembleia aprovada; novo gatilho preenche ano/semestre a partir da data.
- Nova função de servidor `update-user` (nome, email, palavra-passe) com verificação de jurisdição; `reset-user-password` é absorvida por ela.
- Migração de códigos: mapeamento antigo → novo para `categoria`, `escolaridade`, `ocupacao`, `estado_civil`, `origem`, `motivo_inactividade`, com `src/lib/labels.ts` reescrito segundo o índice de abreviaturas do modelo.
- `src/lib/pdf.ts` ganha o layout de tabela larga em modo paisagem e o bloco de abreviaturas.