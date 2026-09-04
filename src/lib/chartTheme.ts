/**
 * Sistema visual único dos gráficos JIMUA.
 * Apenas apresentação — nenhuma lógica, cálculo ou fonte de dados aqui.
 */

export const CHART = {
  /** azul-marinho institucional — valor principal / estrutura */
  principal: "hsl(var(--navy))",
  principalSuave: "hsl(var(--navy-light))",
  /** verde — crescimento, entradas, activos */
  crescimento: "hsl(var(--success))",
  /** dourado — destaque / complementar */
  destaque: "hsl(var(--gold))",
  /** vermelho — saídas, abandono, alertas */
  alerta: "hsl(var(--destructive))",
  /** cinzas — referência, sem dados */
  referencia: "hsl(var(--muted-foreground))",
  grid: "hsl(var(--border))",
  eixo: "hsl(var(--muted-foreground))",
} as const;

export const CHART_SERIES = [
  CHART.principal,
  CHART.crescimento,
  CHART.destaque,
  CHART.principalSuave,
  CHART.referencia,
] as const;

export const axisTick = { fontSize: 12, fill: CHART.eixo } as const;

export const chartMargin = { top: 12, right: 12, left: -14, bottom: 0 } as const;

export const gridProps = {
  stroke: CHART.grid,
  strokeDasharray: "3 3",
  vertical: false,
} as const;

export const ANIM = 700;

export const pctDe = (valor: number, total: number) =>
  total > 0 ? `${Math.round((valor / total) * 100)}%` : "0%";
