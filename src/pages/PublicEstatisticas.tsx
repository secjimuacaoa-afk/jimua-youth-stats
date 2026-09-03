import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  CATEGORIA_LABELS, ESCOLARIDADE_LABELS, OCUPACAO_LABELS, ESTADO_CIVIL_LABELS,
  ORIGEM_LABELS, MOTIVO_INACTIVIDADE_LABELS, getLabel,
} from "@/lib/labels";
import PublicHeader from "@/components/public/PublicHeader";
import PublicStatsPanel from "@/components/public/PublicStatsPanel";

const BarSimple = ({ data }: { data: { name: string; value: number }[] }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.name} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-card-foreground">{item.name}</span>
            <span className="font-semibold tabular-nums text-card-foreground">{item.value}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-navy-light rounded-full transition-all duration-700" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const mapLabels = (arr: any[] | undefined, labels: Record<string, string>) =>
  (arr || []).map((x) => ({ name: getLabel(labels, x.name), value: x.value }));

const PublicEstatisticas = () => {
  const { data } = useQuery({
    queryKey: ["public-stats-rpc"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_dashboard_stats");
      if (error) throw error;
      return data as any;
    },
  });

  const s = data || {};

  const charts = [
    { label: "Categoria", data: mapLabels(s.categoria, CATEGORIA_LABELS) },
    { label: "Estado Civil", data: mapLabels(s.estado_civil, ESTADO_CIVIL_LABELS) },
    { label: "Escolaridade", data: mapLabels(s.escolaridade, ESCOLARIDADE_LABELS) },
    { label: "Ocupação", data: mapLabels(s.ocupacao, OCUPACAO_LABELS) },
    { label: "Origem", data: mapLabels(s.origem, ORIGEM_LABELS) },
    { label: "Motivos de Inactividade", data: mapLabels(s.motivo_inactividade, MOTIVO_INACTIVIDADE_LABELS) },
  ].filter((c) => c.data.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:ring-2 focus:ring-ring"
      >
        Saltar para o conteúdo principal
      </a>

      <PublicHeader />

      <main id="conteudo" className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Estatísticas Públicas</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Dados agregados da Organização de Jovens Regulares — nenhum registo individual é publicado.
          </p>
        </div>

        <PublicStatsPanel />

        {charts.length > 0 && (
          <section aria-labelledby="perfil" className="space-y-4">
            <h2 id="perfil" className="font-display text-xl sm:text-2xl font-bold text-foreground">Perfil dos jovens</h2>
            <p className="text-sm text-muted-foreground">
              Distribuições gerais a nível nacional, apresentadas apenas em contagens agregadas.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {charts.map((cat) => (
                <Card key={cat.label}>
                  <CardHeader className="pb-3"><CardTitle className="text-base">{cat.label}</CardTitle></CardHeader>
                  <CardContent><BarSimple data={cat.data} /></CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-10 text-center text-sm text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">Igreja Metodista Unida — Conferência Anual do Oeste de Angola</p>
        <p>Organização de Jovens Regulares · Plataforma de Gestão e Estatística</p>
      </footer>
    </div>
  );
};

export default PublicEstatisticas;
