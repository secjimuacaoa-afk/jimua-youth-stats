import { ReactNode, useId } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartCardProps {
  title: string;
  description: string;
  /** Valores mostrados no gráfico, também disponibilizados em tabela para leitores de ecrã */
  table: { label: string; value: string | number }[];
  tableHeaders?: [string, string];
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
  children: ReactNode;
}

const ChartCard = ({
  title,
  description,
  table,
  tableHeaders = ["Indicador", "Valor"],
  empty,
  emptyMessage = "Ainda não há dados suficientes para este indicador.",
  className,
  children,
}: ChartCardProps) => {
  const id = useId();
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base" id={`${id}-title`}>{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {empty ? (
          <p className="text-sm text-muted-foreground py-8 text-center">{emptyMessage}</p>
        ) : (
          <>
            <figure role="group" aria-labelledby={`${id}-title`} className="m-0">
              <div className="w-full">{children}</div>
            </figure>
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-primary rounded-md py-2 min-h-11 inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Ver valores em tabela
              </summary>
              <table className="w-full mt-2 text-sm border-collapse">
                <caption className="sr-only">{title}</caption>
                <thead>
                  <tr className="border-b border-border text-left">
                    <th scope="col" className="py-1.5 pr-2 font-semibold text-foreground">{tableHeaders[0]}</th>
                    <th scope="col" className="py-1.5 font-semibold text-foreground text-right">{tableHeaders[1]}</th>
                  </tr>
                </thead>
                <tbody>
                  {table.map((row) => (
                    <tr key={row.label} className="border-b border-border/60 last:border-0">
                      <th scope="row" className="py-1.5 pr-2 font-normal text-muted-foreground text-left">{row.label}</th>
                      <td className="py-1.5 text-right tabular-nums text-foreground">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ChartCard;
