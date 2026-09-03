import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Church, BarChart3, ShieldCheck, ArrowRight } from "lucide-react";
import logoJimua from "@/assets/logo-jimua.png";
import PublicHeader from "@/components/public/PublicHeader";
import PublicStatsPanel from "@/components/public/PublicStatsPanel";

const FEATURES = [
  { icon: Users, title: "Cadastro completo dos jovens", desc: "Ficha detalhada de cada jovem, com histórico e trilha de auditoria." },
  { icon: Church, title: "Estrutura hierárquica", desc: "Níveis Geral, Distrital e Local — Distrito, Intendência, Circuito e Igreja." },
  { icon: BarChart3, title: "Mapa estatístico automático", desc: "Gerado a partir dos registos, consolidado semestralmente." },
  { icon: ShieldCheck, title: "Segurança e auditoria", desc: "Acessos por perfil, políticas de dados e registo de alterações." },
];

const Landing = () => (
  <div className="min-h-screen bg-background">
    <a
      href="#conteudo"
      className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:ring-2 focus:ring-ring"
    >
      Saltar para o conteúdo principal
    </a>

    <PublicHeader />

    <main id="conteudo">
      {/* Herói */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-primary to-navy-light" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-sm font-bold tracking-[0.2em] uppercase text-secondary">Sistema Oficial</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Plataforma de Gestão e Estatística da Juventude
            </h1>
            <p className="text-base sm:text-lg text-primary-foreground/90 max-w-xl">
              Substitui integralmente o processo manual do Mapa Estatístico, com consolidação automática desde a
              Igreja Local até à Conferência, auditoria completa e relatórios oficiais em tempo real.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary" className="font-semibold shadow-lg min-h-11">
                <Link to="/login">
                  Aceder ao Sistema <ArrowRight size={18} aria-hidden="true" className="ml-1" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-h-11 font-semibold bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/sobre">Sobre a Plataforma</Link>
              </Button>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="rounded-3xl bg-primary-foreground/10 ring-1 ring-primary-foreground/20 p-8 sm:p-12 backdrop-blur-sm">
              <img
                src={logoJimua}
                alt="Logótipo da Organização de Jovens da Igreja Metodista Unida"
                className="h-44 sm:h-64 lg:h-72 w-auto drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section aria-labelledby="funcionalidades" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 id="funcionalidades" className="font-display text-2xl sm:text-3xl font-bold text-center text-foreground mb-10">
          Funcionalidades
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <Card key={f.title} className="h-full border-border/70 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <f.icon size={22} aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-card-foreground leading-snug">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Dados públicos */}
      <section aria-labelledby="dados-gerais" className="bg-muted/40 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-6">
          <div className="text-center space-y-2">
            <h2 id="dados-gerais" className="font-display text-2xl sm:text-3xl font-bold text-foreground">Dados Gerais</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Números agregados por Distrito, Intendência, Circuito e Igreja Local — sem informações individuais.
            </p>
          </div>

          <PublicStatsPanel />

          <div className="text-center">
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/publico/estatisticas">Ver estatísticas públicas detalhadas</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>

    <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-10 text-center text-sm text-muted-foreground space-y-2">
      <p className="font-semibold text-foreground">Igreja Metodista Unida — Conferência Anual do Oeste de Angola</p>
      <p>Organização de Jovens Regulares · Plataforma de Gestão e Estatística</p>
      <p>
        <Link
          to="/sobre"
          className="text-primary underline underline-offset-4 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Sobre a Plataforma
        </Link>
      </p>
    </footer>
  </div>
);

export default Landing;
