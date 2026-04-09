import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Users, TrendingUp, TrendingDown, UserPlus, UserMinus, GraduationCap, Heart, Church, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";

const calcAge = (dob: string) => Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

const BarSimple = ({ data, color = "from-primary to-navy-light" }: { data: { name: string; value: number }[]; color?: string }) => {
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
            <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700`} style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const { profile, isAdmin, userEstruturas } = useAuth();
  const [filterIntendencia, setFilterIntendencia] = useState("");
  const [filterCircuito, setFilterCircuito] = useState("");
  const [filterIgreja, setFilterIgreja] = useState("");

  const { data: intendencias = [] } = useQuery({
    queryKey: ["intendencias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("intendencias").select("*").order("nome");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: circuitos = [] } = useQuery({
    queryKey: ["circuitos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("circuitos").select("*").order("nome");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: allIgrejas = [] } = useQuery({
    queryKey: ["igrejas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("igrejas").select("*, circuitos(nome, intendencia_id)").order("nome");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: jovens = [] } = useQuery({
    queryKey: ["dashboard-jovens"],
    queryFn: async () => {
      const { data, error } = await supabase.from("jovens").select("sexo, activo, data_nascimento, categoria, escolaridade, estado_civil, is_oja, igreja_id, igrejas(nome, circuito_id, circuitos(intendencia_id))");
      if (error) throw error;
      return data;
    },
  });

  const { data: userIgreja } = useQuery({
    queryKey: ["user-igreja", userEstruturas],
    queryFn: async () => {
      if (!userEstruturas[0]) return null;
      const { data, error } = await supabase.from("igrejas").select("nome, circuitos(nome, intendencias(nome))").eq("id", userEstruturas[0]).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !isAdmin && userEstruturas.length > 0,
  });

  const filteredCircuitos = filterIntendencia ? circuitos.filter((c: any) => c.intendencia_id === filterIntendencia) : [];
  const filteredIgrejas = filterCircuito ? allIgrejas.filter((i: any) => i.circuito_id === filterCircuito) : [];

  const stats = useMemo(() => {
    let filtered = jovens.filter((j: any) => !j.is_oja);

    // Apply filters
    if (!isAdmin) {
      filtered = filtered.filter((j: any) => userEstruturas.includes(j.igreja_id));
    } else {
      if (filterIgreja) {
        filtered = filtered.filter((j: any) => j.igreja_id === filterIgreja);
      } else if (filterCircuito) {
        filtered = filtered.filter((j: any) => (j.igrejas as any)?.circuito_id === filterCircuito);
      } else if (filterIntendencia) {
        filtered = filtered.filter((j: any) => (j.igrejas as any)?.circuitos?.intendencia_id === filterIntendencia);
      }
    }

    const activos = filtered.filter((j: any) => j.activo);
    const inactivos = filtered.filter((j: any) => !j.activo);
    const masculino = activos.filter((j: any) => j.sexo === "masculino").length;
    const feminino = activos.filter((j: any) => j.sexo === "feminino").length;
    const total = activos.length;
    const h = activos.filter((j: any) => { const a = calcAge(j.data_nascimento); return a >= 12 && a <= 17; }).length;
    const i = total - h;
    const estudantes = activos.filter((j: any) => ["M", "N", "O", "P", "P1", "P2"].includes(j.escolaridade)).length;
    const solteiros = activos.filter((j: any) => j.estado_civil === "Y").length;

    // Church comparison for admin
    const churchCounts: { name: string; value: number }[] = [];
    if (isAdmin && !filterIgreja) {
      const byChurch: Record<string, number> = {};
      activos.forEach((j: any) => {
        const name = (j.igrejas as any)?.nome || "Sem igreja";
        byChurch[name] = (byChurch[name] || 0) + 1;
      });
      Object.entries(byChurch)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([name, value]) => churchCounts.push({ name, value }));
    }

    // Category distribution
    const catCounts: Record<string, number> = {};
    activos.forEach((j: any) => { if (j.categoria) catCounts[j.categoria] = (catCounts[j.categoria] || 0) + 1; });
    const categorias = Object.entries(catCounts).map(([name, value]) => ({ name, value }));

    return {
      total, inactivos: inactivos.length, masculino, feminino, h, i,
      estudantes, solteiros, churchCounts, categorias,
    };
  }, [jovens, isAdmin, userEstruturas, filterIntendencia, filterCircuito, filterIgreja]);

  // LOCAL SECRETARY DASHBOARD
  if (!isAdmin) {
    const igrejaNome = userIgreja ? (userIgreja as any).nome : "Minha Igreja";
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Bem-vindo, {profile?.nome_completo || "Utilizador"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Painel do Secretário Local — <strong>{igrejaNome}</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total de Jovens" value={stats.total} icon={Users} change={`${stats.total} activos`} changeType="positive" />
            <StatCard title="Inactivos" value={stats.inactivos} icon={UserMinus} change="jovens inativos" changeType={stats.inactivos > 0 ? "negative" : "positive"} />
            <StatCard title="Masculino" value={stats.masculino} icon={TrendingUp} change={`${stats.total > 0 ? ((stats.masculino / stats.total) * 100).toFixed(0) : 0}%`} changeType="neutral" />
            <StatCard title="Feminino" value={stats.feminino} icon={Heart} change={`${stats.total > 0 ? ((stats.feminino / stats.total) * 100).toFixed(0) : 0}%`} changeType="neutral" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Faixa Etária</CardTitle>
              </CardHeader>
              <CardContent>
                <BarSimple data={[
                  { name: "H (12–17 anos)", value: stats.h },
                  { name: "I (18–25 anos)", value: stats.i },
                ]} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Indicadores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <GraduationCap size={16} className="text-primary" />
                  <span className="text-card-foreground">Estudantes: <strong>{stats.total > 0 ? ((stats.estudantes / stats.total) * 100).toFixed(0) : 0}%</strong></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Heart size={16} className="text-secondary" />
                  <span className="text-card-foreground">Solteiros: <strong>{stats.total > 0 ? ((stats.solteiros / stats.total) * 100).toFixed(0) : 0}%</strong></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <UserPlus size={16} className="text-primary" />
                  <span className="text-card-foreground">Activos: <strong>{stats.total}</strong></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <UserMinus size={16} className="text-destructive" />
                  <span className="text-card-foreground">Inactivos: <strong>{stats.inactivos}</strong></span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ADMIN DASHBOARD
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Bem-vindo, {profile?.nome_completo || "Administrador"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Painel Administrativo — Visão geral do sistema
          </p>
        </div>

        {/* Cascading filters */}
        <Card>
          <CardContent className="py-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select value={filterIntendencia} onValueChange={(v) => { setFilterIntendencia(v); setFilterCircuito(""); setFilterIgreja(""); }}>
                <SelectTrigger><SelectValue placeholder="Todas as Intendências" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {intendencias.map((i: any) => (<SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={filterCircuito} onValueChange={(v) => { setFilterCircuito(v); setFilterIgreja(""); }} disabled={!filterIntendencia || filterIntendencia === "all"}>
                <SelectTrigger><SelectValue placeholder="Todos os Circuitos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {filteredCircuitos.map((c: any) => (<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={filterIgreja} onValueChange={setFilterIgreja} disabled={!filterCircuito || filterCircuito === "all"}>
                <SelectTrigger><SelectValue placeholder="Todas as Igrejas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {filteredIgrejas.map((i: any) => (<SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Activos" value={stats.total} icon={Users} change={`excl. OJA`} changeType="positive" />
          <StatCard title="Inactivos" value={stats.inactivos} icon={UserMinus} change="jovens" changeType={stats.inactivos > 0 ? "negative" : "positive"} />
          <StatCard title="Masculino / Feminino" value={`${stats.masculino} / ${stats.feminino}`} icon={TrendingUp} change="distribuição" changeType="neutral" />
          <StatCard title="Faixa Etária" value={`H:${stats.h} / I:${stats.i}`} icon={BarChart3} change="12-17 / 18-25" changeType="neutral" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {stats.churchCounts.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Comparação por Igreja (Top 10)</CardTitle>
              </CardHeader>
              <CardContent>
                <BarSimple data={stats.churchCounts} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <BarSimple data={stats.categorias} color="from-secondary to-primary" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Indicadores Rápidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <UserPlus size={16} className="text-primary" />
                <span className="text-card-foreground">Total activos: <strong>{stats.total}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <UserMinus size={16} className="text-destructive" />
                <span className="text-card-foreground">Inactivos: <strong>{stats.inactivos}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <GraduationCap size={16} className="text-primary" />
                <span className="text-card-foreground">Estudantes: <strong>{stats.total > 0 ? ((stats.estudantes / stats.total) * 100).toFixed(0) : 0}%</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Heart size={16} className="text-secondary" />
                <span className="text-card-foreground">Solteiros: <strong>{stats.total > 0 ? ((stats.solteiros / stats.total) * 100).toFixed(0) : 0}%</strong></span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Distribuição por Género</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Masculino", value: stats.masculino, color: "bg-primary" },
                { label: "Feminino", value: stats.feminino, color: "bg-secondary" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${item.color}`} />
                    <span className="text-sm text-card-foreground">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-card-foreground">{item.value}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({stats.total > 0 ? ((item.value / stats.total) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
