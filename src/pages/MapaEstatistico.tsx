import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { createOfficialPdf, addTable, savePdf } from "@/lib/pdf";
import { useToast } from "@/hooks/use-toast";

const calcAge = (dob: string) => Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

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

    const countBy = (arr: any[], key: string, val: string) => arr.filter((x: any) => x[key] === val).length;
    const countByS = (arr: any[], key: string, val: string, sexo: string) => arr.filter((x: any) => x[key] === val && x.sexo === sexo).length;
    const bySex = (arr: any[], sexo: string) => arr.filter((x: any) => x.sexo === sexo);

    const M = bySex(activos, "masculino");
    const F = bySex(activos, "feminino");

    const ocByCodeSex = (code: string, sexo: string) => ocScope.filter((o: any) => o.tipo_codigo === code && o.jovens && emScope.find((j: any) => j.id === o.jovem_id)?.sexo === sexo).length;

    return {
      totalM: M.length,
      totalF: F.length,
      total: activos.length,
      inact: inactivos.length,
      // Ocorrências entradas (A, A1, A2, B, B1, C, D)
      entradas: {
        M: {
          A: ocByCodeSex("vindo_classe_infantil", "masculino"),
          A1: ocByCodeSex("evangelizado", "masculino"),
          A2: ocByCodeSex("ingresso_voluntario", "masculino"),
          B: 0, B1: 0, C: ocByCodeSex("desistente", "masculino"), D: ocByCodeSex("falecido", "masculino"),
        },
        F: {
          A: ocByCodeSex("vindo_classe_infantil", "feminino"),
          A1: ocByCodeSex("evangelizado", "feminino"),
          A2: ocByCodeSex("ingresso_voluntario", "feminino"),
          B: 0, B1: ocByCodeSex("transferido", "feminino"), C: ocByCodeSex("desistente", "feminino"), D: ocByCodeSex("falecido", "feminino"),
        },
      },
      // Diferenças (E, F, G, G1)
      diferencas: {
        M: {
          E: countByS(inactivos, "motivo_inactividade", "E", "masculino"),
          F: countByS(inactivos, "motivo_inactividade", "F", "masculino"),
          G: countByS(inactivos, "motivo_inactividade", "G", "masculino"),
          G1: countByS(inactivos, "motivo_inactividade", "G1", "masculino"),
        },
        F: {
          E: countByS(inactivos, "motivo_inactividade", "E", "feminino"),
          F: countByS(inactivos, "motivo_inactividade", "F", "feminino"),
          G: countByS(inactivos, "motivo_inactividade", "G", "feminino"),
          G1: countByS(inactivos, "motivo_inactividade", "G1", "feminino"),
        },
      },
      parteEtaria: {
        H: activos.filter((j: any) => { const a = calcAge(j.data_nascimento); return a >= 12 && a <= 17; }).length,
        I: activos.filter((j: any) => { const a = calcAge(j.data_nascimento); return a >= 18 && a <= 25; }).length,
      },
      categoria: {
        J: countBy(activos, "categoria", "J"),
        K: countBy(activos, "categoria", "K"),
        L: countBy(activos, "categoria", "L"),
      },
      escolaridade: ["M", "N", "O", "P", "P1", "P2", "Q"].reduce((acc, c) => ({ ...acc, [c]: countBy(activos, "escolaridade", c) }), {} as Record<string, number>),
      ocupacao: ["R", "S", "T", "U", "V", "W", "X", "X1"].reduce((acc, c) => ({ ...acc, [c]: countBy(activos, "ocupacao", c) }), {} as Record<string, number>),
      estadoCivil: {
        Y: countBy(activos, "estado_civil", "Y"),
        Z: countBy(activos, "estado_civil", "Z"),
      },
    };
  }, [jovens, ocorrencias, filterDistrito, filterIntendencia, filterCircuito, filterIgreja, isAdmin, userEstruturas]);

  const exportPdf = async () => {
    const { doc, startY } = await createOfficialPdf({
      title: "Mapa Estatístico Oficial — Organização de Jovens",
      subtitle: `${ano} · ${semestre}º Semestre`,
      orientation: "landscape",
    });

    // Bloco 1: Totais por sexo + ocorrências
    addTable(doc, {
      startY,
      head: [["Sexo", "Total Actual", "A", "A1", "A2", "B", "B1", "C", "D", "E", "F", "G", "G1"]],
      body: [
        ["Masc.", mapa.totalM, mapa.entradas.M.A, mapa.entradas.M.A1, mapa.entradas.M.A2, mapa.entradas.M.B, mapa.entradas.M.B1, mapa.entradas.M.C, mapa.entradas.M.D, mapa.diferencas.M.E, mapa.diferencas.M.F, mapa.diferencas.M.G, mapa.diferencas.M.G1],
        ["Fem.", mapa.totalF, mapa.entradas.F.A, mapa.entradas.F.A1, mapa.entradas.F.A2, mapa.entradas.F.B, mapa.entradas.F.B1, mapa.entradas.F.C, mapa.entradas.F.D, mapa.diferencas.F.E, mapa.diferencas.F.F, mapa.diferencas.F.G, mapa.diferencas.F.G1],
        ["Total", mapa.total, "", "", "", "", "", "", "", "", "", "", ""],
      ],
    });

    // Bloco 2: Parte etária + Categoria
    addTable(doc, {
      head: [["Parte Etária (H) 12-17", "(I) 18-25", "Categoria (J) Catecúmenos", "(K) À Prova", "(L) Efectivos"]],
      body: [[mapa.parteEtaria.H, mapa.parteEtaria.I, mapa.categoria.J, mapa.categoria.K, mapa.categoria.L]],
    });

    // Bloco 3: Escolaridade
    addTable(doc, {
      head: [["Grau de Escolaridade", "M Primário", "N 1º Ciclo", "O 2º/Médio", "P Superior", "P1 Licenciados", "P2 Pós-Grad", "Q Fora"]],
      body: [["Total", mapa.escolaridade.M, mapa.escolaridade.N, mapa.escolaridade.O, mapa.escolaridade.P, mapa.escolaridade.P1, mapa.escolaridade.P2, mapa.escolaridade.Q]],
    });

    // Bloco 4: Ocupação
    addTable(doc, {
      head: [["Situação Ocupacional", "R Empresas", "S Educação", "T Saúde", "U Militar", "V Religiosos", "W Comércio", "X Estudante", "X1 Sem"]],
      body: [["Total", mapa.ocupacao.R, mapa.ocupacao.S, mapa.ocupacao.T, mapa.ocupacao.U, mapa.ocupacao.V, mapa.ocupacao.W, mapa.ocupacao.X, mapa.ocupacao.X1]],
    });

    // Bloco 5: Estado civil
    addTable(doc, {
      head: [["Estado Civil", "Y Solteiros", "Z Casados"]],
      body: [["Total", mapa.estadoCivil.Y, mapa.estadoCivil.Z]],
    });

    savePdf(doc, `mapa-estatistico-${ano}-${semestre}s.pdf`);
    toast({ title: "PDF exportado", description: "Mapa Estatístico Oficial gerado com sucesso." });
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Mapa Estatístico Oficial</h1>
            <p className="text-sm text-muted-foreground">Modelo M.E.O — gerado automaticamente a partir dos registos</p>
          </div>
          <Button onClick={exportPdf}><Download size={16} className="mr-1" /> Exportar PDF</Button>
        </div>

        <Card>
          <CardContent className="py-4 grid grid-cols-2 lg:grid-cols-6 gap-3">
            <Select value={ano} onValueChange={setAno}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{[0, 1, 2, 3, 4].map((i) => { const y = new Date().getFullYear() - i; return <SelectItem key={y} value={String(y)}>{y}</SelectItem>; })}</SelectContent>
            </Select>
            <Select value={semestre} onValueChange={setSemestre}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="1">1º Semestre</SelectItem><SelectItem value="2">2º Semestre</SelectItem></SelectContent>
            </Select>
            {isSuperAdmin && (
              <Select value={filterDistrito} onValueChange={(v) => { setFilterDistrito(v); setFilterIntendencia("all"); setFilterCircuito("all"); setFilterIgreja("all"); }}>
                <SelectTrigger><SelectValue placeholder="Distrito" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todos distritos</SelectItem>{(distritos as any[]).map((d: any) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <Select value={filterIntendencia} onValueChange={(v) => { setFilterIntendencia(v); setFilterCircuito("all"); setFilterIgreja("all"); }}>
              <SelectTrigger><SelectValue placeholder="Intendência" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas intendências</SelectItem>{(intFiltered as any[]).map((i: any) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterCircuito} onValueChange={(v) => { setFilterCircuito(v); setFilterIgreja("all"); }} disabled={filterIntendencia === "all"}>
              <SelectTrigger><SelectValue placeholder="Circuito" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos circuitos</SelectItem>{(circFiltered as any[]).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterIgreja} onValueChange={setFilterIgreja} disabled={filterCircuito === "all"}>
              <SelectTrigger><SelectValue placeholder="Igreja" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas igrejas</SelectItem>{(igrFiltered as any[]).map((i: any) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Totais</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="flex justify-between"><span>Masculino</span><strong>{mapa.totalM}</strong></div>
              <div className="flex justify-between"><span>Feminino</span><strong>{mapa.totalF}</strong></div>
              <div className="flex justify-between border-t pt-1"><span>Total Activos</span><strong>{mapa.total}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Inactivos</span><strong>{mapa.inact}</strong></div>
            </CardContent>
          </Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Categoria</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="flex justify-between"><span>J — Catecúmenos</span><strong>{mapa.categoria.J}</strong></div>
              <div className="flex justify-between"><span>K — À Prova</span><strong>{mapa.categoria.K}</strong></div>
              <div className="flex justify-between"><span>L — Efectivos</span><strong>{mapa.categoria.L}</strong></div>
            </CardContent>
          </Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Escolaridade</CardTitle></CardHeader>
            <CardContent className="text-sm grid grid-cols-2 gap-1">
              {Object.entries(mapa.escolaridade).map(([c, v]) => <div key={c} className="flex justify-between"><span>{c}</span><strong>{v}</strong></div>)}
            </CardContent>
          </Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Ocupação</CardTitle></CardHeader>
            <CardContent className="text-sm grid grid-cols-2 gap-1">
              {Object.entries(mapa.ocupacao).map(([c, v]) => <div key={c} className="flex justify-between"><span>{c}</span><strong>{v}</strong></div>)}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MapaEstatistico;
