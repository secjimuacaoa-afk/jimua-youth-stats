import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const OCORRENCIA_TIPOS = {
  entrada: [
    { code: "vindo_classe_infantil", label: "Vindo da Classe Infantil" },
    { code: "vindo_denominacao", label: "Vindo de outra Denominação" },
    { code: "evangelizado", label: "Evangelizado" },
    { code: "ingresso_voluntario", label: "Ingresso Voluntário" },
  ],
  saida: [
    { code: "ausente_estudo", label: "Ausente por Estudo" },
    { code: "ausente_saude", label: "Ausente por Saúde" },
    { code: "ausente_trabalho", label: "Ausente por Trabalho" },
    { code: "transferido", label: "Transferido" },
    { code: "desistente", label: "Desistente" },
    { code: "falecido", label: "Falecido" },
  ],
};

const labelFor = (code: string) => {
  const all = [...OCORRENCIA_TIPOS.entrada, ...OCORRENCIA_TIPOS.saida];
  return all.find((t) => t.code === code)?.label || code;
};

const empty = { jovem_id: "", tipo_categoria: "entrada" as "entrada" | "saida", tipo_codigo: "", ano: new Date().getFullYear(), semestre: 1, data: new Date().toISOString().slice(0, 10), motivo: "", observacoes: "" };

const Ocorrencias = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [filterAno, setFilterAno] = useState("all");
  const [filterSemestre, setFilterSemestre] = useState("all");
  const [filterTipo, setFilterTipo] = useState("all");

  const { data: jovens = [] } = useQuery({
    queryKey: ["jovens-lookup"],
    queryFn: async () => (await supabase.from("jovens").select("id,nome").order("nome")).data || [],
  });

  const { data: ocorrencias = [] } = useQuery({
    queryKey: ["ocorrencias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ocorrencias").select("*, jovens(nome)").order("data", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = useMemo(() => ocorrencias.filter((o: any) => {
    if (filterAno !== "all" && String(o.ano) !== filterAno) return false;
    if (filterSemestre !== "all" && String(o.semestre) !== filterSemestre) return false;
    if (filterTipo !== "all" && o.tipo_categoria !== filterTipo) return false;
    return true;
  }), [ocorrencias, filterAno, filterSemestre, filterTipo]);

  const anos = Array.from(new Set(ocorrencias.map((o: any) => o.ano))).sort((a, b) => (b as number) - (a as number));

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ocorrencias").insert({ ...form, criado_por: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Ocorrência registada", description: "O estado do jovem foi actualizado automaticamente." });
      setOpen(false); setForm(empty);
      qc.invalidateQueries({ queryKey: ["ocorrencias"] });
      qc.invalidateQueries({ queryKey: ["jovens"] });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const codigos = form.tipo_categoria === "entrada" ? OCORRENCIA_TIPOS.entrada : OCORRENCIA_TIPOS.saida;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ocorrências</h1>
            <p className="text-sm text-muted-foreground mt-1">Registo de entradas e saídas — não altera dados pessoais, apenas o estado</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
            <DialogTrigger asChild><Button><Plus size={16} className="mr-1" /> Nova Ocorrência</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registar Ocorrência</DialogTitle></DialogHeader>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
                <div className="space-y-1.5">
                  <Label>Jovem *</Label>
                  <Select value={form.jovem_id} onValueChange={(v) => setForm({ ...form, jovem_id: v })} required>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{(jovens as any[]).map((j: any) => <SelectItem key={j.id} value={j.id}>{j.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Categoria *</Label>
                    <Select value={form.tipo_categoria} onValueChange={(v: any) => setForm({ ...form, tipo_categoria: v, tipo_codigo: "" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="saida">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tipo *</Label>
                    <Select value={form.tipo_codigo} onValueChange={(v) => setForm({ ...form, tipo_codigo: v })} required>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{codigos.map((c) => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ano *</Label>
                    <Input type="number" value={form.ano} onChange={(e) => setForm({ ...form, ano: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Semestre *</Label>
                    <Select value={String(form.semestre)} onValueChange={(v) => setForm({ ...form, semestre: Number(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="1">1º Semestre</SelectItem><SelectItem value="2">2º Semestre</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Data *</Label>
                    <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Motivo</Label>
                    <Input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Observações</Label>
                    <Textarea rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={save.isPending}>{save.isPending ? "Registando..." : "Registar"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={filterAno} onValueChange={setFilterAno}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anos</SelectItem>
                {anos.map((a: any) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterSemestre} onValueChange={setFilterSemestre}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Ambos semestres</SelectItem>
                <SelectItem value="1">1º Semestre</SelectItem>
                <SelectItem value="2">2º Semestre</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Entradas e Saídas</SelectItem>
                <SelectItem value="entrada">Apenas Entradas</SelectItem>
                <SelectItem value="saida">Apenas Saídas</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">{filtered.length} ocorrências</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Jovem</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma ocorrência</TableCell></TableRow>
                ) : filtered.map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell>{new Date(o.data).toLocaleDateString("pt-AO")}</TableCell>
                    <TableCell className="font-medium">{o.jovens?.nome}</TableCell>
                    <TableCell>
                      <Badge variant={o.tipo_categoria === "entrada" ? "default" : "destructive"} className="gap-1">
                        {o.tipo_categoria === "entrada" ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                        {o.tipo_categoria}
                      </Badge>
                    </TableCell>
                    <TableCell>{labelFor(o.tipo_codigo)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{o.ano} · {o.semestre}º sem</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{o.motivo || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Ocorrencias;
