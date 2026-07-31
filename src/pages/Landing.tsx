import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Church, BarChart3, ShieldCheck, ArrowRight, UserMinus } from "lucide-react";
import logoJimua from "@/assets/logo-jimua.png";

const TODOS = "todos";

type Estrutura = { id: string; nome: string; distrito_id?: string; intendencia_id?: string; circuito_id?: string };

const FEATURES = [
  { icon: Users, title: "Cadastro completo dos jovens", desc: "Ficha detalhada de cada jovem, com histórico e trilha de auditoria." },
  { icon: Church, title: "Estrutura hierárquica", desc: "Níveis Geral, Distrital e Local — Distrito, Intendência, Circuito e Igreja." },
  { icon: BarChart3, title: "Mapa estatístico automático", desc: "Gerado a partir dos registos, consolidado semestralmente." },
  { icon: ShieldCheck, title: "Segurança e auditoria", desc: "Acessos por perfil, políticas de dados e registo de alterações." },
];

const BarSimple = ({ data }: { data: { name: string; value: number }[] }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.name} className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-card-foreground">{item.name}</span>
            <span className="font-semibold tabular-nums text-card-foreground">{item.value}</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-navy-light rounded-full transition-all duration-700" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const Landing = () => {
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

  const { data: stats } = useQuery({
    queryKey: ["public-stats", distrito, intendencia, circuito, igreja],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_dashboard_stats", {
        _distrito_id: distrito === TODOS ? null : distrito,
        _intendencia_id: intendencia === TODOS ? null : intendencia,
        _circuito_id: circuito === TODOS ? null : circuito,
        _igreja_id: igreja === TODOS ? null : igreja,
      } as never);
      if (error) throw error;
      return data as any;
    },
  });

  const intendencias = useMemo(
    () => (estruturas?.intendencias || []).filter((i) => distrito === TODOS || i.distrito_id === distrito),
    [estruturas, distrito],
  );
  const circuitos = useMemo(
    () => (estruturas?.circuitos || []).filter((c) => intendencia === TODOS ? intendencias.some((i) => i.id === c.intendencia_id) : c.intendencia_id === intendencia),
    [estruturas, intendencia, intendencias],
  );
  const igrejas = useMemo(
    () => (estruturas?.igrejas || []).filter((g) => circuito === TODOS ? circuitos.some((c) => c.id === g.circuito_id) : g.circuito_id === circuito),
    [estruturas, circuito, circuitos],
  );

  const s = stats || {};

  const resumo = [
    { label: "Total de Jovens Activos", value: s.total ?? 0, icon: Users },
    { label: "Inactivos", value: s.inactivos ?? 0, icon: UserMinus },
    { label: "Masculino", value: s.masculino ?? 0 },
    { label: "Feminino", value: s.feminino ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logoJimua} alt="Logótipo da Juventude da Igreja Metodista Unida" className="h-12 w-auto" />
            <div className="leading-tight">
              <p className="font-display text-sm sm:text-base font-bold text-foreground tracking-tight">Igreja Metodista Unida</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Conferência Anual do Oeste de Angola</p>
              <p className="text-xs sm:text-sm text-primary font-semibold">Organização de Jovens Regulares</p>
            </div>
          </div>
          <Button asChild size="sm" className="font-semibold">
            <Link to="/login">Entrar</Link>
          </Button>
        </div>
      </header>

      {/* Herói */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-primary to-navy-light" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-secondary">Sistema Oficial</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Plataforma de Gestão e Estatística da Juventude
            </h1>
            <p className="text-base sm:text-lg text-primary-foreground/85 max-w-xl">
              Substitui integralmente o processo manual do Mapa Estatístico, com consolidação automática desde a
              Igreja Local até à Conferência, auditoria completa e relatórios oficiais em tempo real.
            </p>
            <Button asChild size="lg" variant="secondary" className="font-semibold shadow-lg">
              <Link to="/login">
                Aceder ao Sistema <ArrowRight size={18} className="ml-1" />
              </Link>
            </Button>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="rounded-3xl bg-primary-foreground/10 ring-1 ring-primary-foreground/20 p-8 sm:p-12 backdrop-blur-sm">
              <img src={logoJimua} alt="Logótipo da Juventude da Igreja Metodista Unida" className="h-56 sm:h-72 w-auto drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center text-foreground mb-10">Funcionalidades</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <Card key={f.title} className="h-full border-border/70 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <f.icon size={22} />
                </div>
                <h3 className="font-semibold text-card-foreground leading-snug">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Dados públicos */}
      <section className="bg-muted/40 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Dados Gerais</h2>
            <p className="text-sm text-muted-foreground">
              Números agregados por Distrito, Intendência, Circuito e Igreja Local — sem informações individuais.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={distrito} onValueChange={(v) => { setDistrito(v); setIntendencia(TODOS); setCircuito(TODOS); setIgreja(TODOS); }}>
              <SelectTrigger className="bg-card"><SelectValue placeholder="Distrito" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos os Distritos</SelectItem>
                {(estruturas?.distritos || []).map((d) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={intendencia} onValueChange={(v) => { setIntendencia(v); setCircuito(TODOS); setIgreja(TODOS); }}>
              <SelectTrigger className="bg-card"><SelectValue placeholder="Intendência" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas as Intendências</SelectItem>
                {intendencias.map((i) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={circuito} onValueChange={(v) => { setCircuito(v); setIgreja(TODOS); }}>
              <SelectTrigger className="bg-card"><SelectValue placeholder="Circuito" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos os Circuitos</SelectItem>
                {circuitos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={igreja} onValueChange={setIgreja}>
              <SelectTrigger className="bg-card"><SelectValue placeholder="Igreja Local" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas as Igrejas Locais</SelectItem>
                {igrejas.map((g) => <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {resumo.map((r) => (
              <Card key={r.label}>
                <CardContent className="pt-6 text-center space-y-1">
                  {r.icon && <r.icon size={22} className="mx-auto text-primary mb-1" />}
                  <p className="font-display text-3xl font-bold text-card-foreground tabular-nums">{r.value}</p>
                  <p className="text-xs text-muted-foreground">{r.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Faixa Etária</CardTitle></CardHeader>
              <CardContent>
                <BarSimple data={[
                  { name: "12–17 anos", value: s.faixa_12_17 ?? 0 },
                  { name: "18–25 anos", value: s.faixa_18_25 ?? 0 },
                ]} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Distribuição por Sexo</CardTitle></CardHeader>
              <CardContent>
                <BarSimple data={[
                  { name: "Masculino", value: s.masculino ?? 0 },
                  { name: "Feminino", value: s.feminino ?? 0 },
                ]} />
              </CardContent>
            </Card>
            {(s.igrejas_top || []).length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3"><CardTitle className="text-base">Igrejas Locais com mais jovens</CardTitle></CardHeader>
                <CardContent><BarSimple data={s.igrejas_top} /></CardContent>
              </Card>
            )}
          </div>

          <div className="text-center">
            <Button asChild variant="outline">
              <Link to="/publico/estatisticas">Ver estatísticas públicas detalhadas</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-10 text-center text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">Igreja Metodista Unida — Conferência Anual do Oeste de Angola</p>
        <p>Organização de Jovens Regulares · Plataforma de Gestão e Estatística</p>
      </footer>
    </div>
  );
};

export default Landing;
