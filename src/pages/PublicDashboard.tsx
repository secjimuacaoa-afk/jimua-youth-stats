import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CATEGORIA_LABELS, getLabel } from "@/lib/labels";
import logoJimua from "@/assets/logo-jimua.png";
import { Link } from "react-router-dom";

const BarSimple = ({ data }: { data: { name: string; value: number }[] }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.name} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-card-foreground truncate">{item.name}</span>
            <span className="font-semibold text-card-foreground">{item.value}</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-navy-light rounded-full transition-all duration-700" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const PublicDashboard = () => {
  const { data } = useQuery({
    queryKey: ["public-dashboard-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_dashboard_stats");
      if (error) throw error;
      return data as any;
    },
  });

  const s = data || {};
  const categorias = (s.categoria || []).map((x: any) => ({ name: getLabel(CATEGORIA_LABELS, x.name), value: x.value }));
  const churchCounts = s.igrejas_top || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoJimua} alt="JIMUA" className="h-8 w-8" />
          <h1 className="text-lg font-bold text-foreground">JIMUA ANALYTICS — Dashboard Público</h1>
        </div>
        <Link to="/" className="text-sm text-primary hover:underline">Entrar</Link>
      </header>

      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <p className="text-sm text-muted-foreground">Dados agregados da juventude — sem informações individuais</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6 text-center">
            <Users size={24} className="mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{s.total ?? 0}</p>
            <p className="text-xs text-muted-foreground">Total Activos</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <UserMinus size={24} className="mx-auto text-destructive mb-2" />
            <p className="text-2xl font-bold">{s.inactivos ?? 0}</p>
            <p className="text-xs text-muted-foreground">Inactivos</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{s.masculino ?? 0}</p>
            <p className="text-xs text-muted-foreground">Masculino</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{s.feminino ?? 0}</p>
            <p className="text-xs text-muted-foreground">Feminino</p>
          </CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Faixa Etária</CardTitle></CardHeader>
            <CardContent>
              <BarSimple data={[{ name: "12–17 anos", value: s.faixa_12_17 ?? 0 }, { name: "18–25 anos", value: s.faixa_18_25 ?? 0 }]} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Categoria</CardTitle></CardHeader>
            <CardContent><BarSimple data={categorias} /></CardContent>
          </Card>
          {churchCounts.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3"><CardTitle className="text-base">Top 10 Igrejas</CardTitle></CardHeader>
              <CardContent><BarSimple data={churchCounts} /></CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicDashboard;
