import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const Frequencia = () => {
  const { userEstruturas, isAdmin } = useAuth();
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [semestre, setSemestre] = useState("all");
  const [igrejaFilter, setIgrejaFilter] = useState<string>("");

  const { data: igrejas = [] } = useQuery({
    queryKey: ["igrejas-freq"],
    queryFn: async () => (await supabase.from("igrejas").select("id,nome").order("nome")).data || [],
  });

  const igrejaId = isAdmin ? igrejaFilter : userEstruturas[0];

  const { data: actividades = [] } = useQuery({
    queryKey: ["freq-actividades", ano, semestre, igrejaId],
    queryFn: async () => {
      let q = supabase.from("actividades").select("id,tipo,igreja_id,ano,semestre").eq("ano", Number(ano));
      if (semestre !== "all") q = q.eq("semestre", Number(semestre));
      if (igrejaId) q = q.eq("igreja_id", igrejaId);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: presencas = [] } = useQuery({
    queryKey: ["freq-presencas", (actividades as any[]).map((a: any) => a.id).join(",")],
    queryFn: async () => {
      const ids = (actividades as any[]).map((a: any) => a.id);
      if (ids.length === 0) return [];
      const { data } = await supabase.from("presencas").select("*").in("actividade_id", ids);
      return data || [];
    },
    enabled: (actividades as any[]).length > 0,
  });

  const { data: jovens = [] } = useQuery({
    queryKey: ["freq-jovens", igrejaId],
    queryFn: async () => {
      let q = supabase.from("jovens").select("id,nome,igreja_id").eq("activo", true);
      if (igrejaId) q = q.eq("igreja_id", igrejaId);
      const { data } = await q;
      return data || [];
    },
  });

  const stats = useMemo(() => {
    const totalActividades = (actividades as any[]).length;
    const cultos = (actividades as any[]).filter((a: any) => a.tipo === "culto").length;
    const estudos = (actividades as any[]).filter((a: any) => a.tipo === "estudo_biblico").length;
    const totalPresencas = (presencas as any[]).filter((p: any) => p.estado === "presente").length;
    const totalRegistos = (presencas as any[]).length;
    const fma = totalRegistos > 0 ? (totalPresencas / totalRegistos) * 100 : 0;

    // FMR: reuniões oficiais = cultos + estudos
    const reunioesOficiais = (actividades as any[]).filter((a: any) => ["culto", "estudo_biblico"].includes(a.tipo));
    const idsOficiais = new Set(reunioesOficiais.map((r: any) => r.id));
    const presReuniao = (presencas as any[]).filter((p: any) => idsOficiais.has(p.actividade_id));
    const presOficiais = presReuniao.filter((p: any) => p.estado === "presente").length;
    const fmr = presReuniao.length > 0 ? (presOficiais / presReuniao.length) * 100 : 0;

    // Per-jovem FMA
    const perJovem = (jovens as any[]).map((j: any) => {
      const pres = (presencas as any[]).filter((p: any) => p.jovem_id === j.id && p.estado === "presente").length;
      const pct = totalActividades > 0 ? (pres / totalActividades) * 100 : 0;
      return { name: j.nome, value: Math.round(pct) };
    }).sort((a, b) => b.value - a.value).slice(0, 15);

    return { totalActividades, cultos, estudos, fma, fmr, perJovem };
  }, [actividades, presencas, jovens]);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Frequência</h1>
          <p className="text-sm text-muted-foreground">FMR (Reuniões) e FMA (Actividades) — cálculos automáticos por período</p>
        </div>

        <Card>
          <CardContent className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={ano} onValueChange={setAno}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{[0, 1, 2, 3, 4].map((i) => { const y = new Date().getFullYear() - i; return <SelectItem key={y} value={String(y)}>{y}</SelectItem>; })}</SelectContent>
            </Select>
            <Select value={semestre} onValueChange={setSemestre}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Ambos semestres</SelectItem><SelectItem value="1">1º Semestre</SelectItem><SelectItem value="2">2º Semestre</SelectItem></SelectContent>
            </Select>
            {isAdmin && (
              <Select value={igrejaFilter || "all"} onValueChange={(v) => setIgrejaFilter(v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Todas igrejas" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todas igrejas</SelectItem>{(igrejas as any[]).map((i: any) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-primary">{stats.totalActividades}</p><p className="text-xs text-muted-foreground mt-1">Actividades</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{stats.cultos}</p><p className="text-xs text-muted-foreground mt-1">Cultos</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">FMR (Reuniões)</p><p className="text-2xl font-bold">{stats.fmr.toFixed(1)}%</p><Progress value={stats.fmr} className="mt-2" /></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">FMA (Actividades)</p><p className="text-2xl font-bold">{stats.fma.toFixed(1)}%</p><Progress value={stats.fma} className="mt-2" /></CardContent></Card>
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">FMA por jovem (Top 15)</CardTitle></CardHeader>
          <CardContent>
            {stats.perJovem.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Sem dados de presença ainda.</p>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats.perJovem} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                    {stats.perJovem.map((_, i) => (<Cell key={i} fill={`hsl(var(--primary))`} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Frequencia;
