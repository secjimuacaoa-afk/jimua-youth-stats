// Tipos de ocorrência e o seu mapeamento para os códigos do Mapa Estatístico

export interface TipoOcorrencia {
  code: string;      // código interno guardado em ocorrencias.tipo_codigo
  label: string;     // descrição para o utilizador
  mapa: string;      // letra do Mapa Estatístico (A..A3, B..B3, C..F)
  legacy?: boolean;  // já não é oferecido em novos registos
}

export const ENTRADAS: TipoOcorrencia[] = [
  { code: "vindo_classe_infantil", label: "Vindo da Classe Infantil", mapa: "A" },
  { code: "evangelizado", label: "Evangelizado", mapa: "A1" },
  { code: "ingresso_voluntario", label: "Ingresso Voluntário", mapa: "A2" },
  { code: "recebido_transferencia", label: "Recebido por Transferência", mapa: "A3" },
  { code: "vindo_denominacao", label: "Vindo de outra Denominação", mapa: "A3", legacy: true },
];

export const SAIDAS: TipoOcorrencia[] = [
  { code: "encaminhado_oja", label: "Encaminhado à OJA", mapa: "B" },
  { code: "transferido", label: "Saída por Transferência", mapa: "B1" },
  { code: "desistente", label: "Afastou-se", mapa: "B2" },
  { code: "falecido", label: "Falecido", mapa: "B3" },
  { code: "ausente_estudo", label: "Ausente por Estudo", mapa: "C" },
  { code: "ausente_trabalho", label: "Ausente por Trabalho", mapa: "C" },
  { code: "ausente_saude", label: "Ausente por Saúde", mapa: "D" },
  { code: "ausente_diversas", label: "Ausente por razões diversas", mapa: "E" },
  { code: "disciplinar", label: "Sob processo disciplinar", mapa: "F" },
];

export const TODOS_TIPOS = [...ENTRADAS, ...SAIDAS];

export const tiposDe = (categoria: "entrada" | "saida") =>
  (categoria === "entrada" ? ENTRADAS : SAIDAS).filter((t) => !t.legacy);

export const labelTipo = (code: string) => TODOS_TIPOS.find((t) => t.code === code)?.label || code;

export const mapaTipo = (code: string) => TODOS_TIPOS.find((t) => t.code === code)?.mapa || "";

/** Códigos que contam como saída efectiva no efectivo (Nº Actual Real) */
export const SAIDA_EFECTIVA = ["B", "B1", "B2", "B3"];
/** Códigos que contam apenas como diferença (não saem do efectivo real) */
export const DIFERENCA_CODES = ["C", "D", "E", "F"];
