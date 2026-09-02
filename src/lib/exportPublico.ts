import * as XLSX from "xlsx";
import { createOfficialPdf, addTable, addPageNumbers } from "@/lib/pdf";

export interface EscopoPublico {
  distrito?: string;
  intendencia?: string;
  circuito?: string;
  igreja?: string;
}

export interface SeriePeriodo {
  ano: number;
  semestre: number;
  base: number;
  entradas: number;
  saidas: number;
  abandonos: number;
  actual: number;
  taxa_abandono: number;
}

export interface StatsPublicos {
  total?: number;
  inactivos?: number;
  masculino?: number;
  feminino?: number;
  faixa_12_17?: number;
  faixa_18_25?: number;
  igrejas_top?: { name: string; value: number }[];
  serie_semestral?: SeriePeriodo[];
}

export const escopoLinhas = (e: EscopoPublico) => [
  ["Distrito", e.distrito || "Todos"],
  ["Intendência", e.intendencia || "Todas"],
  ["Circuito", e.circuito || "Todos"],
  ["Igreja Local", e.igreja || "Todas"],
];

const resumoLinhas = (s: StatsPublicos) => [
  ["Total de jovens activos", String(s.total ?? 0)],
  ["Jovens inactivos", String(s.inactivos ?? 0)],
  ["Masculino", String(s.masculino ?? 0)],
  ["Feminino", String(s.feminino ?? 0)],
  ["Faixa 12–17 anos", String(s.faixa_12_17 ?? 0)],
  ["Faixa 18–25 anos", String(s.faixa_18_25 ?? 0)],
];

const serieLinhas = (s: StatsPublicos) =>
  (s.serie_semestral || []).map((p) => [
    `${p.ano} · ${p.semestre}.º semestre`,
    String(p.base),
    String(p.entradas),
    String(p.saidas),
    String(p.actual),
    `${p.taxa_abandono}%`,
  ]);

export async function exportarPdfPublico(s: StatsPublicos, escopo: EscopoPublico) {
  const { doc, startY } = await createOfficialPdf({
    title: "Relatório Público Agregado da Juventude",
    subtitle: "Organização de Jovens Regulares — dados agregados, sem informação individual",
  });

  addTable(doc, {
    startY,
    head: [["Âmbito", "Selecção"]],
    body: escopoLinhas(escopo),
  });

  addTable(doc, {
    head: [["Indicador", "Valor"]],
    body: resumoLinhas(s),
  });

  const serie = serieLinhas(s);
  addTable(doc, {
    head: [["Período", "Anterior", "Entradas", "Saídas", "Actual", "Taxa de abandono"]],
    body: serie.length ? serie : [["Sem períodos consolidados", "-", "-", "-", "-", "-"]],
  });

  const igrejas = (s.igrejas_top || []).map((i) => [i.name, String(i.value)]);
  if (igrejas.length) {
    addTable(doc, { head: [["Igreja Local", "Jovens activos"]], body: igrejas });
  }

  addPageNumbers(doc);
  doc.save("relatorio-publico-jimua.pdf");
}

export function exportarExcelPublico(s: StatsPublicos, escopo: EscopoPublico) {
  const wb = XLSX.utils.book_new();

  const resumo = [
    ["Relatório Público Agregado da Juventude"],
    ["Igreja Metodista Unida — Conferência Anual do Oeste de Angola"],
    ["Organização de Jovens Regulares"],
    [],
    ["Âmbito", "Selecção"],
    ...escopoLinhas(escopo),
    [],
    ["Indicador", "Valor"],
    ...resumoLinhas(s).map(([k, v]) => [k, Number(v)]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumo), "Resumo");

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["Sexo", "Jovens activos"],
      ["Masculino", s.masculino ?? 0],
      ["Feminino", s.feminino ?? 0],
    ]),
    "Género",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["Faixa etária", "Jovens activos"],
      ["12–17 anos", s.faixa_12_17 ?? 0],
      ["18–25 anos", s.faixa_18_25 ?? 0],
    ]),
    "Faixa Etária",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["Ano", "Semestre", "Nº anterior", "Entradas", "Saídas", "Nº actual", "Taxa de abandono (%)"],
      ...(s.serie_semestral || []).map((p) => [p.ano, p.semestre, p.base, p.entradas, p.saidas, p.actual, p.taxa_abandono]),
    ]),
    "Crescimento Semestral",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["Igreja Local", "Jovens activos"],
      ...(s.igrejas_top || []).map((i) => [i.name, i.value]),
    ]),
    "Igrejas",
  );

  XLSX.writeFile(wb, "relatorio-publico-jimua.xlsx");
}
