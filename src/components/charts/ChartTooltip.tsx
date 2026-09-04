interface Item {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

interface Props {
  active?: boolean;
  payload?: Item[];
  label?: string | number;
  /** sufixo apresentado após cada valor (ex.: "%") */
  suffix?: string;
  /** total usado para derivar a percentagem, quando aplicável */
  total?: number;
}

const ChartTooltip = ({ active, payload, label, suffix = "", total }: Props) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      {label !== undefined && label !== "" && (
        <p className="text-xs font-semibold text-card-foreground mb-1">{label}</p>
      )}
      <ul className="space-y-0.5">
        {payload.map((p, i) => {
          const num = typeof p.value === "number" ? p.value : Number(p.value);
          const pct = total && total > 0 && !Number.isNaN(num) ? ` · ${Math.round((num / total) * 100)}%` : "";
          return (
            <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ background: p.color }} aria-hidden="true" />
              <span>{p.name}</span>
              <span className="ml-auto font-semibold tabular-nums text-card-foreground">
                {p.value}{suffix}{pct}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ChartTooltip;
