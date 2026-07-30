// Codificação oficial do Mapa Estatístico Uniformizado (JIMUA)
// Os códigos são guardados na base de dados; ao utilizador mostramos sempre a descrição.

// 1 — OCORRÊNCIAS (entradas)
export const OCORRENCIA_ENTRADA_LABELS: Record<string, string> = {
  A: "Vindos da Classe Infantil",
  A1: "Evangelizados",
  A2: "Ingressaram voluntariamente",
  A3: "Recebidos por transferência",
};

// 1 — OCORRÊNCIAS (saídas)
export const OCORRENCIA_SAIDA_LABELS: Record<string, string> = {
  B: "Encaminhados à OJA",
  B1: "Saíram por transferência",
  B2: "Afastaram-se",
  B3: "Falecidos",
};

// 2 — DIFERENÇAS
export const DIFERENCA_LABELS: Record<string, string> = {
  C: "Ausentes por Estudo/Trabalho",
  D: "Ausentes por razões de saúde",
  E: "Ausentes por razões diversas",
  F: "Sob processo disciplinar",
};

// 3 — PARTE ETÁRIA
export const PARTE_ETARIA_LABELS: Record<string, string> = {
  G: "12 aos 17 anos",
  H: "18 aos 25 anos",
};

// 4 — CATEGORIA
export const CATEGORIA_LABELS: Record<string, string> = {
  I: "Catecúmenos",
  J: "À Prova",
  K: "Efectivos",
};

// 5 — GRAU DE ESCOLARIDADE
export const ESCOLARIDADE_LABELS: Record<string, string> = {
  L: "Ensino Primário",
  L1: "1º Ciclo",
  L2: "2º Ciclo / Ensino Médio",
  M: "Ensino Superior",
  M1: "Licenciados",
  M2: "Pós-Graduandos",
  N: "Fora do sistema de ensino",
};

// 6 — ÁREA DE FORMAÇÃO
export const AREA_FORMACAO_LABELS: Record<string, string> = {
  O: "Sem formação definida",
  P: "Engenharias",
  Q: "Ciências da Saúde",
  Q1: "Ciências da Educação",
  Q2: "Ciências Financeiras",
  Q3: "Ciências Sociais",
  R: "Estudos Teológicos",
  S: "Outras",
};

// 7 — SITUAÇÃO OCUPACIONAL
export const OCUPACAO_LABELS: Record<string, string> = {
  T: "Funcionários de Empresas",
  U: "Ramo da Educação",
  U1: "Ramo da Saúde",
  U2: "Ramo Militar / Polícia",
  U3: "Ramo do Comércio",
  U4: "Ramo da Agricultura / Pesca",
  V: "Serviços Religiosos",
  W: "Somente Estudantes",
  W1: "Sem ocupação",
};

// 8 — ESTADO CIVIL
export const ESTADO_CIVIL_LABELS: Record<string, string> = {
  X: "Solteiro(a)",
  Y: "União de facto",
  Z: "Casado(a)",
};

// Origem de entrada do jovem (mesma codificação das ocorrências de entrada)
export const ORIGEM_LABELS: Record<string, string> = { ...OCORRENCIA_ENTRADA_LABELS };

// Motivo de inactividade: saídas (B..B3) + diferenças (C..F)
export const MOTIVO_INACTIVIDADE_LABELS: Record<string, string> = {
  ...OCORRENCIA_SAIDA_LABELS,
  ...DIFERENCA_LABELS,
};

export const DOC_LABELS: Record<string, string> = {
  cedula: "Registo de Nascimento (Cédula)",
  bi: "Bilhete de Identidade (BI)",
  passaporte: "Passaporte",
  carta_conducao: "Carta de Condução",
  sem_documentacao: "Sem documentação",
};

// Índice de abreviaturas usado no rodapé do Mapa Estatístico
export const INDICE_ABREVIATURAS: { titulo: string; itens: [string, string][] }[] = [
  { titulo: "1 — Ocorrências", itens: [...Object.entries(OCORRENCIA_ENTRADA_LABELS), ...Object.entries(OCORRENCIA_SAIDA_LABELS)] as [string, string][] },
  { titulo: "2 — Diferenças", itens: Object.entries(DIFERENCA_LABELS) as [string, string][] },
  { titulo: "3 — Parte Etária", itens: Object.entries(PARTE_ETARIA_LABELS) as [string, string][] },
  { titulo: "4 — Categoria", itens: Object.entries(CATEGORIA_LABELS) as [string, string][] },
  { titulo: "5 — Grau de Escolaridade", itens: Object.entries(ESCOLARIDADE_LABELS) as [string, string][] },
  { titulo: "6 — Área de Formação", itens: Object.entries(AREA_FORMACAO_LABELS) as [string, string][] },
  { titulo: "7 — Situação Ocupacional", itens: Object.entries(OCUPACAO_LABELS) as [string, string][] },
  { titulo: "8 — Estado Civil", itens: Object.entries(ESTADO_CIVIL_LABELS) as [string, string][] },
];

// Helper to get label from any map, falling back to code
export const getLabel = (map: Record<string, string>, code: string | null | undefined): string => {
  if (!code) return "—";
  return map[code] || code;
};

// Helper to get select options from a label map
export const getOptions = (map: Record<string, string>) =>
  Object.entries(map).map(([value, label]) => ({ value, label }));
