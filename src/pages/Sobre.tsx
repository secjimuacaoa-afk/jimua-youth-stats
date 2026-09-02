import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ClipboardList, CheckCircle2, Layers, Lock } from "lucide-react";
import PublicHeader from "@/components/public/PublicHeader";

const CICLO = [
  {
    icon: ClipboardList,
    title: "1. Recolha (Igreja Local)",
    desc: "O Secretário Local regista cada jovem e as ocorrências do semestre (entradas e saídas) segundo os códigos oficiais do Mapa Estatístico.",
  },
  {
    icon: CheckCircle2,
    title: "2. Validação (Distrito)",
    desc: "A Assembleia Distrital aprova a estatística de cada igreja uma vez por semestre. Depois da aprovação o período fica bloqueado e só é reaberto mediante autorização registada.",
  },
  {
    icon: Layers,
    title: "3. Consolidação (Conferência)",
    desc: "O fecho do semestre é automático: Nº actual = Nº anterior + entradas − saídas. Os números sobem de Igreja para Circuito, Intendência, Distrito e Conferência sem digitação repetida.",
  },
];

const NIVEIS = [
  { nivel: "Nacional — Secretário Geral", acesso: "Vê todos os distritos e cria os Secretários Distritais." },
  { nivel: "Distrital — Secretário Distrital", acesso: "Vê e gere apenas o seu distrito: intendências, circuitos, igrejas e contas locais." },
  { nivel: "Local — Secretário Local", acesso: "Regista e gere apenas os jovens da sua Igreja Local." },
  { nivel: "Público", acesso: "Apenas totais e percentagens agregadas, sem qualquer registo individual." },
];

const Sobre = () => (
  <div className="min-h-screen bg-background">
    <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
      Saltar para o conteúdo
    </a>
    <PublicHeader />

    <main id="conteudo">
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 lg:py-20 space-y-4">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-secondary">Transparência</p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
            Sobre a Plataforma
          </h1>
          <p className="text-base sm:text-lg text-primary-foreground/90 max-w-2xl">
            O Sistema Estatístico da Juventude da Igreja Metodista Unida em Angola substitui o processo manual do
            Mapa Estatístico, garantindo números fiáveis, auditáveis e comparáveis entre semestres.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-4">
        <h2 className="font-display text-2xl font-bold text-foreground">Missão da Organização de Jovens</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Acompanhar, formar e servir a juventude metodista em todas as igrejas locais da Conferência Anual do Oeste
          de Angola, assegurando que cada jovem é conhecido, acompanhado no seu percurso e devidamente encaminhado à
          OJA quando completa a idade. A plataforma existe para servir esse acompanhamento pastoral com informação
          rigorosa e atempada — não para vigiar pessoas.
        </p>
      </section>

      <section className="bg-muted/40 border-y border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-6">
          <h2 className="font-display text-2xl font-bold text-foreground">Como os dados são recolhidos, validados e consolidados</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {CICLO.map((c) => (
              <Card key={c.title} className="h-full">
                <CardContent className="pt-6 space-y-3">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <c.icon size={22} aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-card-foreground leading-snug">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <h2 className="font-display text-2xl font-bold text-foreground">Protecção de dados pessoais</h2>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck size={20} className="text-primary" aria-hidden="true" /> O que nunca é público
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>Nomes, número de BI, data de nascimento, contactos, morada, fotografia, documentos e fichas individuais permanecem exclusivamente na área autenticada, acessíveis apenas a quem tem jurisdição sobre aquele jovem.</p>
            <p>A área pública consome apenas funções de leitura que devolvem contagens e percentagens já agregadas. Não existe qualquer forma de obter, listar ou exportar um registo individual sem autenticação.</p>
            <p>Todas as alterações a fichas de jovens ficam registadas numa trilha de auditoria com autor e data.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock size={20} className="text-primary" aria-hidden="true" /> Quem vê o quê
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm border-collapse">
              <caption className="sr-only">Níveis de acesso da plataforma</caption>
              <thead>
                <tr className="border-b border-border text-left">
                  <th scope="col" className="py-2 pr-3 font-semibold text-foreground">Nível</th>
                  <th scope="col" className="py-2 font-semibold text-foreground">Acesso</th>
                </tr>
              </thead>
              <tbody>
                {NIVEIS.map((n) => (
                  <tr key={n.nivel} className="border-b border-border/60 last:border-0 align-top">
                    <th scope="row" className="py-2 pr-3 font-medium text-foreground text-left">{n.nivel}</th>
                    <td className="py-2 text-muted-foreground">{n.acesso}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button asChild className="min-h-11"><Link to="/">Ver dados gerais</Link></Button>
          <Button asChild variant="outline" className="min-h-11"><Link to="/publico/estatisticas">Estatísticas detalhadas</Link></Button>
        </div>
      </section>
    </main>

    <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-10 text-center text-sm text-muted-foreground space-y-1">
      <p className="font-semibold text-foreground">Igreja Metodista Unida — Conferência Anual do Oeste de Angola</p>
      <p>Organização de Jovens Regulares · Plataforma de Gestão e Estatística</p>
    </footer>
  </div>
);

export default Sobre;
