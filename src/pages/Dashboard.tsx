import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Users, TrendingUp, UserPlus, UserMinus, GraduationCap, Heart, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { CATEGORIA_LABELS, getLabel } from "@/lib/labels";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const calcAge = (dob: string) => Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))"];

const Dashboard = () => {
  const { profile, isAdmin, isSuperAdmin, userEstruturas, welcomeInfo } = useAuth();
  const [filterDistrito, setFilterDistrito] = useState("all");
  const [filterIntendencia, setFilterIntendencia] = useState("all");
  const [filterCircuito, setFilterCircuito] = useState("all");
  const [filterIgreja, setFilterIgreja] = useState("all");

  const { data: distritos = [] } = useQuery({ queryKey: ["distritos"], queryFn: async () => (await supabase.from("distritos").select("*").order("nome")).data || [], enabled: isSuperAdmin });
  const { data: intendencias = [] } = useQuery({ queryKey: ["intendencias"], queryFn: async () => (await supabase.from("intendencias").select("*").order("nome")).data || [], enabled: isAdmin });
  const { data: circuitos = [] } = useQuery({ queryKey: ["circuitos"], queryFn: async () => (await supabase.from("circuitos").select("*").order("nome")).data || [], enabled: isAdmin });
  const { data: allIgrejas = [] } = useQuery({ queryKey: ["igrejas"], queryFn: async () => (await supabase.from("igrejas").select("*, circuitos(nome, intendencia_id, intendencias(distrito_id))").order("nome")).data || [], enabled: isAdmin });

  const { data: jovens = [] } = useQuery({
    queryKey: ["dashboard-jovens"],
    queryFn: async () => {
      const { data, error } = await supabase.from("jovens").select("sexo, activo, data_nascimento, categoria, escolaridade, estado_civil, is_oja, igreja_id, created_at, igrejas(nome, circuito_id, circuitos(intendencia_id, intendencias(distrito_id)))");
      if (error) throw error;
      return data;
    },
  });

  const filteredIntendencias = useMemo(() =>
    filterDistrito === "all" ? intendencias : (intendencias as any[]).filter((i: any) => i.distrito_id === filterDistrito),
  [intendencias, filterDistrito]);
  const filteredCircuitos = useMemo(() =>
    filterIntendencia === "all" ? [] : (circuitos as any[]).filter((c: any) => c.intendencia_id === filterIntendencia),
  [circuitos, filterIntendencia]);
  const filteredIgrejas = useMemo(() =>
    filterCircuito === "all" ? [] : (allIgrejas as any[]).filter((i: any) => i.circuito_id === filterCircuito),
  [allIgrejas, filterCircuito]);

  const stats = useMemo(() => {
    let filtered = (jovens as any[]).filter((j: any) => !j.is_oja);
    if (!isAdmin) {
      filtered = filtered.filter((j: any) => userEstruturas.includes(j.igreja_id));
    } else {
      if (filterIgreja !== "all") filtered = filtered.filter((j: any) => j.igreja_id === filterIgreja);
      else if (filterCircuito !== "all") filtered = filtered.filter((j: any) => j.igrejas?.circuito_id === filterCircuito);
      else if (filterIntendencia !== "all") filtered = filtered.filter((j: any) => j.igrejas?.circuitos?.intendencia_id === filterIntendencia);
      else if (filterDistrito !== "all") filtered = filtered.filter((j: any) => j.igrejas?.circuitos?.intendencias?.distrito_id === filterDistrito);
    }

    const activos = filtered.filter((j: any) => j.activo);
    const inactivos = filtered.filter((j: any) => !j.activo);
    const masc = activos.filter((j: any) => j.sexo === "masculino").length;
    const fem = activos.filter((j: any) => j.sexo === "feminino").length;
    const total = activos.length;
    const h = activos.filter((j: any) => { const a = calcAge(j.data_nascimento); return a >= 12 && a <= 17; }).length;
    const i = total - h;
    const estudantes = activos.filter((j: any) => ["M", "N", "O", "P", "P1", "P2"].includes(j.escolaridade)).length;
    const solteiros = activos.filter((j: any) => j.estado_civil === "Y").length;

    // Categoria (bar)
    const catCounts: Record<string, number> = {};
    activos.forEach((j: any) => { if (j.categoria) catCounts[j.categoria] = (catCounts[j.categoria] || 0) + 1; });
    const categorias = Object.entries(catCounts).map(([code, value]) => ({ name: getLabel(CATEGORIA_LABELS, code), value }));

    // Top igrejas
    const churchCounts: { name: string; value: number }[] = [];
    if (isAdmin && filterIgreja === "all") {
      const byChurch: Record<string, number> = {};
      activos.forEach((j: any) => {
        const name = j.igrejas?.nome || "Sem igreja";
        byChurch[name] = (byChurch[name] || 0) + 1;
      });
      Object.entries(byChurch).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([name, value]) => churchCounts.push({ name, value }));
    }

    // Novos no mês/ano
    const now = new Date();
    const novosMes = filtered.filter((j: any) => {
      const d = new Date(j.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const novosAno = filtered.filter((j: any) => new Date(j.created_at).getFullYear() === now.getFullYear()).length;

    return { total, inactivos: inactivos.length, masc, fem, h, i, estudantes, solteiros, categorias, churchCounts, novosMes, novosAno };
  }, [jovens, isAdmin, userEstruturas, filterDistrito, filterIntendencia, filterCircuito, filterIgreja]);

  const genderData = [{ name: "Masculino", value: stats.masc }, { name: "Feminino", value: stats.fem }];
  const ageData = [{ name: "12–17 anos", value: stats.h }, { name: "18–25 anos", value: stats.i }];

  const isLocal = !isAdmin;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Bem-vindo, {welcomeInfo?.titulo || profile?.nome_completo || "Utilizador"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{welcomeInfo?.descricao || "Painel de gestão estatística"}</p>
        </div>

        {isAdmin && (
          <Card>
            <CardContent className="py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {isSuperAdmin && (
                  <Select value={filterDistrito} onValueChange={(v) => { setFilterDistrito(v); setFilterIntendencia("all"); setFilterCircuito("all"); setFilterIgreja("all"); }}>
                    <SelectTrigger><SelectValue placeholder="Distrito" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Distritos</SelectItem>
                      {(distritos as any[]).map((d: any) => (<SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>))}
                    </SelectContent>
                  </Select>
                )}
                <Select value={filterIntendencia} onValueChange={(v) => { setFilterIntendencia(v); setFilterCircuito("all"); setFilterIgreja("all"); }}>
                  <SelectTrigger><SelectValue placeholder="Intendência" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Intendências</SelectItem>
                    {(filteredIntendencias as any[]).map((i: any) => (<SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={filterCircuito} onValueChange={(v) => { setFilterCircuito(v); setFilterIgreja("all"); }} disabled={filterIntendencia === "all"}>
                  <SelectTrigger><SelectValue placeholder="Circuito" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Circuitos</SelectItem>
                    {(filteredCircuitos as any[]).map((c: any) => (<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={filterIgreja} onValueChange={setFilterIgreja} disabled={filterCircuito === "all"}>
                  <SelectTrigger><SelectValue placeholder="Igreja" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Igrejas</SelectItem>
                    {(filteredIgrejas as any[]).map((i: any) => (<SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard title="Total Activos" value={stats.total} icon={Users} change="excl. OJA" changeType="positive" />
          <StatCard title="Inactivos" value={stats.inactivos} icon={UserMinus} change={`${stats.total > 0 ? Math.round((stats.inactivos / (stats.total + stats.inactivos)) * 100) : 0}%`} changeType={stats.inactivos > 0 ? "negative" : "positive"} />
          <StatCard title="Masculino" value={stats.masc} icon={TrendingUp} change={`${stats.total > 0 ? Math.round((stats.masc / stats.total) * 100) : 0}%`} />
          <StatCard title="Feminino" value={stats.fem} icon={Heart} change={`${stats.total > 0 ? Math.round((stats.fem / stats.total) * 100) : 0}%`} />
          <StatCard title="Novos (mês)" value={stats.novosMes} icon={UserPlus} change={`${stats.novosAno} este ano`} changeType="positive" />
          <StatCard title="12–17 / 18–25" value={`${stats.h}/${stats.i}`} icon={BarChart3} change="OJA vs Juvenis" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Distribuição por Género</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={(e) => `${e.name}: ${e.value}`}>
                    {genderData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Faixa Etária</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={ageData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={(e) => `${e.name}: ${e.value}`}>
                    {ageData.map((_, i) => <Cell key={i} fill={COLORS[i + 1]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {stats.categorias.length > 0 && (
            <Card className={stats.churchCounts.length === 0 ? "lg:col-span-2" : ""}>
              <CardHeader className="pb-3"><CardTitle className="text-base">Comparação por Categoria</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stats.categorias}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {stats.churchCounts.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Top 10 Igrejas</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stats.churchCounts} layout="vertical" margin={{ left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--secondary))" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Indicadores</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3"><GraduationCap size={16} className="text-primary" /><span>Estudantes: <strong>{stats.total > 0 ? Math.round((stats.estudantes / stats.total) * 100) : 0}%</strong></span></div>
              <div className="flex items-center gap-3"><Heart size={16} className="text-secondary" /><span>Solteiros: <strong>{stats.total > 0 ? Math.round((stats.solteiros / stats.total) * 100) : 0}%</strong></span></div>
              <div className="flex items-center gap-3"><UserPlus size={16} className="text-primary" /><span>Activos: <strong>{stats.total}</strong></span></div>
              <div className="flex items-center gap-3"><UserMinus size={16} className="text-destructive" /><span>Inactivos: <strong>{stats.inactivos}</strong></span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
