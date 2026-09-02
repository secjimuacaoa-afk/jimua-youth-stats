import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, FileText, UserMinus, Users } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import ChartCard from "@/components/public/ChartCard";
import { exportarExcelPublico, exportarPdfPublico, StatsPublicos } from "@/lib/exportPublico";
import { toast } from "@/hooks/use-toast";

const TODOS = "todos";

type Estrutura = { id: string; nome: string; distrito_id?: string; intendencia_id?: string; circuito_id?: string };

const COR_PRIMARIA = "hsl(var(--primary))";
const COR_SECUNDARIA = "hsl(var(--secondary))";
const COR_LIGHT = "hsl(var(--navy-light))";
const COR_DESTRUTIVA = "hsl(var(--destructive))";

const chartMargin = { top: 8, right: 8, left: -16, bottom: 0 };

const PublicStatsPanel = () => {
  const [distrito, setDistrito] = useState(TODOS);
  const [intendencia, setIntendencia] = useState(TODOS);
  const [circuito, setCircuito] = useState(TODOS);
  const [igreja, setIgreja] = useState(TODOS);

  const { data: estruturas } = useQuery({
    queryKey: ["public-estruturas"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_estruturas" as never);
      if (error) throw error;
      return data as unknown as { distritos: Estrutura[]; intendencias: Estrutura[]; circuitos: Estrutura[]; igrejas: Estrutura[] };
    },
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ["public-stats", distrito, intendencia, circuito, igreja],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_dashboard_stats", {
        _distrito_id: distrito === TODOS ? null : distrito,
        _intendencia_id: intendencia === TODOS ? null : intendencia,
        _circuito_id: circuito === TODOS ? null : circuito,
        _igreja_id: igreja === TODOS ? null : igreja,
      } as never);
      if (error) throw error;
      return data as unknown as StatsPublicos;
    },
  });

  const intendencias = useMemo(
    () => (estruturas?.intendencias || []).filter((i) => distrito === TODOS || i.distrito_id === distrito),
    [estruturas, distrito],
  );
  const circuitos = useMemo(
    () => (estruturas?.circuitos || []).filter((c) => (intendencia === TODOS ? intendencias.some((i) => i.id === c.intendencia_id) : c.intendencia_id === intendencia)),
    [estruturas, intendencia, intendencias],
  );
  const igrejas = useMemo(
    () => (estruturas?.igrejas || []).filter((g) => (circuito === TODOS ? circuitos.some((c) => c.id === g.circuito_id) : g.circuito_id === circuito)),
    [estruturas, circuito, circuitos],
  );

  const s: StatsPublicos = stats || {};
  const serie = s.serie_semestral || [];
  const serieData = serie.map((p) => ({
    periodo: `${p.ano}/${p.semestre}.º`,
    Anterior: p.base,
    Entradas: p.entradas,
    Saídas: p.saidas,
    Actual: p.actual,
    Abandono: p.taxa_abandono,
  }));

  const generoData = [
    { name: "Masculino", value: s.masculino ?? 0 },
    { name: "Feminino", value: s.feminino ?? 0 },
  ];
  const totalGenero = generoData.reduce((a, b) => a + b.value, 0);
  const pct = (v: number) => (totalGenero ? `${Math.round((v / totalGenero) * 100)}%` : "0%");

  const faixaData = [
    { name: "12–17 anos", value: s.faixa_12_17 ?? 0 },
    { name: "18–25 anos", value: s.faixa_18_25 ?? 0 },
  ];
  const igrejasTop = s.igrejas_top || [];

  const nomeDe = (lista: Estrutura[] | undefined, id: string) =>
    id === TODOS ? undefined : lista?.find((x) => x.id === id)?.nome;

  const escopo = {
    distrito: nomeDe(estruturas?.distritos, distrito),
    intendencia: nomeDe(estruturas?.intendencias, intendencia),
    circuito: nomeDe(estruturas?.circuitos, circuito),
    igreja: nomeDe(estruturas?.igrejas, igreja),
  };

  const resumo = [
    { label: "Total de jovens activos", value: s.total ?? 0, icon: Users },
    { label: "Jovens inactivos", value: s.inactivos ?? 0, icon: UserMinus },
    { label: "Masculino", value: s.masculino ?? 0 },
    { label: "Feminino", value: s.feminino ?? 0 },
  ];

  const exportarPdf = async () => {
    try {
      await exportarPdfPublico(s, escopo);
    } catch {
      toast({ title: "Não foi possível gerar o PDF", variant: "destructive" });
    }
  };
  const exportarExcel = () => {
    try {
      exportarExcelPublico(s, escopo);
    } catch {
      toast({ title: "Não foi possível gerar o ficheiro Excel", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="f-distrito" className="text-sm">Distrito</Label>
          <Select value={distrito} onValueChange={(v) => { setDistrito(v); setIntendencia(TODOS); setCircuito(TODOS); setIgreja(TODOS); }}>
            <SelectTrigger id="f-distrito" className="bg-card min-h-11"><SelectValue placeholder="Distrito" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os Distritos</SelectItem>
              {(estruturas?.distritos || []).map((d) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-intendencia" className="text-sm">Intendência</Label>
          <Select value={intendencia} onValueChange={(v) => { setIntendencia(v); setCircuito(TODOS); setIgreja(TODOS); }}>
            <SelectTrigger id="f-intendencia" className="bg-card min-h-11"><SelectValue placeholder="Intendência" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas as Intendências</SelectItem>
              {intendencias.map((i) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-circuito" className="text-sm">Circuito</Label>
          <Select value={circuito} onValueChange={(v) => { setCircuito(v); setIgreja(TODOS); }}>
            <SelectTrigger id="f-circuito" className="bg-card min-h-11"><SelectValue placeholder="Circuito" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os Circuitos</SelectItem>
              {circuitos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-igreja" className="text-sm">Igreja Local</Label>
          <Select value={igreja} onValueChange={setIgreja}>
            <SelectTrigger id="f-igreja" className="bg-card min-h-11"><SelectValue placeholder="Igreja Local" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas as Igrejas Locais</SelectItem>
              {igrejas.map((g) => <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Exportação */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {isLoading ? "A carregar dados agregados…" : "Os números respeitam os filtros seleccionados acima."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="min-h-11" onClick={exportarPdf}>
            <FileText size={18} aria-hidden="true" className="mr-2" /> Exportar PDF
          </Button>
          <Button variant="outline" className="min-h-11" onClick={exportarExcel}>
            <FileSpreadsheet size={18} aria-hidden="true" className="mr-2" /> Exportar Excel
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {resumo.map((r) => (
          <Card key={r.label}>
            <CardContent className="pt-6 text-center space-y-1">
              {r.icon && <r.icon size={22} className="mx-auto text-primary mb-1" aria-hidden="true" />}
              <p className="font-display text-3xl font-bold text-card-foreground tabular-nums">{r.value}</p>
              <p className="text-sm text-muted-foreground">{r.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-5">
        <ChartCard
          className="lg:col-span-2"
          title="Crescimento semestral"
          description="Efectivo no início de cada semestre, entradas e saídas registadas e efectivo no fim. Nº actual = anterior + entradas − saídas."
          empty={serieData.length === 0}
          emptyMessage="Ainda não há semestres consolidados para este âmbito. Os valores aparecem à medida que as igrejas fecham os períodos."
          tableHeaders={["Período", "Anterior / Entradas / Saídas / Actual"]}
          table={serie.map((p) => ({ label: `${p.ano} · ${p.semestre}.º semestre`, value: `${p.base} / ${p.entradas} / ${p.saidas} / ${p.actual}` }))}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={serieData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--card-foreground))" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Anterior" fill={COR_LIGHT} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Entradas" fill={COR_PRIMARIA} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Saídas" fill={COR_DESTRUTIVA} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual" fill={COR_SECUNDARIA} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Taxa de abandono"
          description="Percentagem de jovens que se afastaram no semestre, sobre o efectivo do início somado às entradas."
          empty={serieData.length === 0}
          emptyMessage="Sem semestres consolidados para calcular a taxa de abandono."
          tableHeaders={["Período", "Taxa"]}
          table={serie.map((p) => ({ label: `${p.ano} · ${p.semestre}.º semestre`, value: `${p.taxa_abandono}%` }))}
        >
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={serieData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis unit="%" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--card-foreground))" }} />
              <Line type="monotone" dataKey="Abandono" stroke={COR_DESTRUTIVA} strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Distribuição por género"
          description="Peso de jovens do sexo masculino e feminino no total de jovens activos do âmbito seleccionado."
          empty={totalGenero === 0}
          tableHeaders={["Sexo", "Jovens (percentagem)"]}
          table={generoData.map((g) => ({ label: g.name, value: `${g.value} (${pct(g.value)})` }))}
        >
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={generoData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {generoData.map((g, i) => <Cell key={g.name} fill={i === 0 ? COR_PRIMARIA : COR_SECUNDARIA} />)}
              </Pie>
              <Tooltip formatter={(v: number, n) => [`${v} (${pct(v)})`, n as string]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--card-foreground))" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Faixa etária"
          description="Jovens activos por escalão de idade: 12 a 17 anos e 18 a 25 anos. Aos 26 anos o jovem é encaminhado à OJA."
          empty={faixaData.every((f) => f.value === 0)}
          tableHeaders={["Faixa etária", "Jovens"]}
          table={faixaData.map((f) => ({ label: f.name, value: f.value }))}
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={faixaData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--card-foreground))" }} />
              <Bar dataKey="value" name="Jovens" fill={COR_PRIMARIA} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Igrejas locais com mais jovens"
          description="As dez igrejas locais com maior número de jovens activos dentro do âmbito seleccionado."
          empty={igrejasTop.length === 0}
          tableHeaders={["Igreja Local", "Jovens"]}
          table={igrejasTop.map((i) => ({ label: i.name, value: i.value }))}
        >
          <ResponsiveContainer width="100%" height={Math.max(240, igrejasTop.length * 34)}>
            <BarChart data={igrejasTop} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--card-foreground))" }} />
              <Bar dataKey="value" name="Jovens activos" fill={COR_LIGHT} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default PublicStatsPanel;
