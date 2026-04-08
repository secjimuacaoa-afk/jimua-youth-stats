import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Users, Church, TrendingUp, FileCheck, UserPlus, UserMinus, GraduationCap, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const mockStats = {
  totalJovens: 1247,
  totalIgrejas: 52,
  crescimento: "+8.3%",
  relatoriosPendentes: 7,
};

const recentActivities = [
  { text: "Igreja Bom Pastor submeteu relatório 1º semestre", time: "Há 2 horas" },
  { text: "15 novos jovens registados em Lubango", time: "Há 5 horas" },
  { text: "Relatório da Intendência Norte aprovado", time: "Há 1 dia" },
  { text: "3 jovens transferidos para circuito Huambo", time: "Há 2 dias" },
];

const distributionData = [
  { label: "Masculino", value: 685, pct: "54.9%" },
  { label: "Feminino", value: 562, pct: "45.1%" },
];

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visão geral do sistema estatístico — 2º Semestre 2025
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total de Jovens" value={mockStats.totalJovens} icon={Users} change="+98 este semestre" changeType="positive" />
          <StatCard title="Cargos Pastorais" value={mockStats.totalIgrejas} icon={Church} change="3 novos" changeType="positive" />
          <StatCard title="Crescimento" value={mockStats.crescimento} icon={TrendingUp} change="vs semestre anterior" changeType="positive" />
          <StatCard title="Relatórios Pendentes" value={mockStats.relatoriosPendentes} icon={FileCheck} change="de 52 unidades" changeType="neutral" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Distribuição por Género</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {distributionData.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${item.label === "Masculino" ? "bg-primary" : "bg-secondary"}`} />
                    <span className="text-sm text-card-foreground">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-card-foreground">{item.value}</span>
                    <span className="text-xs text-muted-foreground ml-2">({item.pct})</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Indicadores Rápidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <UserPlus size={16} className="text-success" />
                <span className="text-card-foreground">Novos membros: <strong>98</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <UserMinus size={16} className="text-destructive" />
                <span className="text-card-foreground">Saídas: <strong>12</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <GraduationCap size={16} className="text-info" />
                <span className="text-card-foreground">Estudantes: <strong>67%</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Heart size={16} className="text-secondary" />
                <span className="text-card-foreground">Solteiros: <strong>82%</strong></span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Actividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((act, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-card-foreground">{act.text}</p>
                      <p className="text-xs text-muted-foreground">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
