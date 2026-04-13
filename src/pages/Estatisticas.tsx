import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  CATEGORIA_LABELS, ESCOLARIDADE_LABELS, OCUPACAO_LABELS, ESTADO_CIVIL_LABELS,
  ORIGEM_LABELS, MOTIVO_INACTIVIDADE_LABELS, getLabel,
} from "@/lib/labels";

const calcAge = (dob: string) => Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

const BarSimple = ({ data }: { data: { name: string; value: number }[] }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.name} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-card-foreground">{item.name}</span>
            <span className="font-semibold text-card-foreground">{item.value}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-navy-light rounded-full transition-all duration-700" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const Estatisticas = () => {
  const { isAdmin, isSuperAdmin, userEstruturas } = useAuth();
  const { toast } = useToast();
  const [filterDistrito, setFilterDistrito] = useState("");
  const [filterIntendencia, setFilterIntendencia] = useState("");
  const [filterCircuito, setFilterCircuito] = useState("");
  const [filterIgreja, setFilterIgreja] = useState("");

  const { data: distritos = [] } = useQuery({
    queryKey: ["distritos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("distritos").select("*").order("nome");
      if (error) throw error;
      return data;
    },
    enabled: isSuperAdmin,
  });

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

  const filteredIntendencias = useMemo(() => {
    if (!filterDistrito || filterDistrito === "all") return intendencias;
    return intendencias.filter((i: any) => i.distrito_id === filterDistrito);
  }, [intendencias, filterDistrito]);

  const filteredCircuitos = filterIntendencia && filterIntendencia !== "all" ? circuitos.filter((c: any) => c.intendencia_id === filterIntendencia) : [];
  const filteredIgrejas = filterCircuito && filterCircuito !== "all" ? allIgrejas.filter((i: any) => i.circuito_id === filterCircuito) : [];

  const { data: jovens = [] } = useQuery({
    queryKey: ["stats-jovens"],
    queryFn: async () => {
      const { data, error } = await supabase.from("jovens").select("*, igrejas(nome, circuito_id, circuitos(intendencia_id))");
      if (error) throw error;
      return data;
    },
  });

  const stats = useMemo(() => {
    let filtered = jovens.filter((j: any) => !j.is_oja);

    if (!isAdmin) {
      filtered = filtered.filter((j: any) => userEstruturas.includes(j.igreja_id));
    } else {
      if (filterIgreja && filterIgreja !== "all") {
        filtered = filtered.filter((j: any) => j.igreja_id === filterIgreja);
      } else if (filterCircuito && filterCircuito !== "all") {
        filtered = filtered.filter((j: any) => (j.igrejas as any)?.circuito_id === filterCircuito);
      } else if (filterIntendencia && filterIntendencia !== "all") {
        filtered = filtered.filter((j: any) => (j.igrejas as any)?.circuitos?.intendencia_id === filterIntendencia);
      }
    }

    const activos = filtered.filter((j: any) => j.activo);
    const total = activos.length;

    const groupBy = (arr: any[], key: string, labelMap?: Record<string, string>) => {
      const counts: Record<string, number> = {};
      arr.forEach((j) => { const v = j[key]; if (v) counts[v] = (counts[v] || 0) + 1; });
      return Object.entries(counts).map(([code, value]) => ({
        name: labelMap ? getLabel(labelMap, code) : code, value,
      }));
    };

    return {
      total,
      sexo: [
        { name: "Masculino", value: activos.filter((j: any) => j.sexo === "masculino").length },
        { name: "Feminino", value: activos.filter((j: any) => j.sexo === "feminino").length },
      ],
      parteEtaria: (() => {
        const h = activos.filter((j: any) => calcAge(j.data_nascimento) >= 12 && calcAge(j.data_nascimento) <= 17).length;
        return [{ name: "12–17 anos", value: h }, { name: "18–25 anos", value: total - h }];
      })(),
      categoria: groupBy(activos, "categoria", CATEGORIA_LABELS),
      escolaridade: groupBy(activos, "escolaridade", ESCOLARIDADE_LABELS),
      ocupacao: groupBy(activos, "ocupacao", OCUPACAO_LABELS),
      estadoCivil: groupBy(activos, "estado_civil", ESTADO_CIVIL_LABELS),
      origem: groupBy(activos, "origem", ORIGEM_LABELS),
      inactivos: filtered.filter((j: any) => !j.activo).length,
      motivos: groupBy(filtered.filter((j: any) => !j.activo), "motivo_inactividade", MOTIVO_INACTIVIDADE_LABELS),
      ojaCount: jovens.filter((j: any) => j.is_oja).length,
    };
  }, [jovens, isAdmin, userEstruturas, filterDistrito, filterIntendencia, filterCircuito, filterIgreja]);

  const charts = [
    { label: "Distribuição por Sexo", data: stats.sexo },
    { label: "Parte Etária", data: stats.parteEtaria },
    { label: "Categoria", data: stats.categoria },
    { label: "Estado Civil", data: stats.estadoCivil },
    { label: "Escolaridade", data: stats.escolaridade },
    { label: "Ocupação", data: stats.ocupacao },
    { label: "Origem", data: stats.origem },
    { label: "Motivos de Inactividade", data: stats.motivos },
  ].filter((c) => c.data.length > 0);

  const handleExportPdf = async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const exportDate = new Date().toLocaleDateString("pt-AO", { day: "2-digit", month: "long", year: "numeric" });
    doc.setFontSize(18);
    doc.text("JIMUA ANALYTICS", 14, 20);
    doc.setFontSize(12);
    doc.text("Mapa Estatístico da Juventude", 14, 28);
    doc.setFontSize(10);
    doc.text(`Data de exportação: ${exportDate}`, 14, 36);

    let y = 48;
    doc.setFontSize(12);
    doc.text(`Total Activos: ${stats.total}`, 14, y); y += 8;
    doc.text(`Inactivos: ${stats.inactivos}`, 14, y); y += 8;
    doc.text(`OJA (excluídos): ${stats.ojaCount}`, 14, y); y += 12;

    charts.forEach((chart) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.text(chart.label, 14, y); y += 6;
      doc.setFontSize(9);
      chart.data.forEach((d) => {
        doc.text(`  ${d.name}: ${d.value}`, 14, y); y += 5;
      });
      y += 4;
    });

    doc.save(`jimua-estatisticas-${exportDate.replace(/\s/g, "-")}.pdf`);
    toast({ title: "PDF exportado com sucesso" });
  };

  const handleShareLink = () => {
    const publicUrl = `${window.location.origin}/publico/estatisticas`;
    navigator.clipboard.writeText(publicUrl);
    toast({ title: "Link copiado", description: "Link de visualização pública copiado para a área de transferência." });
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Estatísticas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Análise detalhada dos dados da juventude (excl. OJA &gt;25 anos)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPdf}>
              <Download size={16} className="mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={handleShareLink}>
              <LinkIcon size={16} className="mr-2" />
              Gerar Link Público
            </Button>
          </div>
        </div>

        {isAdmin && (
          <Card>
            <CardContent className="py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {isSuperAdmin && (
                  <Select value={filterDistrito} onValueChange={(v) => { setFilterDistrito(v); setFilterIntendencia(""); setFilterCircuito(""); setFilterIgreja(""); }}>
                    <SelectTrigger><SelectValue placeholder="Todos os Distritos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {distritos.map((d: any) => (<SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>))}
                    </SelectContent>
                  </Select>
                )}
                <Select value={filterIntendencia} onValueChange={(v) => { setFilterIntendencia(v); setFilterCircuito(""); setFilterIgreja(""); }}>
                  <SelectTrigger><SelectValue placeholder="Todas as Intendências" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {filteredIntendencias.map((i: any) => (<SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>))}
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
        )}

        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 size={24} />
              <h2 className="text-lg font-bold">Mapa Estatístico</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-sm opacity-80">Total Activos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div>
                <p className="text-sm opacity-80">Inactivos</p>
                <p className="text-2xl font-bold">{stats.inactivos}</p>
              </div>
              <div>
                <p className="text-sm opacity-80">Masculino</p>
                <p className="text-2xl font-bold">{stats.sexo[0]?.value || 0}</p>
              </div>
              <div>
                <p className="text-sm opacity-80">Feminino</p>
                <p className="text-2xl font-bold">{stats.sexo[1]?.value || 0}</p>
              </div>
            </div>
            {stats.ojaCount > 0 && (
              <p className="text-xs opacity-70 mt-3">
                {stats.ojaCount} jovem(ns) adulto(s) (OJA) excluído(s) das estatísticas
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {charts.map((cat) => (
            <Card key={cat.label}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{cat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <BarSimple data={cat.data} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Estatisticas;
