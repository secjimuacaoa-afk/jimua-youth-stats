import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { createOfficialPdf, addTable, savePdf } from "@/lib/pdf";
import { useToast } from "@/hooks/use-toast";
import {
  CATEGORIA_LABELS, ESCOLARIDADE_LABELS, OCUPACAO_LABELS, ESTADO_CIVIL_LABELS,
  OCORRENCIA_ENTRADA_LABELS, OCORRENCIA_SAIDA_LABELS, DIFERENCA_LABELS, getLabel,
} from "@/lib/labels";
import logoJimua from "@/assets/logo-jimua.png";

const calcAge = (dob: string) => Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

type Linha = { descricao: string; masculino?: number; feminino?: number; total: number };

const Quadro = ({ titulo, nota, linhas, comSexo = true }: { titulo: string; nota?: string; linhas: Linha[]; comSexo?: boolean }) => (
  <div className="print-block space-y-2">
    <div>
      <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">{titulo}</h2>
      {nota && <p className="text-xs text-muted-foreground">{nota}</p>}
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="bg-muted">
            <th className="border border-border px-2 py-1.5 text-left font-semibold">Indicador</th>
            {comSexo && <th className="border border-border px-2 py-1.5 text-right font-semibold w-24">Masculino</th>}
            {comSexo && <th className="border border-border px-2 py-1.5 text-right font-semibold w-24">Feminino</th>}
            <th className="border border-border px-2 py-1.5 text-right font-semibold w-24">Total</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.descricao}>
              <td className="border border-border px-2 py-1.5">{l.descricao}</td>
              {comSexo && <td className="border border-border px-2 py-1.5 text-right">{l.masculino ?? 0}</td>}
              {comSexo && <td className="border border-border px-2 py-1.5 text-right">{l.feminino ?? 0}</td>}
              <td className="border border-border px-2 py-1.5 text-right font-semibold">{l.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const MapaEstatistico = () => {
  const { toast } = useToast();
  const { isAdmin, isSuperAdmin, userEstruturas } = useAuth();
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [semestre, setSemestre] = useState("1");
  const [filterDistrito, setFilterDistrito] = useState("all");
  const [filterIntendencia, setFilterIntendencia] = useState("all");
  const [filterCircuito, setFilterCircuito] = useState("all");
  const [filterIgreja, setFilterIgreja] = useState("all");

  const { data: distritos = [] } = useQuery({ queryKey: ["distritos"], queryFn: async () => (await supabase.from("distritos").select("*").order("nome")).data || [] });
  const { data: intendencias = [] } = useQuery({ queryKey: ["intendencias"], queryFn: async () => (await supabase.from("intendencias").select("*").order("nome")).data || [] });
  const { data: circuitos = [] } = useQuery({ queryKey: ["circuitos"], queryFn: async () => (await supabase.from("circuitos").select("*").order("nome")).data || [] });
  const { data: igrejas = [] } = useQuery({ queryKey: ["igrejas"], queryFn: async () => (await supabase.from("igrejas").select("*, circuitos(intendencia_id, intendencias(distrito_id))").order("nome")).data || [] });
  const { data: jovens = [] } = useQuery({
    queryKey: ["mapa-jovens"],
    queryFn: async () => (await supabase.from("jovens").select("*, igrejas(circuito_id, circuitos(intendencia_id, intendencias(distrito_id)))")).data || [],
  });
  const { data: ocorrencias = [] } = useQuery({
    queryKey: ["mapa-ocorrencias", ano, semestre],
    queryFn: async () => (await supabase.from("ocorrencias").select("*, jovens(igreja_id, igrejas(circuito_id, circuitos(intendencia_id, intendencias(distrito_id))))").eq("ano", Number(ano)).eq("semestre", Number(semestre))).data || [],
  });

  const intFiltered = useMemo(() => filterDistrito === "all" ? intendencias : (intendencias as any[]).filter((i: any) => i.distrito_id === filterDistrito), [intendencias, filterDistrito]);
  const circFiltered = useMemo(() => filterIntendencia === "all" ? [] : (circuitos as any[]).filter((c: any) => c.intendencia_id === filterIntendencia), [circuitos, filterIntendencia]);
  const igrFiltered = useMemo(() => filterCircuito === "all" ? [] : (igrejas as any[]).filter((i: any) => i.circuito_id === filterCircuito), [igrejas, filterCircuito]);

  const nomeDe = (lista: any[], id: string) => (lista as any[]).find((x: any) => x.id === id)?.nome || "—";
  const identificacao = {
    distrito: filterDistrito === "all" ? "Todos" : nomeDe(distritos as any[], filterDistrito),
    intendencia: filterIntendencia === "all" ? "Todas" : nomeDe(intendencias as any[], filterIntendencia),
    circuito: filterCircuito === "all" ? "Todos" : nomeDe(circuitos as any[], filterCircuito),
    igreja: filterIgreja === "all" ? "Todas" : nomeDe(igrejas as any[], filterIgreja),
  };

  const inScope = (jov: any) => {
    if (!isAdmin) return userEstruturas.includes(jov.igreja_id);
    if (filterIgreja !== "all") return jov.igreja_id === filterIgreja;
    if (filterCircuito !== "all") return jov.igrejas?.circuito_id === filterCircuito;
    if (filterIntendencia !== "all") return jov.igrejas?.circuitos?.intendencia_id === filterIntendencia;
    if (filterDistrito !== "all") return jov.igrejas?.circuitos?.intendencias?.distrito_id === filterDistrito;
    return true;
  };

  const mapa = useMemo(() => {
    const emScope = (jovens as any[]).filter((j: any) => !j.is_oja && inScope(j));
    const activos = emScope.filter((j: any) => j.activo);
    const inactivos = emScope.filter((j: any) => !j.activo);

    const ocScope = (ocorrencias as any[]).filter((o: any) => {
      const j = o.jovens;
      if (!j) return false;
      if (!isAdmin) return userEstruturas.includes(j.igreja_id);
      if (filterIgreja !== "all") return j.igreja_id === filterIgreja;
      if (filterCircuito !== "all") return j.igrejas?.circuito_id === filterCircuito;
      if (filterIntendencia !== "all") return j.igrejas?.circuitos?.intendencia_id === filterIntendencia;
      if (filterDistrito !== "all") return j.igrejas?.circuitos?.intendencias?.distrito_id === filterDistrito;
      return true;
    });

    const sexoDoJovem = (id: string) => emScope.find((j: any) => j.id === id)?.sexo;
    const ocPorCodigo = (code: string, sexo?: string) =>
      ocScope.filter((o: any) => o.tipo_codigo === code && (!sexo || sexoDoJovem(o.jovem_id) === sexo)).length;

    const contar = (arr: any[], key: string, val: string, sexo?: string) =>
      arr.filter((x: any) => x[key] === val && (!sexo || x.sexo === sexo)).length;

    const porSexo = (arr: any[], sexo: string) => arr.filter((x: any) => x.sexo === sexo).length;

    const linhasDe = (map: Record<string, string>, arr: any[], key: string): Linha[] =>
      Object.keys(map).map((code) => ({
        descricao: getLabel(map, code),
        masculino: contar(arr, key, code, "masculino"),
        feminino: contar(arr, key, code, "feminino"),
        total: contar(arr, key, code),
      }));

    const entradas: Linha[] = Object.keys(OCORRENCIA_ENTRADA_LABELS).map((code) => ({
      descricao: getLabel(OCORRENCIA_ENTRADA_LABELS, code),
      masculino: ocPorCodigo(code, "masculino"),
      feminino: ocPorCodigo(code, "feminino"),
      total: ocPorCodigo(code),
    }));

    const saidas: Linha[] = Object.keys(OCORRENCIA_SAIDA_LABELS).map((code) => ({
      descricao: getLabel(OCORRENCIA_SAIDA_LABELS, code),
      masculino: ocPorCodigo(code, "masculino"),
      feminino: ocPorCodigo(code, "feminino"),
      total: ocPorCodigo(code),
    }));

    const etaria: Linha[] = [
      { descricao: "Adolescentes (12 a 17 anos)", total: 0 },
      { descricao: "Jovens (18 a 25 anos)", total: 0 },
    ];
    activos.forEach((j: any) => {
      const a = calcAge(j.data_nascimento);
      const idx = a >= 12 && a <= 17 ? 0 : a >= 18 && a <= 25 ? 1 : -1;
      if (idx < 0) return;
      etaria[idx].total += 1;
      if (j.sexo === "masculino") etaria[idx].masculino = (etaria[idx].masculino || 0) + 1;
      else etaria[idx].feminino = (etaria[idx].feminino || 0) + 1;
    });

    return {
      totalM: porSexo(activos, "masculino"),
      totalF: porSexo(activos, "feminino"),
      total: activos.length,
      inact: inactivos.length,
      entradas,
      saidas,
      diferencas: linhasDe(DIFERENCA_LABELS, inactivos, "motivo_inactividade"),
      etaria,
      categoria: linhasDe(CATEGORIA_LABELS, activos, "categoria"),
      escolaridade: linhasDe(ESCOLARIDADE_LABELS, activos, "escolaridade"),
      ocupacao: linhasDe(OCUPACAO_LABELS, activos, "ocupacao"),
      estadoCivil: linhasDe(ESTADO_CIVIL_LABELS, activos, "estado_civil"),
      totalEntradas: entradas.reduce((s, l) => s + l.total, 0),
      totalSaidas: saidas.reduce((s, l) => s + l.total, 0),
    };
  }, [jovens, ocorrencias, filterDistrito, filterIntendencia, filterCircuito, filterIgreja, isAdmin, userEstruturas]);

  const exportPdf = async () => {
    const { doc, startY } = await createOfficialPdf({
      title: "Mapa Estatístico da Juventude",
      subtitle: `${ano} · ${semestre}º Semestre · Distrito: ${identificacao.distrito} · Intendência: ${identificacao.intendencia} · Igreja: ${identificacao.igreja}`,
      orientation: "portrait",
    });

    const bloco = (titulo: string, linhas: Linha[], first = false) =>
      addTable(doc, {
        ...(first ? { startY } : {}),
        head: [[titulo, "Masculino", "Feminino", "Total"]],
        body: linhas.map((l) => [l.descricao, l.masculino ?? 0, l.feminino ?? 0, l.total]),
      });

    bloco("Efectivo actual da juventude", [
      { descricao: "Jovens activos", masculino: mapa.totalM, feminino: mapa.totalF, total: mapa.total },
      { descricao: "Jovens inactivos", total: mapa.inact },
    ], true);
    bloco("Entradas no semestre", mapa.entradas);
    bloco("Saídas no semestre", mapa.saidas);
    bloco("Diferenças / motivos de inactividade", mapa.diferencas);
    bloco("Faixa etária", mapa.etaria);
    bloco("Categoria", mapa.categoria);
    bloco("Grau de escolaridade", mapa.escolaridade);
    bloco("Situação ocupacional", mapa.ocupacao);
    bloco("Estado civil", mapa.estadoCivil);

    savePdf(doc, `mapa-estatistico-${ano}-${semestre}s.pdf`);
    toast({ title: "PDF exportado", description: "Mapa Estatístico gerado com sucesso." });
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-5">
        <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Mapa Estatístico</h1>
            <p className="text-sm text-muted-foreground">Folha oficial da Juventude, gerada a partir dos registos da plataforma</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="min-h-11" onClick={() => window.print()}><Printer size={16} className="mr-1" /> Imprimir</Button>
            <Button className="min-h-11" onClick={exportPdf}><Download size={16} className="mr-1" /> Exportar PDF</Button>
          </div>
        </div>

        <Card className="no-print">
          <CardContent className="py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <Select value={ano} onValueChange={setAno}>
              <SelectTrigger className="min-h-11"><SelectValue /></SelectTrigger>
              <SelectContent>{[0, 1, 2, 3, 4].map((i) => { const y = new Date().getFullYear() - i; return <SelectItem key={y} value={String(y)}>{y}</SelectItem>; })}</SelectContent>
            </Select>
            <Select value={semestre} onValueChange={setSemestre}>
              <SelectTrigger className="min-h-11"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="1">1º Semestre</SelectItem><SelectItem value="2">2º Semestre</SelectItem></SelectContent>
            </Select>
            {isSuperAdmin && (
              <Select value={filterDistrito} onValueChange={(v) => { setFilterDistrito(v); setFilterIntendencia("all"); setFilterCircuito("all"); setFilterIgreja("all"); }}>
                <SelectTrigger className="min-h-11"><SelectValue placeholder="Distrito" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todos distritos</SelectItem>{(distritos as any[]).map((d: any) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <Select value={filterIntendencia} onValueChange={(v) => { setFilterIntendencia(v); setFilterCircuito("all"); setFilterIgreja("all"); }}>
              <SelectTrigger className="min-h-11"><SelectValue placeholder="Intendência" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas intendências</SelectItem>{(intFiltered as any[]).map((i: any) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterCircuito} onValueChange={(v) => { setFilterCircuito(v); setFilterIgreja("all"); }} disabled={filterIntendencia === "all"}>
              <SelectTrigger className="min-h-11"><SelectValue placeholder="Circuito" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos circuitos</SelectItem>{(circFiltered as any[]).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterIgreja} onValueChange={setFilterIgreja} disabled={filterCircuito === "all"}>
              <SelectTrigger className="min-h-11"><SelectValue placeholder="Igreja" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas igrejas</SelectItem>{(igrFiltered as any[]).map((i: any) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="print-area space-y-6 rounded-lg border bg-card p-4 sm:p-6">
          {/* Cabeçalho oficial */}
          <header className="print-block flex items-start gap-4 border-b pb-4">
            <img src={logoJimua} alt="Logótipo da Juventude da Igreja Metodista Unida" className="h-16 w-16 shrink-0" />
            <div className="min-w-0">
              <p className="font-display text-sm sm:text-base font-bold uppercase leading-tight">Igreja Metodista Unida</p>
              <p className="text-xs sm:text-sm">Conferência Anual do Oeste de Angola</p>
              <p className="text-xs sm:text-sm font-semibold">Organização de Jovens</p>
              <p className="mt-2 text-sm font-bold uppercase tracking-wide">Mapa Estatístico · {semestre}º Semestre de {ano}</p>
            </div>
          </header>

          <dl className="print-block grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2 text-sm">
            <div><dt className="text-xs uppercase text-muted-foreground">Distrito</dt><dd className="font-medium">{identificacao.distrito}</dd></div>
            <div><dt className="text-xs uppercase text-muted-foreground">Intendência</dt><dd className="font-medium">{identificacao.intendencia}</dd></div>
            <div><dt className="text-xs uppercase text-muted-foreground">Circuito</dt><dd className="font-medium">{identificacao.circuito}</dd></div>
            <div><dt className="text-xs uppercase text-muted-foreground">Igreja Local</dt><dd className="font-medium">{identificacao.igreja}</dd></div>
          </dl>

          <Quadro
            titulo="Quadro I — Efectivo da Juventude"
            nota="Número de jovens registados e em situação activa no período seleccionado."
            linhas={[
              { descricao: "Jovens activos", masculino: mapa.totalM, feminino: mapa.totalF, total: mapa.total },
              { descricao: "Jovens inactivos", total: mapa.inact },
              { descricao: "Total de entradas no semestre", total: mapa.totalEntradas },
              { descricao: "Total de saídas no semestre", total: mapa.totalSaidas },
            ]}
          />

          <Quadro titulo="Quadro II — Entradas no semestre" nota="Jovens que passaram a integrar a Juventude durante o semestre." linhas={mapa.entradas} />
          <Quadro titulo="Quadro III — Saídas no semestre" nota="Jovens que deixaram de integrar a Juventude durante o semestre." linhas={mapa.saidas} />
          <Quadro titulo="Quadro IV — Motivos de inactividade" nota="Situações que justificam a inactividade dos jovens registados." linhas={mapa.diferencas} />
          <Quadro titulo="Quadro V — Faixa etária" nota="Distribuição dos jovens activos por idade." linhas={mapa.etaria} />
          <Quadro titulo="Quadro VI — Categoria" nota="Situação de membresia dos jovens activos." linhas={mapa.categoria} />
          <Quadro titulo="Quadro VII — Grau de escolaridade" nota="Nível de ensino frequentado ou concluído pelos jovens activos." linhas={mapa.escolaridade} />
          <Quadro titulo="Quadro VIII — Situação ocupacional" nota="Actividade profissional ou estudantil dos jovens activos." linhas={mapa.ocupacao} />
          <Quadro titulo="Quadro IX — Estado civil" nota="Estado civil declarado pelos jovens activos." linhas={mapa.estadoCivil} />

          <footer className="print-block grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 text-sm">
            <div className="border-t pt-2">O Secretário Local</div>
            <div className="border-t pt-2">O Secretário Distrital</div>
          </footer>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MapaEstatistico;
