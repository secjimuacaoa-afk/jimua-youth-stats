import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Users, Church, TrendingUp, FileCheck, UserPlus, UserMinus, GraduationCap, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const { profile, isAdmin } = useAuth();

  const { data: jovens = [] } = useQuery({
    queryKey: ["dashboard-jovens"],
    queryFn: async () => {
      const { data, error } = await supabase.from("jovens").select("sexo, activo, data_nascimento, categoria, escolaridade, estado_civil");
      if (error) throw error;
      return data;
    },
  });

  const { data: estruturas = [] } = useQuery({
    queryKey: ["dashboard-estruturas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("estruturas").select("id");
      if (error) throw error;
      return data;
    },
  });

  const { data: relatorios = [] } = useQuery({
    queryKey: ["dashboard-relatorios"],
    queryFn: async () => {
      const { data, error } = await supabase.from("relatorios").select("status");
      if (error) throw error;
      return data;
    },
  });

  const totalJovens = jovens.length;
  const totalEstruturas = estruturas.length;
  const pendentes = relatorios.filter((r: any) => r.status === "submetido").length;
  const activos = jovens.filter((j: any) => j.activo).length;
  const masculino = jovens.filter((j: any) => j.sexo === "masculino").length;
  const feminino = jovens.filter((j: any) => j.sexo === "feminino").length;
  const estudantes = jovens.filter((j: any) => ["M", "N", "O", "P", "P1", "P2"].includes(j.escolaridade)).length;
  const solteiros = jovens.filter((j: any) => j.estado_civil === "Y").length;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Bem-vindo, {profile?.nome_completo || "Utilizador"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin ? "Painel Administrativo" : "Painel do Secretário Local"} — Visão geral do sistema
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total de Jovens" value={totalJovens} icon={Users} change={`${activos} activos`} changeType="positive" />
          <StatCard title="Cargos Pastorais" value={totalEstruturas} icon={Church} change="estruturas" changeType="neutral" />
          <StatCard title="Masculino / Feminino" value={`${masculino} / ${feminino}`} icon={TrendingUp} change="distribuição" changeType="neutral" />
          <StatCard title="Relatórios Pendentes" value={pendentes} icon={FileCheck} change="a analisar" changeType={pendentes > 0 ? "negative" : "positive"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Distribuição por Género</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Masculino", value: masculino, color: "bg-primary" },
                { label: "Feminino", value: feminino, color: "bg-secondary" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${item.color}`} />
                    <span className="text-sm text-card-foreground">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-card-foreground">{item.value}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({totalJovens > 0 ? ((item.value / totalJovens) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Indicadores Rápidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <UserPlus size={16} className="text-success" />
                <span className="text-card-foreground">Total activos: <strong>{activos}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <UserMinus size={16} className="text-destructive" />
                <span className="text-card-foreground">Inactivos: <strong>{totalJovens - activos}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <GraduationCap size={16} className="text-info" />
                <span className="text-card-foreground">Estudantes: <strong>{totalJovens > 0 ? ((estudantes / totalJovens) * 100).toFixed(0) : 0}%</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Heart size={16} className="text-secondary" />
                <span className="text-card-foreground">Solteiros: <strong>{totalJovens > 0 ? ((solteiros / totalJovens) * 100).toFixed(0) : 0}%</strong></span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Estado do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-card-foreground">
                <p>Jovens registados: <strong>{totalJovens}</strong></p>
                <p>Estruturas: <strong>{totalEstruturas}</strong></p>
                <p>Relatórios: <strong>{relatorios.length}</strong></p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {isAdmin ? "Acesso administrativo completo" : "Acesso limitado à sua estrutura"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
