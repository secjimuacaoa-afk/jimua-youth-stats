import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const calcAge = (dob: string) => Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
const calcParteEtaria = (dob: string) => { const age = calcAge(dob); return age >= 12 && age <= 17 ? "H (12–17)" : "I (18–25)"; };

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

const Estatisticas = () => {
  const { data: jovens = [] } = useQuery({
    queryKey: ["stats-jovens"],
    queryFn: async () => {
      const { data, error } = await supabase.from("jovens").select("*");
      if (error) throw error;
      return data;
    },
  });

  const stats = useMemo(() => {
    const activos = jovens.filter((j: any) => j.activo);
    const total = activos.length;

    const groupBy = (arr: any[], key: string, labelFn?: (v: string) => string) => {
      const counts: Record<string, number> = {};
      arr.forEach((j) => { const v = j[key]; if (v) counts[v] = (counts[v] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({
        name: labelFn ? labelFn(name) : name,
        value,
      }));
    };

    return {
      total,
      sexo: [
        { name: "Masculino", value: activos.filter((j: any) => j.sexo === "masculino").length },
        { name: "Feminino", value: activos.filter((j: any) => j.sexo === "feminino").length },
      ],
      parteEtaria: (() => {
        const h = activos.filter((j: any) => calcAge(j.data_nascimento) >= 12 && calcAge(j.data_nascimento) <= 17).length;
        return [{ name: "H (12–17)", value: h }, { name: "I (18–25)", value: total - h }];
      })(),
      categoria: groupBy(activos, "categoria"),
      escolaridade: groupBy(activos, "escolaridade"),
      ocupacao: groupBy(activos, "ocupacao"),
      estadoCivil: groupBy(activos, "estado_civil", (v) => v === "Y" ? "Y (Solteiro)" : "Z (Casado)"),
      origem: groupBy(activos, "origem"),
      inactivos: jovens.filter((j: any) => !j.activo).length,
      motivos: groupBy(jovens.filter((j: any) => !j.activo), "motivo_inactividade"),
    };
  }, [jovens]);

  const charts = [
    { label: "Distribuição por Sexo", data: stats.sexo },
    { label: "Parte Etária", data: stats.parteEtaria },
    { label: "Categoria", data: stats.categoria },
    { label: "Estado Civil", data: stats.estadoCivil },
    { label: "Escolaridade", data: stats.escolaridade },
    { label: "Ocupação", data: stats.ocupacao },
    { label: "Origem", data: stats.origem },
    { label: "Motivos de Inactividade", data: stats.motivos },
  ].filter((c) => c.data.length > 0);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estatísticas</h1>
          <p className="text-sm text-muted-foreground mt-1">Análise detalhada dos dados da juventude</p>
        </div>

        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 size={24} />
              <h2 className="text-lg font-bold">Mapa Estatístico</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-sm opacity-80">Total Activos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div>
                <p className="text-sm opacity-80">Inactivos</p>
                <p className="text-2xl font-bold">{stats.inactivos}</p>
              </div>
              <div>
                <p className="text-sm opacity-80">Masculino</p>
                <p className="text-2xl font-bold">{stats.sexo[0]?.value || 0}</p>
              </div>
              <div>
                <p className="text-sm opacity-80">Feminino</p>
                <p className="text-2xl font-bold">{stats.sexo[1]?.value || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {charts.map((cat) => (
            <Card key={cat.label}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{cat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <BarSimple data={cat.data} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Estatisticas;
