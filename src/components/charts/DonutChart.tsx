import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { ANIM, CHART, pctDe } from "@/lib/chartTheme";

interface Props {
  data: { name: string; value: number }[];
  colors?: string[];
  /** rótulo apresentado no centro do donut */
  centroLabel?: string;
  height?: number;
}

const DonutChart = ({ data, colors = [CHART.principal, CHART.destaque], centroLabel = "Total", height = 240 }: Props) => {
  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <div className="space-y-3">
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={2}
              stroke="none"
              animationDuration={ANIM}
            >
              {data.map((d, i) => <Cell key={d.name} fill={colors[i % colors.length]} />)}
            </Pie>
            <Tooltip content={<ChartTooltip total={total} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold tabular-nums text-card-foreground">{total}</span>
          <span className="text-xs text-muted-foreground">{centroLabel}</span>
        </div>
      </div>
      <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[i % colors.length] }} aria-hidden="true" />
            <span className="text-card-foreground font-medium">{d.name}</span>
            <span className="tabular-nums">{d.value} · {pctDe(d.value, total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DonutChart;
