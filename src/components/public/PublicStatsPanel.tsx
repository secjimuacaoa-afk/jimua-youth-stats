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
          description="Entradas e saídas registadas em cada semestre, com a linha do efectivo actual por cima. Nº actual = anterior + entradas − saídas."
          empty={serieData.length === 0}
          emptyMessage="Ainda não há semestres consolidados para este âmbito. Os valores aparecem à medida que as igrejas fecham os períodos."
          tableHeaders={["Período", "Anterior / Entradas / Saídas / Actual"]}
          table={serie.map((p) => ({ label: `${p.ano} · ${p.semestre}.º semestre`, value: `${p.base} / ${p.entradas} / ${p.saidas} / ${p.actual}` }))}
        >
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={serieData} margin={chartMargin}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="periodo" tickLine={false} axisLine={false} tick={axisTick} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axisTick} width={44} />
              <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.5)" }} content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
              <Bar dataKey="Entradas" fill={CHART.crescimento} radius={[4, 4, 0, 0]} maxBarSize={34} animationDuration={ANIM}>
                <LabelList dataKey="Entradas" position="top" style={{ fontSize: 11, fill: CHART.eixo }} />
              </Bar>
              <Bar dataKey="Saídas" fill={CHART.alerta} radius={[4, 4, 0, 0]} maxBarSize={34} animationDuration={ANIM}>
                <LabelList dataKey="Saídas" position="top" style={{ fontSize: 11, fill: CHART.eixo }} />
              </Bar>
              <Line type="monotone" dataKey="Actual" stroke={CHART.principal} strokeWidth={3} dot={{ r: 4, fill: CHART.principal }} animationDuration={ANIM} />
            </ComposedChart>
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
          {serieData.length === 1 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <span className="font-display text-5xl font-bold tabular-nums" style={{ color: CHART.alerta }}>
                {serieData[0].Abandono}%
              </span>
              <span className="mt-2 text-sm text-muted-foreground">{serieData[0].periodo}</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={serieData} margin={chartMargin}>
                <defs>
                  <linearGradient id="grad-abandono" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.alerta} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={CHART.alerta} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="periodo" tickLine={false} axisLine={false} tick={axisTick} />
                <YAxis unit="%" tickLine={false} axisLine={false} tick={axisTick} width={44} />
                <Tooltip content={<ChartTooltip suffix="%" />} />
                <Area type="monotone" dataKey="Abandono" stroke={CHART.alerta} strokeWidth={3} fill="url(#grad-abandono)" dot={{ r: 3 }} activeDot={{ r: 5 }} animationDuration={ANIM} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Distribuição por sexo"
          description="Peso de jovens do sexo masculino e feminino no total de jovens activos do âmbito seleccionado."
          empty={totalGenero === 0}
          tableHeaders={["Sexo", "Jovens (percentagem)"]}
          table={generoData.map((g) => ({ label: g.name, value: `${g.value} (${pct(g.value)})` }))}
        >
          <DonutChart data={generoData} centroLabel="Jovens activos" colors={[CHART.principal, CHART.destaque]} />
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
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={axisTick} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axisTick} width={44} />
              <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.5)" }} content={<ChartTooltip total={faixaData.reduce((a, b) => a + b.value, 0)} />} />
              <Bar dataKey="value" name="Jovens" fill={CHART.principal} radius={[6, 6, 0, 0]} maxBarSize={72} animationDuration={ANIM}>
                <LabelList dataKey="value" position="top" style={{ fontSize: 12, fontWeight: 600, fill: CHART.eixo }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          className="lg:col-span-2"
          title="Igrejas locais com mais jovens"
          description="As dez igrejas locais com maior número de jovens activos dentro do âmbito seleccionado."
          empty={igrejasTop.length === 0}
          tableHeaders={["Igreja Local", "Jovens"]}
          table={igrejasTop.map((i) => ({ label: i.name, value: i.value }))}
        >
          <RankingBars data={igrejasTop} />
        </ChartCard>
      </div>

    </div>
  );
};

export default PublicStatsPanel;
