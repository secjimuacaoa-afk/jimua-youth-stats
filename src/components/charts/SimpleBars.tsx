import { CHART, pctDe } from "@/lib/chartTheme";

interface Props {
  data: { name: string; value: number }[];
  cor?: string;
}

/** Barras horizontais simples, alinhadas ao sistema visual JIMUA. */
const SimpleBars = ({ data, cor = CHART.principal }: Props) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.name} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-card-foreground" title={item.name}>{item.name}</span>
            <span className="shrink-0 font-semibold tabular-nums text-card-foreground">
              {item.value}
              <span className="ml-1.5 font-normal text-xs text-muted-foreground">{pctDe(item.value, total)}</span>
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(item.value / max) * 100}%`, background: cor }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SimpleBars;
