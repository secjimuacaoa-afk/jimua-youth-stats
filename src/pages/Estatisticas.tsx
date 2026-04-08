import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, BarChart3 } from "lucide-react";

const categories = [
  { label: "Distribuição por Sexo", data: [{ name: "Masculino", value: 685 }, { name: "Feminino", value: 562 }] },
  { label: "Parte Etária", data: [{ name: "H (12–17)", value: 498 }, { name: "I (18–25)", value: 749 }] },
  { label: "Categoria", data: [{ name: "J", value: 420 }, { name: "K", value: 510 }, { name: "L", value: 317 }] },
  { label: "Estado Civil", data: [{ name: "Y (Solteiro)", value: 1022 }, { name: "Z (Casado)", value: 225 }] },
];

const BarSimple = ({ data }: { data: { name: string; value: number }[] }) => {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.name} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-card-foreground">{item.name}</span>
            <span className="font-semibold text-card-foreground">{item.value}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-navy-light rounded-full transition-all duration-700"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const Estatisticas = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Estatísticas</h1>
            <p className="text-sm text-muted-foreground mt-1">Análise detalhada dos dados da juventude</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline"><Download size={16} className="mr-2" />PDF</Button>
            <Button variant="outline"><Download size={16} className="mr-2" />Excel</Button>
          </div>
        </div>

        {/* Summary */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 size={24} />
              <h2 className="text-lg font-bold">Mapa Estatístico — 2º Semestre 2025</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-sm opacity-80">Nº Anterior</p>
                <p className="text-2xl font-bold">1.149</p>
              </div>
              <div>
                <p className="text-sm opacity-80">Nº Actual</p>
                <p className="text-2xl font-bold">1.247</p>
              </div>
              <div>
                <p className="text-sm opacity-80">Crescimento</p>
                <p className="text-2xl font-bold">+98</p>
              </div>
              <div>
                <p className="text-sm opacity-80">Taxa</p>
                <p className="text-2xl font-bold">+8.5%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat) => (
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
