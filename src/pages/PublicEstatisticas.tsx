import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  CATEGORIA_LABELS, ESCOLARIDADE_LABELS, OCUPACAO_LABELS, ESTADO_CIVIL_LABELS,
  ORIGEM_LABELS, MOTIVO_INACTIVIDADE_LABELS, getLabel,
} from "@/lib/labels";
import logoJimua from "@/assets/logo-jimua.png";
import { Link } from "react-router-dom";

const BarSimple = ({ data }: { data: { name: string; value: number }[] }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.name} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-card-foreground">{item.name}</span>
            <span className="font-semibold text-card-foreground">{item.value}</span>
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
  const sexo = [
    { name: "Masculino", value: s.masculino ?? 0 },
    { name: "Feminino", value: s.feminino ?? 0 },
  ];
  const parteEtaria = [
    { name: "12–17 anos", value: s.faixa_12_17 ?? 0 },
    { name: "18–25 anos", value: s.faixa_18_25 ?? 0 },
  ];

  const charts = [
    { label: "Distribuição por Sexo", data: sexo },
    { label: "Parte Etária", data: parteEtaria },
    { label: "Categoria", data: mapLabels(s.categoria, CATEGORIA_LABELS) },
    { label: "Estado Civil", data: mapLabels(s.estado_civil, ESTADO_CIVIL_LABELS) },
    { label: "Escolaridade", data: mapLabels(s.escolaridade, ESCOLARIDADE_LABELS) },
    { label: "Ocupação", data: mapLabels(s.ocupacao, OCUPACAO_LABELS) },
    { label: "Origem", data: mapLabels(s.origem, ORIGEM_LABELS) },
    { label: "Motivos de Inactividade", data: mapLabels(s.motivo_inactividade, MOTIVO_INACTIVIDADE_LABELS) },
  ].filter((c) => c.data.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoJimua} alt="JIMUA" className="h-8 w-8" />
          <h1 className="text-lg font-bold text-foreground">JIMUA ANALYTICS — Estatísticas Públicas</h1>
        </div>
        <Link to="/" className="text-sm text-primary hover:underline">Entrar</Link>
      </header>

      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 size={24} />
              <h2 className="text-lg font-bold">Mapa Estatístico Geral</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div><p className="text-sm opacity-80">Total Activos</p><p className="text-2xl font-bold">{s.total ?? 0}</p></div>
              <div><p className="text-sm opacity-80">Inactivos</p><p className="text-2xl font-bold">{s.inactivos ?? 0}</p></div>
              <div><p className="text-sm opacity-80">Masculino</p><p className="text-2xl font-bold">{s.masculino ?? 0}</p></div>
              <div><p className="text-sm opacity-80">Feminino</p><p className="text-2xl font-bold">{s.feminino ?? 0}</p></div>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">Dados agregados — sem informações individuais</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {charts.map((cat) => (
            <Card key={cat.label}>
              <CardHeader className="pb-3"><CardTitle className="text-base">{cat.label}</CardTitle></CardHeader>
              <CardContent><BarSimple data={cat.data} /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicEstatisticas;
