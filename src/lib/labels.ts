// Label mappings: internal codes → human-readable descriptions
// Codes are stored in the database but NEVER shown to users

export const CATEGORIA_LABELS: Record<string, string> = {
  J: "Catecúmenos",
  K: "À Prova",
  L: "Efectivos",
};

export const ESCOLARIDADE_LABELS: Record<string, string> = {
  M: "Ensino Primário",
  N: "1º Ciclo",
  O: "2º Ciclo / Médio",
  P: "Ensino Superior",
  P1: "Licenciados",
  P2: "Pós-Graduandos",
  Q: "Fora do Sistema",
};

export const OCUPACAO_LABELS: Record<string, string> = {
  R: "Funcionário de Empresas",
  S: "Educação",
  T: "Saúde",
  U: "Militar/Polícia",
  V: "Serviços Religiosos",
  W: "Comércio",
  X: "Estudante",
  X1: "Sem Ocupação",
};

export const ESTADO_CIVIL_LABELS: Record<string, string> = {
  Y: "Solteiro",
  Z: "Casado",
};

export const ORIGEM_LABELS: Record<string, string> = {
  A: "Classe Infantil",
  A1: "Evangelizados",
  A2: "Ingresso Voluntário",
  B: "Encaminhados à OJA",
  B1: "Transferidos",
};

export const MOTIVO_INACTIVIDADE_LABELS: Record<string, string> = {
  C: "Afastado",
  D: "Falecido",
  E: "Estudo/Trabalho",
  F: "Saúde",
  G: "Disciplinares",
  G1: "Desconhecidas",
};

export const PARTE_ETARIA_LABELS: Record<string, string> = {
  H: "12–17 anos",
  I: "18–25 anos",
};

export const DOC_LABELS: Record<string, string> = {
  cedula: "Registo de Nascimento (Cédula)",
  bi: "Bilhete de Identidade (BI)",
  passaporte: "Passaporte",
  carta_conducao: "Carta de Condução",
  sem_documentacao: "Sem documentação",
};

// Helper to get label from any map, falling back to code
export const getLabel = (map: Record<string, string>, code: string | null | undefined): string => {
  if (!code) return "—";
  return map[code] || code;
};

// Helper to get select options from a label map
export const getOptions = (map: Record<string, string>) =>
  Object.entries(map).map(([value, label]) => ({ value, label }));
