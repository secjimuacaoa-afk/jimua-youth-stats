import { CHART, pctDe } from "@/lib/chartTheme";

interface Props {
  data: { name: string; value: number }[];
  /** unidade apresentada a seguir ao valor */
  unidade?: string;
}

/** Barras horizontais ordenadas, com o 1.º lugar destacado. */
const RankingBars = ({ data, unidade = "" }: Props) => {
  const ordenado = [...data].sort((a, b) => b.value - a.value);
  const max = Math.max(...ordenado.map((d) => d.value), 1);
  const total = ordenado.reduce((a, b) => a + b.value, 0);

  return (
    <ol className="space-y-3">
      {ordenado.map((item, i) => (
        <li key={item.name} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-card-foreground" title={item.name}>
              <span className="text-muted-foreground tabular-nums mr-1.5">{i + 1}.</span>
              {item.name}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-card-foreground">
              {item.value}{unidade}
              <span className="ml-1.5 font-normal text-xs text-muted-foreground">{pctDe(item.value, total)}</span>
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(item.value / max) * 100}%`, background: i === 0 ? CHART.destaque : CHART.principal }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
};

export default RankingBars;
